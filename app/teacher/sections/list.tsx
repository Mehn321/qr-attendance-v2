import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient, OFFLINE_MODE } from '../../../hooks/useApi';
import { offlineApi } from '../../../hooks/useOfflineApi';
import { authStore } from '../../../store/authStore';

interface Section {
  id: string;
  name: string;
  createdAt: string;
}

export default function SectionsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadSections();
    }, [])
  );

  const loadSections = async () => {
    try {
      setLoading(true);
      let sections = [];

      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE');
        const { teacherId } = authStore.getState();
        sections = await offlineApi.getSections(teacherId || "");
      } else {
        console.log('🔌 Using ONLINE MODE');
        const response = await apiClient.get('/sections');
        sections = response.data.sections || [];
      }

      setSections(sections);
    } catch (err) {
      console.error('Error loading sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = (id: string, name: string) => {
    Alert.alert(
      'Delete Section?',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await apiClient.delete(`/sections/${id}`);
              setSections((prev) => prev.filter((s) => s.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete section');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditSection = (id: string, name: string) => {
    router.push({
      pathname: '/teacher/sections/edit',
      params: { id, name },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Sections</Text>
        <TouchableOpacity onPress={() => router.push('/teacher/sections/create')}>
          <Text style={styles.createButton}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No sections yet</Text>
          <TouchableOpacity
            style={styles.createSectionButton}
            onPress={() => router.push('/teacher/sections/create')}
          >
            <Text style={styles.buttonText}>Create First Section</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.sectionCard}>
              <View style={styles.cardContent}>
                <Text style={styles.sectionName}>{item.name}</Text>
                <Text style={styles.sectionDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleEditSection(item.id, item.name)}
                >
                  <Text style={styles.actionEdit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteSection(item.id, item.name)}
                >
                  <Text style={styles.actionDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    marginBottom: 20,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  createSectionButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDate: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionEdit: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  actionDelete: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
});
