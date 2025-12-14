import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { offlineApi } from '../../hooks/useOfflineApi';

interface Teacher {
  index: number;
  id: string;
  email: string;
  fullName: string;
  isVerified: number;
}

export default function ClearData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [deleteEmail, setDeleteEmail] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const result = await offlineApi.listAllTeachers();
    if (result.success) {
      setTeachers(result.teachers);
    }
  };

  const handleDeleteTeacher = async (email: string) => {
    Alert.alert(
      'Delete Teacher?',
      `This will permanently delete the teacher account: ${email}`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            const result = await offlineApi.deleteTeacherByEmail(email);
            setMessage(result.message);
            setLoading(false);
            await loadTeachers();
            Alert.alert('Success', result.message);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteByInputEmail = async () => {
    if (!deleteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }

    Alert.alert(
      'Delete Teacher?',
      `This will permanently delete: ${deleteEmail}`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            const result = await offlineApi.deleteTeacherByEmail(deleteEmail.trim());
            setMessage(result.message);
            setLoading(false);
            setDeleteEmail('');
            await loadTeachers();
            Alert.alert(result.success ? 'Success' : 'Error', result.message);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Data?',
      'This will delete all teachers, subjects, sections, and attendance records. This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Clear All',
          onPress: async () => {
            setLoading(true);
            const result = await offlineApi.clearAllData();
            setMessage(result.message);
            setLoading(false);
            Alert.alert('Success', result.message);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearAttendance = async () => {
    setLoading(true);
    const result = await offlineApi.clearData('attendance');
    setMessage(result.message);
    setLoading(false);
    Alert.alert('Success', result.message);
  };

  const handleClearSubjects = async () => {
    setLoading(true);
    const result = await offlineApi.clearData('subjects');
    setMessage(result.message);
    setLoading(false);
    Alert.alert('Success', result.message);
  };

  const handleClearSections = async () => {
    setLoading(true);
    const result = await offlineApi.clearData('sections');
    setMessage(result.message);
    setLoading(false);
    Alert.alert('Success', result.message);
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database?',
      'This will clear all data and reinitialize with demo data. This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            setLoading(true);
            const result = await offlineApi.resetDatabase();
            setMessage(result.message);
            setLoading(false);
            Alert.alert('Success', result.message);
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Clear Data</Text>
          <View style={{ width: 40 }} />
        </View>

        {message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delete Specific Teacher</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter email to delete (e.g., aclo@gmail.com)"
              value={deleteEmail}
              onChangeText={setDeleteEmail}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, styles.dangerButton, !deleteEmail.trim() && styles.disabledButton]}
              onPress={handleDeleteByInputEmail}
              disabled={loading || !deleteEmail.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Delete by Email</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>Or select from list:</Text>
          {teachers.length === 0 ? (
            <Text style={styles.noTeachers}>No teachers found</Text>
          ) : (
            teachers.map((teacher) => (
              <View key={teacher.email} style={styles.teacherCard}>
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>{teacher.fullName}</Text>
                  <Text style={styles.teacherEmail}>{teacher.email}</Text>
                  <Text style={styles.teacherId}>ID: {teacher.id}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.deleteButton, loading && styles.disabledButton]}
                  onPress={() => handleDeleteTeacher(teacher.email)}
                  disabled={loading}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clear Specific Data</Text>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleClearAttendance}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Clear Attendance Records</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleClearSubjects}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Clear Subjects</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleClearSections}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Clear Sections</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dangerous Operations</Text>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearAll}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>⚠️ Clear ALL Data</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleResetDatabase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>⚠️ Reset Database</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What each option does:</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Clear Attendance</Text>: Removes all attendance records only
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Clear Subjects</Text>: Removes all subjects (keeps teachers)
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Clear Sections</Text>: Removes all sections (keeps subjects)
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Clear ALL Data</Text>: Removes everything (keeps nothing)
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Reset Database</Text>: Clears all and recreates with demo teacher
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#34C759',
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  teacherId: {
    fontSize: 12,
    color: '#999',
  },
  noTeachers: {
    fontSize: 14,
    color: '#999',
    padding: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
});
