import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

const BELT_COLOR = '#3B82F6'; // blue belt

const TECHNIQUE_CHECKLIST = [
  { id: 'c1', name: 'Scissor Sweep', completed: true },
  { id: 'c2', name: 'Hip Bump Sweep', completed: true },
  { id: 'c3', name: 'Armbar from Guard', completed: true },
  { id: 'c4', name: 'Triangle Choke', completed: false },
  { id: 'c5', name: 'Omoplata', completed: false },
];

export default function ProfileScreen() {
  const { primaryColor } = useTheme();
  const router = useRouter();
  const { studentName, logout } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = studentName ?? 'Alex M.';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const completedCount = TECHNIQUE_CHECKLIST.filter((t) => t.completed).length;
  const totalCount = TECHNIQUE_CHECKLIST.length;
  const progressPercent = completedCount / totalCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top section: avatar + name + gym */}
        <View style={styles.topSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.studentName}>{displayName}</Text>
          <Text style={styles.gymName}>Renzo Gracie NYC</Text>
        </View>

        {/* Belt visualization */}
        <View style={[styles.beltBar, { backgroundColor: BELT_COLOR }]}>
          <Text style={styles.beltBarText}>Blue Belt</Text>
        </View>

        {/* Progress card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress to Purple Belt</Text>
          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: primaryColor,
                  width: `${Math.round(progressPercent * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedCount} of {totalCount * 2} required techniques
          </Text>

          {/* Checklist */}
          <View style={styles.checklist}>
            {TECHNIQUE_CHECKLIST.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                {item.completed ? (
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={18} color="#475569" />
                )}
                <Text
                  style={[
                    styles.checklistText,
                    !item.completed && styles.checklistTextMuted,
                  ]}
                >
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Classes Attended</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Techniques Logged</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>Mar{'\n'}2024</Text>
              <Text style={styles.statLabel}>Training Since</Text>
            </View>
          </View>
        </View>

        {/* Instructor note */}
        <Text style={styles.instructorNote}>
          Your instructor decides when to promote you
        </Text>

        {/* Settings section */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#94A3B8" />
            <Text style={styles.settingsRowText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </TouchableOpacity>
          <View style={styles.settingsDivider} />
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.settingsRowText, styles.settingsRowTextDanger]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitials: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  studentName: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  gymName: {
    color: '#94A3B8',
    fontSize: 14,
  },
  beltBar: {
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  beltBarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 14,
  },
  checklist: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  checklistTextMuted: {
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1E293B',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  instructorNote: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  settingsSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsRowText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  settingsRowTextDanger: {
    color: '#EF4444',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginLeft: 48,
  },
});
