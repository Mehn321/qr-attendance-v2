import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from '../../store/authStore';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

interface StudentData {
  fullName: string;
  studentId: string;
  department: string;
}

interface ScanLog {
  id: string;
  studentId: string;
  fullName: string;
  timeIn?: string;
  timeOut?: string;
  status: 'In' | 'Out' | 'Completed' | 'Duplicate Attempt' | 'Cooldown';
  message: string;
}

export default function TeacherScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedSection, selectedSectionId, teacherId } = authStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [error, setError] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const lastScannedRef = useRef<string>('');

  // Student cooldown tracking: { studentId: { lastScanAt: timestamp } }
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
    // Load cooldowns from storage
    loadCooldowns();
  }, []);

  // Redirect if no section selected
  useEffect(() => {
    if (!selectedSection || !selectedSectionId) {
      router.replace('/teacher/session/choose-section-before-scan');
    }
  }, [selectedSection, selectedSectionId]);

  const loadCooldowns = async () => {
    try {
      const stored = await AsyncStorage.getItem('studentCooldowns');
      if (stored) {
        const data: Record<string, number> = JSON.parse(stored);
        // Clean up old entries (>24 hours)
        const now = Date.now();
        const cleaned = Object.fromEntries(
          Object.entries(data).filter(([, timestamp]) => {
            return now - timestamp < 86400000;
          })
        );
        setCooldowns(cleaned as Record<string, number>);
      }
    } catch (err) {
      console.error('Error loading cooldowns:', err);
    }
  };

  const saveCooldowns = async (newCooldowns: Record<string, number>) => {
    try {
      await AsyncStorage.setItem(
        'studentCooldowns',
        JSON.stringify(newCooldowns)
      );
    } catch (err) {
      console.error('Error saving cooldowns:', err);
    }
  };

  // Parse QR code: FULLNAME STUDENTID DEPARTMENT (space-separated)
  // Example: NHEM DAY G. ACLO       2023300076      BSIT
  const parseStudentQR = (data: string): StudentData | null => {
    try {
      const parts = data.trim().split(/\s+/).filter(p => p.length > 0);
      
      if (parts.length < 3) {
        console.log('❌ Invalid QR format - expected 3+ parts, got', parts.length);
        return null;
      }
      
      // Last part is department (e.g., BSIT)
      const department = parts[parts.length - 1];
      
      // Second to last is student ID (numeric)
      const studentId = parts[parts.length - 2];
      
      // Everything else is the name
      const fullName = parts.slice(0, parts.length - 2).join(' ');
      
      console.log('📝 Parsed Student QR: Name=[' + fullName + '] ID=[' + studentId + '] Department=[' + department + ']');
      
      if (!fullName || !studentId || !department) {
        console.log('❌ Missing required fields');
        return null;
      }
      
      return {
        fullName,
        studentId,
        department,
      };
    } catch (e) {
      console.error('Error parsing QR:', e);
    }
    return null;
  };

  // Check cooldown and process scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading || lastScannedRef.current === data) return;

    lastScannedRef.current = data;
    setScanned(true);
    setError('');

    const parsed = parseStudentQR(data);

    if (!parsed) {
      setError('Invalid student QR code');
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 2000);
      return;
    }

    const { studentId, fullName } = parsed;
    const now = Date.now();
    const lastScan = cooldowns[studentId];

    // Check 60-second cooldown (STRICT RULE)
    if (lastScan && now - lastScan < 60000) {
      const remaining = Math.ceil((60000 - (now - lastScan)) / 1000);
      const message = `Slow down! Please wait ${remaining}s before scanning again.`;

      setLogs((prev) => [
        {
          id: `${studentId}-${now}`,
          studentId,
          fullName,
          status: 'Cooldown',
          message,
        },
        ...prev,
      ]);

      setError(message);
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 2000);
      return;
      }

      // Process scan on server
    setLoading(true);

    try {
      let response;

      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE');
        if (!teacherId) {
          throw new Error('Teacher ID not found');
        }
        const qrData = `${fullName} ${studentId} ${parsed.department}`;
        // ✅ CRITICAL: Pass teacherId as first parameter
        response = await offlineApi.scanAttendance(teacherId || "", selectedSectionId || "", qrData);
      } else {
        console.log('🔌 Using ONLINE MODE');
        const apiResponse = await apiClient.post('/attendance/scan', {
          studentId,
          fullName,
          section: selectedSection,
          sectionId: selectedSectionId,
        });
        response = apiResponse.data;
      }

      // Update local cooldown
      const newCooldowns = { ...cooldowns, [studentId]: now };
      setCooldowns(newCooldowns);
      await saveCooldowns(newCooldowns);

      // Determine status
      const { timeIn, timeOut, status } = response;
      let displayStatus: ScanLog['status'] = 'In';
      let message = '';

      if (status === 'IN') {
        displayStatus = 'In';
        message = `Time In recorded at ${new Date(timeIn).toLocaleTimeString()}. Welcome!`;
      } else if (status === 'OUT') {
        displayStatus = 'Out';
        message = `Time Out recorded at ${new Date(timeOut).toLocaleTimeString()}. Goodbye!`;
      } else if (status === 'COMPLETED') {
        displayStatus = 'Completed';
        message = `Attendance complete for today.`;
      }

      setLogs((prev) => [
        {
          id: `${studentId}-${now}`,
          studentId,
          fullName,
          status: displayStatus,
          message,
          timeIn: timeIn ? new Date(timeIn).toLocaleTimeString() : undefined,
          timeOut: timeOut
            ? new Date(timeOut).toLocaleTimeString()
            : undefined,
        },
        ...prev,
      ]);

      // Toast-like notification
      Alert.alert('Success', message, [{ text: 'OK' }]);
    } catch (err: any) {
      const message =
        (OFFLINE_MODE ? null : err.response?.data?.message) ||
        'Failed to process scan. Try again.';
      setError(message);

      setLogs((prev) => [
        {
          id: `${studentId}-${now}`,
          studentId,
          fullName,
          status: 'Duplicate Attempt',
          message,
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 1000);
    }
    };

    const handleEndSession = () => {
    Alert.alert(
      'End Session?',
      `Are you sure? You'll need to select a new section to continue scanning.`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'End Session',
          onPress: async () => {
            await authStore.getState().clearSelectedSection();
            router.replace('/teacher/session/choose-section-before-scan');
          },
        },
      ]
    );
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.centerText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.centerText}>Camera permission denied</Text>
          <TouchableOpacity
            style={{ marginTop: 20, padding: 10, backgroundColor: '#007AFF', borderRadius: 5 }}
            onPress={requestPermission}
          >
            <Text style={{ color: '#fff' }}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        ref={cameraRef}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={flashOn}
        facing={cameraFacing}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
            disabled={loading}
          >
            <Text style={styles.controlIcon}>📷</Text>
            <Text style={styles.controlLabel}>{cameraFacing === 'back' ? 'Front' : 'Back'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, flashOn && styles.controlButtonActive]}
            onPress={() => setFlashOn(!flashOn)}
            disabled={loading}
          >
            <Text style={styles.controlIcon}>{flashOn ? '💡' : '🔦'}</Text>
            <Text style={styles.controlLabel}>{flashOn ? 'On' : 'Off'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Student QR</Text>
          <Text style={styles.headerSubtitle}>{selectedSection}</Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Tap to Rescan</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.endSessionButton}
          onPress={handleEndSession}
        >
          <Text style={styles.endSessionText}>End Session</Text>
        </TouchableOpacity>
      </View>

      {/* Scan logs */}
      {logs.length > 0 && (
        <View style={[styles.logsContainer, { maxHeight: 200 }]}>
          <ScrollView>
            {logs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <Text style={styles.logName}>{log.fullName}</Text>
                <Text style={styles.logId}>ID: {log.studentId}</Text>
                <Text style={[styles.logStatus, getStatusColor(log.status)]}>
                  {log.status}
                </Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'In':
      return { color: '#34C759' };
    case 'Out':
      return { color: '#FF9500' };
    case 'Completed':
      return { color: '#007AFF' };
    case 'Cooldown':
    case 'Duplicate Attempt':
      return { color: '#FF3B30' };
    default:
      return { color: '#666' };
  }
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  controlIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  scanFrame: {
    width: 280,
    height: 280,
    marginVertical: 40,
    borderColor: '#0AFF00',
    borderWidth: 2,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0AFF00',
    top: -2,
    left: -2,
  },
  cornerTR: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0AFF00',
    top: -2,
    right: -2,
  },
  cornerBL: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0AFF00',
    bottom: -2,
    left: -2,
  },
  cornerBR: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0AFF00',
    bottom: -2,
    right: -2,
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    textAlign: 'center' as const,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  rescanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  endSessionButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  endSessionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 8,
    marginBottom: 8,
  },
  logName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logId: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  logStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logMessage: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
});
