import React from 'react';
import { Stack } from 'expo-router';

export default function AppRoutes() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
      {/* Add more routes here as needed */}
    </Stack>
  );
}
