import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Animated as RNAnimated,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { TechniqueRow } from '../../src/components/TechniqueRow';
import { BottomSheet } from '../../src/components/BottomSheet';
import { useTheme } from '../../src/context/ThemeContext';
import { getTechniques, type Technique, type Position } from '../../src/api/techniques';
import { Cache, CacheKeys } from '../../src/lib/cache';
import { useAuthStore } from '../../src/store/authStore';
import { useIsOnline } from '../../src/components/OfflineBanner';

interface LoggedTechnique {
  id: string;
  name: string;
  position: Position;
  loggedAt: string;
  drilled: boolean;
  rolled: boolean;
  notes?: string;
}

interface GymTechnique {
  id: string;
  name: string;
  position: Position;
}

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------
const INITIAL_LOG: LoggedTechnique[] = [
  { id: 'log-1', name: 'Scissor Sweep', position: 'Guard', loggedAt: 'Today, 7:42pm', drilled: true, rolled: false },
  { id: 'log-2', name: 'Armbar from Guard', position: 'Guard', loggedAt: 'Today, 7:30pm', drilled: true, rolled: true },
  { id: 'log-3', name: 'Triangle Choke', position: 'Guard', loggedAt: 'Jun 7, 8:15pm', drilled: true, rolled: false },
  { id: 'log-4', name: 'Rear Naked Choke', position: 'Back', loggedAt: 'Jun 5, 6:50pm', drilled: true, rolled: true },
  { id: 'log-5', name: 'Double Leg Takedown', position: 'Takedown', loggedAt: 'Jun 3, 7:00pm', drilled: true, rolled: false },
];

const MOCK_RECENT: GymTechnique[] = [
  { id: 'r-1', name: 'Scissor Sweep', position: 'Guard' },
  { id: 'r-2', name: 'Armbar from Guard', position: 'Guard' },
  { id: 'r-3', name: 'Hip Bump Sweep', position: 'Guard' },
];

const MOCK_LIBRARY: GymTechnique[] = [
  { id: 'g-1', name: 'Triangle Choke', position: 'Guard' },
  { id: 'g-2', name: 'Rear Naked Choke', position: 'Back' },
  { id: 'g-3', name: 'Double Leg Takedown', position: 'Takedown' },
  { id: 'g-4', name: 'X-Guard Entry', position: 'Guard' },
  { id: 'g-5', name: 'Omoplata', position: 'Guard' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type SheetView = 'search' | 'quick-log';

function getTodayDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeNow(): string {
  const now = new Date();
  return 'Today, ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function techniqueToGym(t: Technique): GymTechnique {
  return {
    id: t.id,
    name: t.title,
    position: (t.position as Position) ?? 'Guard',
  };
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function LogScreen() {
  const { primaryColor } = useTheme();
  const { gymId } = useAuthStore();
  const isOnline = useIsOnline();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<GymTechnique | null>(null);
  const [notes, setNotes] = useState('');
  const [drilled, setDrilled] = useState(true);
  const [rolled, setRolled] = useState(false);
  const [logEntries, setLogEntries] = useState<LoggedTechnique[]>(INITIAL_LOG);
  const [apiResults, setApiResults] = useState<GymTechnique[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new RNAnimated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cached techniques on mount, then background-refresh
  useEffect(() => {
    const cacheKey = gymId ? CacheKeys.techniques(gymId) : null;
    if (!cacheKey) return;

    (async () => {
      try {
        // Show stale cache if offline
        const cached = isOnline
          ? await Cache.get<GymTechnique[]>(cacheKey)
          : await Cache.getStale<GymTechnique[]>(cacheKey);
        if (cached && cached.length > 0) {
          // Pre-populate library with cached data (will be filtered on search)
          setApiResults([]);
        }
      } catch (error) {
        console.warn('[Log] Cache read failed:', error);
      }

      if (!isOnline) return;

      try {
        const { data } = await getTechniques({ gymId: gymId ?? undefined });
        await Cache.set(cacheKey, data.map(techniqueToGym));
      } catch (error) {
        console.warn('[Log] Background technique refresh failed:', error);
      }
    })();
  }, [gymId, isOnline]);

  // Debounced search: fire API call 300 ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setApiResults([]);
        return;
      }

      // Try cache first if offline
      if (!isOnline && gymId) {
        try {
          const cached = await Cache.getStale<GymTechnique[]>(CacheKeys.techniques(gymId));
          if (cached) {
            const filtered = cached.filter((t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            setApiResults(filtered);
          }
        } catch (error) {
          console.warn('[Log] Offline search from cache failed:', error);
        }
        return;
      }

      try {
        const { data } = await getTechniques({ query: searchQuery.trim() });
        setApiResults(data.map(techniqueToGym));
      } catch (error) {
        console.warn('[Log] Technique search failed, using local filter', error);
        setApiResults([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, gymId, isOnline]);

  const openSheet = () => {
    setSheetView('search');
    setSearchQuery('');
    setSelectedTechnique(null);
    setNotes('');
    setDrilled(true);
    setRolled(false);
    setApiResults([]);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
  };

  const selectTechnique = (technique: GymTechnique) => {
    setSelectedTechnique(technique);
    setSheetView('quick-log');
  };

  const showToast = () => {
    setToastVisible(true);
    RNAnimated.sequence([
      RNAnimated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      RNAnimated.delay(1800),
      RNAnimated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleLogIt = () => {
    if (!selectedTechnique) return;
    const newEntry: LoggedTechnique = {
      id: `log-${Date.now()}`,
      name: selectedTechnique.name,
      position: selectedTechnique.position,
      loggedAt: getTimeNow(),
      drilled,
      rolled,
      notes: notes.trim() || undefined,
    };
    setLogEntries((prev: LoggedTechnique[]) => [newEntry, ...prev]);
    closeSheet();
    showToast();
  };

  // When API has results, show them; otherwise fall back to local filter
  const hasApiResults = apiResults.length > 0;
  const filteredRecent = hasApiResults
    ? []
    : MOCK_RECENT.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  const libraryTechniques = hasApiResults
    ? apiResults
    : MOCK_LIBRARY.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

  const renderLogEntry = ({ item }: { item: LoggedTechnique }) => (
    <TechniqueRow
      name={item.name}
      position={item.position}
      detail={item.loggedAt}
      onPress={() => undefined}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Technique Log</Text>
        <Text style={styles.dateText}>{getTodayDate()}</Text>
      </View>

      {/* Recent log list */}
      <FlatList
        data={logEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderLogEntry}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>Recent Logs</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>No techniques logged yet.</Text>
          </View>
        }
      />

      {/* Log Technique button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.logButton, { backgroundColor: primaryColor }]}
          onPress={openSheet}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.logButtonText}>Log Technique</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        {sheetView === 'search' ? (
          <SearchView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            recentTechniques={filteredRecent}
            libraryTechniques={libraryTechniques}
            onSelectTechnique={selectTechnique}
          />
        ) : (
          <QuickLogView
            technique={selectedTechnique!}
            notes={notes}
            onNotesChange={setNotes}
            drilled={drilled}
            onDrilledChange={setDrilled}
            rolled={rolled}
            onRolledChange={setRolled}
            onBack={() => setSheetView('search')}
            onLogIt={handleLogIt}
            primaryColor={primaryColor}
          />
        )}
      </BottomSheet>

      {/* Toast */}
      {toastVisible && (
        <RNAnimated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.toastText}>Technique logged!</Text>
        </RNAnimated.View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  recentTechniques: GymTechnique[];
  libraryTechniques: GymTechnique[];
  onSelectTechnique: (t: GymTechnique) => void;
}

function SearchView({
  searchQuery,
  onSearchChange,
  recentTechniques,
  libraryTechniques,
  onSelectTechnique,
}: SearchViewProps) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.sheetContent}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#475569" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search techniques..."
          placeholderTextColor="#475569"
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
        {/* Recently logged — kept from local state (last 5 in mock) */}
        {recentTechniques.length > 0 && (
          <>
            <Text style={styles.sheetSectionLabel}>Recently Logged</Text>
            {recentTechniques.map((t) => (
              <TechniqueRow
                key={t.id}
                name={t.name}
                position={t.position}
                onPress={() => onSelectTechnique(t)}
                showChevron={false}
              />
            ))}
          </>
        )}

        {/* Gym library — from API or local fallback */}
        {libraryTechniques.length > 0 && (
          <>
            <Text style={styles.sheetSectionLabel}>Gym Library</Text>
            {libraryTechniques.map((t) => (
              <TechniqueRow
                key={t.id}
                name={t.name}
                position={t.position}
                onPress={() => onSelectTechnique(t)}
                showChevron={false}
              />
            ))}
          </>
        )}

        {recentTechniques.length === 0 && libraryTechniques.length === 0 && (
          <Text style={styles.noResults}>No techniques found.</Text>
        )}
      </ScrollView>
    </Animated.View>
  );
}

interface QuickLogViewProps {
  technique: GymTechnique;
  notes: string;
  onNotesChange: (text: string) => void;
  drilled: boolean;
  onDrilledChange: (val: boolean) => void;
  rolled: boolean;
  onRolledChange: (val: boolean) => void;
  onBack: () => void;
  onLogIt: () => void;
  primaryColor: string;
}

function QuickLogView({
  technique,
  notes,
  onNotesChange,
  drilled,
  onDrilledChange,
  rolled,
  onRolledChange,
  onBack,
  onLogIt,
  primaryColor,
}: QuickLogViewProps) {
  return (
    <Animated.View
      entering={SlideInRight.duration(200)}
      exiting={SlideOutLeft.duration(150)}
      style={styles.sheetContent}
    >
      {/* Back link */}
      <TouchableOpacity onPress={onBack} style={styles.backLink} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={18} color="#94A3B8" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Technique name */}
      <Text style={[styles.selectedTechniqueName, { color: primaryColor }]}>
        {technique.name}
      </Text>

      {/* Notes input */}
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Add notes..."
        placeholderTextColor="#475569"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Toggles */}
      <View style={styles.togglesRow}>
        <ToggleItem label="Drilled today" value={drilled} onChange={onDrilledChange} primaryColor={primaryColor} />
        <ToggleItem label="Rolled today" value={rolled} onChange={onRolledChange} primaryColor={primaryColor} />
      </View>

      {/* Log It button */}
      <TouchableOpacity
        style={[styles.logItButton, { backgroundColor: primaryColor }]}
        onPress={onLogIt}
        activeOpacity={0.85}
      >
        <Text style={styles.logItButtonText}>Log It</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ToggleItemProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
  primaryColor: string;
}

function ToggleItem({ label, value, onChange, primaryColor }: ToggleItemProps) {
  return (
    <View style={styles.toggleItem}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#334155', true: primaryColor + '80' }}
        thumbColor={value ? primaryColor : '#94A3B8'}
        ios_backgroundColor="#334155"
      />
    </View>
  );
}

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
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyList: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#475569',
    fontSize: 14,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetSectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  noResults: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTechniqueName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    minHeight: 80,
    marginBottom: 16,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toggleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  logItButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  logItButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
});
