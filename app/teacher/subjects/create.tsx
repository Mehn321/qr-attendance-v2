import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient, OFFLINE_MODE } from '../../../hooks/useApi';
import { offlineApi } from '../../../hooks/useOfflineApi';
import { authStore } from '../../../store/authStore';

export default function CreateSubject() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacherId } = authStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE');
        await offlineApi.createSubject(
          teacherId || "",
          name.trim(),
          description.trim()
        );
      } else {
        console.log('🔌 Using ONLINE MODE');
        await apiClient.post('/subjects', {
          name: name.trim(),
          description: description.trim(),
        });
      }

      Alert.alert('Success', 'Subject created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      const message = OFFLINE_MODE
        ? 'Failed to create subject'
        : err.response?.data?.message || 'Failed to create subject';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Subject</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Subject Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mathematics, Physics"
            value={name}
            onChangeText={setName}
            editable={!loading}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add description or notes for this subject"
            value={description}
            onChangeText={setDescription}
            editable={!loading}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 After creating a subject, you can add sections to it for your different classes.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Subject</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  backButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 13,
    color: '#0066CC',
    lineHeight: 18,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
