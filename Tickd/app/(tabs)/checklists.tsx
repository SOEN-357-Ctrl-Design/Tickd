import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import ProgressBar from '../../components/ProgressBar';
import BadgeNotification from '../../components/BadgeNotification';
import ChallengeNotification from '../../components/ChallengeNotification';
import {
  getBadgesUnlockedBetweenCounts,
  getEarnedBadgeIdsForCompletedCount,
  sameStringSet,
  type Badge,
} from '../../constants/badges';
import { useUserProgress } from '../../context/UserProgressContext';
import type { Challenge } from '../../constants/challenges';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const USER_PROGRESS_REF = 'userProgress';
const USER_PROGRESS_DOC = 'default';

function isListComplete(list: { tasks?: { done: boolean }[] }) {
  const tasks = list.tasks ?? [];
  if (tasks.length === 0) return false;
  return tasks.every((t) => t.done);
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function ChecklistsScreen() {
  const { trackAction, activeTheme } = useUserProgress();

  const [lists, setLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskInputs, setTaskInputs] = useState<{ [key: string]: string }>({});
  const [completedListIds, setCompletedListIds] = useState<string[]>([]);
  const [badgeToShow, setBadgeToShow] = useState<Badge | null>(null);
  const [challengeToShow, setChallengeToShow] = useState<Challenge | null>(null);
  const pendingChallengesRef = useRef<Challenge[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<Record<string, boolean>>({});
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Record<string, boolean>>({});
  const [undoDelete, setUndoDelete] = useState<{ id: string; title: string } | null>(null);
  const deleteTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const undoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedSearchQuery = searchQuery.trim();

  const enqueueChallenges = useCallback((completed: Challenge[]) => {
    if (completed.length === 0) return;
    pendingChallengesRef.current.push(...completed);
    setChallengeToShow((current) => current ?? pendingChallengesRef.current.shift() ?? null);
  }, []);

  const dismissChallengeNotification = useCallback(() => {
    const next = pendingChallengesRef.current.shift();
    setChallengeToShow(next ?? null);
  }, []);

  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  function clearPendingDeleteTimers() {
    Object.values(deleteTimersRef.current).forEach((timer) => clearTimeout(timer));
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
  }

  useEffect(() => {
    const q = query(collection(db, 'checklists'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      animate();
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLists(data);
      setLoadingLists(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLists = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const visible = lists.filter((l) => !l.deleted && !pendingDeleteIds[l.id]);
    if (!queryText) return visible;

    return visible.filter((list) => {
      const titleMatch = String(list.title ?? '').toLowerCase().includes(queryText);
      const taskMatch = (list.tasks ?? []).some((task: any) =>
        String(task?.text ?? '').toLowerCase().includes(queryText),
      );
      return titleMatch || taskMatch;
    });
  }, [lists, searchQuery, pendingDeleteIds]);

  const sortedLists = useMemo(() => {
    const visible = filteredLists;
    return [...visible].sort((a, b) => {
      const ac = isListComplete(a) ? 1 : 0;
      const bc = isListComplete(b) ? 1 : 0;
      return ac - bc;
    });
  }, [filteredLists]);

  useEffect(() => {
    const loadProgress = async () => {
      const ref = doc(db, USER_PROGRESS_REF, USER_PROGRESS_DOC);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const ids = data.completedListIds ?? [];
        const syncedEarned = getEarnedBadgeIdsForCompletedCount(ids.length);
        const storedEarned = data.earnedBadgeIds ?? [];
        setCompletedListIds(ids);
        if (!sameStringSet(storedEarned, syncedEarned)) {
          await setDoc(ref, { earnedBadgeIds: syncedEarned }, { merge: true });
        }
      }
    };
    loadProgress();
  }, []);

  useEffect(() => {
    return () => {
      clearPendingDeleteTimers();
    };
  }, []);

  const handleListComplete = async (listId: string, currentCompletedIds: string[]) => {
    if (currentCompletedIds.includes(listId)) return;

    const newCompletedIds = [...currentCompletedIds, listId];
    const prevCount = currentCompletedIds.length;
    const newCount = newCompletedIds.length;
    const updatedEarnedIds = getEarnedBadgeIdsForCompletedCount(newCount);
    const newBadges = getBadgesUnlockedBetweenCounts(prevCount, newCount);

    setCompletedListIds(newCompletedIds);

    await setDoc(
      doc(db, USER_PROGRESS_REF, USER_PROGRESS_DOC),
      { completedListIds: newCompletedIds, earnedBadgeIds: updatedEarnedIds },
      { merge: true },
    );

    if (newBadges.length > 0) setBadgeToShow(newBadges[0]);

    const result = await trackAction('list_completed');
    enqueueChallenges(result.completedChallenges);
  };

  const handleListIncomplete = async (listId: string, currentCompletedIds: string[]) => {
    if (!currentCompletedIds.includes(listId)) return;

    const newCompletedIds = currentCompletedIds.filter((id) => id !== listId);
    const updatedEarnedIds = getEarnedBadgeIdsForCompletedCount(newCompletedIds.length);
    setCompletedListIds(newCompletedIds);

    await setDoc(
      doc(db, USER_PROGRESS_REF, USER_PROGRESS_DOC),
      { completedListIds: newCompletedIds, earnedBadgeIds: updatedEarnedIds },
      { merge: true },
    );
  };

  const createList = async () => {
    if (!title) return;

    await addDoc(collection(db, 'checklists'), {
      title,
      tasks: [],
      createdAt: Date.now(),
    });

    setTitle('');
    setModalVisible(false);

    const result = await trackAction('list_created');
    enqueueChallenges(result.completedChallenges);
  };

  const addTask = async (listId: string) => {
    const text = taskInputs[listId];
    if (!text) return;

    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedTasks = [...list.tasks, { text, done: false }];
    await updateDoc(doc(db, 'checklists', listId), { tasks: updatedTasks });
    setTaskInputs((prev) => ({ ...prev, [listId]: '' }));
  };

  const toggleTask = async (listId: string, index: number) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedTasks = list.tasks.map((t: any, i: number) =>
      i === index ? { ...t, done: !t.done } : t,
    );
    await updateDoc(doc(db, 'checklists', listId), { tasks: updatedTasks });

    const wasComplete = list.tasks.every((t: any) => t.done);
    const isNowComplete = updatedTasks.every((t: any) => t.done);
    const wasChecked = list.tasks[index].done;

    if (!wasChecked) {
      const result = await trackAction('task_checked');
      enqueueChallenges(result.completedChallenges);
    }

    if (!wasComplete && isNowComplete && updatedTasks.length > 0) {
      handleListComplete(listId, completedListIds);
    }
    if (wasComplete && !isNowComplete && updatedTasks.length > 0) {
      handleListIncomplete(listId, completedListIds);
    }
  };

  const permanentlyDeleteList = async (id: string) => {
    if (completedListIds.includes(id)) {
      const next = completedListIds.filter((listId) => listId !== id);
      const updatedEarnedIds = getEarnedBadgeIdsForCompletedCount(next.length);
      setCompletedListIds(next);
      await setDoc(
        doc(db, USER_PROGRESS_REF, USER_PROGRESS_DOC),
        { completedListIds: next, earnedBadgeIds: updatedEarnedIds },
        { merge: true },
      );
    }
    await deleteDoc(doc(db, 'checklists', id));
  };

  const queueDeleteList = (id: string, listTitle: string) => {
    const existingTimer = deleteTimersRef.current[id];
    if (existingTimer) clearTimeout(existingTimer);

    setPendingDeleteIds((prev) => ({ ...prev, [id]: true }));
    setUndoDelete({ id, title: listTitle });

    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);

    deleteTimersRef.current[id] = setTimeout(() => {
      void permanentlyDeleteList(id);
      setPendingDeleteIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setUndoDelete((current) => (current?.id === id ? null : current));
      delete deleteTimersRef.current[id];
    }, 5000);

    undoToastTimerRef.current = setTimeout(() => {
      setUndoDelete((current) => (current?.id === id ? null : current));
    }, 5000);
  };

  const confirmDeleteList = (id: string, listTitle: string) => {
    Alert.alert(
      'Delete list?',
      `"${listTitle}" will be deleted. You can undo for a few seconds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => queueDeleteList(id, listTitle) },
      ],
    );
  };

  const handleUndoDelete = () => {
    if (!undoDelete) return;
    const timer = deleteTimersRef.current[undoDelete.id];
    if (timer) {
      clearTimeout(timer);
      delete deleteTimersRef.current[undoDelete.id];
    }
    setPendingDeleteIds((prev) => {
      const next = { ...prev };
      delete next[undoDelete.id];
      return next;
    });
    if (undoToastTimerRef.current) {
      clearTimeout(undoToastTimerRef.current);
      undoToastTimerRef.current = null;
    }
    setUndoDelete(null);
  };

  const toggleMinimized = (id: string) => {
    animate();
    setMinimizedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderHighlightedTaskText = (text: string) => {
    if (!normalizedSearchQuery) return text;

    const safeQuery = escapeRegExp(normalizedSearchQuery);
    const parts = String(text).split(new RegExp(`(${safeQuery})`, 'ig'));
    const target = normalizedSearchQuery.toLowerCase();

    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === target;
      return (
        <Text
          key={`${part}-${index}`}
          style={
            isMatch
              ? [
                  styles.taskHighlight,
                  {
                    backgroundColor: activeTheme.primaryLight,
                    color: activeTheme.primaryDark,
                  },
                ]
              : undefined
          }
        >
          {part}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search lists or tasks..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
      />

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: activeTheme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>+ New List</Text>
      </TouchableOpacity>

      {loadingLists ? (
        <ActivityIndicator style={styles.loadingIndicator} color={activeTheme.primary} />
      ) : null}

      <FlatList
        data={sortedLists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          !loadingLists && sortedLists.length === 0 ? styles.listContentEmpty : null,
        ]}
        removeClippedSubviews={false}
        ListEmptyComponent={
          !loadingLists ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {searchQuery.trim() ? 'No matching lists or tasks' : 'No checklists yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery.trim()
                  ? 'Try a different keyword.'
                  : 'Tap "+ New List" to create your first checklist.'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const minimized = !!minimizedIds[item.id];
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => toggleMinimized(item.id)}
                style={({ pressed }) => [
                  styles.cardHeader,
                  Platform.OS === 'ios' && pressed && styles.cardHeaderPressed,
                ]}
              >
                <View style={styles.cardHeaderTitleRow}>
                  <Text style={[styles.title, styles.titleInHeader]} numberOfLines={3}>
                    {item.title}
                  </Text>
                  <View style={styles.cardChevronHit}>
                    <Ionicons
                      name={minimized ? 'chevron-forward' : 'chevron-down'}
                      size={22}
                      color="#444"
                    />
                  </View>
                </View>
                <ProgressBar
                  completed={item.tasks?.filter((t: any) => t.done).length ?? 0}
                  total={item.tasks?.length ?? 0}
                />
              </Pressable>

              {!minimized && (
                <>
                  {item.tasks?.map((task: any, index: number) => (
                    <Pressable
                      key={index}
                      onPress={() => toggleTask(item.id, index)}
                      android_ripple={{ color: `${activeTheme.primary}33` }}
                      style={({ pressed }) => [
                        styles.taskRow,
                        task.done && { backgroundColor: activeTheme.primaryLight },
                        Platform.OS === 'ios' && pressed && styles.taskRowPressed,
                      ]}
                    >
                      <Text style={[styles.taskText, task.done && styles.taskTextDone]}>
                        {renderHighlightedTaskText(task.text)}
                      </Text>
                    </Pressable>
                  ))}

                  <View style={styles.addRow}>
                    <TextInput
                      placeholder="Add a task..."
                      value={taskInputs[item.id] || ''}
                      onChangeText={(text) =>
                        setTaskInputs((prev) => ({ ...prev, [item.id]: text }))
                      }
                      style={styles.taskInput}
                    />
                    <Pressable
                      onPress={() => addTask(item.id)}
                      style={({ pressed }) => [
                        styles.addButtonWrap,
                        { opacity: pressed ? 0.65 : 1 },
                      ]}
                      hitSlop={8}
                    >
                      <Text style={[styles.addButton, { color: activeTheme.primaryDark }]}>Add</Text>
                    </Pressable>
                  </View>

                  <TouchableOpacity onPress={() => confirmDeleteList(item.id, String(item.title ?? ''))}>
                    <Text style={styles.delete}>Delete List</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Create New Checklist</Text>
          <TextInput
            placeholder="List title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: activeTheme.primary }]}
            onPress={createList}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <BadgeNotification badge={badgeToShow} onDismiss={() => setBadgeToShow(null)} />

      <ChallengeNotification
        challenge={challengeToShow}
        onDismiss={dismissChallengeNotification}
        topInset={badgeToShow ? 96 : 12}
      />

      {undoDelete ? (
        <View style={styles.undoToast}>
          <Text style={styles.undoToastText} numberOfLines={1}>
            List deleted
          </Text>
          <Pressable onPress={handleUndoDelete} hitSlop={8}>
            <Text style={[styles.undoToastAction, { color: activeTheme.primary }]}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F7F7' },

  createButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },

  loadingIndicator: {
    marginVertical: 12,
  },

  listContent: {
    paddingBottom: 20,
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  card: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
  },

  cardHeader: {
    marginBottom: 4,
  },

  cardHeaderPressed: {
    opacity: 0.85,
  },

  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },

  titleInHeader: {
    flex: 1,
    marginBottom: 0,
  },

  cardChevronHit: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  taskRow: {
    paddingVertical: 8,
  },

  taskRowPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },

  taskText: {
    fontSize: 16,
  },

  taskTextDone: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },

  taskHighlight: {
    fontWeight: '700',
    borderRadius: 4,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
  },

  taskInput: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    flex: 1,
  },

  addButtonWrap: {
    marginLeft: 10,
    justifyContent: 'center',
  },

  addButton: {
    fontWeight: 'bold',
  },

  delete: {
    marginTop: 10,
    color: 'red',
  },

  modal: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 15,
  },

  modalTitle: {
    fontSize: 20,
    textAlign: 'center',
  },

  cancel: {
    textAlign: 'center',
  },

  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  undoToastText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },

  undoToastAction: {
    fontSize: 14,
    fontWeight: '700',
  },
});
