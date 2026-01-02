import React, { useState } from 'react'; 
import { useDispatch } from 'react-redux';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { 
  Card, 
  Text, 
  XStack, 
  YStack, 
  Button, 
  ScrollView,
  Spinner,
  Separator,
  H4,
  H5,
  Image,
  Input,
} from 'tamagui';
import type { AppDispatch } from '@/(redux)/store';
import { useQuery } from '@tanstack/react-query';

// Redux imports for cart
import {
  addItemToUserCart,
  fetchMyCart,
} from '@/(redux)/CART';

// Import the API service
import { 
  getProductBatchesByShopsForUser,
  ShopBatchInfo,
  AdditionalPrice,
  ProductBatchesForUserResponse 
} from '@/(services)/api/productBatchesService';

// Types
interface PriceOption {
  id: string;
  label: string;
  price: number;
  type?: 'default' | 'additional' | 'custom';
}

interface SelectedShopInfo {
  shopId: string;
  shopName: string;
  branchName?: string;
  quantity: number;
  basePrice: number | null;
  totalPrice: number | null;
  additionalPrices: AdditionalPrice[];
}

const BACKEND_URL = "https://ordere.net";

export const normalizeImagePath = (path?: string) => {
  if (!path) return undefined;
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) {
    return normalizedPath;
  }
  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

// Helper function to safely convert to number and format
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

// Helper function to safely get number value
const safeNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Price Selection Modal
const PriceSelectionModal = ({ 
  selectedShop, 
  selectedPriceOption: initialPriceOption,
  visible, 
  onClose, 
  onAddToCart 
}: {
  selectedShop: SelectedShopInfo | null;
  selectedPriceOption: PriceOption | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (cartData: {
    shop: SelectedShopInfo;
    priceOption: PriceOption;
    quantity: number;
    notes: string;
  }) => void;
}) => {
  const [selectedPriceOption, setSelectedPriceOption] = useState<PriceOption | null>(initialPriceOption);
  const [customPrice, setCustomPrice] = useState(initialPriceOption?.price?.toString() || '');
  const [quantityInput, setQuantityInput] = useState<string>(''); // Changed to string for empty state
  const [notes, ] = useState('');

  // Set initial selected price option if provided
  React.useEffect(() => {
    if (initialPriceOption) {
      setSelectedPriceOption(initialPriceOption);
      setCustomPrice(initialPriceOption.price.toString());
    }
  }, [initialPriceOption]);

  if (!selectedShop) return null;

  // Safely create price options with fallbacks - ensure all prices are numbers
  const priceOptions: PriceOption[] = [
    ...(selectedShop.additionalPrices?.map((ap: AdditionalPrice) => ({
      id: ap.id,
      label: ap.label || 'Additional Price',
      price: safeNumber(ap.price),
      type: 'additional' as const
    })) || [])
  ].filter(option => option.price > 0); // Filter out options with invalid prices

  const handleSelectPrice = (priceOption: PriceOption) => {
    setSelectedPriceOption(priceOption);
    setCustomPrice(priceOption.price.toString());
  };

  const handleCustomPriceChange = (price: string) => {
    setCustomPrice(price);
    const numericPrice = parseFloat(price) || 0;
    if (numericPrice > 0) {
      setSelectedPriceOption({
        id: 'custom',
        label: 'Custom Price',
        price: numericPrice,
        type: 'custom'
      });
    }
  };

  const handleQuantityInputChange = (text: string) => {
    // Allow empty string or numbers
    if (text === '' || /^\d*$/.test(text)) {
      setQuantityInput(text);
    }
  };

  const handleQuantityIncrement = () => {
    const currentValue = parseInt(quantityInput) || 0;
    const newValue = Math.min(selectedShop.quantity, currentValue + 1);
    setQuantityInput(newValue.toString());
  };

  const handleQuantityDecrement = () => {
    const currentValue = parseInt(quantityInput) || 0;
    if (currentValue > 1) {
      setQuantityInput((currentValue - 1).toString());
    } else {
      // If it's 1, clear to empty string
      setQuantityInput('');
    }
  };

  const handleAddToCart = () => {
    const finalPrice = parseFloat(customPrice) || (selectedPriceOption?.price || 0);
    
    if (finalPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid unit price');
      return;
    }

    // Parse quantity with validation
    const quantity = parseInt(quantityInput);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity (minimum 1)');
      return;
    }

    if (quantity > selectedShop.quantity) {
      Alert.alert('Error', `Only ${selectedShop.quantity} units available`);
      return;
    }

    const finalPriceOption: PriceOption = selectedPriceOption || {
      id: 'custom',
      label: 'Custom Price',
      price: finalPrice,
      type: 'custom'
    };

    onAddToCart({
      shop: selectedShop,
      priceOption: {
        ...finalPriceOption,
        price: finalPrice
      },
      quantity: quantity,
      notes: notes
    });
  };

  const finalPrice = parseFloat(customPrice) || (selectedPriceOption?.price || 0);
  const parsedQuantity = parseInt(quantityInput) || 0;
  const showOrderSummary = finalPrice > 0 && parsedQuantity > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Use KeyboardAvoidingView to lift content when keyboard appears */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <YStack flex={1} backgroundColor="$orange1" padding="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <H4 fontWeight="bold" color="$orange12">Add to Cart - {selectedShop.shopName}</H4>
            <Button onPress={onClose} circular size="$2" backgroundColor="$orange3">
              <Text color="$orange11">✕</Text>
            </Button>
          </XStack>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <YStack space="$4" paddingBottom={20}>
              {/* Shop Info */}
              <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
                <YStack space="$2">
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange12">Shop:</Text>
                    <Text fontWeight="600" color="$orange12">{selectedShop.shopName}</Text>
                  </XStack>
                  {selectedShop.branchName && (
                    <XStack justifyContent="space-between">
                      <Text color="$orange10">Branch:</Text>
                      <Text color="$orange10">{selectedShop.branchName}</Text>
                    </XStack>
                  )}
                  <XStack justifyContent="space-between">
                    <Text color="$orange10">Available:</Text>
                    <Text color="$green10" fontWeight="600">{selectedShop.quantity} units</Text>
                  </XStack>
                </YStack>
              </Card>

              {/* Price Options */}
              <YStack space="$2">
                <Text fontWeight="600" color="$orange11" fontSize="$4">Select Price Option:</Text>
                {priceOptions.map((option) => (
                  <TouchableOpacity 
                    key={option.id} 
                    onPress={() => handleSelectPrice(option)}
                  >
                    <Card 
                      backgroundColor={selectedPriceOption?.id === option.id ? "$orange3" : "$orange1"}
                      borderColor={selectedPriceOption?.id === option.id ? "$orange7" : "$orange4"}
                      borderWidth={2}
                      borderRadius="$3"
                      padding="$3"
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack flex={1}>
                          <Text fontWeight="600" color="$orange12">
                            {option.label}
                          </Text>
                          <Text color="$orange10" fontSize="$2">
                            {option.type === 'default' ? 'Standard price' : 'Additional price'}
                          </Text>
                        </YStack>
                        <Text fontWeight="700" color="$green10" fontSize="$5">
                          ${safeToFixed(option.price)}
                        </Text>
                      </XStack>
                    </Card>
                  </TouchableOpacity>
                ))}
              </YStack>

              {/* Custom Price Input */}
              <YStack space="$2">
                <Text fontWeight="600" color="$orange11" fontSize="$4">Unit Price:</Text>
                <Input
                  value={customPrice}
                  onChangeText={handleCustomPriceChange}
                  keyboardType="decimal-pad"
                  placeholder="Enter unit price"
                  fontSize="$5"
                  fontWeight="600"
                  backgroundColor="white"
                  borderColor="$orange5"
                  borderWidth={2}
                />
                <Text fontSize="$2" color="$orange10">
                  You can use a preset price above or enter your own custom price
                </Text>
              </YStack>

              {/* Quantity Selection */}
              <YStack space="$2">
                <Text fontWeight="600" color="$orange11" fontSize="$4">Quantity:</Text>
                <XStack justifyContent="center" alignItems="center" space="$4">
                  <Button
                    size="$4"
                    circular
                    backgroundColor="$orange2"
                    borderColor="$orange6"
                    borderWidth={2}
                    onPress={handleQuantityDecrement}
                    disabled={quantityInput === '' && parseInt(quantityInput) <= 0}
                    width="$4"
                    height="$4"
                  >
                    <Text color="$orange11" fontWeight="bold" fontSize="$6">-</Text>
                  </Button>
                  
                  <Input
                    width={80}
                    value={quantityInput}
                    onChangeText={handleQuantityInputChange}
                    keyboardType="numeric"
                    textAlign="center"
                    fontSize="$6"
                    fontWeight="700"
                    borderWidth={2}
                    borderRadius="$3"
                    borderColor="$orange5"
                    placeholder="Qty"
                  />
                  
                  <Button
                    size="$4"
                    circular
                    backgroundColor="$orange2"
                    borderColor="$orange6"
                    borderWidth={2}
                    onPress={handleQuantityIncrement}
                    disabled={parseInt(quantityInput) >= selectedShop.quantity}
                    width="$4"
                    height="$4"
                  >
                    <Text color="$orange11" fontWeight="bold" fontSize="$6">+</Text>
                  </Button>
                </XStack>
                <Text fontSize="$2" color="$orange10" textAlign="center">
                  Maximum: {selectedShop.quantity} units
                </Text>
              </YStack>

              {/* Order Summary */}
              {showOrderSummary && (
                <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
                  <YStack space="$2">
                    <H5 fontWeight="bold" color="$orange12" textAlign="center">
                      Order Summary
                    </H5>
                    <XStack justifyContent="space-between">
                      <Text color="$orange11">Unit Price:</Text>
                      <Text fontWeight="600" color="$orange12">
                        ${safeToFixed(finalPrice)}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="$orange11">Quantity:</Text>
                      <Text fontWeight="600" color="$orange12">{parsedQuantity}</Text>
                    </XStack>
                    <Separator borderColor="$orange4" />
                    <XStack justifyContent="space-between">
                      <Text fontSize="$5" fontWeight="bold" color="$green10">
                        Total:
                      </Text>
                      <Text fontSize="$5" fontWeight="bold" color="$green10">
                        ${safeToFixed(finalPrice * parsedQuantity)}
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              )}

              {/* Add to Cart Button */}
              <Button
                onPress={handleAddToCart}
                backgroundColor="$orange9"
                borderColor="$orange10"
                borderWidth={2}
                borderRadius="$4"
                height="$5"
                disabled={finalPrice <= 0 || parsedQuantity <= 0}
              >
                <Text color="white" fontWeight="700" fontSize="$4">
                  🛒 Add to Cart
                </Text>
              </Button>
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ProductDetailScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();

  // Get product data from navigation params
  const productId = params.productId as string;
  const productName = params.productName as string;
  const productImage = params.productImage as string;

  // Local state
  const [selectedShopForModal, setSelectedShopForModal] = useState<SelectedShopInfo | null>(null);
  const [selectedPriceOption, setSelectedPriceOption] = useState<PriceOption | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Use React Query to fetch product batches
  const {
    data: batchesData,
    isLoading: batchesLoading,
    error: batchesError,
    refetch: refetchBatches,
  } = useQuery<ProductBatchesForUserResponse>({
    queryKey: ['product-batches', productId],
    queryFn: () => getProductBatchesByShopsForUser(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  // Extract data from response
  const shops = batchesData?.batches?.shops || [];
  const hasStock = batchesData?.batches?.hasStock || false;

  // Load cart data
  React.useEffect(() => {
    dispatch(fetchMyCart());
  }, [dispatch]);

  const handleOpenPriceModal = (shop: SelectedShopInfo, priceOption?: PriceOption) => {
    setSelectedShopForModal(shop);
    setSelectedPriceOption(priceOption || null);
    setShowPriceModal(true);
  };

  const handleClosePriceModal = () => {
    setShowPriceModal(false);
    setSelectedShopForModal(null);
    setSelectedPriceOption(null);
  };

  const handleAddToCart = async (cartData: {
    shop: SelectedShopInfo;
    priceOption: PriceOption;
    quantity: number;
    notes: string;
  }) => {
    try {
      const cartItemData = {
        productId: productId,
        shopId: cartData.shop.shopId,
        quantity: cartData.quantity,
        unitPrice: cartData.priceOption.price,
        notes: cartData.notes
      };

      await dispatch(addItemToUserCart(cartItemData)).unwrap();
      
      Alert.alert(
        'Success', 
        'Item added to cart successfully!',
        [
          {
            text: 'Continue Shopping',
            onPress: () => router.push('/home' as any),
          }
        ]
      );
      
      handleClosePriceModal();
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item to cart');
    }
  };

  // Custom Badge Component
  const Badge = ({ children, backgroundColor, ...props }: any) => (
    <YStack
      backgroundColor={backgroundColor}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <Text fontSize="$1" fontWeight="700" color="white">
        {children}
      </Text>
    </YStack>
  );

  if (batchesLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
        <Text marginTop="$4" color="$orange11" fontSize="$5" fontWeight="600">
          Loading product details...
        </Text>
      </YStack>
    );
  }

  if (batchesError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$orange1">
        <Text color="$red10" textAlign="center" fontSize="$5" fontWeight="600">
          Error: {(batchesError as Error).message || 'Failed to load product batches'}
        </Text>
        <Button 
          marginTop="$4"
          onPress={() => refetchBatches()}
          backgroundColor="$orange9"
          borderColor="$orange10"
          borderWidth={1}
          borderRadius="$4"
          pressStyle={{ backgroundColor: "$orange10" }}
        >
          <Text color="white" fontWeight="600">Retry</Text>
        </Button>
      </YStack>
    );
  }

  const handleBack = () => {
    router.back();
  };

  if (!hasStock) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$orange1">
        <Text color="$red10" textAlign="center" fontSize="$5" fontWeight="600">
          No stock available for this product
        </Text>
        <Text color="$orange10" textAlign="center" marginTop="$2">
          Please check back later or contact support.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$orange1">
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack space="$4" padding="$4">
          {/* Product Header */}
          <Button 
            onPress={handleBack}
            alignSelf="flex-start"
            size="$3"
            backgroundColor="$orange2"
            borderColor="$orange5"
            borderWidth={1}
            borderRadius="$3"
            marginBottom="$2"
          >
            <Text color="$orange11" fontWeight="600">← Back </Text>
          </Button>
          
          <Card 
            elevate 
            size="$4" 
            bordered 
            borderRadius="$4" 
            backgroundColor="$orange1"
            borderColor="$orange4"
            shadowColor="$orange7"
            shadowRadius={8}
          >
            <Card.Header padded>
              <YStack space="$3" alignItems="center">
                {productImage && (
                  <Image
                    source={{ uri: normalizeImagePath(productImage) }}
                    width={100}
                    height={100}
                    borderRadius="$4"
                    resizeMode="cover"
                    borderWidth={2}
                    borderColor="$orange4"
                  />
                )}
                <H4 fontWeight="bold" color="$orange12" textAlign="center">
                  {productName}
                </H4>
              </YStack>
            </Card.Header>
          </Card>

          {/* Available Shops List */}
          <YStack space="$3">
            <H4 fontWeight="bold">Available Shops</H4>

            {shops.map((shop: ShopBatchInfo) => {
              const shopPriceOptions: PriceOption[] = [
                {
                  id: "base",
                  label: "Base Price",
                  price: safeNumber(shop.basePrice || shop.totalPrice || 0),
                },
                ...(shop.additionalPrices?.map((ap) => ({
                  id: ap.id,
                  label: ap.label || "Additional Price",
                  price: safeNumber(ap.price),
                  type: "additional" as const
                })) || []),
              ].filter((p) => p.price > 0);

              return (
                <Card
                  key={shop.shopId}
                  bordered
                  borderRadius="$4"
                  padding="$3"
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="700" fontSize="$5">{shop.shopName}</Text>
                    <Badge size="$2" theme="green">
                      {shop.quantity} in stock
                    </Badge>
                  </XStack>

                  <YStack space="$2" mt="$2">
                    {/* Additional Price Options */}
                    {shopPriceOptions.slice(1).map((p) => (
                      <Button
                        key={p.id}
                        size="$3"
                        variant="outlined"
                        onPress={() => handleOpenPriceModal(shop, p)}
                      >
                        <XStack justifyContent="space-between" width="100%">
                          <Text>{p.label}</Text>
                          <Text fontWeight="700">${safeToFixed(p.price)}</Text>
                        </XStack>
                      </Button>
                    ))}

                    {/* Custom Price */}
                    <Button
                      size="$3"
                      onPress={() => handleOpenPriceModal(shop)}
                    >
                      Custom Price
                    </Button>
                  </YStack>
                </Card>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Price Selection Modal */}
      <PriceSelectionModal
        selectedShop={selectedShopForModal}
        selectedPriceOption={selectedPriceOption}
        visible={showPriceModal}
        onClose={handleClosePriceModal}
        onAddToCart={handleAddToCart}
      />
    </YStack>
  );
};

export default ProductDetailScreen;