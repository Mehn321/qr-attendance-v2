import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient, OFFLINE_MODE } from '../../hooks/useApi';
import { offlineApi } from '../../hooks/useOfflineApi';

export default function LoginStep1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Login Step 1: Checking credentials...', { email: email.trim() });
      
      let response;
      
      if (OFFLINE_MODE) {
        console.log('📱 Using OFFLINE MODE');
        response = await offlineApi.loginStep1(email.trim(), password);
      } else {
        console.log('🔌 Using ONLINE MODE');
        const apiResponse = await apiClient.post('/teacher/login/step1', {
          email: email.trim(),
          password,
        });
        response = apiResponse.data;
      }

      console.log('Login Step 1 response:', response);

      if (response.success && response.tempToken) {
        // Navigate to Step 2 with temp token
        console.log('Proceeding to Step 2...');
        router.push({
          pathname: '/teacher/login-step2',
          params: {
            tempToken: response.tempToken,
            email: email.trim(),
          },
        });
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login Step 1 error:', err);
      
      let errorMessage = 'Email or password incorrect. Please try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Email or password incorrect';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Please enter email and password';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 3000.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Error message set:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Teacher Login</Text>
          <Text style={styles.subtitle}>Step 1 of 2</Text>
          <Text style={styles.description}>Enter your email and password</Text>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="teacher@example.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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
              style={[styles.nextButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.backText}>← Back to Landing</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
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
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    marginTop: 20,
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
  passwordContainer: {
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
    fontSize: 14,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  nextButtonText: {
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
});
