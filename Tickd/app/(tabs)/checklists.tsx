import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function ChecklistsScreen() {
  const [lists, setLists] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [taskInputs, setTaskInputs] = useState<{ [key: string]: string }>({});

  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // ✅ REAL-TIME LISTENER
  useEffect(() => {
    const q = query(collection(db, 'checklists'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      animate();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLists(data);
    });

    return () => unsubscribe();
  }, []);

  // CREATE LIST
  const createList = async () => {
    if (!title) return;

    await addDoc(collection(db, 'checklists'), {
      title,
      tasks: [],
      createdAt: Date.now(),
    });

    setTitle('');
    setModalVisible(false);
  };

  // ADD TASK
  const addTask = async (listId: string) => {
    const text = taskInputs[listId];
    if (!text) return;

    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedTasks = [...list.tasks, { text, done: false }];

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });

    setTaskInputs((prev) => ({ ...prev, [listId]: '' }));
  };

  // TOGGLE TASK
  const toggleTask = async (listId: string, index: number) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedTasks = [...list.tasks];
    updatedTasks[index].done = !updatedTasks[index].done;

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });
  };

  // DELETE LIST
  const deleteList = async (id: string) => {
    await deleteDoc(doc(db, 'checklists', id));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>+ New List</Text>
      </TouchableOpacity>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>

            {item.tasks?.map((task: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleTask(item.id, index)}
                style={[
                  styles.taskRow,
                  task.done && styles.taskDone,
                ]}
              >
                <Text
                  style={[
                    styles.taskText,
                    task.done && styles.taskTextDone,
                  ]}
                >
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.addRow}>
              <TextInput
                placeholder="Add a task..."
                value={taskInputs[item.id] || ''}
                onChangeText={(text) =>
                  setTaskInputs((prev) => ({
                    ...prev,
                    [item.id]: text,
                  }))
                }
                style={styles.taskInput}
              />

              <TouchableOpacity onPress={() => addTask(item.id)}>
                <Text style={styles.addButton}>Add</Text>
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

          <TouchableOpacity style={styles.createButton} onPress={createList}>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F7F7' },

  createButton: {
    backgroundColor: '#4CAF50',
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

  taskDone: {
    backgroundColor: '#E8F5E9',
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
    color: '#4CAF50',
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
});