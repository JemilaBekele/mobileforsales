import { TopSellingProduct } from '@/(services)/api/topSellingProducts';
import { Category } from '@/(services)/api/catagory';
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Text, 
  XStack, 
  YStack, 
  Button, 
  ScrollView,
  Spinner,
  Image,
  Input,
} from 'tamagui';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useTopSellingStore, selectTopSellingProducts, selectTopSellingProductsLoading, selectTopSellingProductsError } from '@/(store)/useTopSellingStore.ts';
import { useCategoriesStore, selectCategories, selectCategoriesLoading } from '@/(store)/useCategoriesStore';

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

const TopSellingProductsComponent = () => {
  const router = useRouter();
  
  // Use Zustand stores with selectors
  const products = useTopSellingStore(selectTopSellingProducts);
  const loading = useTopSellingStore(selectTopSellingProductsLoading);
  const error = useTopSellingStore(selectTopSellingProductsError);
  const fetchTopSellingProducts = useTopSellingStore((state) => state.fetchTopSellingProducts);
  
  // Categories store
  const categories = useCategoriesStore(selectCategories);
  const categoriesLoading = useCategoriesStore(selectCategoriesLoading);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  const [selectedCategory] = useState<string | null>(null);
  const [visibleProducts, setVisibleProducts] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchTopSellingProducts({});
    fetchCategories();
  }, [fetchTopSellingProducts, fetchCategories]);

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim() !== '') {
      fetchTopSellingProducts({ 
        searchTerm: searchTerm.trim(),
        categoryId: selectedCategory || undefined
      });
    } else {
      fetchTopSellingProducts({ 
        categoryId: selectedCategory || undefined
      });
    }
    setVisibleProducts(6);
  };

  // Handle search input change
  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    fetchTopSellingProducts({ 
      categoryId: selectedCategory || undefined
    });
    setVisibleProducts(6);
  };

  // Use products directly from backend (no client-side filtering)
  const displayedProducts = products.slice(0, visibleProducts);

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/home/subcategories' as any,
      params: { 
        categoryId,
        categoryName 
      }
    });
  };

  // Navigate directly to product details page
  const handleViewDetails = (product: TopSellingProduct) => {
    router.push({
      pathname: '/ProductDetails/[id]' as any,
      params: { 
        id: product.product.id,
        productId: product.product.id,
        productName: product.product.name,
        productGeneric: product.product.generic || '',
        productPrice: product.product.sellPrice,
        productImage: product.product.imageUrl,
      }
    });
  };

  if (loading || categoriesLoading) return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="#FFF8F0">
      <Spinner size="large" color="#FF7A00" />
      <Text marginTop="$4" color="#FF7A00" fontSize="$5" fontWeight="600">Loading Premium Products...</Text>
    </YStack>
  );

  if (error) return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="#FFF8F0">
      <Text color="#FF4444" textAlign="center" fontSize="$5" fontWeight="600">Error: {error}</Text>
      <Button 
        marginTop="$4"
        onPress={() => fetchTopSellingProducts({ 
          searchTerm: searchTerm.trim() || undefined,
          categoryId: selectedCategory || undefined 
        })}
        backgroundColor="#FF7A00"
        borderColor="#FF9B42"
        borderWidth={1}
        borderRadius="$4"
        pressStyle={{ backgroundColor: "#FF9B42" }}
      >
        <Text color="white" fontWeight="600">Try Again</Text>
      </Button>
    </YStack>
  );

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return typeof numPrice === 'number' && !isNaN(numPrice) ? numPrice.toFixed(2) : '0.00';
  };

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      backgroundColor="#FFF8F0"
    >
      <YStack space="$6" padding="$5">
        {/* Search Bar */}
        <YStack space="$3">
          <Text fontSize="$6" fontWeight="800" color="#FF7A00">
            🔍 Search Products
          </Text>
          <XStack alignItems="center" space="$3">
            <Input
              flex={1}
              placeholder="Search items..."
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
              onSubmitEditing={handleSearchClick}
            />
            {searchTerm ? (
              <Button
                size="$4"
                backgroundColor="#FF6B6B"
                borderRadius="$6"
                onPress={handleClearSearch}
                pressStyle={{ backgroundColor: "#FF8E8E" }}
                disabled={loading}
              >
                <Text color="white" fontWeight="800">✕</Text>
              </Button>
            ) : null}
            <Button
              size="$4"
              backgroundColor="#FF7A00"
              borderRadius="$6"
              onPress={handleSearchClick}
              pressStyle={{ backgroundColor: "#FF9B42" }}
              disabled={loading}
            >
              <Text color="white" fontWeight="800">
                {loading ? "Searching..." : "Search"}
              </Text>
            </Button>
          </XStack>
          {searchTerm && (
            <Text fontSize="$3" color="#A65A00" fontWeight="500">
              Showing results for: &quot;{searchTerm}&quot;
            </Text>
          )}
        </YStack>

        {/* Categories */}
        {categories.length > 0 && (
          <YStack space="$4">
            <Text fontSize="$6" fontWeight="800" color="#FF7A00">
              🏷️ Categories
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20, gap: 12 }}
            >
              <XStack space="$3">
                {categories.map((category: Category) => (
                  <Button
                    key={category.id}
                    size="$4"
                    backgroundColor={
                      selectedCategory === category.id ? "#FF7A00" : "#FFF7F0"
                    }
                    borderColor={
                      selectedCategory === category.id ? "#FF7A00" : "#FFD4A3"
                    }
                    borderWidth={2}
                    borderRadius="$6"
                    onPress={() => handleCategoryPress(category.id, category.name)}
                    pressStyle={{
                      scale: 0.97,
                      backgroundColor:
                        selectedCategory === category.id ? "#FF9B42" : "#FFE8D6",
                    }}
                    shadowColor="#FFB865"
                    shadowRadius={8}
                    shadowOpacity={0.2}
                  >
                    <Text
                      fontWeight="700"
                      color={
                        selectedCategory === category.id ? "white" : "#FF7A00"
                      }
                    >
                      {category.name}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>
        )}

        {/* Products Grid */}
        <YStack space="$4">
          <XStack flexWrap="wrap" justifyContent="space-between" gap="$3">
            {displayedProducts.map((item: TopSellingProduct, index: number) => (
              <TouchableOpacity 
                key={item.product.id} 
                style={{ width: '48%' }}
                onPress={() => handleViewDetails(item)}
              >
                <YStack width="100%">
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
                        source={{ uri: normalizeImagePath(item.product.imageUrl) }}
                        width={100}
                        height={100}
                        borderRadius="$4"
                        resizeMode="contain"
                        backgroundColor="#FFF7F0"
                        borderWidth={1}
                        borderColor="#FFD4A3"
                      />
                    </YStack>

                    {/* Info */}
                    <YStack space="$1">
                      <Text fontSize={13} fontWeight="800" color="#333" numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <Text fontSize={11} color="#A65A00" numberOfLines={1}>
                        {item.product.productCode}
                      </Text>
                      <Text fontSize={11} color="#A65A00" numberOfLines={1}>
                        {item.product.generic}
                      </Text>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={11} color="#888">
                          Price:
                        </Text>
                        <Text fontSize={13} fontWeight="900" color="#FF7A00">
                          {formatPrice(item.product.sellPrice)}
                        </Text>
                      </XStack>
                    </YStack>
                  </Card>
                </YStack>
              </TouchableOpacity>
            ))}
          </XStack>
        </YStack>

        {/* Load More Button */}
        {products.length > visibleProducts && (
          <YStack alignItems="center" paddingVertical="$5">
            <Button 
              onPress={() => setVisibleProducts(prev => prev + 6)}
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
                Load More ({products.length - visibleProducts} remaining)
              </Text>
            </Button>
          </YStack>
        )}
        
        {/* Empty State */}
        {products.length === 0 && (
          <YStack alignItems="center" padding="$10" space="$5" backgroundColor="#FFF2E0" borderRadius="$5" borderWidth={1} borderColor="#FFD4A3">
            <Text fontSize="$6" color="#A65A00" textAlign="center" fontWeight="700">
              {searchTerm 
                ? `No products found for "${searchTerm}"`
                : selectedCategory 
                  ? 'No products found in this category' 
                  : 'No products available at the moment'
              }
            </Text>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
};

export default TopSellingProductsComponent;