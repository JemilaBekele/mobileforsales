import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  Text,
  Button,
  Spinner,
  YStack,
  XStack,
  Card,
  Image,
  Input,
} from 'tamagui';
import { TouchableOpacity } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductsBySubCategoryId, Product } from '@/(services)/api/subcatagorypro';

const BACKEND_URL = 'https://ordere.net';

export const normalizeImagePath = (path?: string) => {
  if (!path) return undefined;
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) {
    return normalizedPath;
  }
  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

export default function SubcategoryProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  
  const subCategoryId = params.subCategoryId as string;
  const subCategoryName = params.subCategoryName as string;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleProducts, setVisibleProducts] = useState(6);

  // Use React Query for data fetching
const {
  data: productsData,
  isLoading,
  error,
  refetch,
} = useQuery({
  queryKey: ['subcategory-products', subCategoryId],
  queryFn: () => getProductsBySubCategoryId(subCategoryId),
  enabled: !!subCategoryId, // Only run query if subCategoryId exists
  staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes (formerly cacheTime)
});

  const products = productsData?.products || [];

  const handleBack = () => {
    router.back();
  };

  const handleLoadMore = () => {
    setVisibleProducts(prev => prev + 6);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setVisibleProducts(6);
  };

  const handleRetry = () => {
    refetch();
  };

  const handleCardClick = (currentIndex: number) => {
    const currentProduct = displayedProducts[currentIndex];
    
    if (!currentProduct) {
      console.log('Current product not found');
      return;
    }
    
    // Prefetch product details if needed
    queryClient.prefetchQuery({
      queryKey: ['product-details', currentProduct.id],
      queryFn: () => Promise.resolve(currentProduct), // You would replace this with actual API call
    });
    
    // Navigate to the CURRENT product details
    router.push({
      pathname: '/home/ProductDetails/[id]' as any,
      params: { 
        id: currentProduct.id,
        productId: currentProduct.id,
        productName: currentProduct.name,
        productGeneric: currentProduct.generic || '',
        productPrice: currentProduct.sellPrice,
        productImage: currentProduct.imageUrl,
        productCode: currentProduct.productCode,
        productDescription: currentProduct.description || '',
        categoryName: currentProduct.category?.name || '',
        subCategoryName: currentProduct.subCategory?.name || '',
        unitOfMeasure: currentProduct.unitOfMeasure?.name || '',
      }
    });
  };

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return typeof numPrice === 'number' && !isNaN(numPrice) ? numPrice.toFixed(2) : '0.00';
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    searchTerm === '' ||
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.generic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProducts = filteredProducts.slice(0, visibleProducts);

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="#FFF8F0">
        <Spinner size="large" color="#FF7A00" />
        <Text marginTop="$4" color="#FF7A00" fontSize="$5" fontWeight="600">
          Loading Products...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="#FFF8F0">
        <Text color="#FF4444" textAlign="center" fontSize="$5" fontWeight="600">
          Error: {error.message || 'Failed to load products'}
        </Text>
        <Button 
          marginTop="$4"
          onPress={handleRetry}
          backgroundColor="#FF7A00"
          borderColor="#FF9B42"
          borderWidth={1}
          borderRadius="$4"
          pressStyle={{ backgroundColor: "#FF9B42" }}
        >
          <Text color="white" fontWeight="600">Try Again</Text>
        </Button>
        <Button 
          marginTop="$2"
          onPress={handleBack}
          backgroundColor="#FFF2E0"
          borderColor="#FFD4A3"
          borderWidth={1}
          borderRadius="$4"
        >
          <Text color="#FF7A00" fontWeight="600">Go Back</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      backgroundColor="#FFF8F0"
    >
      <YStack space="$6" padding="$5">
        {/* Header Section */}
        <YStack space="$4" backgroundColor="#FFF2E0" padding="$5" borderRadius="$6" borderWidth={1} borderColor="#FFD4A3">
          <Button 
            onPress={handleBack}
            alignSelf="flex-start"
            size="$3"
            backgroundColor="#FFF2E0"
            borderColor="#FFD4A3"
            borderWidth={1}
            borderRadius="$6"
            marginBottom="$2"
          >
            <Text color="#FF7A00" fontWeight="600">← Back</Text>
          </Button>
          
          <Text fontSize="$6" fontWeight="800" color="#FF7A00">
            {subCategoryName}
          </Text>
          <Text fontSize="$4" color="#A65A00" fontWeight="500">
            {products.length} products available
          </Text>
        </YStack>

        {/* Search Bar */}
        <YStack space="$3">
          <Text fontSize="$6" fontWeight="800" color="#FF7A00">
            🔍 Search Products
          </Text>
          <XStack alignItems="center" space="$3">
            <Input
              flex={1}
              placeholder={`Search in ${subCategoryName}...`}
              value={searchTerm}
              onChangeText={handleSearch}
              backgroundColor="#FFF"
              borderColor="#FFD4A3"
              borderWidth={2}
              borderRadius="$6"
              paddingHorizontal="$4"
              paddingVertical="$3"
              fontSize="$4"
              color="#333"
              placeholderTextColor="#D08A4E"
              shadowColor="#FFB865"
              shadowOpacity={0.15}
              shadowRadius={8}
            />
            {searchTerm ? (
              <Button
                size="$4"
                backgroundColor="#FF6B6B"
                borderRadius="$6"
                onPress={handleClearSearch}
                pressStyle={{ backgroundColor: "#FF8E8E" }}
              >
                <Text color="white" fontWeight="800">✕</Text>
              </Button>
            ) : null}
          </XStack>
          {searchTerm && (
            <Text fontSize="$3" color="#A65A00" fontWeight="500">
              Showing results for: &quot;{searchTerm}&quot;
            </Text>
          )}
        </YStack>

        {/* Products Grid */}
        <YStack space="$4">
          <XStack flexWrap="wrap" justifyContent="space-between" gap="$3">
            {displayedProducts.map((product: Product, index: number) => (
              <YStack key={product.id} width="48%">
                <TouchableOpacity onPress={() => handleCardClick(index)}>
                  <Card
                    elevate
                    size="$2"
                    bordered
                    borderRadius="$6"
                    backgroundColor="white"
                    shadowColor="#FFB865"
                    shadowOpacity={0.2}
                    shadowRadius={10}
                    padding="$3"
                  >
                    {/* Product Image */}
                    <YStack alignItems="center" marginBottom="$2">
                      <Image
                        source={{ uri: normalizeImagePath(product.imageUrl) }}
                        width={100}
                        height={100}
                        borderRadius="$4"
                        resizeMode="contain"
                        backgroundColor="#FFF7F0"
                        borderWidth={1}
                        borderColor="#FFD4A3"
                      />
                    </YStack>

                    {/* Product Info */}
                    <YStack space="$1">
                      <Text fontSize={13} fontWeight="800" color="#333" numberOfLines={2}>
                        {product.name}
                      </Text>
                      {product.generic && (
                        <Text fontSize={11} color="#A65A00" numberOfLines={1}>
                          {product.generic}
                        </Text>
                      )}
                      <Text fontSize={10} color="#888" numberOfLines={1}>
                        Code: {product.productCode}
                      </Text>
                      <XStack justifyContent="space-between" alignItems="center" marginTop="$1">
                        <Text fontSize={11} color="#888">
                          Price:
                        </Text>
                        <Text fontSize={13} fontWeight="900" color="#FF7A00">
                          {formatPrice(product.sellPrice)}
                        </Text>
                      </XStack>
                      {product.category && (
                        <XStack>
                          <Text 
                            fontSize={10} 
                            color="#666" 
                            backgroundColor="#FFF2E0" 
                            paddingHorizontal="$2" 
                            paddingVertical="$1" 
                            borderRadius="$2"
                          >
                            {product.category.name}
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </Card>
                </TouchableOpacity>
              </YStack>
            ))}
          </XStack>
        </YStack>

        {/* Load More Button */}
        {filteredProducts.length > visibleProducts && (
          <YStack alignItems="center" paddingVertical="$5">
            <Button 
              onPress={handleLoadMore}
              backgroundColor="#FF7A00"
              borderColor="#FF9B42"
              borderWidth={1}
              borderRadius="$4"
              pressStyle={{ backgroundColor: "#FF9B42" }}
              paddingHorizontal="$6"
              paddingVertical="$4"
              shadowColor="#FFB865"
              shadowRadius={8}
              shadowOpacity={0.2}
            >
              <Text color="white" fontWeight="800" fontSize="$4">
                Load More ({filteredProducts.length - visibleProducts} remaining)
              </Text>
            </Button>
          </YStack>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <YStack alignItems="center" padding="$10" space="$5" backgroundColor="#FFF2E0" borderRadius="$5" borderWidth={1} borderColor="#FFD4A3">
            <Text fontSize="$6" color="#A65A00" textAlign="center" fontWeight="700">
              No products found
            </Text>
            <Text fontSize="$4" color="#A65A00" textAlign="center" fontWeight="500">
              There are no products available in {subCategoryName} at the moment.
            </Text>
            <Button 
              onPress={handleBack}
              backgroundColor="#FF7A00"
              borderColor="#FF9B42"
              borderWidth={1}
              borderRadius="$4"
              marginTop="$2"
              paddingHorizontal="$6"
              paddingVertical="$4"
            >
              <Text color="white" fontWeight="600" fontSize="$4">Go Back to Subcategories</Text>
            </Button>
          </YStack>
        )}

        {/* No Search Results */}
        {products.length > 0 && filteredProducts.length === 0 && (
          <YStack alignItems="center" padding="$10" space="$5" backgroundColor="#FFF2E0" borderRadius="$5" borderWidth={1} borderColor="#FFD4A3">
            <Text fontSize="$6" color="#A65A00" textAlign="center" fontWeight="700">
              No products found for &quot;{searchTerm}&quot;
            </Text>
            <Text fontSize="$4" color="#A65A00" textAlign="center" fontWeight="500">
              Try adjusting your search terms
            </Text>
            <Button 
              onPress={handleClearSearch}
              backgroundColor="#FF7A00"
              borderColor="#FF9B42"
              borderWidth={1}
              borderRadius="$4"
              marginTop="$2"
              paddingHorizontal="$6"
              paddingVertical="$4"
            >
              <Text color="white" fontWeight="600" fontSize="$4">Clear Search</Text>
            </Button>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}