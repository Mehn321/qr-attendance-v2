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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authStore } from '../../store/authStore';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

export default function RegisterQRScan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { setAuth } = authStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const tempToken = params.tempToken as string;
  const tempTeacherId = params.tempTeacherId as string;
  const fullName = params.fullName as string;
  const email = params.email as string;
  const isRegistration = (params.isRegistration as string) === 'true';

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

  // Parse QR code format: NAME ID PROGRAM
  const parseTeacherQR = (data: string) => {
    try {
      const parts = data.trim().split(/\s+/).filter(p => p.length > 0);
      if (parts.length < 3) return null;
      
      return {
        name: parts.slice(0, parts.length - 2).join(' '),
        id: parts[parts.length - 2],
        program: parts[parts.length - 1],
        raw: data,
      };
    } catch (e) {
      console.error('Error parsing QR:', e);
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
      setError('Invalid QR code format.\n\nExpected: NAME ID PROGRAM\n\nExample: NHEM DAY G. ACLO 2023300076 BSIT');
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 2000);
    }
  };

  const handleQRVerification = async (scannedQrData: any) => {
    setLoading(true);
    setError('');

    try {
      if (isRegistration) {
        // REGISTRATION: Verify QR code and CREATE account (only if QR scan successful)
        console.log('📋 Registration QR verification:', scannedQrData);
        console.log('🔐 Sending QR data to create account after verification');
        
        let response;
        
        if (OFFLINE_MODE) {
          console.log('📱 Using OFFLINE MODE for registration QR verification');
          response = await offlineApi.registerVerifyQR(tempToken, scannedQrData.raw);
        } else {
          console.log('🔌 Using ONLINE MODE for registration QR verification');
          const apiResponse = await apiClient.post('/teacher/register/verify-qr', {
            tempToken,
            qrCodeData: scannedQrData.raw,
          });
          response = apiResponse.data;
        }

        if (response.success && response.token) {
          // Account JUST created! Save auth data
          console.log('✅ Account created and verified successfully');
          await setAuth(response.token, response.teacherId, response.fullName);

          // Navigate to success screen
          router.replace({
            pathname: '/teacher/register-success',
            params: {
              email: response.email,
              fullName: response.fullName,
              qrCodeData: scannedQrData.raw,
            },
          });
        } else {
          setError(response.message || 'Registration verification failed. Please try again.');
          console.log('❌ Registration verification failed:', response.message);
          setTimeout(() => {
            setScanned(false);
            lastScannedRef.current = '';
          }, 3000);
        }
      } else {
        // LOGIN: Just pass the scanned QR data back to login screen
        // (This would be handled by the login.tsx if this screen was used during login)
        console.log('📋 QR Code scanned:', scannedQrData);
      }
    } catch (err: any) {
      console.error('QR verification error:', err);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      console.log('❌ Error during QR verification:', errorMessage);
      setTimeout(() => {
        setScanned(false);
        lastScannedRef.current = '';
      }, 3000);
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
          <Text style={styles.headerTitle}>Complete Registration</Text>
          <Text style={styles.headerSubtitle}>Scan your teacher QR code</Text>
        </View>

        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Point camera at QR code</Text>
          <Text style={styles.infoSubtext}>Format: NAME ID PROGRAM</Text>
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
          <Text style={styles.cancelButtonText}>← Back to Registration</Text>
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
    marginTop: 20,
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
  infoBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoSubtext: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
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
