import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
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
  Input,
  Fieldset,
  Label,
 
} from 'tamagui';
import type { AppDispatch } from '@/(redux)/store';
import { useFocusEffect } from 'expo-router';

// Redux imports - UPDATED with new filter imports
import {
  fetchUserSells,
  clearFilters,
  setCustomerFilter,
  setStatusFilter,
  setDateRangeFilter,
  selectUserSells,
  selectUserSellsLoading,
  selectUserSellsError,
  selectUserSellsCount,
  selectUserSellsFilters,
  selectUserSellsMeta,
  selectFilteredUserSells,
  selectFilteredUserSellsCount,
  convertSellToCart,
  selectIsSellConverting,
  selectSellConversionError,
  clearConversionError,
} from '@/(redux)/sell';

// Import the actual Sell type from your API
import type { Sell, SellItem, SellItemBatch } from '@/(utils)/types';

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

// Date utility functions
const formatDateForBackend = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDatePresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const last3Days = new Date(today);
  last3Days.setDate(today.getDate() - 3);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  
  const last3Months = new Date(today);
  last3Months.setMonth(today.getMonth() - 3);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  return {
    today: formatDateForBackend(today),
    yesterday: formatDateForBackend(yesterday),
    last3Days: formatDateForBackend(last3Days),
    lastWeek: formatDateForBackend(lastWeek),
    lastMonth: formatDateForBackend(lastMonth),
    last3Months: formatDateForBackend(last3Months),
    startOfMonth: formatDateForBackend(startOfMonth),
    startOfYear: formatDateForBackend(startOfYear),
    current: formatDateForBackend(today),
  };
};

// UPDATED Status Select Component with multiple status support
const StatusSelect = ({ 
  value, 
  onValueChange 
}: { 
  value: string;
  onValueChange: (value: string) => void;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    value && value !== 'all' ? value.split(',').map(s => s.trim()) : []
  );

  const statusOptions = [
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'NOT_APPROVED', label: 'Not Approved' },
    { value: 'PARTIALLY_DELIVERED', label: 'Partially Delivered' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'PENDING', label: 'Pending' },
  ];

  const getStatusLabel = () => {
    if (selectedStatuses.length === 0) return 'All Statuses';
    if (selectedStatuses.length === 1) {
      const option = statusOptions.find(opt => opt.value === selectedStatuses[0]);
      return option ? option.label : 'Custom Status';
    }
    return `${selectedStatuses.length} Statuses`;
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'DELIVERED': return '$green9';
      case 'NOT_APPROVED': return '$orange9';
      case 'PARTIALLY_DELIVERED': return '$yellow9';
      case 'APPROVED': return '$blue9';
      case 'CANCELLED': return '$red9';
      case 'PENDING': return '$purple9';
      default: return '$gray9';
    }
  };

  const handleStatusToggle = (statusValue: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusValue)) {
        return prev.filter(s => s !== statusValue);
      } else {
        return [...prev, statusValue];
      }
    });
  };

  const handleApply = () => {
    if (selectedStatuses.length === 0) {
      onValueChange('all');
    } else {
      onValueChange(selectedStatuses.join(','));
    }
    setShowModal(false);
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    onValueChange('all');
    setShowModal(false);
  };

  return (
    <>
      <Button
        onPress={() => setShowModal(true)}
        backgroundColor="$orange1"
        borderColor="$orange5"
        borderWidth={1}
        borderRadius="$3"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$2"
        pressStyle={{ backgroundColor: "$orange2" }}
      >
        <XStack alignItems="center" space="$2" flex={1}>
          {selectedStatuses.length > 0 ? (
            <XStack space="$1">
              {selectedStatuses.slice(0, 2).map((status, index) => (
                <YStack
                  key={status}
                  width={10}
                  height={10}
                  borderRadius="$12"
                  backgroundColor={getStatusColor(status)}
                  borderWidth={1}
                  borderColor="$gray5"
                />
              ))}
              {selectedStatuses.length > 2 && (
                <Text color="$orange10" fontSize="$1">
                  +{selectedStatuses.length - 2}
                </Text>
              )}
            </XStack>
          ) : (
            <YStack
              width={10}
              height={10}
              borderRadius="$12"
              backgroundColor="$gray7"
              borderWidth={1}
              borderColor="$gray5"
            />
          )}
          <Text 
            color="$orange12" 
            fontWeight="600" 
            fontSize="$3"
            numberOfLines={1}
            flex={1}
            textAlign="left"
          >
            {getStatusLabel()}
          </Text>
        </XStack>
        <Text color="$orange10" fontSize="$2">▼</Text>
      </Button>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <YStack 
            flex={1} 
            justifyContent="center" 
            alignItems="center" 
            backgroundColor="rgba(0,0,0,0.5)"
            padding="$4"
          >
            <TouchableWithoutFeedback>
              <YStack 
                backgroundColor="white" 
                borderRadius="$4" 
                padding="$4" 
                width="100%"
                maxWidth={400}
                borderWidth={1}
                borderColor="$orange4"
                maxHeight="80%"
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <YStack space="$4">
                    <YStack alignItems="center" space="$2">
                      <H4 color="$gray12" textAlign="center" fontWeight="700">
                        Select Order Status
                      </H4>
                      <Text fontSize="$2" color="$gray9" textAlign="center">
                        Select one or multiple statuses
                      </Text>
                    </YStack>

                    <YStack space="$3">
                      {statusOptions.map((option) => (
                        <Button
                          key={option.value}
                          onPress={() => handleStatusToggle(option.value)}
                          backgroundColor={selectedStatuses.includes(option.value) ? "$blue2" : "white"}
                          borderColor={selectedStatuses.includes(option.value) ? "$blue7" : "$gray4"}
                          borderWidth={1.5}
                          borderRadius="$4"
                          padding="$3"
                          justifyContent="flex-start"
                          pressStyle={{ backgroundColor: "$gray2" }}
                        >
                          <XStack alignItems="center" space="$3" width="100%">
                            <YStack
                              width={16}
                              height={16}
                              borderRadius="$12"
                              backgroundColor={getStatusColor(option.value)}
                              borderWidth={2}
                              borderColor="white"
                            />
                            <YStack flex={1}>
                              <Text
                                fontSize="$4"
                                fontWeight="600"
                                color={selectedStatuses.includes(option.value) ? "$blue12" : "$gray12"}
                              >
                                {option.label}
                              </Text>
                            </YStack>
                            {selectedStatuses.includes(option.value) && (
                              <Text color="$blue9" fontSize="$3" fontWeight="700">
                                ✓
                              </Text>
                            )}
                          </XStack>
                        </Button>
                      ))}
                    </YStack>

                    <XStack space="$3" marginTop="$3">
                      <Button
                        flex={1}
                        backgroundColor="$gray2"
                        borderColor="$gray5"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={handleClear}
                        pressStyle={{ backgroundColor: "$gray3" }}
                      >
                        <Text color="$gray11" fontWeight="600" fontSize="$3">
                          Clear All
                        </Text>
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor="$orange9"
                        borderColor="$orange10"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={handleApply}
                        pressStyle={{ backgroundColor: "$orange10" }}
                      >
                        <Text color="white" fontWeight="600" fontSize="$3">
                          Apply ({selectedStatuses.length || 'All'})
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                </ScrollView>
              </YStack>
            </TouchableWithoutFeedback>
          </YStack>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// NEW Customer Filter Component
const CustomerFilter = ({ 
  value, 
  onValueChange,
  sells 
}: { 
  value?: string | number;
  onValueChange: (value: string | number | undefined) => void;
  sells: Sell[];
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique customers from sells
  const customers = Array.from(new Set(
    sells
      .filter(sell => sell.customer)
      .map(sell => ({
        id: sell.customerId,
        name: sell.customer?.name || `Customer ${sell.customerId?.slice(-8) || 'Unknown'}`,
      }))
      .filter(customer => customer.id)
  ));

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customerId?: string | number) => {
    onValueChange(customerId);
    setShowModal(false);
  };

  const getCustomerName = () => {
    if (!value) return 'All Customers';
    const customer = customers.find(c => String(c.id) === String(value));
    return customer ? customer.name : `Customer ${value}`;
  };

  return (
    <>
      <Button
        onPress={() => setShowModal(true)}
        backgroundColor="$orange1"
        borderColor="$orange5"
        borderWidth={1}
        borderRadius="$3"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$2"
        pressStyle={{ backgroundColor: "$orange2" }}
      >
        <XStack alignItems="center" space="$2" flex={1}>
          <Text 
            color="$orange12" 
            fontWeight="600" 
            fontSize="$3"
            numberOfLines={1}
            flex={1}
            textAlign="left"
          >
            👤 {getCustomerName()}
          </Text>
        </XStack>
        <Text color="$orange10" fontSize="$2">▼</Text>
      </Button>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <YStack 
            flex={1} 
            justifyContent="center" 
            alignItems="center" 
            backgroundColor="rgba(0,0,0,0.5)"
            padding="$4"
          >
            <TouchableWithoutFeedback>
              <YStack 
                backgroundColor="white" 
                borderRadius="$4" 
                padding="$4" 
                width="100%"
                maxWidth={400}
                borderWidth={1}
                borderColor="$orange4"
                maxHeight="80%"
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <YStack space="$4">
                    <YStack alignItems="center" space="$2">
                      <H4 color="$gray12" textAlign="center" fontWeight="700">
                        Select Customer
                      </H4>
                      <Text fontSize="$2" color="$gray9" textAlign="center">
                        Filter orders by customer
                      </Text>
                    </YStack>

                    <Fieldset>
                      <Label htmlFor="customerSearch" fontSize="$3" fontWeight="600" color="$orange11">
                        Search Customer
                      </Label>
                      <Input
                        id="customerSearch"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        borderColor="$orange5"
                        backgroundColor="$orange1"
                      />
                    </Fieldset>

                    <YStack space="$2" maxHeight={300}>
                      <Button
                        onPress={() => handleSelectCustomer(undefined)}
                        backgroundColor={!value ? "$blue2" : "white"}
                        borderColor={!value ? "$blue7" : "$gray4"}
                        borderWidth={1}
                        borderRadius="$3"
                        padding="$3"
                        justifyContent="flex-start"
                        pressStyle={{ backgroundColor: "$gray2" }}
                      >
                        <XStack alignItems="center" space="$2">
                          <Text fontSize="$4" fontWeight="600" color={!value ? "$blue12" : "$gray12"}>
                            👥 All Customers
                          </Text>
                        </XStack>
                      </Button>

                      {filteredCustomers.map((customer) => (
                        <Button
                          key={customer.id}
                          onPress={() => handleSelectCustomer(customer.id)}
                          backgroundColor={String(value) === String(customer.id) ? "$blue2" : "white"}
                          borderColor={String(value) === String(customer.id) ? "$blue7" : "$gray4"}
                          borderWidth={1}
                          borderRadius="$3"
                          padding="$3"
                          justifyContent="flex-start"
                          pressStyle={{ backgroundColor: "$gray2" }}
                        >
                          <XStack alignItems="center" space="$2" width="100%">
                            <YStack flex={1}>
                              <Text
                                fontSize="$4"
                                fontWeight="600"
                                color={String(value) === String(customer.id) ? "$blue12" : "$gray12"}
                                numberOfLines={1}
                              >
                                {customer.name}
                              </Text>
                            </YStack>
                            {String(value) === String(customer.id) && (
                              <Text color="$blue9" fontSize="$3" fontWeight="700">
                                ✓
                              </Text>
                            )}
                          </XStack>
                        </Button>
                      ))}

                      {filteredCustomers.length === 0 && (
                        <Text fontSize="$3" color="$gray9" textAlign="center" padding="$4">
                          No customers found
                        </Text>
                      )}
                    </YStack>

                    <XStack space="$3" marginTop="$3">
                      <Button
                        flex={1}
                        backgroundColor="$gray2"
                        borderColor="$gray5"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={() => setShowModal(false)}
                        pressStyle={{ backgroundColor: "$gray3" }}
                      >
                        <Text color="$gray11" fontWeight="600" fontSize="$3">
                          Cancel
                        </Text>
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor="$orange9"
                        borderColor="$orange10"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={() => handleSelectCustomer(undefined)}
                        pressStyle={{ backgroundColor: "$orange10" }}
                      >
                        <Text color="white" fontWeight="600" fontSize="$3">
                          Clear Filter
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                </ScrollView>
              </YStack>
            </TouchableWithoutFeedback>
          </YStack>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// Enhanced Date Input Component (same as before)
const DateInput = ({ 
  value, 
  onDateChange, 
  placeholder 
}: { 
  value?: string;
  onDateChange: (date: string) => void;
  placeholder: string;
}) => {
  const [tempValue, setTempValue] = useState(value || '');
  const [showManualInput, setShowManualInput] = useState(false);

  const validateDate = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleDateChange = (text: string) => {
    setTempValue(text);
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const showDateInput = () => {
    setShowManualInput(true);
    setTempValue(value || '');
  };

  const handleCancel = () => {
    setShowManualInput(false);
    setTempValue(value || '');
  };

  const handleConfirm = () => {
    if (validateDate(tempValue)) {
      onDateChange(tempValue);
      setShowManualInput(false);
    } else {
      Alert.alert('Invalid Date', 'Please use format: YYYY-MM-DD (e.g., 2024-01-15)');
    }
  };

  return (
    <YStack>
      <Button
        onPress={showDateInput}
        backgroundColor="$orange1"
        borderColor="$orange5"
        borderWidth={1}
        borderRadius="$3"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <Text 
          color={value ? "$orange12" : "$orange8"} 
          fontWeight="600" 
          fontSize="$3"
          numberOfLines={1}
          flex={1}
          textAlign="left"
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Text color="$orange8" fontSize="$2">📅</Text>
      </Button>

      {showManualInput && (
        <Modal
          visible={showManualInput}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancel}
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
                      Enter Date
                    </H4>

                    <Fieldset>
                      <Label htmlFor="dateInput" fontSize="$4" fontWeight="600" color="$orange12">
                        Date (YYYY-MM-DD)
                      </Label>
                      <Input
                        id="dateInput"
                        value={tempValue}
                        onChangeText={handleDateChange}
                        placeholder="2024-01-15"
                        keyboardType="numbers-and-punctuation"
                        borderColor="$orange5"
                        backgroundColor="white"
                        fontSize="$5"
                        fontWeight="600"
                        textAlign="center"
                      />
                    </Fieldset>

                    <Text fontSize="$2" color="$orange10" textAlign="center">
                      Format: YYYY-MM-DD (e.g., 2024-01-15)
                    </Text>

                    {tempValue && !validateDate(tempValue) && (
                      <Text fontSize="$2" color="$red10" textAlign="center">
                        ❌ Invalid date format
                      </Text>
                    )}

                    {tempValue && validateDate(tempValue) && (
                      <Card backgroundColor="$green1" padding="$2" borderRadius="$2">
                        <Text fontSize="$2" color="$green10" textAlign="center" fontWeight="600">
                          ✅ {formatDisplayDate(tempValue)}
                        </Text>
                      </Card>
                    )}

                    <XStack space="$3" marginTop="$2">
                      <Button
                        flex={1}
                        backgroundColor="$orange3"
                        borderColor="$orange6"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={handleCancel}
                      >
                        <Text color="$orange11" fontWeight="600">Cancel</Text>
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor="$orange9"
                        borderColor="$orange10"
                        borderWidth={1}
                        borderRadius="$4"
                        onPress={handleConfirm}
                        disabled={!validateDate(tempValue)}
                      >
                        <Text color="white" fontWeight="600">Confirm</Text>
                      </Button>
                    </XStack>
                  </YStack>
                </YStack>
              </TouchableWithoutFeedback>
            </YStack>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </YStack>
  );
};

// Enhanced Date Filter Modal with Quick Presets (same as before)
const DateFilterModal = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}: {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { startDate?: string; endDate?: string }) => void;
  currentFilters: { startDate?: string; endDate?: string };
}) => {
  const [startDate, setStartDate] = useState<string>(currentFilters.startDate || '');
  const [endDate, setEndDate] = useState<string>(currentFilters.endDate || '');
  const datePresets = getDatePresets();

  const handleApply = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        Alert.alert('Invalid Date Range', 'Start date cannot be after end date');
        return;
      }
    }

    onApplyFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onApplyFilters({});
    onClose();
  };

  const applyQuickFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'Not selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getQuickFilterButtons = () => [
    // { 
    //   label: '📅 Today', 
    //   onPress: () => applyQuickFilter(datePresets.today, datePresets.today),
    //   description: 'View today\'s sales'
    // },
    // { 
    //   label: '📅 Yesterday', 
    //   onPress: () => applyQuickFilter(datePresets.yesterday, datePresets.yesterday),
    //   description: 'View yesterday\'s sales'
    // },
    { 
      label: '📅 Last 3 Days', 
      onPress: () => applyQuickFilter(datePresets.last3Days, datePresets.current),
      description: 'Last 3 days including today'
    },
    { 
      label: '📅 Last Week', 
      onPress: () => applyQuickFilter(datePresets.lastWeek, datePresets.current),
      description: 'Last 7 days including today'
    },
    { 
      label: '📅 Last Month', 
      onPress: () => applyQuickFilter(datePresets.lastMonth, datePresets.current),
      description: 'Last 30 days including today'
    },
    { 
      label: '📅 Last 3 Months', 
      onPress: () => applyQuickFilter(datePresets.last3Months, datePresets.current),
      description: 'Last 90 days including today'
    },
    { 
      label: '📅 This Month', 
      onPress: () => applyQuickFilter(datePresets.startOfMonth, datePresets.current),
      description: 'From start of month to today'
    },
    { 
      label: '📅 This Year', 
      onPress: () => applyQuickFilter(datePresets.startOfYear, datePresets.current),
      description: 'From start of year to today'
    },
  ];

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
              maxHeight="90%"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <YStack space="$4">
                  <H4 textAlign="center" color="$orange12">
                    Filter by Date Range
                  </H4>

                  <YStack space="$3">
                    <Text fontSize="$4" fontWeight="600" color="$orange11" textAlign="center">
                      Quick Filters
                    </Text>
                    <YStack space="$2">
                      {getQuickFilterButtons().map((filter, index) => (
                        <Button
                          key={index}
                          onPress={filter.onPress}
                          backgroundColor="$blue3"
                          borderColor="$blue6"
                          borderWidth={1}
                          borderRadius="$3"
                          pressStyle={{ backgroundColor: "$blue4" }}
                        >
                          <YStack alignItems="center" width="100%">
                            <Text color="$blue11" fontWeight="600" fontSize="$3">
                              {filter.label}
                            </Text>
                            <Text color="$blue9" fontSize="$1" textAlign="center">
                              {filter.description}
                            </Text>
                          </YStack>
                        </Button>
                      ))}
                    </YStack>
                  </YStack>

                  <YStack space="$3">
                    <Text fontSize="$4" fontWeight="600" color="$orange11" textAlign="center">
                      Custom Date Range
                    </Text>
                    
                    <Fieldset>
                      <Label htmlFor="startDate" fontSize="$4" fontWeight="600" color="$orange12">
                        Start Date
                      </Label>
                      <DateInput
                        value={startDate}
                        onDateChange={setStartDate}
                        placeholder="Select start date"
                      />
                      {startDate && (
                        <Text fontSize="$2" color="$orange10" marginTop="$1">
                          Selected: {formatDisplayDate(startDate)}
                        </Text>
                      )}
                    </Fieldset>

                    <Fieldset>
                      <Label htmlFor="endDate" fontSize="$4" fontWeight="600" color="$orange12">
                        End Date
                      </Label>
                      <DateInput
                        value={endDate}
                        onDateChange={setEndDate}
                        placeholder="Select end date"
                      />
                      {endDate && (
                        <Text fontSize="$2" color="$orange10" marginTop="$1">
                          Selected: {formatDisplayDate(endDate)}
                        </Text>
                      )}
                    </Fieldset>

                    {startDate && endDate && (
                      <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
                        <Text fontSize="$3" fontWeight="600" color="$orange12" textAlign="center">
                          📅 {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
                        </Text>
                      </Card>
                    )}
                  </YStack>

                  <XStack space="$3" marginTop="$2">
                    <Button
                      flex={1}
                      backgroundColor="$orange3"
                      borderColor="$orange6"
                      borderWidth={1}
                      borderRadius="$4"
                      onPress={handleClear}
                      pressStyle={{ backgroundColor: "$orange4" }}
                    >
                      <Text color="$orange11" fontWeight="600">Clear All</Text>
                    </Button>
                    <Button
                      flex={1}
                      backgroundColor="$orange9"
                      borderColor="$orange10"
                      borderWidth={1}
                      borderRadius="$4"
                      pressStyle={{ backgroundColor: "$orange10" }}
                      onPress={handleApply}
                      disabled={!startDate && !endDate}
                    >
                      <Text color="white" fontWeight="600">
                        {startDate && endDate ? 'Apply Filters' : 'Select Dates'}
                      </Text>
                    </Button>
                  </XStack>
                </YStack>
              </ScrollView>
            </YStack>
          </TouchableWithoutFeedback>
        </YStack>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const BatchDetails = ({ batches }: { batches: SellItemBatch[] }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!batches || batches.length === 0) {
    return null;
  }

  return (
    <YStack>
      <Button
        size="$1"
        backgroundColor="$blue3"
        borderColor="$blue6"
        borderWidth={1}
        borderRadius="$2"
        onPress={() => setShowDetails(!showDetails)}
        alignSelf="flex-start"
      >
        <Text color="$blue11" fontSize="$1" fontWeight="600">
          📦 {batches.length} batch{batches.length > 1 ? 'es' : ''}
        </Text>
      </Button>

      {showDetails && (
        <YStack marginTop="$2" space="$1">
          {batches.map((batchItem, index) => (
            <Card key={batchItem.id} backgroundColor="$blue1" padding="$2" borderRadius="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontSize="$1" fontWeight="600" color="$blue12">
                    Batch #{batchItem.batch?.batchNumber || batchItem.batchId?.slice(-6) || 'N/A'}
                  </Text>
                  <Text fontSize="$1" color="$blue10">
                    Qty: {batchItem.quantity}
                  </Text>
                </YStack>
                {batchItem.batch?.expiryDate && (
                  <Text fontSize="$1" color="$blue10">
                    {new Date(batchItem.batch.expiryDate).toLocaleDateString()}
                  </Text>
                )}
              </XStack>
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  );
};

const ConvertConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  sell,
  isConverting,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sell: Sell | null;
  isConverting: boolean;
}) => {
  if (!sell) return null;

  const canConvert = !sell.locked && ['PENDING', 'APPROVED', 'NOT_APPROVED'].includes(sell.saleStatus);

  if (!canConvert) {
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
            backgroundColor="$red1" 
            borderRadius="$4" 
            padding="$4" 
            width="100%"
            maxWidth={400}
            borderWidth={1}
            borderColor="$red4"
          >
            <YStack space="$4" alignItems="center">
              <Text fontSize="$6" color="$red9">⚠️</Text>
              <H4 color="$red12" textAlign="center">
                Cannot Convert Order
              </H4>
              <Text color="$red11" textAlign="center">
                {sell.locked 
                  ? 'This order is locked and cannot be converted.'
                  : `Orders with status "${sell.saleStatus}" cannot be converted. Only pending or approved orders can be converted.`
                }
              </Text>
              <Button
                width="100%"
                backgroundColor="$red9"
                borderColor="$red10"
                borderWidth={1}
                borderRadius="$4"
                onPress={onClose}
              >
                <Text color="white" fontWeight="600">Close</Text>
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </Modal>
    );
  }

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
          <YStack space="$4">
            <YStack alignItems="center" space="$2">
              <Text fontSize="$6" color="$orange9">🔄</Text>
              <H4 color="$orange12" textAlign="center">
                Convert Order to Cart
              </H4>
              <Text fontSize="$2" color="$orange10" textAlign="center">
                This will convert the order back to a shopping cart
              </Text>
            </YStack>

            <Card backgroundColor="$orange2" padding="$3" borderRadius="$3">
              <YStack space="$2">
                <XStack justifyContent="space-between">
                  <Text fontWeight="600" color="$orange11">Invoice:</Text>
                  <Text color="$orange12">{sell.invoiceNo}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontWeight="600" color="$orange11">Status:</Text>
                  <Text color="$orange12">{sell.saleStatus}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontWeight="600" color="$orange11">Total:</Text>
                  <Text fontWeight="700" color="$green10">${sell.grandTotal?.toFixed(2) || '0.00'}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontWeight="600" color="$orange11">Items:</Text>
                  <Text color="$orange12">{sell.totalProducts || sell.items?.length || 0}</Text>
                </XStack>
              </YStack>
            </Card>

            <XStack space="$3" marginTop="$2">
              <Button
                flex={1}
                backgroundColor="$orange3"
                borderColor="$orange6"
                borderWidth={1}
                borderRadius="$4"
                onPress={onClose}
                disabled={isConverting}
              >
                <Text color="$orange11" fontWeight="600">Cancel</Text>
              </Button>
              <Button
                flex={1}
                backgroundColor="$orange9"
                borderColor="$orange10"
                borderWidth={1}
                borderRadius="$4"
                onPress={onConfirm}
                disabled={isConverting}
              >
                {isConverting ? (
                  <XStack space="$2" alignItems="center">
                    <Spinner size="small" color="white" />
                    <Text color="white" fontWeight="600">Converting...</Text>
                  </XStack>
                ) : (
                  <Text color="white" fontWeight="600">Convert</Text>
                )}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
};

const SellDetailModal = ({
  sell,
  visible,
  onClose,
  onConvertToCart,
  isConverting,
}: {
  sell: Sell;
  visible: boolean;
  onClose: () => void;
  onConvertToCart: () => void;
  isConverting: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '$green9';
      case 'NOT_APPROVED': return '$orange9';
      case 'PARTIALLY_DELIVERED': return '$yellow9';
      case 'APPROVED': return '$blue9';
      case 'CANCELLED': return '$red9';
      case 'PENDING': return '$purple9';
      default: return '$gray9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Delivered';
      case 'NOT_APPROVED': return 'Not Approved';
      case 'PARTIALLY_DELIVERED': return 'Partially Delivered';
      case 'APPROVED': return 'Approved';
      case 'CANCELLED': return 'Cancelled';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '$green9';
      case 'PENDING': return '$orange9';
      default: return '$gray9';
    }
  };

  const getItemStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Delivered';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  const getProductName = (item: SellItem) => {
    return item?.product?.name || `Product ${item?.productId?.slice(-8) || 'Unknown'}`;
  };

  const getShopName = (item: SellItem) => {
    return item?.shop?.name || 'Unknown Shop';
  };

  const getUnitOfMeasure = (item: SellItem) => {
    return item?.unitOfMeasure?.name || item?.unitOfMeasure?.symbol || 'unit';
  };

  const getItemBatches = (item: SellItem) => {
    return item?.batches || [];
  };

  const canConvert = !sell.locked && ['PENDING', 'APPROVED', 'NOT_APPROVED'].includes(sell.saleStatus);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <YStack 
        flex={1} 
        backgroundColor="rgba(0,0,0,0.5)"
        justifyContent="flex-end"
      >
        <YStack 
          backgroundColor="$orange1" 
          borderTopLeftRadius="$4" 
          borderTopRightRadius="$4" 
          padding="$4"
          maxHeight="85%"
          borderWidth={1}
          borderColor="$orange4"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack space="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <H4 color="$orange12">Order Details</H4>
                <XStack space="$2">
                  {canConvert && (
                    <Button
                      size="$2"
                      backgroundColor="$orange9"
                      borderColor="$orange10"
                      borderWidth={1}
                      borderRadius="$3"
                      onPress={onConvertToCart}
                      disabled={isConverting}
                      pressStyle={{ backgroundColor: "$orange10" }}
                    >
                      {isConverting ? (
                        <Spinner size="small" color="white" />
                      ) : (
                        <Text color="white" fontWeight="600" fontSize="$1">
                          🛒 Convert to Cart
                        </Text>
                      )}
                    </Button>
                  )}
                  <Button
                    size="$2"
                    circular
                    backgroundColor="$orange3"
                    onPress={onClose}
                  >
                    <Text color="$orange11">✕</Text>
                  </Button>
                </XStack>
              </XStack>

              <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                <YStack space="$3">
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Invoice No:</Text>
                    <Text color="$orange12">{sell.invoiceNo}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Date:</Text>
                    <Text color="$orange12">
                      {new Date(sell.saleDate).toLocaleDateString()}
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Status:</Text>
                    <YStack
                      backgroundColor={getStatusColor(sell.saleStatus)}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      <Text color="white" fontSize="$1" fontWeight="700">
                        {getStatusText(sell.saleStatus)}
                      </Text>
                    </YStack>
                  </XStack>
                  {sell.locked && (
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600" color="$orange11">Locked:</Text>
                      <Text color="$red10" fontWeight="600">Yes</Text>
                    </XStack>
                  )}
                  {sell.branch && (
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600" color="$orange11">Branch:</Text>
                      <Text color="$orange12">{sell.branch.name}</Text>
                    </XStack>
                  )}
                  {sell.customer && (
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600" color="$orange11">Customer:</Text>
                      <Text color="$orange12">{sell.customer.name}</Text>
                    </XStack>
                  )}
                  <XStack justifyContent="space-between">
                    <Text fontWeight="600" color="$orange11">Total Products:</Text>
                    <Text color="$orange12">{sell.totalProducts}</Text>
                  </XStack>
                </YStack>
              </Card>

              <YStack space="$3">
                <Text fontWeight="700" color="$orange12" fontSize="$5">
                  Items ({sell.items?.length || 0})
                </Text>
                {sell.items?.map((item, index) => (
                  <Card key={item?.id || index} backgroundColor="$orange2" padding="$3" borderRadius="$3">
                    <YStack space="$3">
                      <XStack justifyContent="space-between" alignItems="flex-start">
                        <YStack flex={1}>
                          <Text fontWeight="700" color="$orange12" numberOfLines={2}>
                            {getProductName(item)}
                          </Text>
                          <Text fontSize="$2" color="$orange10">
                            Shop: {getShopName(item)}
                          </Text>
                          <Text fontSize="$2" color="$orange10">
                            Unit: {getUnitOfMeasure(item)}
                          </Text>
                        </YStack>
                        <YStack alignItems="flex-end">
                          <Text fontWeight="700" color="$green10">
                            {item?.unitPrice?.toFixed(2) || '0.00'}
                          </Text>
                          <Text fontSize="$2" color="$orange10">
                            x{item?.quantity || 0}
                          </Text>
                        </YStack>
                      </XStack>
                      
                      {getItemBatches(item).length > 0 && (
                        <BatchDetails batches={getItemBatches(item)} />
                      )}
                      
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack
                          backgroundColor={getItemStatusColor(item?.itemSaleStatus || 'PENDING')}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text color="white" fontSize="$1" fontWeight="700">
                            {getItemStatusText(item?.itemSaleStatus || 'PENDING')}
                          </Text>
                        </YStack>
                        <Text fontWeight="600" color="$orange12">
                          ${item?.totalPrice?.toFixed(2) || '0.00'}
                        </Text>
                      </XStack>
                    </YStack>
                  </Card>
                ))}
              </YStack>

              <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                <YStack space="$2">
                  <XStack justifyContent="space-between">
                    <Text color="$orange11">Subtotal:</Text>
                    <Text color="$orange12">{sell.subTotal?.toFixed(2) || '0.00'}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="$orange11">Discount:</Text>
                    <Text color="$red10">-{sell.discount?.toFixed(2) || '0.00'}</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="$orange11">VAT:</Text>
                    <Text color="$orange12">{sell.vat?.toFixed(2) || '0.00'}</Text>
                  </XStack>
                  <XStack justifyContent="space-between" borderTopWidth={1} borderTopColor="$orange4" paddingTop="$2">
                    <Text fontWeight="700" color="$orange12" fontSize="$5">Grand Total:</Text>
                    <Text fontWeight="700" color="$green10" fontSize="$5">
                      {sell.grandTotal?.toFixed(2) || '0.00'}
                    </Text>
                  </XStack>
                  {sell.NetTotal && (
                    <XStack justifyContent="space-between">
                      <Text color="$orange11">Net Total:</Text>
                      <Text color="$orange12">{sell.NetTotal.toFixed(2)}</Text>
                    </XStack>
                  )}
                </YStack>
              </Card>

              {sell.notes && (
                <Card backgroundColor="$orange2" padding="$4" borderRadius="$4">
                  <YStack space="$2">
                    <Text fontWeight="600" color="$orange11">Notes:</Text>
                    <Text color="$orange12">{sell.notes}</Text>
                  </YStack>
                </Card>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
};

const OrderScreen = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state - UPDATED with new selectors
  const sells = useSelector(selectUserSells);
  const filteredSells = useSelector(selectFilteredUserSells);
  const filteredCount = useSelector(selectFilteredUserSellsCount);
  const loading = useSelector(selectUserSellsLoading);
  const error = useSelector(selectUserSellsError);
  const totalCount = useSelector(selectUserSellsCount);
  const filters = useSelector(selectUserSellsFilters);
  const meta = useSelector(selectUserSellsMeta);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [sellToConvert, setSellToConvert] = useState<Sell | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UPDATED: Use filters from Redux state
  const statusFilter = filters.status || 'all';
  const customerFilter = filters.customerId;

  // Selectors for conversion state
  const isSellConverting = useSelector((state: any) => 
    selectIsSellConverting(selectedSell?.id || '')(state)
  );
  const conversionError = useSelector((state: any) => 
    selectSellConversionError(selectedSell?.id || '')(state)
  );

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || customerFilter || searchQuery || filters.startDate || filters.endDate;

  // Load sells data with all filters
  useEffect(() => {
    const fetchParams: any = {
      userId: 'current-user-id' // Replace with actual user ID
    };

    if (filters.startDate) fetchParams.startDate = filters.startDate;
    if (filters.endDate) fetchParams.endDate = filters.endDate;
    if (filters.customerId) fetchParams.customerId = filters.customerId;
    if (filters.status && filters.status !== 'all') fetchParams.status = filters.status;

    dispatch(fetchUserSells(fetchParams));
  }, [dispatch, filters]);

  // Refresh sells data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchParams: any = {
        userId: 'current-user-id'
      };

      if (filters.startDate) fetchParams.startDate = filters.startDate;
      if (filters.endDate) fetchParams.endDate = filters.endDate;
      if (filters.customerId) fetchParams.customerId = filters.customerId;
      if (filters.status && filters.status !== 'all') fetchParams.status = filters.status;

      dispatch(fetchUserSells(fetchParams));
    }, [dispatch, filters])
  );

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Clear conversion error when sell changes
  useEffect(() => {
    if (selectedSell?.id && conversionError) {
      dispatch(clearConversionError(selectedSell.id));
    }
  }, [selectedSell, conversionError, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const fetchParams: any = {
      userId: 'current-user-id'
    };

    if (filters.startDate) fetchParams.startDate = filters.startDate;
    if (filters.endDate) fetchParams.endDate = filters.endDate;
    if (filters.customerId) fetchParams.customerId = filters.customerId;
    if (filters.status && filters.status !== 'all') fetchParams.status = filters.status;

    await dispatch(fetchUserSells(fetchParams));
    setRefreshing(false);
  };

  const handleApplyDateFilters = (newFilters: { startDate?: string; endDate?: string }) => {
    dispatch(setDateRangeFilter(newFilters));
  };

  const handleStatusFilterChange = (status: string) => {
    dispatch(setStatusFilter(status === 'all' ? undefined : status));
  };

  const handleCustomerFilterChange = (customerId?: string | number) => {
    dispatch(setCustomerFilter(customerId));
  };

  const handleResetAllFilters = () => {
    // Clear Redux filters
    dispatch(clearFilters());
    // Clear local state
    setSearchQuery('');
    // Close filter modal if open
    setShowFilterModal(false);
    
    Alert.alert('Filters Reset', 'All filters have been cleared');
  };

  const handleViewDetails = (sell: Sell) => {
    setSelectedSell(sell);
    setShowDetailModal(true);
  };

  const handleConvertToCart = (sell: Sell) => {
    setSellToConvert(sell);
    setShowConvertConfirm(true);
  };

  const confirmConvertToCart = async () => {
    if (!sellToConvert) return;

    try {
      const result = await dispatch(convertSellToCart(sellToConvert.id)).unwrap();
      
      Alert.alert(
        'Success',
        result.message || 'Order converted to cart successfully!',
        [{ text: 'OK', onPress: () => {
          setShowConvertConfirm(false);
          setSellToConvert(null);
          if (selectedSell?.id === sellToConvert.id) {
            setShowDetailModal(false);
            setSelectedSell(null);
          }
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to convert order to cart');
    }
  };

  // Format date range for display
  const formatDateRangeDisplay = () => {
    if (!filters.startDate && !filters.endDate) return null;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    if (filters.startDate && filters.endDate) {
      return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    } else if (filters.startDate) {
      return `From ${formatDate(filters.startDate)}`;
    } else if (filters.endDate) {
      return `Until ${formatDate(filters.endDate)}`;
    }
  };

  // Apply search filter on top of Redux filters
  const searchedSells = filteredSells.filter(sell => {
    if (!searchQuery) return true;
    
    const matchesSearch = 
      sell.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sell.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sell.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sell.items?.some(item => 
        item?.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesSearch;
  });

  // Group sells by date
  const sellsByDate = searchedSells.reduce((acc, sell) => {
    const date = new Date(sell.saleDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(sell);
    return acc;
  }, {} as Record<string, Sell[]>);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '$green9';
      case 'NOT_APPROVED': return '$orange9';
      case 'PARTIALLY_DELIVERED': return '$yellow9';
      case 'APPROVED': return '$blue9';
      case 'CANCELLED': return '$red9';
      case 'PENDING': return '$purple9';
      default: return '$gray9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Delivered';
      case 'NOT_APPROVED': return 'Not Approved';
      case 'PARTIALLY_DELIVERED': return 'Partially Delivered';
      case 'APPROVED': return 'Approved';
      case 'CANCELLED': return 'Cancelled';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  const getProductDisplayNames = (sell: Sell) => {
    if (!sell.items || !Array.isArray(sell.items) || sell.items.length === 0) return 'No items';
    
    const productNames = sell.items.map(item => {
      return item?.product?.name || `Product ${item?.productId?.slice(-8) || 'Unknown'}`;
    });
    
    if (productNames.length <= 2) {
      return productNames.join(', ');
    } else {
      return `${productNames.slice(0, 2).join(', ')} +${productNames.length - 2} more`;
    }
  };

  const hasBatches = (sell: Sell) => {
    return sell.items?.some(item => item?.batches && item.batches.length > 0) || false;
  };

  const canConvertSell = (sell: Sell) => {
    return !sell.locked && ['PENDING', 'APPROVED', 'NOT_APPROVED'].includes(sell.saleStatus);
  };

  if (loading && !refreshing && sells.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
        <Text marginTop="$4" color="$orange11" fontSize="$5" fontWeight="600">
          Loading your sales...
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
                  📊 My Sales
                </H3>
                
                {sells.length === 0 ? (
                  <YStack alignItems="center" space="$3" paddingVertical="$4">
                    <Text fontSize="$6" color="$orange9">📊</Text>
                    <Text fontSize="$5" fontWeight="600" color="$orange11" textAlign="center">
                      No sales found
                    </Text>
                    <Text fontSize="$3" color="$orange9" textAlign="center">
                      {hasActiveFilters ? (
                        <Button 
                          onPress={handleResetAllFilters}
                          backgroundColor="transparent"
                          padding={0}
                          margin={0}
                        >
                          <Text 
                            color="$orange11" 
                            fontWeight="600" 
                            textDecorationLine="underline"
                          >
                            Try adjusting your filters
                          </Text>
                        </Button>
                      ) : (
                        'Your sales will appear here'
                      )}
                    </Text>
                  </YStack>
                ) : (
                  <YStack space="$3" width="100%">
                    <XStack justifyContent="space-between" width="100%">
                      <Text fontSize="$4" fontWeight="600" color="$orange11">
                        Total Sales:
                      </Text>
                      <Text fontSize="$4" fontWeight="700" color="$orange12">
                        {totalCount}
                      </Text>
                    </XStack>
                    {filteredCount !== totalCount && (
                      <XStack justifyContent="space-between" width="100%">
                        <Text fontSize="$4" fontWeight="600" color="$orange11">
                          Filtered Sales:
                        </Text>
                        <Text fontSize="$4" fontWeight="700" color="$blue10">
                          {filteredCount}
                        </Text>
                      </XStack>
                    )}
                    {meta?.filters && (
                      <Text fontSize="$2" color="$orange10" textAlign="center">
                        {meta.filters.customerId && `Customer: ${meta.filters.customerId}`}
                        {meta.filters.status && ` | Status: ${meta.filters.status}`}
                      </Text>
                    )}
                    {formatDateRangeDisplay() && (
                      <Text fontSize="$2" color="$orange10" textAlign="center">
                        {formatDateRangeDisplay()}
                      </Text>
                    )}
                  </YStack>
                )}
              </YStack>
            </Card.Header>
          </Card>

          {/* Filters Section */}
          {sells.length > 0 && (
            <Card 
              elevate 
              bordered 
              borderRadius="$4" 
              backgroundColor="$orange1"
              borderColor="$orange4"
            >
              <Card.Header padded>
                <YStack space="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$5" fontWeight="700" color="$orange12">
                      Filters
                    </Text>
                    {hasActiveFilters && (
                      <Button
                        size="$2"
                        backgroundColor="$red3"
                        borderColor="$red6"
                        borderWidth={1}
                        borderRadius="$3"
                        onPress={handleResetAllFilters}
                        pressStyle={{ backgroundColor: "$red4" }}
                      >
                        <Text color="$red11" fontWeight="600" fontSize="$2">
                          🔄 Reset All
                        </Text>
                      </Button>
                    )}
                  </XStack>

                  {/* Search */}
                  <Fieldset>
                    <Label htmlFor="search" fontSize="$3" fontWeight="600" color="$orange11">
                      Search
                    </Label>
                    <Input
                      id="search"
                      placeholder="Search by order ID, invoice, customer, or product..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      borderColor="$orange5"
                      backgroundColor="$orange1"
                    />
                  </Fieldset>

                  {/* Customer Filter */}
                  <Fieldset>
                    <Label htmlFor="customer" fontSize="$3" fontWeight="600" color="$orange11">
                      Customer
                    </Label>
                    <CustomerFilter
                      value={customerFilter}
                      onValueChange={handleCustomerFilterChange}
                      sells={sells}
                    />
                  </Fieldset>

                  {/* Status Filter */}
                  <Fieldset>
                    <Label htmlFor="status" fontSize="$3" fontWeight="600" color="$orange11">
                      Status
                    </Label>
                    <StatusSelect
                      value={statusFilter}
                      onValueChange={handleStatusFilterChange}
                    />
                  </Fieldset>

                  {/* Filter Actions */}
                  <XStack space="$2">
                    <Button
                      flex={1}
                      backgroundColor="$orange3"
                      borderColor="$orange6"
                      borderWidth={1}
                      borderRadius="$3"
                      onPress={() => setShowFilterModal(true)}
                      pressStyle={{ backgroundColor: "$orange4" }}
                    >
                      <Text color="$orange11" fontWeight="600">📅 Date Range</Text>
                    </Button>
                    <Button
                      backgroundColor="$red3"
                      borderColor="$red6"
                      borderWidth={1}
                      borderRadius="$3"
                      onPress={handleResetAllFilters}
                      pressStyle={{ backgroundColor: "$red4" }}
                    >
                      <Text color="$red11" fontWeight="600">🗑️ Clear All</Text>
                    </Button>
                  </XStack>

                  {/* Active Filters Summary */}
                  {hasActiveFilters && (
                    <Card backgroundColor="$orange2" padding="$2" borderRadius="$2">
                      <YStack space="$1">
                        <Text fontSize="$2" fontWeight="600" color="$orange11">
                          Active Filters:
                        </Text>
                        <XStack flexWrap="wrap" space="$1">
                          {customerFilter && (
                            <Badge backgroundColor="$purple8" size="$1">
                              Customer
                            </Badge>
                          )}
                          {statusFilter !== 'all' && (
                            <Badge backgroundColor="$orange8" size="$1">
                              Status
                            </Badge>
                          )}
                          {searchQuery && (
                            <Badge backgroundColor="$blue8" size="$1">
                              Search
                            </Badge>
                          )}
                          {filters.startDate && filters.endDate && (
                            <Badge backgroundColor="$green8" size="$1">
                              Date Range
                            </Badge>
                          )}
                        </XStack>
                      </YStack>
                    </Card>
                  )}
                </YStack>
              </Card.Header>
            </Card>
          )}

          {/* Sales by Date */}
          {Object.entries(sellsByDate).map(([date, dateSells]) => (
            <YStack key={date} space="$3">
              <XStack alignItems="center" space="$3" paddingHorizontal="$2">
                <Text fontSize="$5" fontWeight="700" color="$orange12">
                  📅 {date}
                </Text>
                <Badge backgroundColor="$orange9">
                  {dateSells.length} {dateSells.length === 1 ? 'sale' : 'sales'}
                </Badge>
              </XStack>

              {dateSells.map((sell) => (
                <Card 
                  key={sell.id}
                  elevate 
                  bordered 
                  borderRadius="$4" 
                  backgroundColor="$orange1"
                  borderColor="$orange4"
                  shadowColor="$orange7"
                  onPress={() => handleViewDetails(sell)}
                >
                  <Card.Header padded>
                    <YStack space="$3">
                      <XStack justifyContent="space-between" alignItems="flex-start">
                        <YStack flex={1} space="$1">
                          <Text fontSize="$4" fontWeight="700" color="$orange12">
                            {sell.invoiceNo}
                          </Text>
                          {sell.customer && (
                            <Text fontSize="$3" color="$purple10" fontWeight="600">
                              👤 {sell.customer.name}
                            </Text>
                          )}
                          <Text fontSize="$2" color="$orange10">
{new Date(sell.saleDate).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})} at {new Date(sell.saleDate).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})}                                                 </Text>
                        </YStack>
                        <YStack alignItems="flex-end" space="$1">
                          <YStack
                            backgroundColor={getStatusColor(sell.saleStatus)}
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                          >
                            <Text color="white" fontSize="$1" fontWeight="700">
                              {getStatusText(sell.saleStatus)}
                            </Text>
                          </YStack>
                          {hasBatches(sell) && (
                            <Badge backgroundColor="$blue9" size="$1">
                              📦 Batches
                            </Badge>
                          )}
                          {sell.locked && (
                            <Badge backgroundColor="$red9" size="$1">
                              🔒 Locked
                            </Badge>
                          )}
                        </YStack>
                      </XStack>

                      <Text fontSize="$3" color="$orange11" numberOfLines={2}>
                        {getProductDisplayNames(sell)}
                      </Text>

                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="$3" fontWeight="600" color="$orange11">
                          Total:
                        </Text>
                        <Text fontSize="$4" fontWeight="800" color="$green10">
                          ${sell.grandTotal?.toFixed(2) || '0.00'}
                        </Text>
                      </XStack>

                      <XStack space="$2">
                        <Button
                          flex={1}
                          size="$2"
                          backgroundColor="$orange3"
                          borderColor="$orange6"
                          borderWidth={1}
                          borderRadius="$3"
                          onPress={() => handleViewDetails(sell)}
                          pressStyle={{ backgroundColor: "$orange4" }}
                        >
                          <Text color="$orange11" fontWeight="600" fontSize="$2">
                            👁️ View Details
                          </Text>
                        </Button>
                        
                        {canConvertSell(sell) && (
                          <Button
                            size="$2"
                            backgroundColor="$green9"
                            borderColor="$green10"
                            borderWidth={1}
                            borderRadius="$3"
                            onPress={() => handleConvertToCart(sell)}
                            pressStyle={{ backgroundColor: "$green10" }}
                          >
                            <Text color="white" fontWeight="600" fontSize="$2">
                              🛒 Edit
                            </Text>
                          </Button>
                        )}
                      </XStack>
                    </YStack>
                  </Card.Header>
                </Card>
              ))}
            </YStack>
          ))}
        </YStack>
      </ScrollView>

      <DateFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyDateFilters}
        currentFilters={filters}
      />

      {selectedSell && (
        <SellDetailModal
          sell={selectedSell}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSell(null);
          }}
          onConvertToCart={() => handleConvertToCart(selectedSell)}
          isConverting={isSellConverting}
        />
      )}

      {sellToConvert && (
        <ConvertConfirmationModal
          visible={showConvertConfirm}
          onClose={() => {
            setShowConvertConfirm(false);
            setSellToConvert(null);
          }}
          onConfirm={confirmConvertToCart}
          sell={sellToConvert}
          isConverting={isSellConverting}
        />
      )}
    </YStack>
  );
};

export default OrderScreen;