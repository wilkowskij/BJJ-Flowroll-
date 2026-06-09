import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheet } from '../../src/components/BottomSheet';
import { useTheme } from '../../src/context/ThemeContext';
import { getTechniques, type Technique } from '../../src/api/techniques';
import { useAuthStore } from '../../src/store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GamePosition = 'Guard' | 'Half Guard' | 'Mount' | 'Back' | 'Side Control' | 'Standing';

interface GamePlanEntry {
  id: string;
  techniqueId: string | null;
  customTitle: string;
  notes: string;
}

type GamePlan = {
  [position in GamePosition]?: GamePlanEntry[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const POSITIONS: GamePosition[] = [
  'Guard',
  'Half Guard',
  'Mount',
  'Back',
  'Side Control',
  'Standing',
];

const BELT_COLORS: Record<string, string> = {
  white: '#F8FAFC',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#1F2937',
};

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStorageKey(userId: string | null) {
  return `gameplan:${userId ?? 'guest'}`;
}

async function loadGamePlan(userId: string | null): Promise<GamePlan> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw) as GamePlan;
  } catch {
    // ignore
  }
  return {};
}

async function persistGamePlan(userId: string | null, plan: GamePlan) {
  try {
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(plan));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function GamePlanScreen() {
  const { primaryColor } = useTheme();
  const userId = useAuthStore((s) => s.userId);

  const [plan, setPlan] = useState<GamePlan>({});
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [activePosition, setActivePosition] = useState<GamePosition>('Guard');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: string; text: string } | null>(null);

  // Bottom sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [gymTechniques, setGymTechniques] = useState<Technique[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──
  useEffect(() => {
    loadGamePlan(userId).then((saved) => {
      setPlan(saved);
      setLoadingPlan(false);
    });
  }, [userId]);

  // ── Auto-save wrapper ──
  const updatePlan = useCallback(
    (next: GamePlan) => {
      setPlan(next);
      persistGamePlan(userId, next);
    },
    [userId],
  );

  // ── Debounced technique search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await getTechniques({ query: search.trim() || undefined });
        setGymTechniques(data);
      } catch {
        setGymTechniques([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const entries = plan[activePosition] ?? [];

  const deleteEntry = useCallback(
    (id: string) => {
      const next = { ...plan, [activePosition]: entries.filter((e) => e.id !== id) };
      updatePlan(next);
      if (expandedId === id) setExpandedId(null);
    },
    [plan, activePosition, entries, expandedId, updatePlan],
  );

  const saveNotes = useCallback(
    (id: string, text: string) => {
      const next = {
        ...plan,
        [activePosition]: entries.map((e) => (e.id === id ? { ...e, notes: text } : e)),
      };
      updatePlan(next);
      setEditingNotes(null);
    },
    [plan, activePosition, entries, updatePlan],
  );

  const addTechniqueEntry = useCallback(
    (technique: Technique) => {
      const entry: GamePlanEntry = {
        id: `gp-${Date.now()}`,
        techniqueId: technique.id,
        customTitle: technique.title,
        notes: '',
      };
      updatePlan({ ...plan, [activePosition]: [...entries, entry] });
      setSheetVisible(false);
      setSearch('');
    },
    [plan, activePosition, entries, updatePlan],
  );

  const addCustomEntry = useCallback(() => {
    const title = customTitle.trim();
    if (!title) return;
    const entry: GamePlanEntry = {
      id: `gp-${Date.now()}`,
      techniqueId: null,
      customTitle: title,
      notes: '',
    };
    updatePlan({ ...plan, [activePosition]: [...entries, entry] });
    setCustomTitle('');
    setAddingCustom(false);
    setSheetVisible(false);
  }, [plan, activePosition, entries, customTitle, updatePlan]);

  const onDragEnd = useCallback(
    ({ data }: { data: GamePlanEntry[] }) => {
      updatePlan({ ...plan, [activePosition]: data });
    },
    [plan, activePosition, updatePlan],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Row renderer
  // ─────────────────────────────────────────────────────────────────────────

  const renderEntry = useCallback(
    ({ item, drag, isActive }: RenderItemParams<GamePlanEntry>) => {
      const isExpanded = expandedId === item.id;
      const isEditingNote = editingNotes?.id === item.id;

      return (
        <ScaleDecorator>
          <View
            style={{
              backgroundColor: isActive ? '#334155' : '#1E293B',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isActive ? primaryColor : '#334155',
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            {/* Main row */}
            <TouchableOpacity
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              {/* Drag handle */}
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="menu" size={20} color="#475569" />
              </TouchableOpacity>

              {/* Title */}
              <Text
                style={{ flex: 1, color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}
                numberOfLines={1}
              >
                {item.customTitle}
              </Text>

              {/* Belt dot */}
              <View
                style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#475569' }}
              />

              {/* Delete */}
              <TouchableOpacity
                onPress={() => deleteEntry(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Expanded notes section */}
            {isExpanded && (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingBottom: 14,
                  borderTopWidth: 1,
                  borderTopColor: '#334155',
                }}
              >
                {isEditingNote ? (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      value={editingNotes.text}
                      onChangeText={(text) => setEditingNotes({ id: item.id, text })}
                      placeholder="Add notes about this technique..."
                      placeholderTextColor="#475569"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      style={{
                        backgroundColor: '#0F172A',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#334155',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#F8FAFC',
                        fontSize: 14,
                        minHeight: 72,
                        marginTop: 10,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => saveNotes(item.id, editingNotes.text)}
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: 8,
                        paddingVertical: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setEditingNotes({ id: item.id, text: item.notes })}
                    style={{ marginTop: 10 }}
                  >
                    {item.notes ? (
                      <Text style={{ color: '#94A3B8', fontSize: 14 }}>{item.notes}</Text>
                    ) : (
                      <Text style={{ color: '#475569', fontSize: 14, fontStyle: 'italic' }}>
                        Tap to add notes...
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScaleDecorator>
      );
    },
    [expandedId, editingNotes, deleteEntry, saveNotes, primaryColor],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (loadingPlan) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={primaryColor} />
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#1E293B',
          }}
        >
          <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800' }}>Game Plan</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
            Build your go-to sequences by position
          </Text>
        </View>

        {/* Position tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
            flexDirection: 'row',
          }}
        >
          {POSITIONS.map((pos) => (
            <TouchableOpacity
              key={pos}
              onPress={() => {
                setActivePosition(pos);
                setExpandedId(null);
                setEditingNotes(null);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activePosition === pos ? primaryColor : '#1E293B',
                borderWidth: 1,
                borderColor: activePosition === pos ? primaryColor : '#334155',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: activePosition === pos ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {pos}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sequence list */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {entries.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Ionicons name="trophy-outline" size={48} color="#334155" />
              <Text
                style={{
                  color: '#475569',
                  fontSize: 15,
                  textAlign: 'center',
                  paddingHorizontal: 32,
                }}
              >
                Tap + to build your {activePosition.toLowerCase()} game plan
              </Text>
            </View>
          ) : (
            <DraggableFlatList
              data={entries}
              keyExtractor={(item) => item.id}
              renderItem={renderEntry}
              onDragEnd={onDragEnd}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Add button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 24,
            backgroundColor: '#0F172A',
            borderTopWidth: 1,
            borderTopColor: '#1E293B',
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              setAddingCustom(false);
              setCustomTitle('');
              setSheetVisible(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: primaryColor,
              borderRadius: 16,
              paddingVertical: 16,
              gap: 8,
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              Add Technique
            </Text>
          </TouchableOpacity>
        </View>

        {/* BottomSheet */}
        <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {addingCustom ? (
              /* Custom technique form */
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setAddingCustom(false)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    alignSelf: 'flex-start',
                    marginBottom: 4,
                  }}
                >
                  <Ionicons name="chevron-back" size={18} color="#94A3B8" />
                  <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>Back</Text>
                </TouchableOpacity>
                <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700' }}>
                  Add Custom Technique
                </Text>
                <TextInput
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="e.g. Modified X-Guard entry"
                  placeholderTextColor="#475569"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={addCustomEntry}
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#334155',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: '#F8FAFC',
                    fontSize: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={addCustomEntry}
                  disabled={!customTitle.trim()}
                  style={{
                    backgroundColor: primaryColor,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: customTitle.trim() ? 1 : 0.4,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Search view */
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#F8FAFC',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 12,
                  }}
                >
                  Add to {activePosition}
                </Text>

                {/* Search bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    gap: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#334155',
                  }}
                >
                  <Ionicons name="search" size={18} color="#475569" />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search gym techniques..."
                    placeholderTextColor="#475569"
                    style={{ flex: 1, color: '#F8FAFC', fontSize: 15 }}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearch('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#475569" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Results */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {gymTechniques.length === 0 && search.trim() !== '' && (
                    <Text
                      style={{
                        color: '#475569',
                        fontSize: 14,
                        textAlign: 'center',
                        marginTop: 20,
                      }}
                    >
                      No techniques found.
                    </Text>
                  )}
                  {gymTechniques.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => addTechniqueEntry(t)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#334155',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        marginBottom: 8,
                        gap: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600' }}
                          numberOfLines={1}
                        >
                          {t.title}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                          {t.position}
                        </Text>
                      </View>
                      {t.beltLevel ? (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: BELT_COLORS[t.beltLevel] ?? '#475569',
                          }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  ))}

                  {/* Add custom option */}
                  <TouchableOpacity
                    onPress={() => setAddingCustom(true)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 8,
                      gap: 10,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: '#334155',
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#94A3B8" />
                    <Text style={{ color: '#94A3B8', fontSize: 15, fontWeight: '600' }}>
                      Add custom technique
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
