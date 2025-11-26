import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegisterQRDisplay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const qrCodeData = params.qrCodeData as string;
  const email = params.email as string;
  const fullName = params.fullName as string;

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    // Small delay for UX
    setTimeout(() => {
      router.replace('/teacher/dashboard');
    }, 300);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.title}>Account Created!</Text>
            <Text style={styles.subtitle}>Welcome, {fullName}</Text>
          </View>

          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Your Teacher QR Code</Text>
            <Text style={styles.qrDescription}>
              Save this QR code. You'll need it to login next time.
            </Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR CODE</Text>
                <Text style={styles.qrPlaceholderSubtext}>Scanner Ready</Text>
              </View>
            </View>

            <View style={styles.qrDataDisplay}>
              <View style={styles.qrDataItem}>
                <Text style={styles.qrDataLabel}>Email:</Text>
                <Text style={styles.qrDataValue}>{email}</Text>
              </View>
              <View style={styles.qrDataItem}>
                <Text style={styles.qrDataLabel}>Name:</Text>
                <Text style={styles.qrDataValue}>{fullName}</Text>
              </View>
              <View style={styles.qrDataItem}>
                <Text style={styles.qrDataLabel}>QR Data:</Text>
                <Text style={[styles.qrDataValue, { fontSize: 12 }]}>{qrCodeData}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Keep Your QR Code Safe</Text>
              <Text style={styles.infoText}>
                You can:
                {'\n'}• Screenshot this screen
                {'\n'}• Print the QR code
                {'\n'}• Save it in a secure location
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
              )}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkmark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  qrSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  qrPlaceholderSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  qrDataDisplay: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  qrDataItem: {
    marginBottom: 12,
  },
  qrDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  qrDataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  actions: {
    marginTop: 30,
  },
  continueButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
