import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface WeeklyPostCardProps {
  type: 'weekly_post';
  instructorName: string;
  date: string;
  title: string;
  onViewTechnique?: () => void;
}

interface AnnouncementCardProps {
  type: 'announcement';
  text: string;
  date: string;
}

type FeedCardProps = WeeklyPostCardProps | AnnouncementCardProps;

export function FeedCard(props: FeedCardProps) {
  const { primaryColor, secondaryColor } = useTheme();

  if (props.type === 'announcement') {
    return (
      <View style={[styles.announcementCard, { borderLeftColor: secondaryColor }]}>
        <Text style={styles.announcementText}>
          {'📢 '}
          {props.text}
        </Text>
        <Text style={styles.announcementDate}>{props.date}</Text>
      </View>
    );
  }

  return (
    <View style={styles.weeklyCard}>
      {/* Instructor row */}
      <View style={styles.instructorRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {props.instructorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.instructorName}>{props.instructorName}</Text>
        <View style={styles.dateChip}>
          <Text style={styles.dateChipText}>{props.date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.postTitle}>{props.title}</Text>

      {/* Thumbnail placeholder */}
      <View style={styles.thumbnail}>
        <Ionicons name="play-circle-outline" size={40} color="#94A3B8" />
      </View>

      {/* CTA */}
      <TouchableOpacity onPress={props.onViewTechnique} activeOpacity={0.7}>
        <Text style={[styles.viewLink, { color: primaryColor }]}>
          View Technique →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  weeklyCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  instructorName: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  dateChip: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dateChipText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  postTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  announcementText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
  },
  announcementDate: {
    color: '#475569',
    fontSize: 12,
    marginTop: 6,
  },
});
