import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

interface StudentData {
  fullName: string;
  studentId: string;
  department: string;
}

export default function StudentScan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
    loadLastScan();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setTimeout(() => {
      setRemainingSeconds(remainingSeconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingSeconds]);

  const loadLastScan = async () => {
    try {
      const stored = await AsyncStorage.getItem('studentLastScan');
      if (stored) {
        const lastTime = parseInt(stored);
        setLastScanAt(lastTime);

        const now = Date.now();
        const elapsed = now - lastTime;
        if (elapsed < 60000) {
          const remaining = Math.ceil((60000 - elapsed) / 1000);
          setRemainingSeconds(remaining);
        }
      }
    } catch (err) {
      console.error('Error loading last scan:', err);
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

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent duplicate scans within a short time
    if (scanned || loading || lastScannedRef.current === data) return;
    
    lastScannedRef.current = data;
    setScanned(true);
    setError('');

    const parsed = parseStudentQR(data);

    if (!parsed) {
      setError('Invalid QR code format');
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 2000);
      return;
    }

    const { studentId, fullName } = parsed;
    const now = Date.now();

    // Check 60-second cooldown (STRICT CLIENT-SIDE CHECK)
    if (lastScanAt && now - lastScanAt < 60000) {
      const remaining = Math.ceil((60000 - (now - lastScanAt)) / 1000);
      setRemainingSeconds(remaining);
      setError(
        `Slow down! Please wait ${remaining}s before scanning again.`
      );
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
        console.log('📱 Student scan in OFFLINE MODE');
        Alert.alert('Offline Mode', 'Student self-scanning is not available in offline mode', [{ text: 'OK' }]);
      } else {
        console.log('🔌 Processing student scan via API');
        response = await apiClient.post('/attendance/student-scan', {
          studentId,
          fullName,
        });

        // Save last scan time
        await AsyncStorage.setItem('studentLastScan', now.toString());
        setLastScanAt(now);
        setRemainingSeconds(60);

        // Show result
        const { timeIn, timeOut } = response.data;
        let message = '';

        if (timeIn && timeOut) {
          message = 'Attendance complete for today!';
        } else if (timeIn && !timeOut) {
          message = `Time In recorded at ${new Date(
            timeIn
          ).toLocaleTimeString()}. Welcome!`;
        } else if (!timeIn && timeOut) {
          message = `Time Out recorded at ${new Date(
            timeOut
          ).toLocaleTimeString()}. Goodbye!`;
        }

        Alert.alert('Success', message, [{ text: 'OK' }]);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Failed to record attendance. Try again.';
      setError(message);

      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 1000);
    }
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
          <Text style={styles.headerTitle}>Student Attendance</Text>
          <Text style={styles.headerSubtitle}>Scan your QR code</Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {remainingSeconds > 0 && (
          <View style={styles.cooldownBanner}>
            <Text style={styles.cooldownText}>
              Please wait {remainingSeconds}s
            </Text>
          </View>
        )}

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
          style={styles.backButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
  cooldownBanner: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginVertical: 10,
  },
  cooldownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    textAlign: 'center',
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
  backButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
