import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@torah-app/store';

function TabIcon({ label }) {
  return <Text style={{ fontSize: 20 }}>{label}</Text>;
}

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0a1f14',
          borderTopColor: '#1a3a2a',
        },
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: '#4a7c59',
        headerStyle: { backgroundColor: '#0a1f14' },
        headerTintColor: '#e8f5e9',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          tabBarLabel: 'בית',
          tabBarIcon: () => <TabIcon label="🏠" />,
          headerTitle: 'Torah App',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'חיפוש',
          tabBarLabel: 'חיפוש',
          tabBarIcon: () => <TabIcon label="🔍" />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'ספריה',
          tabBarLabel: 'ספריה',
          tabBarIcon: () => <TabIcon label={user ? '🔖' : '👤'} />,
        }}
      />
    </Tabs>
  );
}
