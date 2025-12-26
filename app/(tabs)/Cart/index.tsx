import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
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
  H4,
  H3,
  Image,
  Input,
  Fieldset,
  Label,
  TextArea,
} from 'tamagui';
import type { AppDispatch } from '@/(redux)/store';

// Redux imports
import {
  fetchMyCart,
  updateCartItemQuantity,
  removeCartItem,
  clearUserCart,
  checkoutUserCart,
  selectCartItems,
  selectCartLoading,
  selectCartError,
  selectCartTotalItems,
  selectCartTotalAmount,
  selectIsCartEmpty,
  selectCheckoutLoading,
  incrementItemQuantity,
  removeItemOptimistic,
  clearError,
  updateItemPriceOptimistic,
  updateCartItemPrice,
  clearCartAction,
} from '@/(redux)/CART';

// Updated Customer Redux imports with search functionality
import {
  fetchCustomers,
  createCustomerAction,
  selectCustomers,
  selectCustomersLoading,
  selectCreateCustomerLoading,
  selectCreateCustomerError,
  clearError as clearCustomerError,
  // Add any new selectors you might need from the updated slice
  // selectIsSearchResults,
  // selectIsTopCustomers,
  // selectIsDefaultCustomers,
  // selectCustomerMetadata,
} from '@/(redux)/customer';

import {
  addItemsToWaitlistAction,
  clearError as clearWaitlistError,
  selectBulkAddLoading,
  selectBulkAddError,
} from '@/(redux)/WaitlistCart';

// Import the actual CartItem type from your API
import type { CartItem as ApiCartItem } from '@/(services)/api/CART';
import type { CreateCustomerData } from '@/(services)/api/customer';
import api from '@/(utils)/config';

// Create a compatible type for our component
interface CartItem extends Omit<ApiCartItem, 'product' | 'shop' | 'batch'> {
  product?: {
    id: string;
    name: string;
    image?: string;
    unitOfMeasure?: {
      id: string;
      name?: string;
    };
  };
  shop?: {
    id: string;
    name?: string;
  };
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

// Custom Modal Components using React Native Modal
const QuantityUpdateModal = ({
  item,
  visible,
  onClose,
  onUpdateQuantity,
}: {
  item: CartItem;
  visible: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}) => {
  const [quantity, setQuantity] = useState(item.quantity.toString());

  const handleSave = () => {
    const newQuantity = parseInt(quantity) || 1;
    if (newQuantity < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }
    onUpdateQuantity(item.id, newQuantity);
    onClose();
  };

  const handleIncrement = () => {
    const newQuantity = parseInt(quantity) + 1;
    setQuantity(newQuantity.toString());
  };

  const handleDecrement = () => {
    const newQuantity = Math.max(1, parseInt(quantity) - 1);
    setQuantity(newQuantity.toString());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <YStack 
          flex={1} 
          justifyContent="center" 
          alignItems="center" 
          backgroundColor="rgba(0,0,0,0.5)"
          padding="$4"
        >
          <TouchableWithoutFeedback>
            <YStack 
              backgroundColor="$orange1" 
              borderRadius="$4" 
              padding="$4" 
              width="100%"
              maxWidth={400}
              borderWidth={1}
              borderColor="$orange4"
            >
              <YStack space="$4">
                <H4 textAlign="center" color="$orange12">
                  Update Quantity
                </H4>

                <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                  <YStack space="$3" alignItems="center">
                    <Text fontSize="$5" fontWeight="600" color="$orange12">
                      {item.product?.name}
                    </Text>
                    <Text fontSize="$3" color="$orange10">
                      Current: {item.quantity} units
                    </Text>
                  </YStack>
                </Card>

                <Fieldset space="$4">
                  <Label htmlFor="quantity" fontSize="$4" fontWeight="600" color="$orange12">
                    New Quantity
                  </Label>
                  <XStack justifyContent="center" alignItems="center" space="$4">
                    <Button
                      size="$4"
                      circular
                      backgroundColor="$orange3"
                      borderColor="$orange6"
                      borderWidth={2}
                      onPress={handleDecrement}
                      width="$4"
                      height="$4"
                    >
                      <Text color="$orange11" fontWeight="bold" fontSize="$6">-</Text>
                    </Button>

                    <Input
                      id="quantity"
                      width={100}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      textAlign="center"
                      fontSize="$6"
                      fontWeight="700"
                      borderWidth={2}
                      borderRadius="$3"
                      borderColor="$orange5"
                      backgroundColor="white"
                    />

                    <Button
                      size="$4"
                      circular
                      backgroundColor="$orange3"
                      borderColor="$orange6"
                      borderWidth={2}
                      onPress={handleIncrement}
                      width="$4"
                      height="$4"
                    >
                      <Text color="$orange11" fontWeight="bold" fontSize="$6">+</Text>
                    </Button>
                  </XStack>
                </Fieldset>

                <XStack space="$3" marginTop="$2">
                  <Button
                    flex={1}
                    backgroundColor="$orange3"
                    borderColor="$orange6"
                    borderWidth={1}
                    borderRadius="$4"
                    onPress={onClose}
                    pressStyle={{ backgroundColor: "$orange4" }}
                  >
                    <Text color="$orange11" fontWeight="600">Cancel</Text>
                  </Button>
                  <Button
                    flex={1}
                    backgroundColor="$orange9"
                    borderColor="$orange10"
                    borderWidth={1}
                    borderRadius="$4"
                    pressStyle={{ backgroundColor: "$orange10" }}
                    onPress={handleSave}
                  >
                    <Text color="white" fontWeight="600">Update</Text>
                  </Button>
                </XStack>
              </YStack>
            </YStack>
          </TouchableWithoutFeedback>
        </YStack>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const PriceUpdateModal = ({
  item,
  visible,
  onClose,
  onUpdatePrice,
}: {
  item: CartItem;
  visible: boolean;
  onClose: () => void;
  onUpdatePrice: (itemId: string, price: number) => void;
}) => {
  const [price, setPrice] = useState(item.unitPrice.toString());
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardOffset(e.endCoordinates.height / 2);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSave = () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    onUpdatePrice(item.id, newPrice);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <YStack 
            flex={1} 
            justifyContent="center" 
            alignItems="center" 
            padding="$4"
            style={{
              transform: [{ translateY: -keyboardOffset }]
            }}
          >
            <TouchableWithoutFeedback>
              <YStack 
                backgroundColor="$orange1" 
                borderRadius="$4" 
                padding="$4" 
                width="100%"
                maxWidth={400}
                borderWidth={1}
                borderColor="$orange4"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={3.84}
                elevation={5}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <YStack space="$4">
                    <H4 textAlign="center" color="$orange12">
                      Update Unit Price
                    </H4>

                    <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                      <YStack space="$2" alignItems="center">
                        <Text fontSize="$5" fontWeight="600" color="$orange12" textAlign="center">
                          {item.product?.name}
                        </Text>
                        <Text fontSize="$3" color="$orange10" textAlign="center">
                          Current: ${item.unitPrice.toFixed(2)}
                        </Text>
                      </YStack>
                    </Card>

                    <Fieldset space="$4">
                      <Label htmlFor="price" fontSize="$4" fontWeight="600" color="$orange12">
                        New Unit Price ($)
                      </Label>
                      <Input
                        id="price"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        fontSize="$6"
                        fontWeight="700"
                        textAlign="center"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        minHeight="$4"
                        autoFocus={true}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                      />
                    </Fieldset>

                    <XStack space="$3" marginTop="$2">
                      <Button
                        flex={1}
                        backgroundColor="$orange3"
                        borderColor="$orange6"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={onClose}
                        pressStyle={{ backgroundColor: "$orange4" }}
                      >
                        <Text color="$orange11" fontWeight="600">Cancel</Text>
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor="$orange9"
                        borderColor="$orange10"
                        borderWidth={1}
                        borderRadius="$4"
                        pressStyle={{ backgroundColor: "$orange10" }}
                        onPress={handleSave}
                      >
                        <Text color="white" fontWeight="600">Update Price</Text>
                      </Button>
                    </XStack>
                  </YStack>
                </ScrollView>
              </YStack>
            </TouchableWithoutFeedback>
          </YStack>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Add Customer Modal Component
const AddCustomerModal = ({
  visible,
  onClose,
  onCreateCustomer,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateCustomer: (customerData: CreateCustomerData) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    phone1: '',
    companyName: '',
    phone2: '',
    tinNumber: '',
    address: '',
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }
    if (!formData.phone1.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    onCreateCustomer(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone1: '',
      companyName: '',
      phone2: '',
      tinNumber: '',
      address: '',
    });
  };

  const handleClose = () => {
    Keyboard.dismiss(); // Dismiss keyboard first
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      {/* Only dismiss keyboard when tapping on background */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <YStack 
            flex={1} 
            justifyContent="center" 
            alignItems="center" 
            backgroundColor="rgba(0,0,0,0.5)"
            padding="$4"
          >
            {/* Prevent background tap from closing modal */}
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <YStack 
                backgroundColor="$orange1" 
                borderRadius="$4" 
                padding="$4" 
                width="100%"
                maxWidth={400}
                borderWidth={1}
                borderColor="$orange4"
                maxHeight="85%" // Increased max height
                minHeight={300} // Minimum height
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={10}
                elevation={10}
              >
                {/* ScrollView with proper keyboard handling */}
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled" // Important: prevents keyboard dismiss on scroll
                  contentContainerStyle={{ flexGrow: 1 }}
                  nestedScrollEnabled={true}
                >
                  <YStack space="$4">
                    {/* Header with Close Button */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <H4 color="$orange12" fontWeight="700" flex={1}>
                        ✨ Add New Customer
                      </H4>
                      <TouchableOpacity 
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ padding: 4 }}
                      >
                        <Text fontSize="$6" color="$orange10">✕</Text>
                      </TouchableOpacity>
                    </XStack>

                    {/* Required fields indicator */}
                    <XStack alignItems="center" space="$2" marginBottom="$2">
                      <Text fontSize="$1" color="$red10">*</Text>
                      <Text fontSize="$1" color="$orange9">
                        Required fields
                      </Text>
                    </XStack>

                    <Fieldset space="$2" marginBottom="$2">
                      <XStack alignItems="center" space="$2">
                        <Label 
                          htmlFor="name" 
                          fontSize="$4" 
                          fontWeight="600" 
                          color="$orange12"
                          flex={1}
                        >
                          Customer Name
                        </Label>
                        <Text fontSize="$1" color="$red10">*</Text>
                      </XStack>
                      <Input
                        id="name"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        placeholder="Enter customer name"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          // Focus next field - you can use refs for this
                        }}
                      />
                    </Fieldset>

                    <Fieldset space="$2" marginBottom="$2">
                      <XStack alignItems="center" space="$2">
                        <Label 
                          htmlFor="phone1" 
                          fontSize="$4" 
                          fontWeight="600" 
                          color="$orange12"
                          flex={1}
                        >
                          Phone Number
                        </Label>
                        <Text fontSize="$1" color="$red10">*</Text>
                      </XStack>
                      <Input
                        id="phone1"
                        value={formData.phone1}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone1: text }))}
                        placeholder="Enter primary phone number"
                        keyboardType="phone-pad"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="next"
                      />
                    </Fieldset>

                    <Fieldset space="$2" marginBottom="$2">
                      <Label 
                        htmlFor="companyName" 
                        fontSize="$4" 
                          fontWeight="600" 
                        color="$orange12"
                      >
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, companyName: text }))}
                        placeholder="Enter company name (optional)"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="next"
                      />
                    </Fieldset>

                    <Fieldset space="$2" marginBottom="$2">
                      <Label 
                        htmlFor="phone2" 
                        fontSize="$4" 
                        fontWeight="600" 
                        color="$orange12"
                      >
                        Secondary Phone
                      </Label>
                      <Input
                        id="phone2"
                        value={formData.phone2}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone2: text }))}
                        placeholder="Enter secondary phone (optional)"
                        keyboardType="phone-pad"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="next"
                      />
                    </Fieldset>

                    <Fieldset space="$2" marginBottom="$2">
                      <Label 
                        htmlFor="tinNumber" 
                        fontSize="$4" 
                        fontWeight="600" 
                        color="$orange12"
                      >
                        TIN Number
                      </Label>
                      <Input
                        id="tinNumber"
                        value={formData.tinNumber}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, tinNumber: text }))}
                        placeholder="Enter TIN number (optional)"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="next"
                      />
                    </Fieldset>

                    <Fieldset space="$2" marginBottom="$4">
                      <Label 
                        htmlFor="address" 
                        fontSize="$4" 
                        fontWeight="600" 
                        color="$orange12"
                      >
                        Address
                      </Label>
                      <TextArea
                        id="address"
                        value={formData.address}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                        placeholder="Enter address (optional)"
                        numberOfLines={3}
                        textAlignVertical="top"
                        borderWidth={2}
                        borderRadius="$3"
                        borderColor="$orange5"
                        backgroundColor="white"
                        minHeight="$10"
                        fontSize="$3"
                        padding="$3"
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </Fieldset>

                    {/* Action Buttons */}
                    <XStack space="$3" marginTop="$2">
                      <Button
                        flex={1}
                        backgroundColor="$orange3"
                        borderColor="$orange6"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={handleClose}
                        pressStyle={{ backgroundColor: "$orange4" }}
                        disabled={loading}
                        height="$4"
                      >
                        <Text color="$orange11" fontWeight="600">Cancel</Text>
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor="$orange9"
                        borderColor="$orange10"
                        borderWidth={1}
                        borderRadius="$4"
                        pressStyle={{ backgroundColor: "$orange10" }}
                        onPress={handleSave}
                        disabled={loading}
                        height="$4"
                      >
                        {loading ? (
                          <XStack alignItems="center" space="$2">
                            <Spinner size="small" color="white" />
                            <Text color="white" fontWeight="600">Adding...</Text>
                          </XStack>
                        ) : (
                          <XStack alignItems="center" space="$2">
                            <Text fontSize="$4">✓</Text>
                            <Text color="white" fontWeight="700">Add Customer</Text>
                          </XStack>
                        )}
                      </Button>
                    </XStack>

                    {/* Quick Save Shortcut Info */}
                    <XStack justifyContent="center" marginTop="$3">
                      <Text fontSize="$1" color="$orange8" textAlign="center">
                        Tip: Press &quot;Enter&quot; or &quot;Return&quot; to quickly move between fields
                      </Text>
                    </XStack>
                  </YStack>
                </ScrollView>
              </YStack>
            </TouchableWithoutFeedback>
          </YStack>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Discount and Notes Modal Component
const DiscountNotesModal = ({
  visible,
  onClose,
  onApply,
  currentDiscount,
  currentNotes,
  totalAmount,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (discount: number, notes: string) => void | Promise<void>;
  currentDiscount: number;
  currentNotes: string;
  totalAmount: number;
  loading: boolean;
}) => {
  const [discountInput, setDiscountInput] = useState(currentDiscount.toString());
  const [notesInput, setNotesInput] = useState(currentNotes);

  const handleApply = () => {
    const discountValue = discountInput.trim() ? parseFloat(discountInput) : 0;
    
    if (discountValue < 0) {
      Alert.alert('Error', 'Discount cannot be negative');
      return;
    }
    
    if (discountValue > totalAmount) {
      Alert.alert('Error', 'Discount cannot be greater than total amount');
      return;
    }
    
    onApply(discountValue, notesInput);
  };

  const calculateDiscountedTotal = () => {
    const discountValue = discountInput.trim() ? parseFloat(discountInput) : 0;
    return Math.max(0, totalAmount - discountValue);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack space="$4">
                  <H4 textAlign="center" color="$orange12">
                    Apply Discount & Notes
                  </H4>

                  <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                    <YStack space="$2" alignItems="center">
                      <Text fontSize="$4" fontWeight="600" color="$orange12">
                        Cart Total: ${totalAmount.toFixed(2)}
                      </Text>
                      {discountInput.trim() && !isNaN(parseFloat(discountInput)) && (
                        <YStack alignItems="center" space="$1">
                          <Text fontSize="$3" color="$orange10">
                            Discount: -${parseFloat(discountInput).toFixed(2)}
                          </Text>
                          <Text fontSize="$4" fontWeight="700" color="$green10">
                            New Total: ${calculateDiscountedTotal().toFixed(2)}
                          </Text>
                        </YStack>
                      )}
                    </YStack>
                  </Card>

                  <Fieldset space="$2">
                    <Label htmlFor="discount" fontSize="$4" fontWeight="600" color="$orange12">
                      Discount Amount ($)
                    </Label>
                    <Input
                      id="discount"
                      value={discountInput}
                      onChangeText={setDiscountInput}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      borderWidth={2}
                      borderRadius="$3"
                      borderColor="$orange5"
                      backgroundColor="white"
                      fontSize="$4"
                      padding="$3"
                    />
                    <Text fontSize="$1" color="$orange8">
                      Leave empty for no discount
                    </Text>
                  </Fieldset>

                  <Fieldset space="$2">
                    <Label htmlFor="notes" fontSize="$4" fontWeight="600" color="$orange12">
                      Order Notes
                    </Label>
                    <TextArea
                      id="notes"
                      value={notesInput}
                      onChangeText={setNotesInput}
                      placeholder="Add any notes for this order (optional)"
                      numberOfLines={4}
                      textAlignVertical="top"
                      borderWidth={2}
                      borderRadius="$3"
                      borderColor="$orange5"
                      backgroundColor="white"
                      minHeight="$10"
                      fontSize="$3"
                      padding="$3"
                    />
                  </Fieldset>

                  <XStack space="$3" marginTop="$2">
                    <Button
                      flex={1}
                      backgroundColor="$orange3"
                      borderColor="$orange6"
                      borderWidth={1}
                      borderRadius="$4"
                      onPress={onClose}
                      pressStyle={{ backgroundColor: "$orange4" }}
                      disabled={loading}
                    >
                      <Text color="$orange11" fontWeight="600">Cancel</Text>
                    </Button>
                    <Button
                      flex={1}
                      backgroundColor="$orange9"
                      borderColor="$orange10"
                      borderWidth={1}
                      borderRadius="$4"
                      pressStyle={{ backgroundColor: "$orange10" }}
                      onPress={handleApply}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner size="small" color="white" />
                      ) : (
                        <Text color="white" fontWeight="600">Apply</Text>
                      )}
                    </Button>
                  </XStack>
                </YStack>
              </ScrollView>
            </YStack>
          </YStack>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Add to Waitlist Confirmation Modal
const AddToWaitlistModal = ({
  visible,
  onClose,
  onConfirm,
  loading,
  cartInfo,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  cartInfo: {
    totalItems: number;
    totalAmount: number;
    customerName?: string;
  };
}) => {
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
          maxWidth={400}
          borderWidth={1}
          borderColor="$orange4"
        >
          <YStack space="$4">
            <H4 textAlign="center" color="$orange12">
              Add to Waitlist
            </H4>

            <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
              <YStack space="$3" alignItems="center">
                <Text fontSize="$5" fontWeight="600" color="$orange12">
                  Cart Summary
                </Text>
                <Text fontSize="$3" color="$orange10">
                  Items: {cartInfo.totalItems}
                </Text>
                <Text fontSize="$3" color="$orange10">
                  Total: ${cartInfo.totalAmount.toFixed(2)}
                </Text>
                {cartInfo.customerName && (
                  <Text fontSize="$3" color="$orange10">
                    Customer: {cartInfo.customerName}
                  </Text>
                )}
              </YStack>
            </Card>

            <Text fontSize="$3" color="$orange11" textAlign="center">
              This will move your cart to the waitlist. You can retrieve it later from the waitlist section.
            </Text>

            <XStack space="$3" marginTop="$2">
              <Button
                flex={1}
                backgroundColor="$orange3"
                borderColor="$orange6"
                borderWidth={1}
                borderRadius="$4"
                onPress={onClose}
                pressStyle={{ backgroundColor: "$orange4" }}
                disabled={loading}
              >
                <Text color="$orange11" fontWeight="600">Cancel</Text>
              </Button>
              <Button
                flex={1}
                backgroundColor="$blue9"
                borderColor="$blue10"
                borderWidth={1}
                borderRadius="$4"
                pressStyle={{ backgroundColor: "$blue10" }}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <Text color="white" fontWeight="600">Add to Waitlist</Text>
                )}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
};

const CartListViewScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const cartItems = useSelector(selectCartItems);
  const loading = useSelector(selectCartLoading);
  const error = useSelector(selectCartError);
  const totalItems = useSelector(selectCartTotalItems);
  const totalAmount = useSelector(selectCartTotalAmount);
  const isEmpty = useSelector(selectIsCartEmpty);
  const checkoutLoading = useSelector(selectCheckoutLoading);

  // Customer state
  const customers = useSelector(selectCustomers);
  const customersLoading = useSelector(selectCustomersLoading);
  const createCustomerLoading = useSelector(selectCreateCustomerLoading);
  const createCustomerError = useSelector(selectCreateCustomerError);

  // Waitlist state - BULK OPERATIONS ONLY
  const waitlistLoading = useSelector(selectBulkAddLoading);
  const waitlistError = useSelector(selectBulkAddError);

  // Discount and Notes state
  const [discount, setDiscount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showDiscountNotesModal, setShowDiscountNotesModal] = useState(false);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    
    const query = customerSearchQuery.toLowerCase().trim();
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(query) ||
      customer.phone1?.toLowerCase().includes(query) ||
      customer.phone2?.toLowerCase().includes(query) ||
      customer.companyName?.toLowerCase().includes(query)
    );
  }, [customers, customerSearchQuery]);

  // Load cart data and customers on component mount
  useEffect(() => {
    dispatch(fetchMyCart());
    // Fetch customers without search query initially
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Refresh cart data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchMyCart());
    }, [dispatch])
  );

  // Effect for searching customers when search query changes
  useEffect(() => {
    if (customerSearchQuery.trim() || customerSearchQuery === '') {
      // Debounce the search to avoid too many API calls
      const timeoutId = setTimeout(() => {
        dispatch(fetchCustomers(customerSearchQuery));
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [customerSearchQuery, dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
    if (createCustomerError) {
      Alert.alert('Error', createCustomerError);
      dispatch(clearCustomerError());
    }
    if (waitlistError) {
      Alert.alert('Error', waitlistError);
      dispatch(clearWaitlistError());
    }
  }, [error, createCustomerError, waitlistError, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchMyCart()),
      dispatch(fetchCustomers(customerSearchQuery))
    ]);
    setRefreshing(false);
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      // Optimistic update
      dispatch(incrementItemQuantity(itemId));
      
      await dispatch(updateCartItemQuantity({ cartItemId: itemId, quantity })).unwrap();
      Alert.alert('Success', 'Quantity updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update quantity');
      // Refresh to revert optimistic update
      dispatch(fetchMyCart());
    }
  };

  const handleUpdatePrice = async (itemId: string, price: number) => {
    try {
      // Prevent duplicate calls
      if (updatingItems.current.has(itemId)) {
        return;
      }

      // Add to updating set
      updatingItems.current.add(itemId);

      const currentItem = cartItems.find(item => item.id === itemId);
      if (!currentItem) {
        Alert.alert('Error', 'Item not found in cart');
        updatingItems.current.delete(itemId);
        return;
      }

      // Optimistic update
      dispatch(updateItemPriceOptimistic({ 
        itemId, 
        unitPrice: price
      }));
      
      await dispatch(updateCartItemPrice({ 
        cartItemId: itemId, 
        unitPrice: price 
      })).unwrap();
      
      Alert.alert('Success', 'Price updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update price');
      dispatch(fetchMyCart());
    } finally {
      // Always remove from updating set
      updatingItems.current.delete(itemId);
    }
  };

  // Add this ref to track updating items
  const updatingItems = useRef(new Set());

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${item.product?.name} from your cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              dispatch(removeItemOptimistic(item.id));
              
              await dispatch(removeCartItem(item.id)).unwrap();
              Alert.alert('Success', 'Item removed from cart');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove item');
              // Refresh to revert optimistic update
              dispatch(fetchMyCart());
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (isEmpty) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearUserCart()).unwrap();
              dispatch(clearCartAction());
              
              // Clear customer selection when cart is cleared
              setSelectedCustomerId('');
              setDiscount('');
              setNotes('');
              
              Alert.alert('Success', 'Cart cleared successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const handleCreateCustomer = async (customerData: CreateCustomerData) => {
    try {
      const result = await dispatch(createCustomerAction(customerData)).unwrap();
      setShowAddCustomerModal(false);
      Alert.alert('Success', 'Customer created successfully');
      // Auto-select the newly created customer
      setSelectedCustomerId(result.customer.id);
      // Refresh customers list to include the new one
      dispatch(fetchCustomers(customerSearchQuery));
    } catch {
      // Error handled by Redux and displayed in useEffect
    }
  };

  // Function to apply discount and notes
  const handleApplyDiscountNotes = async (discountValue: number, notesText: string) => {
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer first');
      return;
    }

    try {
      // Get cart ID from first item
      const cartId = cartItems[0]?.cartId;
      if (!cartId) {
        Alert.alert('Error', 'Cannot find cart ID');
        return;
      }

      // Update cart with discount and notes
      await api.put(`/carts/assign/customer/${cartId}`, {
        customerId: selectedCustomerId,
        discount: discountValue,
        notes: notesText
      });

      // Update local state
      setDiscount(discountValue.toString());
      setNotes(notesText);
      
      // Refresh cart to get updated total
      dispatch(fetchMyCart());
      
      setShowDiscountNotesModal(false);
      Alert.alert('Success', 'Discount and notes applied to cart');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply discount and notes');
    }
  };

  // BULK WAITLIST FUNCTIONALITY
  const handleAddToWaitlist = async (cartItemIds: string[], note?: string) => {
    try {
      if (cartItemIds.length === 0) {
        Alert.alert('Error', 'No items selected');
        return;
      }

      if (!selectedCustomerId) {
        Alert.alert(
          'Select Customer',
          'Please select a customer before moving items to waitlist.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Select Customer',
              onPress: () => {
                setShowCustomerModal(true);
                setSearchQuery('');
              },
            },
          ]
        );
        return;
      }

      // Call bulk add to waitlist action WITH customerId
      const result = await dispatch(addItemsToWaitlistAction({ 
        cartItemIds,
        note: note || `Items moved to waitlist`,
        customerId: selectedCustomerId
      })).unwrap();
      
      // Show success message
      if (result.data.successfulItems > 0) {
        Alert.alert(
          'Success', 
          `Successfully added ${result.data.successfulItems} item(s) to waitlist!`,
          [
            {
              text: 'View Waitlist',
              onPress: () => router.push('/profile/Waitlists'),
            }
          ]
        );
        
        // IMPORTANT: Clear cart data from Redux after moving to waitlist
        dispatch(clearCartAction()); // This clears cart AND customer data
        
        // Also clear local state
        setSelectedCustomerId('');
        setDiscount('');
        setNotes('');
        setSelectedItems([]);
        setSelectMode(false);
        
        // If there were failures, show them
        if (result.data.failedItems > 0 && result.data.errors) {
          setTimeout(() => {
            Alert.alert(
              'Partial Success',
              `${result.data.failedItems} item(s) failed to add to waitlist.`,
              result.data.errors?.map(error => ({
                text: `${error.productName}: ${error.error}`,
              }))
            );
          }, 1000);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add items to waitlist');
    }
  };

  // Update the handleBulkAddToWaitlist function:
  const handleBulkAddToWaitlist = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    if (!selectedCustomerId) {
      Alert.alert(
        'Select Customer',
        'Please select a customer before moving items to waitlist.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Select Customer',
            onPress: () => {
              setShowCustomerModal(true);
              setSearchQuery('');
            },
          },
        ]
      );
      return;
    }

    // Get all cart item IDs
    const cartItemIds = cartItems.map(item => item.id);
    
    await handleAddToWaitlist(cartItemIds, 'Entire cart moved to waitlist');
    
    setShowWaitlistModal(false);
  };

  // Also update the handleAddSelectedToWaitlist function:
  const handleAddSelectedToWaitlist = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select items first');
      return;
    }
    
    await handleAddToWaitlist(selectedItems, 'Selected items moved to waitlist');
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCheckout = () => {
    if (isEmpty) {
      Alert.alert('Cart Empty', 'Your cart is empty. Add some items before checkout.');
      return;
    }

    if (!selectedCustomerId) {
      Alert.alert(
        'Select Customer',
        'Please select a customer before proceeding to checkout.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Select Customer',
            onPress: () => {
              setShowCustomerModal(true);
              setSearchQuery('');
            },
          },
        ]
      );
      return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const discountValue = discount ? parseFloat(discount) : 0;
    const notesText = notes || '';

    Alert.alert(
      'Proceed to Checkout',
      `Customer: ${selectedCustomer?.name}\n` +
      `Items: ${totalItems}\n` +
      `Subtotal: $${totalAmount.toFixed(2)}\n` +
      (discountValue > 0 ? `Discount: -$${discountValue.toFixed(2)}\n` : '') +
      `Final Total: $${(totalAmount - discountValue).toFixed(2)}\n` +
      (notesText ? `Notes: ${notesText}` : ''),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: discountValue > 0 || notesText ? 'Edit Discount/Notes' : 'Add Discount/Notes',
          onPress: () => setShowDiscountNotesModal(true),
        },
        {
          text: 'Checkout',
          onPress: async () => {
            try {
              await dispatch(checkoutUserCart({
                customerId: selectedCustomerId,
                paymentMethod: 'cash',
                discount: discountValue > 0 ? discountValue : undefined,
                notes: notesText || undefined,
              })).unwrap();

              Alert.alert(
                'Order Placed!',
                `Order has been placed successfully for ${selectedCustomer?.name}.\n` +
                (discountValue > 0 ? `Discount applied: $${discountValue.toFixed(2)}\n` : '') +
                (notesText ? `Notes: ${notesText}` : ''),
                [
                  {
                    text: 'Continue Shopping',
                    onPress: () => {
                      setSelectedCustomerId('');
                      setDiscount('');
                      setNotes('');
                      router.push('/');
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Checkout Failed', error.message || 'Failed to process checkout');
            }
          },
        },
      ]
    );
  };

  const openQuantityModal = (item: CartItem) => {
    setSelectedItem(item);
    setShowQuantityModal(true);
  };

  const openPriceModal = (item: CartItem) => {
    setSelectedItem(item);
    setShowPriceModal(true);
  };

  // Group items by shop
  const itemsByShop = cartItems.reduce((acc, item) => {
    const shopName = item.shop?.name || 'Unknown Shop';
    if (!acc[shopName]) {
      acc[shopName] = [];
    }
    acc[shopName].push(item as CartItem);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // Get selected customer name
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

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

  if (loading && !refreshing && cartItems.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
        <Text marginTop="$4" color="$orange11" fontSize="$5" fontWeight="600">
          Loading your cart...
        </Text>
      </YStack>
    );
  }

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
          {/* Cart Header */}
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
                  🛒 My Cart
                </H3>
                
                {isEmpty ? (
                  <YStack alignItems="center" space="$3" paddingVertical="$4">
                    <Text fontSize="$6" color="$orange9">🛒</Text>
                    <Text fontSize="$5" fontWeight="600" color="$orange11" textAlign="center">
                      Your cart is empty
                    </Text>
                    <Text fontSize="$3" color="$orange9" textAlign="center">
                      Add some products to get started
                    </Text>
                    <Button
                      marginTop="$2"
                      backgroundColor="$orange9"
                      borderColor="$orange10"
                      borderWidth={1}
                      borderRadius="$4"
                      pressStyle={{ backgroundColor: "$orange10" }}
                      onPress={() => router.push('/')}
                    >
                      <Text color="white" fontWeight="600">Start Shopping</Text>
                    </Button>
                  </YStack>
                ) : (
                  <YStack space="$2" alignItems="center" width="100%">
                    {/* Customer Selection */}
                    <XStack justifyContent="space-between" alignItems="center" width="100%">
                      <Text fontSize="$4" fontWeight="600" color="$orange11">
                        Customer:
                      </Text>
                      <Button
                        size="$2"
                        backgroundColor={selectedCustomerId ? "$green3" : "$orange3"}
                        borderColor={selectedCustomerId ? "$green6" : "$orange6"}
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => {
                          setCustomerSearchQuery('');
                          setShowCustomerModal(true);
                        }}
                        pressStyle={{ backgroundColor: selectedCustomerId ? "$green4" : "$orange4" }}
                      >
                        <Text 
                          color={selectedCustomerId ? "$green11" : "$orange11"} 
                          fontWeight="600" 
                          fontSize="$2"
                        >
                          {selectedCustomerId 
                            ? customers.find(c => c.id === selectedCustomerId)?.name || 'Selected'
                            : 'Select Customer'
                          }
                        </Text>
                      </Button>
                    </XStack>

                    {/* Discount/Notes Button */}
                    {selectedCustomerId && (
                      <Button
                        size="$2"
                        backgroundColor="$green3"
                        borderColor="$green6"
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => setShowDiscountNotesModal(true)}
                        pressStyle={{ backgroundColor: "$green4" }}
                        marginTop="$2"
                      >
                        <Text color="$green11" fontWeight="600" fontSize="$2">
                          {discount ? `Discount: -$${parseFloat(discount).toFixed(2)}` : 'Add Discount/Notes'}
                        </Text>
                      </Button>
                    )}

                    <XStack justifyContent="space-between" width="100%">
                      <Text fontSize="$4" fontWeight="600" color="$orange11">
                        Total Items:
                      </Text>
                      <Text fontSize="$4" fontWeight="700" color="$orange12">
                        {totalItems}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between" width="100%">
                      <Text fontSize="$4" fontWeight="600" color="$orange11">
                        Total Amount:
                      </Text>
                      <Text fontSize="$5" fontWeight="800" color="$green10">
                        ${(totalAmount - (discount ? parseFloat(discount) : 0)).toFixed(2)}
                      </Text>
                    </XStack>

                    {/* Discount Display */}
                    {discount && parseFloat(discount) > 0 && (
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$3" fontWeight="600" color="$orange10">
                          Discount:
                        </Text>
                        <Text fontSize="$3" fontWeight="700" color="$red10">
                          -${parseFloat(discount).toFixed(2)}
                        </Text>
                      </XStack>
                    )}

                    {/* Select Mode Toggle */}
                    <XStack justifyContent="space-between" alignItems="center" width="100%" marginTop="$2">
                      <Text fontSize="$3" fontWeight="600" color="$orange11">
                        Select Items for Waitlist:
                      </Text>
                      <Button
                        size="$2"
                        backgroundColor={selectMode ? "$blue9" : "$orange3"}
                        borderColor={selectMode ? "$blue10" : "$orange6"}
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => {
                          setSelectMode(!selectMode);
                          if (!selectMode) {
                            setSelectedItems([]);
                          }
                        }}
                        pressStyle={{ backgroundColor: selectMode ? "$blue10" : "$orange4" }}
                      >
                        <Text 
                          color={selectMode ? "white" : "$orange11"} 
                          fontWeight="600" 
                          fontSize="$2"
                        >
                          {selectMode ? 'Cancel Selection' : 'Select Items'}
                        </Text>
                      </Button>
                    </XStack>

                    {/* Selected items count */}
                    {selectMode && selectedItems.length > 0 && (
                      <XStack alignItems="center" space="$2" marginTop="$2">
                        <Badge backgroundColor="$blue9">
                          {selectedItems.length} selected
                        </Badge>
                        <Button
                          size="$2"
                          backgroundColor="$blue9"
                          borderColor="$blue10"
                          borderWidth={1}
                          borderRadius="$3"
                          onPress={handleAddSelectedToWaitlist}
                          pressStyle={{ backgroundColor: "$blue10" }}
                          disabled={waitlistLoading}
                        >
                          {waitlistLoading ? (
                            <Spinner size="small" color="white" />
                          ) : (
                            <Text color="white" fontWeight="600" fontSize="$2">
                              ⏳ Add Selected to Waitlist
                            </Text>
                          )}
                        </Button>
                      </XStack>
                    )}
                  </YStack>
                )}
              </YStack>
            </Card.Header>
          </Card>

          {/* Cart Items by Shop */}
          {!isEmpty && Object.entries(itemsByShop).map(([shopName, items]) => (
            <YStack key={shopName} space="$3">
              {/* Shop Header */}
              <XStack alignItems="center" space="$3" paddingHorizontal="$2">
                <Text fontSize="$5" fontWeight="700" color="$orange12">
                  🏪 {shopName}
                </Text>
                <Badge backgroundColor="$orange9">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Badge>
              </XStack>

              {/* Items for this shop */}
              {items.map((item) => (
                <Card 
                  key={item.id}
                  elevate 
                  bordered 
                  borderRadius="$4" 
                  backgroundColor="$orange1"
                  borderColor="$orange4"
                  shadowColor="$orange7"
                  opacity={selectMode && !selectedItems.includes(item.id) ? 0.7 : 1}
                >
                  <Card.Header padded>
                    <YStack space="$3">
                      {/* Product Header with Selection Checkbox */}
                      <XStack space="$3" alignItems="flex-start">
                        {selectMode && (
                          <TouchableOpacity onPress={() => toggleItemSelection(item.id)}>
                            <YStack
                              width={24}
                              height={24}
                              borderRadius="$2"
                              backgroundColor={selectedItems.includes(item.id) ? "$blue9" : "$orange3"}
                              alignItems="center"
                              justifyContent="center"
                              borderWidth={1}
                              borderColor={selectedItems.includes(item.id) ? "$blue10" : "$orange6"}
                            >
                              {selectedItems.includes(item.id) && (
                                <Text color="white" fontWeight="bold">✓</Text>
                              )}
                            </YStack>
                          </TouchableOpacity>
                        )}
                        
                        {item?.product?.image && (
                          <Image
                            source={{ uri: normalizeImagePath(item.product.image) }}
                            width={60}
                            height={60}
                            borderRadius="$3"
                            resizeMode="cover"
                            borderWidth={1}
                            borderColor="$orange4"
                          />
                        )}
                        <YStack flex={1} space="$1">
                          <Text fontSize="$4" fontWeight="700" color="$orange12" numberOfLines={2}>
                            {item?.product?.name}
                          </Text>
                        
                          {item.product?.unitOfMeasure && (
                            <Text fontSize="$2" color="$orange10">
                              Unit: {item?.product?.unitOfMeasure?.name || 'N/A'}
                            </Text>
                          )}
                        </YStack>
                      </XStack>

                      {/* Quantity and Price Row */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack>
                          <Text fontSize="$3" color="$orange11" fontWeight="600">
                            Quantity
                          </Text>
                          <XStack alignItems="center" space="$2">
                            <Text fontSize="$4" fontWeight="700" color="$orange12">
                              {item?.quantity}
                            </Text>
                            <Button
                              size="$2"
                              circular
                              backgroundColor="$orange3"
                              borderColor="$orange6"
                              borderWidth={1}
                              onPress={() => openQuantityModal(item)}
                              width="$2"
                              height="$2"
                              disabled={selectMode}
                            >
                              <Text color="$orange11" fontWeight="bold" fontSize="$3">✏️</Text>
                            </Button>
                          </XStack>
                        </YStack>

                        <YStack alignItems="flex-end">
                          <Text fontSize="$3" color="$orange11" fontWeight="600">
                            Unit Price
                          </Text>
                          <XStack alignItems="center" space="$2">
                            <Text fontSize="$4" fontWeight="700" color="$green10">
                              ${(item.unitPrice || 0).toFixed(2)}
                            </Text>
                            <Button
                              size="$2"
                              circular
                              backgroundColor="$orange3"
                              borderColor="$orange6"
                              borderWidth={1}
                              onPress={() => openPriceModal(item)}
                              width="$2"
                              height="$2"
                              disabled={selectMode}
                            >
                              <Text color="$orange11" fontWeight="bold" fontSize="$3">💰</Text>
                            </Button>
                          </XStack>
                        </YStack>
                      </XStack>

                      {/* Total Price */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" fontWeight="600" color="$orange11">
                          Total:
                        </Text>
                        <Text fontSize="$4" fontWeight="800" color="$green10">
                          ${(item.totalPrice || 0).toFixed(2)}
                        </Text>
                      </XStack>

                      {/* Action Buttons - Hidden in select mode */}
                      {!selectMode && (
                        <XStack space="$2" marginTop="$2">
                          <Button
                            size="$2"
                            backgroundColor="$red3"
                            borderColor="$red6"
                            borderWidth={1}
                            borderRadius="$3"
                            onPress={() => handleRemoveItem(item)}
                            pressStyle={{ backgroundColor: "$red4" }}
                          >
                            <Text color="$red11" fontWeight="600" fontSize="$2">
                              🗑️ Remove
                            </Text>
                          </Button>
                        </XStack>
                      )}
                    </YStack>
                  </Card.Header>
                </Card>
              ))}
            </YStack>
          ))}

          {/* Cart Actions - Hidden in select mode */}
          {!isEmpty && !selectMode && (
            <YStack space="$3" marginTop="$4">
              {/* Waitlist Button */}
              <Button
                backgroundColor="$blue3"
                borderColor="$blue6"
                borderWidth={2}
                borderRadius="$4"
                onPress={() => {
                  if (!selectedCustomerId) {
                    Alert.alert(
                      'Select Customer',
                      'Please select a customer before moving cart to waitlist.',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Select Customer',
                          onPress: () => {
                            setShowCustomerModal(true);
                            setSearchQuery('');
                          },
                        },
                      ]
                    );
                    return;
                  }
                  setShowWaitlistModal(true);
                }}
                pressStyle={{ backgroundColor: "$blue4" }}
                height="$5"
                disabled={waitlistLoading}
              >
                {waitlistLoading ? (
                  <Spinner size="small" color="$blue11" />
                ) : (
                  <Text color="$blue11" fontWeight="700" fontSize="$4">
                    ⏳ Add Entire Cart to Waitlist
                  </Text>
                )}
              </Button>

              {/* Clear Cart Button */}
              <Button
                backgroundColor="$red3"
                borderColor="$red6"
                borderWidth={2}
                borderRadius="$4"
                onPress={handleClearCart}
                pressStyle={{ backgroundColor: "$red4" }}
                height="$5"
              >
                <Text color="$red11" fontWeight="700" fontSize="$4">
                  🗑️ Clear Entire Cart
                </Text>
              </Button>

              {/* Checkout Button */}
              <Button
                backgroundColor="$green9"
                borderColor="$green10"
                borderWidth={2}
                borderRadius="$4"
                onPress={handleCheckout}
                disabled={checkoutLoading}
                pressStyle={{ backgroundColor: "$green10" }}
                height="$5"
                shadowColor="$green7"
                shadowRadius={8}
              >
                {checkoutLoading ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <Text color="white" fontWeight="700" fontSize="$4">
                    🚀 Checkout - ${(totalAmount - (discount ? parseFloat(discount) : 0)).toFixed(2)}
                  </Text>
                )}
              </Button>

              {!selectedCustomerId && (
                <Text fontSize="$2" color="$orange10" textAlign="center">
                  * Please select a customer to enable checkout and waitlist functions
                </Text>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Customer Selection Modal with Search */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCustomerModal(false);
          setCustomerSearchQuery('');
        }}
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
            maxHeight="80%"
          >
            <YStack space="$4">
              <H4 textAlign="center" color="$orange12">
                Select Customer
              </H4>

              {/* Search Input */}
              <Input
                placeholder="Search by name or phone..."
                value={customerSearchQuery}
                onChangeText={setCustomerSearchQuery}
                borderWidth={2}
                borderRadius="$3"
                borderColor="$orange5"
                backgroundColor="white"
                padding="$3"
                autoFocus={true}
              />

              {customersLoading ? (
                <YStack alignItems="center" padding="$4">
                  <Spinner size="large" color="$orange9" />
                  <Text marginTop="$2" color="$orange11">Loading customers...</Text>
                </YStack>
              ) : filteredCustomers.length === 0 ? (
                <YStack alignItems="center" padding="$4" space="$3">
                  <Text color="$orange10" textAlign="center">
                    {customerSearchQuery ? 'No customers found matching your search.' : 'No customers found. Please add a customer first.'}
                  </Text>
                  <Button
                    backgroundColor="$orange9"
                    borderColor="$orange10"
                    borderWidth={1}
                    borderRadius="$4"
                    onPress={() => {
                      setShowCustomerModal(false);
                      setShowAddCustomerModal(true);
                    }}
                  >
                    <Text color="white" fontWeight="600">Add New Customer</Text>
                  </Button>
                </YStack>
              ) : (
                <ScrollView maxHeight={400} showsVerticalScrollIndicator={false}>
                  <YStack space="$5">
                    {filteredCustomers.map((customer) => (
                      <Button
                        key={customer.id}
                        backgroundColor={selectedCustomerId === customer.id ? "$orange9" : "$orange3"}
                        borderColor={selectedCustomerId === customer.id ? "$orange10" : "$orange6"}
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={() => {
                          setSelectedCustomerId(customer.id);
                          setShowCustomerModal(false);
                          setCustomerSearchQuery('');
                        }}
                        pressStyle={{ backgroundColor: "$orange4" }}
                      >
                        <YStack alignItems="flex-start" width="100%">
                          <Text 
                            color={selectedCustomerId === customer.id ? "white" : "$orange11"} 
                            fontWeight="600"
                          >
                            {customer.name}
                          </Text>
                          <XStack gap="$3" alignItems="center">
                            {customer.phone1 && (
                              <XStack alignItems="center" gap="$1">
                                <Text fontSize="$1">📞</Text>
                                <Text 
                                  color={selectedCustomerId === customer.id ? "white" : "$orange9"} 
                                  fontSize="$2"
                                >
                                  {customer?.phone1}
                                </Text>
                              </XStack>
                            )}
                            {customer.companyName && (
                              <XStack alignItems="center" gap="$1">
                                <Text fontSize="$1">🏢</Text>
                                <Text 
                                  color={selectedCustomerId === customer.id ? "white" : "$orange9"} 
                                  fontSize="$2"
                                >
                                  {customer?.companyName}
                                </Text>
                              </XStack>
                            )}
                          </XStack>
                        </YStack>
                      </Button>
                    ))}
                  </YStack>
                </ScrollView>
              )}

              {/* Discount/Notes Apply Button */}
              {selectedCustomerId && (
                <Button
                  backgroundColor="$green9"
                  borderColor="$green10"
                  borderWidth={1}
                  borderRadius="$4"
                  onPress={() => {
                    setShowCustomerModal(false);
                    setCustomerSearchQuery('');
                    setShowDiscountNotesModal(true);
                  }}
                  pressStyle={{ backgroundColor: "$green10" }}
                  marginTop="$2"
                >
                  <Text color="white" fontWeight="600">
                    ✓ Apply Discount & Notes
                  </Text>
                </Button>
              )}

              <XStack space="$3" marginTop="$2">
                <Button
                  flex={1}
                  backgroundColor="$orange3"
                  borderColor="$orange6"
                  borderWidth={1}
                  borderRadius="$4"
                  onPress={() => {
                    setShowCustomerModal(false);
                    setCustomerSearchQuery('');
                  }}
                >
                  <Text color="$orange11" fontWeight="600">Cancel</Text>
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$orange9"
                  borderColor="$orange10"
                  borderWidth={1}
                  borderRadius="$4"
                  onPress={() => {
                    setShowCustomerModal(false);
                    setShowAddCustomerModal(true);
                    setCustomerSearchQuery('');
                  }}
                >
                  <Text color="white" fontWeight="600">Add New</Text>
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </Modal>

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCreateCustomer={handleCreateCustomer}
        loading={createCustomerLoading}
      />

      {/* Discount and Notes Modal */}
      <DiscountNotesModal
        visible={showDiscountNotesModal}
        onClose={() => setShowDiscountNotesModal(false)}
        onApply={handleApplyDiscountNotes}
        currentDiscount={discount ? parseFloat(discount) : 0}
        currentNotes={notes}
        totalAmount={totalAmount}
        loading={false}
      />

      {/* Add to Waitlist Modal */}
      <AddToWaitlistModal
        visible={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onConfirm={handleBulkAddToWaitlist}
        loading={waitlistLoading}
        cartInfo={{
          totalItems,
          totalAmount: totalAmount - (discount ? parseFloat(discount) : 0),
          customerName: selectedCustomer?.name
        }}
      />

      {/* Update Modals */}
      {selectedItem && (
        <>
          <QuantityUpdateModal
            item={selectedItem}
            visible={showQuantityModal}
            onClose={() => {
              setShowQuantityModal(false);
              setSelectedItem(null);
            }}
            onUpdateQuantity={handleUpdateQuantity}
          />

          <PriceUpdateModal
            item={selectedItem}
            visible={showPriceModal}
            onClose={() => {
              setShowPriceModal(false);
              setSelectedItem(null);
            }}
            onUpdatePrice={handleUpdatePrice}
          />
        </>
      )}
    </YStack>
  );
};

export default CartListViewScreen;