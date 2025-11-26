import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authStore } from '../../store/authStore';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

type LoginStep = 'email-password' | 'scan-qr' | 'processing';

interface ScannedData {
  name: string;
  id: string;
  program: string;
  raw: string;
}

export default function TeacherLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth } = authStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<LoginStep>('email-password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState('');
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, []);

  // Parse QR code data format: NAME ID PROGRAM
  // Example: "NHEM DAY G. ACLO      2023300076      BSIT"
  const parseTeacherQR = (data: string): ScannedData | null => {
    try {
      console.log('🔍 QR Data scanned:', data);
      const trimmedData = data.trim();
      
      // Split by any whitespace and filter empty strings
      const parts = trimmedData.split(/\s+/).filter(p => p.length > 0);
      
      console.log('📊 Parsed parts:', parts);
      console.log('📈 Number of parts:', parts.length);
      
      if (parts.length < 3) {
        console.log('❌ Invalid QR format - expected 3+ parts, got', parts.length);
        return null;
      }
      
      // Last part is program (e.g., BSIT)
      const program = parts[parts.length - 1];
      
      // Second to last is teacher ID (numeric)
      const id = parts[parts.length - 2];
      
      // Everything else is the name
      const name = parts.slice(0, parts.length - 2).join(' ');
      
      console.log('📝 Parsed: Name=[' + name + '] ID=[' + id + '] Program=[' + program + ']');
      
      if (!name || !id || !program) {
        console.log('❌ Missing required fields');
        return null;
      }
      
      console.log('✅ QR format valid');
      return {
        name,
        id,
        program,
        raw: data,
      };
    } catch (e) {
      console.error('❌ Error parsing QR:', e);
    }
    return null;
  };

  const handleVerifyEmailPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔑 Verifying email and password...');
      let response;

      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE for login step 1');
        response = { data: await offlineApi.loginStep1(email.trim(), password) };
      } else {
        console.log('🔌 Using ONLINE MODE for login step 1');
        response = await apiClient.post('/teacher/login/step1', {
          email: email.trim(),
          password,
        });
      }

      if (response.data.success && response.data.tempToken) {
        console.log('✅ Email and password verified');
        setTempToken(response.data.tempToken);
        setStep('scan-qr');
      } else {
        setError(response.data.message || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const message = err.response?.data?.message || 'Email or password incorrect';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (lastScannedRef.current === data) return;
    
    lastScannedRef.current = data;
    setScanned(true);
    const parsed = parseTeacherQR(data);

    if (parsed) {
      setScannedData(parsed);
      handleQRVerification(parsed);
    } else {
      setError('Invalid teacher QR code format.\n\nExpected: NAME ID PROGRAM\n\nExample: NHEM DAY G. ACLO 2023300076 BSIT');
      setTimeout(() => {
        lastScannedRef.current = '';
        setScanned(false);
      }, 2000);
    }
  };

  const handleQRVerification = async (scannedQrData: ScannedData) => {
    setStep('processing');
    setLoading(true);
    setError('');

    try {
      console.log('📤 Verifying QR code with backend...');
      let response;

      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE for login step 2');
        const apiResponse = await offlineApi.loginStep2(tempToken, scannedQrData.raw);
        response = { data: apiResponse };
      } else {
        console.log('🔌 Using ONLINE MODE for login step 2');
        response = await apiClient.post('/teacher/login/step2', {
          tempToken,
          qrCodeData: scannedQrData.raw,
        });
      }

      if (response.data.success && response.data.token) {
        console.log('✅ Login successful');
        await setAuth(
          response.data.token,
          response.data.teacherId,
          response.data.fullName
        );
        // Use setTimeout to ensure router is ready
        setTimeout(() => {
          router.replace('/teacher/session/choose-section-before-scan');
        }, 100);
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
        setTimeout(() => {
          setStep('scan-qr');
          setScanned(false);
          lastScannedRef.current = '';
          setLoading(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ QR verification error:', err);
      const message = err.response?.data?.message || err.message || 'QR code verification failed';
      
      console.log('📊 Error message:', message);
      
      // Parse error message to provide better feedback
      if (message.includes('QR Code Mismatch') || message.includes('does not match')) {
        setError(message);
      } else if (message.includes('Invalid QR code format')) {
        setError('Invalid QR code format.\n\nExpected: NAME ID PROGRAM\n\nExample: NHEM DAY G. ACLO 2023300076 BSIT');
      } else {
        setError(message);
      }
      
      setTimeout(() => {
        setStep('scan-qr');
        setScanned(false);
        lastScannedRef.current = '';
        setLoading(false);
      }, 3000);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.centerText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  // STEP 1: Email and Password Input
  if (step === 'email-password') {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.passwordContainer}>
          <Text style={styles.title}>Teacher Login</Text>
          <Text style={styles.subtitle}>Step 1 of 2: Enter credentials</Text>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyEmailPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Next: Scan QR Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 2: QR Code Scanning
  if (step === 'scan-qr' || step === 'processing') {
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
          onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 2: Verify your identity</Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Point camera at your QR code</Text>
            <Text style={styles.infoSubtext}>Format: NAME ID PROGRAM</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Verifying QR code...</Text>
            </View>
          )}

          {scanned && !loading && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setScanned(false);
                setError('');
                lastScannedRef.current = '';
              }}
            >
              <Text style={styles.rescanButtonText}>Tap to Rescan</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setStep('email-password');
              setTempToken('');
              setScanned(false);
              setError('');
              lastScannedRef.current = '';
            }}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  passwordContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    marginTop: 30,
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
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  error: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  // Scanner styles
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
    fontSize: 24,
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
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
