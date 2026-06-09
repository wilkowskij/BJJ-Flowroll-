import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PositionChip } from './PositionChip';
import type { Position } from '../api/techniques';

interface TechniqueRowProps {
  name: string;
  position: Position;
  detail?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function TechniqueRow({
  name,
  position,
  detail,
  onPress,
  showChevron = true,
}: TechniqueRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.row}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.meta}>
          <PositionChip position={position} />
          {detail ? (
            <Text style={styles.detail}>{detail}</Text>
          ) : null}
        </View>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color="#475569" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  left: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detail: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
