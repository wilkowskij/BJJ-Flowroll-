import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Position } from '../api/techniques';

const POSITION_COLORS: Record<Position, string> = {
  Guard: '#3B82F6',
  'Half Guard': '#6366F1',
  Mount: '#EF4444',
  Back: '#8B5CF6',
  'Side Control': '#F97316',
  Turtle: '#84CC16',
  Standing: '#06B6D4',
  Takedown: '#14B8A6',
  Submission: '#EC4899',
};

interface PositionChipProps {
  position: Position;
}

export function PositionChip({ position }: PositionChipProps) {
  const color = POSITION_COLORS[position] ?? '#94A3B8';

  return (
    <View style={[styles.chip, { backgroundColor: color + '33', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{position}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
