import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getSchedule,
  checkInToClass,
  type ClassSchedule,
} from '../../src/api/techniques';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getWeekDays(referenceDate: Date): Date[] {
  const days: Date[] = [];
  const day = referenceDate.getDay(); // 0 = Sunday
  // Start from Monday (day 1)
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day === 0 ? 7 : day) - 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeRange(startTime: string, endTime: string): string {
  // startTime / endTime are ISO strings or HH:MM:SS strings
  const formatTime = (t: string) => {
    // Handle full ISO or time-only "HH:MM:SS"
    const date = t.includes('T') ? new Date(t) : new Date(`1970-01-01T${t}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/** Returns true if the class starts within 15 minutes from now */
function isCheckInEligible(startTime: string): boolean {
  const now = Date.now();
  const start = startTime.includes('T')
    ? new Date(startTime).getTime()
    : new Date(`1970-01-01T${startTime}`).getTime();
  // Check-in window: up to 15 min before start and up to class start
  const diffMs = start - now;
  return diffMs <= 15 * 60 * 1000 && diffMs >= 0;
}

// ---------------------------------------------------------------------------
// Mock fallback (used when API is unreachable)
// ---------------------------------------------------------------------------
const MOCK_SCHEDULE: ClassSchedule[] = [
  {
    id: 'sched-1',
    gymId: 'gym-1',
    title: 'Fundamentals',
    instructorName: 'Prof. Santos',
    startTime: '18:00:00',
    endTime: '19:30:00',
    dayOfWeek: 1, // Monday
  },
  {
    id: 'sched-2',
    gymId: 'gym-1',
    title: 'No-Gi',
    instructorName: 'Coach Reyes',
    startTime: '20:00:00',
    endTime: '21:00:00',
    dayOfWeek: 1,
  },
  {
    id: 'sched-3',
    gymId: 'gym-1',
    title: 'Advanced',
    instructorName: 'Prof. Santos',
    startTime: '18:30:00',
    endTime: '20:00:00',
    dayOfWeek: 3, // Wednesday
  },
  {
    id: 'sched-4',
    gymId: 'gym-1',
    title: 'Open Mat',
    instructorName: 'Self-Directed',
    startTime: '10:00:00',
    endTime: '12:00:00',
    dayOfWeek: 6, // Saturday
  },
];

// ---------------------------------------------------------------------------
// ClassCard sub-component
// ---------------------------------------------------------------------------
interface ClassCardProps {
  schedule: ClassSchedule;
}

function ClassCard({ schedule }: ClassCardProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const eligible = isCheckInEligible(schedule.startTime);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkInToClass({ classId: schedule.id, method: 'manual' });
      setCheckedIn(true);
    } catch (err) {
      console.warn('Check-in failed', err);
      Alert.alert('Check-in failed', 'Could not check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <View style={styles.classCard}>
      <View style={styles.classCardInner}>
        <View style={styles.classInfo}>
          <Text style={styles.classTitle}>{schedule.title}</Text>
          <Text style={styles.classTime}>
            {formatTimeRange(schedule.startTime, schedule.endTime)}
          </Text>
          <View style={styles.instructorRow}>
            <Ionicons name="person-outline" size={13} color="#64748B" />
            <Text style={styles.instructorName}>{schedule.instructorName}</Text>
          </View>
        </View>
        {(eligible || checkedIn) && (
          <TouchableOpacity
            style={[
              styles.checkInButton,
              checkedIn && styles.checkInButtonDone,
            ]}
            onPress={!checkedIn ? handleCheckIn : undefined}
            activeOpacity={checkedIn ? 1 : 0.8}
            disabled={checkingIn || checkedIn}
          >
            {checkingIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : checkedIn ? (
              <>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.checkInButtonText}>Checked In</Text>
              </>
            ) : (
              <Text style={styles.checkInButtonText}>Check In</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function ScheduleScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDays = getWeekDays(today);

  const loadSchedule = useCallback(async () => {
    try {
      setError(null);
      const { data } = await getSchedule();
      setSchedule(data);
    } catch (err) {
      console.warn('Failed to load schedule, using mock data', err);
      setSchedule(MOCK_SCHEDULE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedule();
  }, [loadSchedule]);

  // Filter classes by selected day-of-week (0=Sun, 1=Mon…6=Sat)
  const selectedDayOfWeek = selectedDate.getDay();
  const todaysClasses = schedule.filter(
    (s) => s.dayOfWeek === selectedDayOfWeek,
  );

  const monthYear = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  const renderClass = ({ item }: { item: ClassSchedule }) => (
    <ClassCard schedule={item} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>{monthYear}</Text>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStripContent}
        >
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const dayName = DAY_NAMES[day.getDay()];
            const dayNum = day.getDate();
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                ]}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                    isToday && !isSelected && styles.dayNameToday,
                  ]}
                >
                  {dayName}
                </Text>
                <View
                  style={[
                    styles.dayNumWrapper,
                    isSelected && styles.dayNumWrapperSelected,
                    isToday && !isSelected && styles.dayNumWrapperToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      isToday && !isSelected && styles.dayNumToday,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1B4FD8" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#64748B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSchedule}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todaysClasses}
          keyExtractor={(item) => item.id}
          renderItem={renderClass}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#94A3B8"
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {isSameDay(selectedDate, today) ? "Today's Classes" : `${DAY_NAMES[selectedDayOfWeek]}'s Classes`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={52} color="#334155" />
              <Text style={styles.emptyTitle}>No classes today</Text>
              <Text style={styles.emptySubtitle}>
                Check another day or ask your instructor about upcoming classes.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  weekStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  weekStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  dayButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 44,
    gap: 4,
  },
  dayButtonSelected: {
    // no background; indicator is on dayNumWrapper
  },
  dayName: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNameSelected: {
    color: '#1B4FD8',
  },
  dayNameToday: {
    color: '#F59E0B',
  },
  dayNumWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumWrapperSelected: {
    backgroundColor: '#1B4FD8',
  },
  dayNumWrapperToday: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dayNum: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  dayNumToday: {
    color: '#F59E0B',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1B4FD8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  classCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  classCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  classInfo: {
    flex: 1,
    gap: 4,
  },
  classTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  classTime: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  instructorName: {
    color: '#64748B',
    fontSize: 13,
  },
  checkInButton: {
    backgroundColor: '#1B4FD8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
    justifyContent: 'center',
  },
  checkInButtonDone: {
    backgroundColor: '#10B981',
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
