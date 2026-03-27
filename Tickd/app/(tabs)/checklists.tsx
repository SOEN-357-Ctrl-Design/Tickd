import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';

export default function ChecklistsScreen() {
  const [lists, setLists] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');

  const [taskInputs, setTaskInputs] = useState<{ [key: string]: string }>({});

  const fetchLists = async () => {
    const snapshot = await getDocs(collection(db, 'checklists'));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLists(data);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const createList = async () => {
    if (!title) return;

    await addDoc(collection(db, 'checklists'), {
      title,
      tasks: [],
    });

    setTitle('');
    setModalVisible(false);
    fetchLists();
  };

  const addTask = async (listId: string) => {
    const text = taskInputs[listId];
    if (!text) return;

    const list = lists.find((l) => l.id === listId);

    const updatedTasks = [
      ...list.tasks,
      { text, done: false },
    ];

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });

    setTaskInputs((prev) => ({ ...prev, [listId]: '' }));
    fetchLists();
  };

  const toggleTask = async (listId: string, index: number) => {
    const list = lists.find((l) => l.id === listId);

    const updatedTasks = [...list.tasks];
    updatedTasks[index].done = !updatedTasks[index].done;

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });

    fetchLists();
  };

  const deleteList = async (id: string) => {
    await deleteDoc(doc(db, 'checklists', id));
    fetchLists();
  };

  return (
    <View style={styles.container}>
      {/* Create List Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>+ New List</Text>
      </TouchableOpacity>

      {/* Lists */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>

            {/* Tasks */}
            {item.tasks?.map((task: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleTask(item.id, index)}
                style={styles.taskRow}
              >
                <Text
                  style={{
                    fontSize: 16,
                    textDecorationLine: task.done ? 'line-through' : 'none',
                  }}
                >
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add Task Row */}
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

            {/* Delete */}
            <TouchableOpacity onPress={() => deleteList(item.id)}>
              <Text style={styles.delete}>Delete List</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal */}
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
  container: {
    flex: 1,
    padding: 20,
  },

  createButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },

  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  taskRow: {
    paddingVertical: 6,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  // FIXED: no flex here
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
  },

  // separate style for row input
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
    marginTop: 10,
    textAlign: 'center',
  },
});