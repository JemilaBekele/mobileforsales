import React from "react";
import { Stack } from "expo-router";

const HomeLayout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
                 <Stack.Screen
                name="subcategories"
                options={{
                    headerShown: false,
                }}
            />
                 <Stack.Screen
                name="subcategory-products"
                options={{
                    headerShown: false,
                }}
            />
               <Stack.Screen
                name="ProductDetails"
                options={{
                    headerShown: false,
                }}
            />
    
    
          
    
    

        </Stack>
    );
};

export default HomeLayout;


