import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
                <Stack.Screen
                name="Waitlists"
                options={{
                    headerShown: false,
                }}
            />
       
        </Stack>
    );
};

export default ProfileLayout;


