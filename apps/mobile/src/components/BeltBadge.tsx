import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BeltLevel } from '../api/techniques';

const BELT_COLORS: Record<BeltLevel, string> = {
  white: '#F8FAFC',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#1F2937',
};

const BELT_TEXT_COLORS: Record<BeltLevel, string> = {
  white: '#0F172A',
  blue: '#FFFFFF',
  purple: '#FFFFFF',
  brown: '#FFFFFF',
  black: '#FFFFFF',
};

interface BeltBadgeProps {
  belt: BeltLevel;
  size?: 'sm' | 'md';
}

export function BeltBadge({ belt, size = 'md' }: BeltBadgeProps) {
  const label = belt.charAt(0).toUpperCase() + belt.slice(1) + ' Belt';
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: BELT_COLORS[belt] },
        isSmall ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: BELT_TEXT_COLORS[belt] },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
});
