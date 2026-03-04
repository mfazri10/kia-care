import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
import FloatingAIChat from '@/components/FloatingAIChat';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            height: 60 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Hari Ini',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'today' : 'today-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="kesehatan"
          options={{
            title: 'Kesehatan',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Jadwal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="education"
          options={{
            title: 'Edukasi',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="jurnal"
          options={{
            title: 'Jurnal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'journal' : 'journal-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                color={color}
                size={22}
              />
            ),
          }}
        />
      </Tabs>
      <FloatingAIChat tabBarHeight={60 + insets.bottom} />
    </View>
  );
}
