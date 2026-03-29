import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import {
  getBadgesUnlockedBetweenCounts,
  getEarnedBadgeIdsForCompletedCount,
  sameStringSet,
  type Badge,
} from '../../constants/badges';
import { useUserProgress } from '../../context/UserProgressContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const USER_PROGRESS_REF = 'userProgress';
const USER_PROGRESS_DOC = 'default';

type PointsToast = { id: number; message: string };

export default function ChecklistsScreen() {
  const { trackAction, activeTheme } = useUserProgress();

  const [lists, setLists] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [taskInputs, setTaskInputs] = useState<{ [key: string]: string }>({});
  const [completedListIds, setCompletedListIds] = useState<string[]>([]);
  const [badgeToShow, setBadgeToShow] = useState<Badge | null>(null);
  const [toasts, setToasts] = useState<PointsToast[]>([]);
  const toastCounter = useRef(0);

  const showToast = (message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  useEffect(() => {
    const q = query(collection(db, 'checklists'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      animate();
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLists(data);
    });
    return () => unsubscribe();
  }, []);

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
    if (result.pointsEarned > 0) {
      showToast(`+${result.pointsEarned} pts — Challenge complete!`);
    }
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
    if (result.pointsEarned > 0) {
      showToast(`+${result.pointsEarned} pts — Challenge complete!`);
    }
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
      if (result.pointsEarned > 0) {
        showToast(`+${result.pointsEarned} pts — Challenge complete!`);
      }
    }

    if (!wasComplete && isNowComplete && updatedTasks.length > 0) {
      handleListComplete(listId, completedListIds);
    }
    if (wasComplete && !isNowComplete && updatedTasks.length > 0) {
      handleListIncomplete(listId, completedListIds);
    }
  };

  const deleteList = async (id: string) => {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: activeTheme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>+ New List</Text>
      </TouchableOpacity>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        removeClippedSubviews={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>

            <ProgressBar
              completed={item.tasks?.filter((t: any) => t.done).length ?? 0}
              total={item.tasks?.length ?? 0}
            />

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
                  {task.text}
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
              <TouchableOpacity onPress={() => addTask(item.id)}>
                <Text style={[styles.addButton, { color: activeTheme.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => deleteList(item.id)}>
              <Text style={styles.delete}>Delete List</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Points toasts */}
      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map((toast) => (
          <PointsToastItem key={toast.id} message={toast.message} theme={activeTheme} />
        ))}
      </View>
    </View>
  );
}

function PointsToastItem({
  message,
  theme,
}: {
  message: string;
  theme: { primary: string; primaryLight: string };
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: theme.primary, opacity }]}
    >
      <Ionicons name="star" size={14} color="white" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
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

  card: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
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

  addButton: {
    marginLeft: 10,
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

  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 8,
    alignItems: 'center',
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  toastText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
});
