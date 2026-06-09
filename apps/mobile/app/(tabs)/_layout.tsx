import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  color: string;
  focused: boolean;
}

export default function TabsLayout() {
  const { primaryColor } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopWidth: 1,
          borderTopColor: '#334155',
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'newspaper' : 'newspaper-outline') as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="flowchart"
        options={{
          title: 'Flowchart',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'git-network' : 'git-network-outline') as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'add-circle' : 'add-circle-outline') as IoniconName}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'calendar' : 'calendar-outline') as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'play-circle' : 'play-circle-outline') as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons
              name={(focused ? 'person' : 'person-outline') as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
