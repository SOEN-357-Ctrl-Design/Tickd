import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Modal, Button
} from 'react-native';

import {
  collection, addDoc, getDocs,
  updateDoc, deleteDoc, doc
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';

export default function ChecklistsScreen() {
  const [lists, setLists] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  // Fetch lists
  const fetchLists = async () => {
    const snapshot = await getDocs(collection(db, 'checklists'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLists(data);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Create new list
  const createList = async () => {
    if (!title) return;

    await addDoc(collection(db, 'checklists'), {
      title,
      category,
      tasks: [],
    });

    setTitle('');
    setCategory('');
    setModalVisible(false);
    fetchLists();
  };

  // Toggle task
  const toggleTask = async (listId: string, index: number) => {
    const list = lists.find(l => l.id === listId);

    const updatedTasks = [...list.tasks];
    updatedTasks[index].done = !updatedTasks[index].done;

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });

    fetchLists();
  };

  // Delete list
  const deleteList = async (id: string) => {
    await deleteDoc(doc(db, 'checklists', id));
    fetchLists();
  };

  // Add task (simple)
  const addTask = async (listId: string) => {
    const list = lists.find(l => l.id === listId);

    const updatedTasks = [
      ...list.tasks,
      { text: 'New Task', done: false }
    ];

    await updateDoc(doc(db, 'checklists', listId), {
      tasks: updatedTasks,
    });

    fetchLists();
  };

  return (
    <View style={styles.container}>

      <Button title="Create New List" onPress={() => setModalVisible(true)} />

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.title} ({item.category})
            </Text>

            {item.tasks?.map((task: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleTask(item.id, index)}
              >
                <Text style={{
                  textDecorationLine: task.done ? 'line-through' : 'none'
                }}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Add Task" onPress={() => addTask(item.id)} />
              <Button title="Delete" onPress={() => deleteList(item.id)} />
            </View>
          </View>
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>Create Checklist</Text>

          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <TextInput
            placeholder="Category (Homework, Fitness...)"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />

          <Button title="Create" onPress={createList} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  card: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  modal: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
});