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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { apiClient, OFFLINE_MODE } from '../../../hooks/useApi';
import { offlineApi } from '../../../hooks/useOfflineApi';
import { authStore } from '../../../store/authStore';

interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function ManageSections() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: subjectId, name: subjectName } = useLocalSearchParams<{
    id: string;
    name: string;
  }>();
  const { teacherId } = authStore();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (subjectId) {
        loadSections();
      }
    }, [subjectId])
  );

  const loadSections = async () => {
    try {
      setLoading(true);
      let sectionsList = [];

      if (OFFLINE_MODE) {
        console.log('📱 Loading sections from OFFLINE MODE');
        if (subjectId) {
          sectionsList = await offlineApi.getSectionsBySubject(subjectId as string);
        }
      } else {
        console.log('🔌 Loading sections from ONLINE API');
        const response = await apiClient.get(`/subjects/${subjectId}/sections`);
        sectionsList = response.data.sections || [];
      }

      setSections(sectionsList);
    } catch (err) {
      console.error('Error loading sections:', err);
      Alert.alert('Error', 'Failed to load sections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSections();
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
              if (OFFLINE_MODE) {
                await offlineApi.deleteSection(id);
              } else {
                await apiClient.delete(`/sections/${id}`);
              }
              loadSections();
              Alert.alert('Success', 'Section deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete section');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSelectSection = (section: Section) => {
    authStore.getState().setSelectedSection(section.id, section.name);
    router.push('/teacher/scanner');
  };

  const handleCreateSection = () => {
    router.push({
      pathname: '/teacher/sections/create',
      params: { subjectId, subjectName },
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.subject}>{subjectName}</Text>
          <Text style={styles.sectionCount}>
            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateSection}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No sections yet</Text>
          <Text style={styles.emptySubtext}>
            Add a section to start taking attendance
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSection}
          >
            <Text style={styles.createButtonText}>Create First Section</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => handleSelectSection(item)}
              >
                <Text style={styles.sectionName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.sectionDescription}>{item.description}</Text>
                )}
                <Text style={styles.sectionDate}>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.selectAction}
                  onPress={() => handleSelectSection(item)}
                >
                  <Text style={styles.selectActionText}>Use</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => handleDeleteSection(item.id, item.name)}
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
          style={styles.createSectionButton}
          onPress={handleCreateSection}
        >
          <Text style={styles.createSectionButtonText}>+ Create New Section</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
  sectionCard: {
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
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sectionDate: {
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  createSectionButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createSectionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
