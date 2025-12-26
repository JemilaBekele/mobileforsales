import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Alert,
  RefreshControl,
  Modal,
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
  H4,
  H3,
  Image,
} from 'tamagui';
import type { AppDispatch } from '@/(redux)/store';

// Waitlist Redux imports
import {
  fetchMyWaitlists,
  removeWaitlistItem,
  convertWaitlistToCartAction,
  selectWaitlistItems,
  selectWaitlistLoading,
  selectWaitlistError,
  selectConversionLoading,
  clearError,
  removeWaitlistItemOptimistic,
  selectWaitlistItemCount,
  selectLastConversionResult,
  selectTotalConvertedItems,
} from '@/(redux)/WaitlistCart';

// Types
import type { WaitlistItem } from '@/(services)/api/WaitlistCart';
import { clearCartAction, clearUserCart, fetchMyCart, selectCart, selectCartCustomerId } from '@/(redux)/CART';
import { selectCustomers, setCurrentCustomer } from '@/(redux)/customer';

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

// Helper functions for safe property access
const getItemQuantity = (item: WaitlistItem): number => {
  return item.cartItem?.quantity || 0;
};

const getItemUnitPrice = (item: WaitlistItem): number => {
  return item.cartItem?.unitPrice || 0;
};

const getItemTotalPrice = (item: WaitlistItem): number => {
  const quantity = getItemQuantity(item);
  const unitPrice = getItemUnitPrice(item);
  return quantity * unitPrice;
};

// Group waitlist items by customer - CLIENT-SIDE GROUPING with safety checks
const groupWaitlistByCustomer = (items: WaitlistItem[] | undefined): Record<string, WaitlistItem[]> => {
  if (!items || !Array.isArray(items)) {
    return {};
  }
  
  const grouped: Record<string, WaitlistItem[]> = {};
  
  items.forEach((item, index) => {
    try {
      const customerId = item?.customerId || 'unknown';
      
      if (!grouped[customerId]) {
        grouped[customerId] = [];
      }
      grouped[customerId].push(item);
    } catch (error) {
      console.error(`❌ Error processing waitlist item at index ${index}:`, error, item);
    }
  });
  
  return grouped;
};

// Calculate customer totals
const calculateCustomerTotals = (items: WaitlistItem[]) => {
  if (!items || !Array.isArray(items)) {
    return { totalItems: 0, totalQuantity: 0, totalValue: 0 };
  }
  
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const totalValue = items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  
  return { totalItems, totalQuantity, totalValue };
};

// Customer Section Component
const CustomerWaitlistSection = ({
  customerName,
  customerId,
  items,
  expanded,
  onToggle,
  onViewDetails,
  onConvertToCart,
  onConvertAllToCart,
  onRemoveFromWaitlist,
  onRemoveAllForCustomer,
  conversionLoading,
  convertAllLoading,
  removeAllLoading,
}: {
  customerName: string;
  customerId: string;
  items: WaitlistItem[];
  expanded: boolean;
  onToggle: () => void;
  onViewDetails: (item: WaitlistItem) => void;
  onConvertToCart: (itemId: string) => void;
  onConvertAllToCart: (customerId: string) => void;
  onRemoveFromWaitlist: (itemId: string) => void;
  onRemoveAllForCustomer: (customerId: string) => void;
  conversionLoading: boolean;
  convertAllLoading: boolean;
  removeAllLoading: boolean;
}) => {
  const { totalItems, totalQuantity, totalValue } = calculateCustomerTotals(items);
  
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // Safety check for empty items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card 
      elevate 
      bordered 
      borderRadius="$4" 
      backgroundColor="$orange1"
      borderColor="$orange4"
      shadowColor="$orange7"
      marginBottom="$3"
    >
      <Card.Header padded>
        <YStack space="$3">
          {/* Customer Header - Clickable to expand/collapse */}
          <TouchableOpacity onPress={onToggle}>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1} space="$1">
                <H4 color="$orange12" numberOfLines={1}>
                  {customerName}
                </H4>
                <XStack space="$4">
                  <Text fontSize="$2" color="$orange10">
                    📦 {totalItems} items
                  </Text>
                  <Text fontSize="$2" color="$orange10">
                    🔢 {totalQuantity} units
                  </Text>
                  <Text fontSize="$2" color="$green10" fontWeight="600">
                    💰 {formatPrice(totalValue)}
                  </Text>
                </XStack>
              </YStack>
              {expanded ? (
                <Text fontSize="$2" color="$orange10">▲</Text>
              ) : (
                <Text fontSize="$2" color="$orange10">▼</Text>
              )}
            </XStack>
          </TouchableOpacity>

          {/* Action Buttons - Always visible in header */}
          <XStack justifyContent="space-between" marginTop="$2">
            <Button
              size="$2"
              backgroundColor="$red3"
              borderColor="$red6"
              borderWidth={1}
              borderRadius="$3"
              onPress={() => onRemoveAllForCustomer(customerId)}
              disabled={removeAllLoading}
              pressStyle={{ backgroundColor: "$red4" }}
            >
              {removeAllLoading ? (
                <Spinner size="small" color="$red11" />
              ) : (
                <XStack alignItems="center" space="$2">
                  <Text color="$red11" fontWeight="600" fontSize="$2">
                    🗑️ Remove All
                  </Text>
                </XStack>
              )}
            </Button>
            
            <Button
              size="$2"
              backgroundColor="$green9"
              borderColor="$green10"
              borderWidth={1}
              borderRadius="$3"
              onPress={() => onConvertAllToCart(customerId)}
              disabled={convertAllLoading || conversionLoading}
              pressStyle={{ backgroundColor: "$green10" }}
            >
              {convertAllLoading ? (
                <Spinner size="small" color="white" />
              ) : (
                <XStack alignItems="center" space="$2">
                  <Text color="white" fontWeight="600" fontSize="$2">
                    🛒 Convert All ({totalItems} items)
                  </Text>
                </XStack>
              )}
            </Button>
          </XStack>

          {/* Expanded Content */}
          {expanded && (
            <YStack space="$3" marginTop="$3" borderTopWidth={1} borderTopColor="$orange3" paddingTop="$3">
              {items.map((item) => {
                // Safety check for each item
                if (!item) return null;
                
                const quantity = getItemQuantity(item);
                const product = item.cartItem?.product;
                const shop = item.cartItem?.shop;
                
                return (
                  <Card 
                    key={item.id || Math.random().toString()}
                    backgroundColor="$orange2"
                    borderColor="$orange3"
                    borderWidth={1}
                    borderRadius="$3"
                    padding="$3"
                    marginBottom="$2"
                  >
                    <YStack space="$2">
                      {/* Product Info */}
                      <XStack space="$3" alignItems="flex-start">
                        {product?.imageUrl && (
                          <Image
                            source={{ uri: normalizeImagePath(product.imageUrl) }}
                            width={50}
                            height={50}
                            borderRadius="$2"
                            resizeMode="cover"
                            backgroundColor="#FFF7F0"
                            borderWidth={1}
                            borderColor="#FFD4A3"
                          />
                        )}
                        <YStack flex={1} space="$1">
                          <Text fontSize="$3" fontWeight="600" color="$orange12" numberOfLines={2}>
                            {product?.name || 'Unknown Product'}
                          </Text>
                          <XStack space="$3">
                            <Text fontSize="$2" color="$orange10">
                              Qty: {quantity}
                            </Text>
                            <Text fontSize="$2" color="$orange10">
                              Price: ${getItemUnitPrice(item).toFixed(2)}
                            </Text>
                            {shop && (
                              <Text fontSize="$2" color="$orange10">
                                🏪 {shop.name}
                              </Text>
                            )}
                          </XStack>
                          {item.createdAt && (
                            <Text fontSize="$1" color="$orange9">
                              📅 {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                          )}
                        </YStack>
                      </XStack>

                      {/* Action Buttons */}
                      <XStack space="$2" marginTop="$2">
                        <Button
                          flex={1}
                          size="$1"
                          backgroundColor="$orange3"
                          borderColor="$orange6"
                          borderWidth={1}
                          borderRadius="$2"
                          onPress={() => onViewDetails(item)}
                          pressStyle={{ backgroundColor: "$orange4" }}
                        >
                          <Text color="$orange11" fontWeight="600" fontSize="$1">
                            📋 Details
                          </Text>
                        </Button>
                        <Button
                          size="$1"
                          backgroundColor="$red3"
                          borderColor="$red6"
                          borderWidth={1}
                          borderRadius="$2"
                          onPress={() => onRemoveFromWaitlist(item.id)}
                          pressStyle={{ backgroundColor: "$red4" }}
                        >
                          <Text color="$red11" fontWeight="600" fontSize="$1">
                            🗑️
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                );
              })}
            </YStack>
          )}
        </YStack>
      </Card.Header>
    </Card>
  );
};

const WaitlistItemDetailModal = ({
  item,
  visible,
  onClose,
  onRemoveFromWaitlist,
  onConvertToCart,
  removingFromWaitlist,
  convertingToCart,
}: {
  item: WaitlistItem;
  visible: boolean;
  onClose: () => void;
  onRemoveFromWaitlist: (itemId: string) => void;
  onConvertToCart: (itemId: string) => void;
  removingFromWaitlist: boolean;
  convertingToCart: boolean;
}) => {
  // Safe price formatting
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return 'N/A';
    const numPrice = Number(price);
    return isNaN(numPrice) ? 'N/A' : `$${numPrice.toFixed(2)}`;
  };

  const quantity = getItemQuantity(item);
  const unitPrice = getItemUnitPrice(item);
  const totalPrice = getItemTotalPrice(item);
  
  // Get product from cartItem
  const product = item.cartItem?.product;
  const shop = item.cartItem?.shop;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <YStack 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        backgroundColor="rgba(0,0,0,0.5)"
        padding="$4"
      >
        <YStack 
          backgroundColor="$orange1" 
          borderRadius="$4" 
          padding="$4" 
          width="100%"
          maxWidth={500}
          borderWidth={1}
          borderColor="$orange4"
          maxHeight="80%"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack space="$4">
              <H4 textAlign="center" color="$orange12">
                Waitlist Item Details
              </H4>

              {/* Item Header Info */}
              <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                <YStack space="$3">
                  {item.customer && (
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600" color="$orange11">Customer:</Text>
                      <Text fontWeight="700" color="$orange12">
                        {item.customer?.name || 'N/A'}
                      </Text>
                    </XStack>
                  )}
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Quantity:</Text>
                    <Text fontWeight="700" color="$orange12">{quantity}</Text>
                  </XStack>
                  {product && (
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600" color="$orange11">Product:</Text>
                      <Text fontWeight="700" color="$orange12">{product.name}</Text>
                    </XStack>
                  )}
                  {shop && (
                    <Text fontSize="$2" color="$orange10">
                      Shop: {shop.name}
                    </Text>
                  )}
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Created:</Text>
                    <Text fontWeight="600" color="$orange10">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </XStack>
                </YStack>
              </Card>

              {/* Product Details */}
              {product && (
                <YStack space="$3">
                  <Text fontSize="$5" fontWeight="700" color="$orange12">
                    Product Details
                  </Text>
                  <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
                    <YStack space="$2">
                      <XStack space="$3" alignItems="flex-start">
                        {product.imageUrl && (
                          <Image
                            source={{ uri: normalizeImagePath(product.imageUrl) }}
                            width={60}
                            height={60}
                            borderRadius="$3"
                            resizeMode="cover"
                            borderWidth={1}
                            borderColor="$orange4"
                          />
                        )}
                        <YStack flex={1} space="$1">
                          <Text fontSize="$4" fontWeight="700" color="$orange12">
                            {product.name}
                          </Text>
                          {product.unitOfMeasure && (
                            <Text fontSize="$2" color="$orange10">
                              Unit: {product.unitOfMeasure.name}
                            </Text>
                          )}
                          {/* Safe price display */}
                          <Text fontSize="$3" fontWeight="600" color="$green10">
                            Price: {formatPrice(product.sellPrice)}
                          </Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </Card>
                </YStack>
              )}

              {/* Price Details */}
              <YStack space="$3">
                <Text fontSize="$5" fontWeight="700" color="$orange12">
                  Price Details
                </Text>
                <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
                  <YStack space="$2">
                    <XStack justifyContent="space-between">
                      <Text fontSize="$3" color="$orange11">Unit Price:</Text>
                      <Text fontSize="$3" fontWeight="700" color="$green10">
                        {formatPrice(unitPrice)}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text fontSize="$3" color="$orange11">Total Price:</Text>
                      <Text fontSize="$3" fontWeight="700" color="$green10">
                        {formatPrice(totalPrice)}
                      </Text>
                    </XStack>
                    {item.cartItem?.notes && (
                      <XStack justifyContent="space-between">
                        <Text fontSize="$3" color="$orange11">Notes:</Text>
                        <Text fontSize="$3" color="$orange10">{item.cartItem.notes}</Text>
                      </XStack>
                    )}
                  </YStack>
                </Card>
              </YStack>

              {/* Action Buttons */}
              <XStack space="$3" marginTop="$4">
                <Button
                  flex={1}
                  backgroundColor="$orange3"
                  borderColor="$orange6"
                  borderWidth={1}
                  borderRadius="$4"
                  onPress={onClose}
                  pressStyle={{ backgroundColor: "$orange4" }}
                >
                  <Text color="$orange11" fontWeight="600">Close</Text>
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$red9"
                  borderColor="$red10"
                  borderWidth={1}
                  borderRadius="$4"
                  onPress={() => onRemoveFromWaitlist(item.id)}
                  disabled={removingFromWaitlist}
                  pressStyle={{ backgroundColor: "$red10" }}
                >
                  {removingFromWaitlist ? (
                    <Spinner size="small" color="white" />
                  ) : (
                    <Text color="white" fontWeight="600">Remove</Text>
                  )}
                </Button>
              </XStack>
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
};

// Remove Confirmation Modal
const RemoveConfirmationModal = ({
  item,
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  item: WaitlistItem;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const product = item.cartItem?.product;
  const quantity = getItemQuantity(item);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <YStack 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        backgroundColor="rgba(0,0,0,0.5)"
        padding="$4"
      >
        <YStack 
          backgroundColor="$orange1" 
          borderRadius="$4" 
          padding="$4" 
          width="100%"
          maxWidth={400}
          borderWidth={1}
          borderColor="$orange4"
        >
          <YStack space="$4" alignItems="center">
            <Text fontSize="$6" color="$red10">⚠️</Text>
            <H4 textAlign="center" color="$orange12">
              Remove from Waitlist?
            </H4>
            
            <Text textAlign="center" color="$orange11">
              Are you sure you want to remove this item from waitlist?
            </Text>

            <Card backgroundColor="$orange2" padding="$3" borderRadius="$3" width="100%">
              <YStack space="$2" alignItems="center">
                <Text fontWeight="700" color="$orange12" textAlign="center">
                  {product?.name || 'Unknown Product'}
                </Text>
                <Text color="$orange10">Quantity: {quantity}</Text>
                {item.customer && (
                  <Text color="$orange10">Customer: {item.customer.name}</Text>
                )}
              </YStack>
            </Card>

            <Text fontSize="$2" color="$orange9" textAlign="center">
              This action cannot be undone.
            </Text>

            <XStack space="$3" width="100%">
              <Button
                flex={1}
                backgroundColor="$orange3"
                borderColor="$orange6"
                borderWidth={1}
                borderRadius="$4"
                onPress={onClose}
                disabled={loading}
              >
                <Text color="$orange11" fontWeight="600">Cancel</Text>
              </Button>
              <Button
                flex={1}
                backgroundColor="$red9"
                borderColor="$red10"
                borderWidth={1}
                borderRadius="$4"
                onPress={onConfirm}
                disabled={loading}
                pressStyle={{ backgroundColor: "$red10" }}
              >
                {loading ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <Text color="white" fontWeight="600">Remove</Text>
                )}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
};

// Remove All Confirmation Modal
const RemoveAllConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  loading,
  itemCount,
  customerName,
  type,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  itemCount: number;
  customerName?: string;
  type: 'all' | 'customer';
}) => {
  const title = type === 'all' 
    ? 'Remove All Waitlist Items?' 
    : `Remove All Items for ${customerName}?`;
  
  const description = type === 'all'
    ? 'Are you sure you want to remove ALL items from your waitlist?'
    : `Are you sure you want to remove ALL items from ${customerName}'s waitlist?`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <YStack 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        backgroundColor="rgba(0,0,0,0.5)"
        padding="$4"
      >
        <YStack 
          backgroundColor="$orange1" 
          borderRadius="$4" 
          padding="$4" 
          width="100%"
          maxWidth={400}
          borderWidth={1}
          borderColor="$orange4"
        >
          <YStack space="$4" alignItems="center">
            <Text fontSize="$8" color="$red10">⚠️</Text>
            <H4 textAlign="center" color="$orange12">
              {title}
            </H4>
            
            <Text textAlign="center" color="$orange11">
              {description}
            </Text>

            <Card backgroundColor="$orange2" padding="$3" borderRadius="$3" width="100%">
              <YStack space="$2" alignItems="center">
                <Text fontWeight="700" color="$orange12" textAlign="center">
                  Total Items: {itemCount}
                </Text>
                <Text color="$orange10">This action will permanently remove all selected waitlist items</Text>
              </YStack>
            </Card>

            <Text fontSize="$2" color="$red10" textAlign="center" fontWeight="600">
              ⚠️ This action cannot be undone!
            </Text>

            <XStack space="$3" width="100%">
              <Button
                flex={1}
                backgroundColor="$orange3"
                borderColor="$orange6"
                borderWidth={1}
                borderRadius="$4"
                onPress={onClose}
                disabled={loading}
              >
                <Text color="$orange11" fontWeight="600">Cancel</Text>
              </Button>
              <Button
                flex={1}
                backgroundColor="$red9"
                borderColor="$red10"
                borderWidth={1}
                borderRadius="$4"
                onPress={onConfirm}
                disabled={loading}
                pressStyle={{ backgroundColor: "$red10" }}
              >
                {loading ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <Text color="white" fontWeight="600">
                    {type === 'all' ? 'Remove All' : `Remove All for ${customerName}`}
                  </Text>
                )}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
};

const WaitlistScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const waitlistItems = useSelector(selectWaitlistItems);
  const loading = useSelector(selectWaitlistLoading);
  const error = useSelector(selectWaitlistError);
  const conversionLoading = useSelector(selectConversionLoading);
  const itemCount = useSelector(selectWaitlistItemCount);
  const lastConversionResult = useSelector(selectLastConversionResult);
  const totalConvertedItems = useSelector(selectTotalConvertedItems);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WaitlistItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [convertAllLoading, setConvertAllLoading] = useState<Record<string, boolean>>({});
  const [removeAllLoading, setRemoveAllLoading] = useState<Record<string, boolean>>({});
  const [removeAllType, setRemoveAllType] = useState<'all' | 'customer' | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Safely group items by customer - ensure waitlistItems is an array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const waitlistItemsArray = Array.isArray(waitlistItems) ? waitlistItems : [];
  const groupedByCustomer = groupWaitlistByCustomer(waitlistItemsArray);
  
  // Calculate totals with safety checks
  const totalQuantity = waitlistItemsArray.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const totalValue = waitlistItemsArray.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  const cart = useSelector(selectCart);
  const cartCustomerId = useSelector(selectCartCustomerId);
  const customers = useSelector(selectCustomers);

  // Load waitlist data
  useEffect(() => {
    dispatch(fetchMyWaitlists());
  }, [dispatch]);

  // Refresh waitlist data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchMyWaitlists());
    }, [dispatch])
  );

  // Show success/error messages for bulk conversion
  useEffect(() => {
    if (lastConversionResult) {
      if (lastConversionResult.success) {
        Alert.alert(
          'Success ✅',
          lastConversionResult.message || `${totalConvertedItems} items converted to cart successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh waitlist after successful conversion
                dispatch(fetchMyWaitlists());
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error ❌',
          lastConversionResult.message || 'Failed to convert items to cart'
        );
      }
    }
  }, [lastConversionResult, totalConvertedItems, dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchMyWaitlists()).unwrap();
    } catch (error: any) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (item: WaitlistItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleRemoveFromWaitlist = (itemId: string) => {
    const item = waitlistItemsArray.find(i => i?.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowRemoveModal(true);
    }
  };

  const confirmRemoveFromWaitlist = async () => {
    if (!selectedItem) return;

    try {
      setRemovingItemId(selectedItem.id);
      // Optimistic update
      dispatch(removeWaitlistItemOptimistic(selectedItem.id));
      
      await dispatch(removeWaitlistItem(selectedItem.id)).unwrap();
      
      setShowRemoveModal(false);
      setShowDetailModal(false);
      setSelectedItem(null);
      Alert.alert('Success', 'Item removed from waitlist');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove item from waitlist');
      // Refresh to revert optimistic update
      dispatch(fetchMyWaitlists());
    } finally {
      setRemovingItemId(null);
    }
  };

  // Handle removing all items for a specific customer
  const handleRemoveAllForCustomer = (customerId: string) => {
    const customerItems = groupedByCustomer[customerId] || [];
    if (customerItems.length === 0) {
      Alert.alert('Info', 'No items found for this customer');
      return;
    }
    
    setSelectedCustomerId(customerId);
    setRemoveAllType('customer');
    setShowRemoveAllModal(true);
  };

  // Handle removing all items from entire waitlist
  const handleRemoveAllItems = () => {
    if (waitlistItemsArray.length === 0) {
      Alert.alert('Info', 'Your waitlist is already empty');
      return;
    }
    
    setSelectedCustomerId(null);
    setRemoveAllType('all');
    setShowRemoveAllModal(true);
  };

  const confirmRemoveAll = async () => {
    try {
      if (removeAllType === 'all') {
        // Remove all items from waitlist
        setRemoveAllLoading(prev => ({ ...prev, 'all': true }));
        
        // Remove each item individually (you might want to implement a batch API)
        const itemIds = waitlistItemsArray.map(item => item.id).filter(Boolean);
        
        // Optimistic updates for all items
        itemIds.forEach(itemId => {
          dispatch(removeWaitlistItemOptimistic(itemId));
        });
        
        // Remove all items one by one
        await Promise.all(
          itemIds.map(itemId => 
            dispatch(removeWaitlistItem(itemId)).unwrap()
          )
        );
        
        Alert.alert('Success', `All ${itemCount} items removed from waitlist`);
      } else if (removeAllType === 'customer' && selectedCustomerId) {
        // Remove all items for specific customer
        setRemoveAllLoading(prev => ({ ...prev, [selectedCustomerId]: true }));
        
        const customerItems = groupedByCustomer[selectedCustomerId] || [];
        const itemIds = customerItems.map(item => item.id).filter(Boolean);
        const customerName = customerItems[0]?.customer?.name || 'Customer';
        
        // Optimistic updates for customer items
        itemIds.forEach(itemId => {
          dispatch(removeWaitlistItemOptimistic(itemId));
        });
        
        // Remove customer items one by one
        await Promise.all(
          itemIds.map(itemId => 
            dispatch(removeWaitlistItem(itemId)).unwrap()
          )
        );
        
        Alert.alert('Success', `All items for ${customerName} removed from waitlist`);
      }
      
      setShowRemoveAllModal(false);
      setRemoveAllType(null);
      setSelectedCustomerId(null);
      
      // Refresh data
      dispatch(fetchMyWaitlists());
      
    } catch (error: any) {
      console.error('Remove all error:', error);
      Alert.alert('Error', error.message || 'Failed to remove items');
      // Refresh to revert optimistic updates
      dispatch(fetchMyWaitlists());
    } finally {
      // Clear all loading states
      setRemoveAllLoading({});
    }
  };
  const handleConvertToCart = async (itemId: string) => {
    try {
      // Get the waitlist item
      const waitlistItem = waitlistItemsArray.find(item => item.id === itemId);
      if (!waitlistItem) {
        Alert.alert('Error', 'Waitlist item not found');
        return;
      }

      // Get waitlist customer ID
      const waitlistCustomerId = waitlistItem.customerId;
      if (!waitlistCustomerId) {
        Alert.alert('Error', 'Waitlist item has no customer assigned');
        return;
      }

      // Check for customer mismatch
      if (cart && cart.items && cart.items.length > 0) {
        if (cartCustomerId && cartCustomerId !== waitlistCustomerId) {
          // Get customer names for better error message
          const waitlistCustomer = waitlistItem.customer;
          const cartCustomer = customers.find(c => c.id === cartCustomerId);
          
          Alert.alert(
            'Customer Mismatch',
            `Current cart is assigned to customer: ${cartCustomer?.name || cartCustomerId}\n` +
            `Waitlist item is for customer: ${waitlistCustomer?.name || waitlistCustomerId}\n\n` +
            'Please clear the cart or select the same customer.',
            [
              { text: 'OK', style: 'cancel' },
            ]
          );
          return;
        }
      }
                    dispatch(clearCartAction()); // This clears cart AND customer data
  localStorage.removeItem('cartCustomer');
      localStorage.removeItem('cartData');
      sessionStorage.removeItem('cartCustomer');
      // If no customer mismatch or cart is empty, proceed with conversion
      await proceedWithConversion(itemId, waitlistCustomerId);
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item to cart');
    }
  };

  // Helper function to handle conversion
  const proceedWithConversion = async (itemId: string, customerId: string) => {
    try {
      await dispatch(convertWaitlistToCartAction(itemId)).unwrap();
      
      // After successful conversion, refresh cart to get updated customer info
      await dispatch(fetchMyCart());
      
      Alert.alert('Success', 'Item added to cart successfully');
      setShowDetailModal(false);
      setSelectedItem(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item to cart');
    }
  };

  // Updated: Handle converting ALL waitlist items for a customer
const handleConvertAllToCart = async (customerId: string) => {
    try {
      const customerItems = groupedByCustomer[customerId] || [];
      if (customerItems.length === 0) {
        Alert.alert('Info', 'No items found for this customer');
        return;
      }

      // Check for customer mismatch
      if (cart && cart.items && cart.items.length > 0) {
        if (cartCustomerId && cartCustomerId !== customerId) {
          const waitlistCustomer = customerItems[0]?.customer;
          const cartCustomer = customers.find(c => c.id === cartCustomerId);
          
          Alert.alert(
            'Customer Mismatch',
            `Current cart is assigned to customer: ${cartCustomer?.name || cartCustomerId}\n` +
            `Waitlist items are for customer: ${waitlistCustomer?.name || customerId}\n\n` +
            'Please clear the cart or select the same customer.',
            [
              { text: 'OK', style: 'cancel' },
              { 
                text: 'Clear Cart', 
                style: 'destructive',
                onPress: async () => {
                  try {
                                        dispatch(clearCartAction()); // This clears cart AND customer data

                    await dispatch(clearUserCart()).unwrap();
                   
                    // Now try bulk conversion
                    await proceedWithBulkConversion(customerId, customerItems);
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to clear cart');
                  }
                }
              }
            ]
          );
          return;
        }
      }

      // If no customer mismatch or cart is empty, proceed with bulk conversion
      await proceedWithBulkConversion(customerId, customerItems);
      
    } catch (error: any) {
      console.error('Bulk conversion error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to convert items to cart. Please try again.'
      );
    }
  };

  // Helper function for bulk conversion
const proceedWithBulkConversion = async (customerId: string, customerItems: WaitlistItem[]) => {
  setConvertAllLoading(prev => ({ ...prev, [customerId]: true }));

  try {
    // Get customer data from waitlist items
    const waitlistCustomer = customerItems[0]?.customer;
    
    // If you have a customer in context or global state, update it
    if (waitlistCustomer) {
      // Just set the customer ID - not the entire customer object
      setSelectedCustomerId(customerId);
      
      // Also update in Redux if needed - create a proper customer object
      // First, find the full customer object from your customers list
      const fullCustomer = customers.find(c => c.id === customerId);
      
      if (fullCustomer) {
        dispatch(setCurrentCustomer(fullCustomer));
      }
    }
    
    // Perform conversion
    await dispatch(convertWaitlistToCartAction(customerId)).unwrap();
    
    // Refresh cart
    await dispatch(fetchMyCart());
    
    setTimeout(() => {
      setConvertAllLoading(prev => ({ ...prev, [customerId]: false }));
    }, 1000);
    
  } catch  {
  Alert.alert(
  'Clear Cart First',
  'Your cart has existing items. Would you like to clear them before converting to waitlist?')
    setConvertAllLoading(prev => ({ ...prev, [customerId]: false }));
  }
};


  const toggleCustomerExpansion = (customerId: string) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  // Expand all customers by default on first load
  useEffect(() => {
    if (waitlistItemsArray.length > 0 && Object.keys(expandedCustomers).length === 0) {
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(groupedByCustomer).forEach(customerId => {
        initialExpanded[customerId] = true;
      });
      setExpandedCustomers(initialExpanded);
    }
  }, [waitlistItemsArray, expandedCustomers, groupedByCustomer]);

  if (loading && !refreshing && waitlistItemsArray.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
        <Text marginTop="$4" color="$orange11" fontSize="$5" fontWeight="600">
          Loading waitlist...
        </Text>
      </YStack>
    );
  }

  // Check if we have valid data to display
  const hasValidData = waitlistItemsArray.length > 0;

  // Get customer name for modal if removing for a specific customer
  const getCustomerNameForModal = () => {
    if (removeAllType === 'customer' && selectedCustomerId) {
      const customerItems = groupedByCustomer[selectedCustomerId] || [];
      if (customerItems.length > 0) {
        return customerItems[0]?.customer?.name || 'Customer';
      }
    }
    return '';
  };

  // Get item count for modal
  const getItemCountForModal = () => {
    if (removeAllType === 'all') {
      return itemCount;
    } else if (removeAllType === 'customer' && selectedCustomerId) {
      const customerItems = groupedByCustomer[selectedCustomerId] || [];
      return customerItems.length;
    }
    return 0;
  };

  return (
    <YStack flex={1} backgroundColor="$orange1">
      <ScrollView 
        flex={1} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <YStack space="$4" padding="$4">
          {/* Waitlist Header */}
          <Card 
            elevate 
            bordered 
            borderRadius="$4" 
            backgroundColor="$orange1"
            borderColor="$orange4"
            shadowColor="$orange7"
          >
            <Card.Header padded>
              <YStack space="$3" alignItems="center">
                <H3 fontWeight="bold" color="$orange12">
                  ⏳ My Waitlist
                </H3>
                
                {!hasValidData ? (
                  <YStack alignItems="center" space="$3" paddingVertical="$4">
                    <Text fontSize="$6" color="$orange9">⏳</Text>
                    <Text fontSize="$5" fontWeight="600" color="$orange11" textAlign="center">
                      Your waitlist is empty
                    </Text>
                    <Text fontSize="$3" color="$orange9" textAlign="center">
                      Add items from your cart to see them here
                    </Text>
                    <Button
                      marginTop="$2"
                      backgroundColor="$orange9"
                      borderColor="$orange10"
                      borderWidth={1}
                      borderRadius="$4"
                      pressStyle={{ backgroundColor: "$orange10" }}
                      onPress={() => router.push('/Cart')}
                    >
                      <Text color="white" fontWeight="600">Go to Cart</Text>
                    </Button>
                  </YStack>
                ) : (
                  <YStack space="$3" alignItems="center" width="100%">
                    {/* Summary Stats */}
                    <YStack space="$2" alignItems="center" width="100%">
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$4" fontWeight="600" color="$orange11">
                          Customers:
                        </Text>
                        <Text fontSize="$4" fontWeight="700" color="$orange12">
                          {Object.keys(groupedByCustomer).length}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$4" fontWeight="600" color="$orange11">
                          Total Items:
                        </Text>
                        <Text fontSize="$4" fontWeight="700" color="$orange12">
                          {itemCount}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$4" fontWeight="600" color="$orange11">
                          Total Quantity:
                        </Text>
                        <Text fontSize="$4" fontWeight="700" color="$orange12">
                          {totalQuantity}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$4" fontWeight="600" color="$orange11">
                          Total Value:
                        </Text>
                        <Text fontSize="$4" fontWeight="700" color="$green10">
                          ${totalValue.toFixed(2)}
                        </Text>
                      </XStack>
                    </YStack>

                    {/* Quick Actions */}
                    <XStack space="$2" marginTop="$2" flexWrap="wrap">
                      <Button
                        size="$2"
                        backgroundColor="$orange3"
                        borderColor="$orange6"
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => {
                          const allExpanded = Object.values(expandedCustomers).every(v => v);
                          const newExpanded: Record<string, boolean> = {};
                          Object.keys(groupedByCustomer).forEach(customerId => {
                            newExpanded[customerId] = !allExpanded;
                          });
                          setExpandedCustomers(newExpanded);
                        }}
                        marginBottom="$2"
                      >
                        <Text color="$orange11" fontWeight="600" fontSize="$2">
                          {Object.values(expandedCustomers).every(v => v) ? "Collapse All" : "Expand All"}
                        </Text>
                      </Button>
                      <Button
                        size="$2"
                        backgroundColor="$blue3"
                        borderColor="$blue6"
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => router.push('/Cart')}
                        marginBottom="$2"
                      >
                        <Text color="$blue11" fontWeight="600" fontSize="$2">
                          🛒 View Cart
                        </Text>
                      </Button>
                      <Button
                        size="$2"
                        backgroundColor="$red3"
                        borderColor="$red6"
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={handleRemoveAllItems}
                        marginBottom="$2"
                      >
                        <Text color="$red11" fontWeight="600" fontSize="$2">
                          🗑️ Remove All Items
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            </Card.Header>
          </Card>

          {/* Customer Grouped Waitlist Items */}
          {hasValidData && Object.entries(groupedByCustomer).map(([customerId, customerItems]) => {
            if (!customerItems || customerItems.length === 0) return null;
            
            const customer = customerItems[0]?.customer;
            const customerName = customer?.name || 'Unknown Customer';
            
            return (
              <CustomerWaitlistSection
                key={customerId}
                customerName={customerName}
                customerId={customerId}
                items={customerItems}
                expanded={!!expandedCustomers[customerId]}
                onToggle={() => toggleCustomerExpansion(customerId)}
                onViewDetails={handleViewDetails}
                onConvertToCart={handleConvertToCart}
                onConvertAllToCart={handleConvertAllToCart}
                onRemoveFromWaitlist={handleRemoveFromWaitlist}
                onRemoveAllForCustomer={handleRemoveAllForCustomer}
                conversionLoading={conversionLoading}
                convertAllLoading={convertAllLoading[customerId] || false}
                removeAllLoading={removeAllLoading[customerId] || false}
              />
            );
          })}
        </YStack>
      </ScrollView>

      {/* Detail Modal */}
      {selectedItem && (
        <WaitlistItemDetailModal
          item={selectedItem}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedItem(null);
          }}
          onRemoveFromWaitlist={handleRemoveFromWaitlist}
          onConvertToCart={handleConvertToCart}
          removingFromWaitlist={removingItemId === selectedItem.id}
          convertingToCart={conversionLoading}
        />
      )}
      
      {/* Remove Confirmation Modal */}
      {selectedItem && (
        <RemoveConfirmationModal
          item={selectedItem}
          visible={showRemoveModal}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedItem(null);
          }}
          onConfirm={confirmRemoveFromWaitlist}
          loading={removingItemId === selectedItem.id}
        />
      )}
      
      {/* Remove All Confirmation Modal */}
      {removeAllType && (
        <RemoveAllConfirmationModal
          visible={showRemoveAllModal}
          onClose={() => {
            setShowRemoveAllModal(false);
            setRemoveAllType(null);
            setSelectedCustomerId(null);
          }}
          onConfirm={confirmRemoveAll}
          loading={removeAllType === 'all' 
            ? removeAllLoading['all'] || false 
            : selectedCustomerId 
              ? removeAllLoading[selectedCustomerId] || false 
              : false
          }
          itemCount={getItemCountForModal()}
          customerName={getCustomerNameForModal()}
          type={removeAllType}
        />
      )}
    </YStack>
  );
};

export default WaitlistScreen;