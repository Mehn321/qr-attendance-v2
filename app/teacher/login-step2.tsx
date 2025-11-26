import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authStore } from '../../store/authStore';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

export default function LoginStep2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { setAuth } = authStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const tempToken = params.tempToken as string;
  const email = params.email as string;

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, []);

  const parseTeacherQR = (data: string) => {
    try {
      console.log('🔍 QR Data scanned:', data);
      const trimmedData = data.trim();
      
      // Split by any whitespace and filter out empty strings
      const parts = trimmedData.split(/\s+/).filter(p => p.length > 0);
      
      console.log('📊 Parsed parts:', parts);
      console.log('📈 Number of parts:', parts.length);
      
      if (parts.length < 3) {
        console.log('❌ QR format invalid - expected 3+ parts, got', parts.length);
        console.log('💡 Expected format: FULLNAME TEACHERID DEPARTMENT');
        console.log('⚠️ Example: NHEM DAY G. ACLO 2023300076 BSIT');
        console.log('⚠️ Scanned format:', trimmedData);
        return null;
      }
      
      // Last part is department (e.g., BSIT or TEACHER)
      const department = parts[parts.length - 1];
      
      // Second to last is teacher ID (10-11 digits)
      const teacherId = parts[parts.length - 2];
      
      // Everything else is the name
      const fullName = parts.slice(0, parts.length - 2).join(' ');
      
      console.log('📝 Parsed: [' + fullName + '] [' + teacherId + '] [' + department + ']');
      console.log('✅ QR format valid');
      
      // Return space-separated format for API
      const normalizedData = `${fullName} ${teacherId} ${department}`;
      console.log('📤 Sending to API:', normalizedData);
      return normalizedData;
    } catch (e) {
      console.error('❌ Error parsing QR:', e);
    }
    return null;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || lastScannedRef.current === data) return;

    lastScannedRef.current = data;
    setScanned(true);
    const parsed = parseTeacherQR(data);

    if (parsed) {
      handleQRVerification(parsed);
    } else {
      setError('Invalid QR code format\n\nExpected: FULLNAME TEACHERID DEPARTMENT\nExample: JOHN DOE 2023300076 BSIT');
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 3000);
    }
  };

  const handleQRVerification = async (qrCodeData: string) => {
    setLoading(true);
    setError('');

    try {
      let response;

      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE');
        response = await offlineApi.loginStep2(tempToken, qrCodeData);
      } else {
        console.log('🔌 Using ONLINE MODE');
        const apiResponse = await apiClient.post('/teacher/login/step2', {
          tempToken,
          qrCodeData,
        });
        response = apiResponse.data;
      }

      if (response.success && response.token) {
        // Save auth data
        await setAuth(response.token, response.teacherId, response.fullName);

        // Navigate to dashboard
        router.replace('/teacher/dashboard');
      }
    } catch (err: any) {
      const message = OFFLINE_MODE
        ? 'QR verification failed. Please try again.'
        : err.response?.data?.message || 'QR verification failed. Please try again.';
      setError(message);
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.centerText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.centerText}>Camera permission required to scan QR code</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        ref={cameraRef}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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
          <Text style={styles.headerTitle}>Teacher Login - Step 2</Text>
          <Text style={styles.headerSubtitle}>Scan your teacher QR code</Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Verifying QR...</Text>
          </View>
        )}

        {scanned && !loading && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => {
              setScanned(false);
              setError('');
            }}
          >
            <Text style={styles.rescanButtonText}>Tap to Rescan</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
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
  error: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
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
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
