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
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient, OFFLINE_MODE } from '../../../hooks/useApi';
import { offlineApi } from '../../../hooks/useOfflineApi';

export default function ManualAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeIn, setTimeIn] = useState<Date | null>(null);
  const [showTimeInPicker, setShowTimeInPicker] = useState(false);
  const [timeOut, setTimeOut] = useState<Date | null>(null);
  const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleTimeInChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) setTimeIn(selectedDate);
    setShowTimeInPicker(false);
  };

  const handleTimeOutChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) setTimeOut(selectedDate);
    setShowTimeOutPicker(false);
  };

  const handleAdd = async () => {
    if (!studentId.trim() || !fullName.trim()) {
      setError('Student ID and name are required');
      return;
    }

    if (!timeIn && !timeOut) {
      setError('At least one time (In or Out) is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required for this action');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (OFFLINE_MODE) {
        console.log('📱 Manual attendance in OFFLINE MODE');
        Alert.alert('Offline Mode', 'Manual attendance entry is not available in offline mode', [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]);
      } else {
        console.log('🔌 Adding manual attendance via API');
        await apiClient.post('/attendance/manual', {
          studentId: studentId.trim(),
          fullName: fullName.trim(),
          department: department.trim(),
          section: section.trim(),
          date: date.toISOString().split('T')[0],
          timeIn: timeIn ? timeIn.toISOString() : null,
          timeOut: timeOut ? timeOut.toISOString() : null,
          password,
        });

        Alert.alert('Success', 'Attendance record added', [
          {
            text: 'OK',
            onPress: () => {
              setStudentId('');
              setFullName('');
              setDepartment('');
              setSection('');
              setTimeIn(null);
              setTimeOut(null);
              setPassword('');
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to add attendance. Check password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manual Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter student ID"
          value={studentId}
          onChangeText={setStudentId}
          editable={!loading}
        />

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter student name"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., BSIT"
          value={department}
          onChangeText={setDepartment}
          editable={!loading}
        />

        <Text style={styles.label}>Section</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., BSIT-S1"
          value={section}
          onChangeText={setSection}
          editable={!loading}
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Time In</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimeInPicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {timeIn ? timeIn.toLocaleTimeString() : 'Select time (optional)'}
          </Text>
        </TouchableOpacity>

        {showTimeInPicker && (
          <DateTimePicker
            value={timeIn || new Date()}
            mode="time"
            display="spinner"
            onChange={handleTimeInChange}
          />
        )}

        <Text style={styles.label}>Time Out</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimeOutPicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {timeOut ? timeOut.toLocaleTimeString() : 'Select time (optional)'}
          </Text>
        </TouchableOpacity>

        {showTimeOutPicker && (
          <DateTimePicker
            value={timeOut || new Date()}
            mode="time"
            display="spinner"
            onChange={handleTimeOutChange}
          />
        )}

        <Text style={styles.label}>Password (Required)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Attendance Record</Text>
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
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
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
