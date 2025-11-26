import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { authStore } from '../../../store/authStore';
import { apiClient, OFFLINE_MODE } from '../../../hooks/useApi';
import { offlineApi } from '../../../hooks/useOfflineApi';

interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function ManageSubjects() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacherId, teacherName } = authStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadSubjects();
    }, [])
  );

  const loadSubjects = async () => {
    try {
      setLoading(true);
      let subjectsList = [];

      if (OFFLINE_MODE) {
        console.log('📱 Loading subjects from OFFLINE MODE');
        if (teacherId) {
          subjectsList = await offlineApi.getSubjects(teacherId);
        }
      } else {
        console.log('🔌 Loading subjects from ONLINE API');
        const response = await apiClient.get('/subjects');
        subjectsList = response.data.subjects || [];
      }

      setSubjects(subjectsList);
    } catch (err) {
      console.error('Error loading subjects:', err);
      Alert.alert('Error', 'Failed to load subjects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubjects();
  };

  const handleDeleteSubject = (id: string, name: string) => {
    Alert.alert(
      'Delete Subject?',
      `Are you sure you want to delete "${name}" and all its sections?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              if (OFFLINE_MODE) {
                await offlineApi.deleteSubject(id);
              } else {
                await apiClient.delete(`/subjects/${id}`);
              }
              loadSubjects();
              Alert.alert('Success', 'Subject deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete subject');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSelectSubject = (subject: Subject) => {
    router.push({
      pathname: '/teacher/subjects/[id]',
      params: { id: subject.id, name: subject.name },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manage Subjects</Text>
          <Text style={styles.subtitle}>Hi, {teacherName}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/teacher/subjects/create')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No subjects yet</Text>
          <Text style={styles.emptySubtext}>
            Create a subject to start managing sections
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/teacher/subjects/create')}
          >
            <Text style={styles.createButtonText}>Create First Subject</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.subjectCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => handleSelectSubject(item)}
              >
                <Text style={styles.subjectName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.subjectDescription}>{item.description}</Text>
                )}
                <Text style={styles.subjectDate}>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.selectAction}
                  onPress={() => handleSelectSubject(item)}
                >
                  <Text style={styles.selectActionText}>Manage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => handleDeleteSubject(item.id, item.name)}
                >
                  <Text style={styles.deleteActionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.back()}
        >
          <Text style={styles.dashboardButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  subjectDate: {
    fontSize: 11,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  selectAction: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dashboardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
