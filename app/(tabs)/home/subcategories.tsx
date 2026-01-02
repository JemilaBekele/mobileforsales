import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  Text,
  Button,
  Spinner,
  YStack,
  XStack,
  Card,
  Separator,
  H4,
} from 'tamagui';
import { getSubCategoriesByCategory, SubCategoryList } from '@/(services)/api/subcatagorypro';

export default function SubcategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const categoryId = params.categoryId as string;
  const categoryName = params.categoryName as string;

  // Local state
  const [subCategories, setSubCategories] = useState<SubCategoryList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleSubCategories, setVisibleSubCategories] = useState(8);

  // Reset visible products when category changes
  useEffect(() => {
    setVisibleSubCategories(8);
  }, [categoryId]);

   const fetchSubCategories = useCallback(async () => {
    if (!categoryId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getSubCategoriesByCategory(categoryId);
      setSubCategories(response.subCategories || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch subcategories");
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId]); // categoryId is the only dependency

  useEffect(() => {
    if (categoryId) {
      fetchSubCategories();
    }

    return () => {
      // Cleanup if needed
    };
  }, [categoryId, fetchSubCategories]); 

  const handleSubCategoryPress = (subCategoryId: string, subCategoryName: string) => {
    // Navigate directly to products page for this subcategory
    router.push({
      pathname: '/home/subcategory-products' as any,
      params: {
        subCategoryId,
        subCategoryName,
        categoryId,
        categoryName
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleLoadMore = () => {
    setVisibleSubCategories(prev => prev + 8);
  };

  const handleRetry = () => {
    if (categoryId) {
      fetchSubCategories();
    }
  };

  // Custom Badge component
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
      {children}
    </YStack>
  );

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$orange1">
        <Spinner size="large" color="$orange9" />
        <Text marginTop="$4" color="$orange11" fontSize="$5" fontWeight="600">
          Loading Subcategories...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" backgroundColor="$orange1">
        <Text color="$red10" textAlign="center" fontSize="$5" fontWeight="600">
          Error: {error}
        </Text>
        <Button 
          marginTop="$4"
          onPress={handleRetry}
          backgroundColor="$orange9"
          borderColor="$orange10"
          borderWidth={1}
          borderRadius="$4"
          pressStyle={{ backgroundColor: "$orange10" }}
        >
          <Text color="white" fontWeight="600">Try Again</Text>
        </Button>
        <Button 
          marginTop="$2"
          onPress={handleBack}
          backgroundColor="$orange2"
          borderColor="$orange5"
          borderWidth={1}
          borderRadius="$4"
        >
          <Text color="$orange11" fontWeight="600">Go Back</Text>
        </Button>
      </YStack>
    );
  }

  const displayedSubCategories = subCategories.slice(0, visibleSubCategories);

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false} backgroundColor="$orange1">
      <YStack space="$6" padding="$5">
        {/* Welcome Header Section */}
        <YStack space="$4" backgroundColor="$orange2" padding="$5" borderRadius="$5" borderWidth={1} borderColor="$orange4">
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
            <Text color="$orange11" fontWeight="600">← Back to Categories</Text>
          </Button>
          <YStack>
            <H4 fontWeight="bold" color="$orange12" fontSize="$7">
              {categoryName || 'Category'}
            </H4>
            <Text fontSize="$4" color="$orange10" marginTop="$2" fontWeight="500">
              Browse subcategories and products
            </Text>
          </YStack>
        </YStack>

        {/* Subcategories Header Section */}
        <YStack space="$4" backgroundColor="$orange2" padding="$4" borderRadius="$4" borderWidth={1} borderColor="$orange4">
          <XStack justifyContent="space-between" alignItems="flex-end">
            <YStack flex={1}>
              <H4 fontWeight="bold" color="$orange12" fontSize="$7">
                Subcategories 
              </H4>
              <Text fontSize="$4" color="$orange10" marginTop="$2" fontWeight="500">
                {subCategories.length} subcategories available
              </Text>
            </YStack>
            
            <YStack alignItems="flex-end">
              <Badge backgroundColor="$orange3" borderWidth={1} borderColor="$orange6">
                <Text fontSize="$3" color="$orange11" fontWeight="800">
                  {displayedSubCategories.length} showing
                </Text>
              </Badge>
              {subCategories.length > 0 && (
                <Text fontSize="$3" color="$green10" marginTop="$2" fontWeight="700" backgroundColor="$green2" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                  {subCategories.length} total
                </Text>
              )}
            </YStack>
          </XStack>
        </YStack>

        {/* Subcategories Grid - TWO COLUMN LAYOUT */}
        {subCategories.length > 0 ? (
          <YStack space="$4">
            <XStack flexWrap="wrap" justifyContent="space-between" gap="$3">
              {displayedSubCategories.map((subCategory) => (
                <YStack 
                  key={subCategory.id}
                  width="48%"
                  marginBottom="$4"
                >
                  <Card 
                    elevate 
                    size="$5" 
                    bordered 
                    flex={1}
                    borderRadius="$5"
                    overflow="hidden"
                    backgroundColor="$orange1"
                    borderColor="$orange4"
                    shadowColor="$orange7"
                    shadowRadius={10}
                    shadowOffset={{ width: 0, height: 5 }}
                  >
                    <Card.Header padded>
                      <YStack space="$3" padding="$2">
                        {/* Subcategory Basic Info */}
                        <YStack alignItems="center" space="$2">
                          <YStack alignItems="center" width="100%">
                            <Text 
                              fontSize="$3" 
                              fontWeight="800" 
                              numberOfLines={2} 
                              textAlign="center"
                              lineHeight={18}
                              color="$orange12"
                            >
                              {subCategory.name}
                            </Text>
                            <Text fontSize="$1" color="$orange10" textAlign="center" marginTop="$1" fontWeight="500">
                              Subcategory
                            </Text>
                          </YStack>
                        </YStack>

                        <Separator borderColor="$orange4" />

                        {/* View Products Button */}
                        <Button 
                          size="$2" 
                          backgroundColor="$orange9"
                          borderColor="$orange10"
                          borderWidth={1}
                          borderRadius="$3"
                          pressStyle={{ backgroundColor: "$orange10" }}
                          shadowColor="$orange7"
                          shadowRadius={3}
                          shadowOffset={{ width: 0, height: 2 }}
                          marginTop="$1"
                          onPress={() => handleSubCategoryPress(subCategory.id, subCategory.name)}
                        >
                          <Text fontSize="$2" color="white" fontWeight="800">
                            View Products
                          </Text>
                        </Button>
                      </YStack>
                    </Card.Header>
                  </Card>
                </YStack>
              ))}
            </XStack>
            
            {/* Load More Button */}
            {subCategories.length > visibleSubCategories && (
              <YStack alignItems="center" paddingVertical="$5">
                <Button 
                  onPress={handleLoadMore}
                  backgroundColor="$orange9"
                  borderColor="$orange10"
                  borderWidth={1}
                  borderRadius="$4"
                  pressStyle={{ backgroundColor: "$orange10" }}
                  paddingHorizontal="$6"
                  paddingVertical="$4"
                  shadowColor="$orange7"
                  shadowRadius={8}
                  shadowOffset={{ width: 0, height: 4 }}
                >
                  <Text color="white" fontWeight="800" fontSize="$4">
                    Load More ({subCategories.length - visibleSubCategories} remaining)
                  </Text>
                </Button>
              </YStack>
            )}
          </YStack>
        ) : (
          <YStack alignItems="center" padding="$10" space="$5" backgroundColor="$orange2" borderRadius="$5" borderWidth={1} borderColor="$orange4">
            <Text fontSize="$6" color="$orange10" textAlign="center" fontWeight="700">
              No subcategories found
            </Text>
            <Text fontSize="$4" color="$orange9" textAlign="center" fontWeight="500">
              {categoryName ? `There are no subcategories available for ${categoryName} at the moment.` : 'No subcategories available.'}
            </Text>
            <Button 
              onPress={handleBack}
              backgroundColor="$orange9"
              borderColor="$orange10"
              borderWidth={1}
              borderRadius="$4"
              marginTop="$2"
              paddingHorizontal="$6"
              paddingVertical="$4"
            >
              <Text color="white" fontWeight="600" fontSize="$4">Go Back to Categories</Text>
            </Button>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}