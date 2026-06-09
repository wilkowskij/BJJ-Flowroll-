import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatBarProps {
  stats: StatItem[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.statItem}>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
    marginHorizontal: 8,
  },
});
