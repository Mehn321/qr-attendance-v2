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

export default function RegisterSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const email = params.email as string;
  const fullName = params.fullName as string;
  const qrCodeData = params.qrCodeData as string;

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
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
            <Text style={styles.title}>Welcome, {fullName}!</Text>
            <Text style={styles.subtitle}>Account created and verified</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>✓ Verified</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>QR Code</Text>
                <Text style={[styles.infoValue, { fontSize: 12 }]}>{qrCodeData}</Text>
              </View>
            </View>

            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>What you can do now:</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>Create sections</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>Scan student QR codes</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>Track attendance</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureDot}>✓</Text>
                  <Text style={styles.featureText}>View attendance history</Text>
                </View>
              </View>
            </View>

            <View style={styles.nextStepsBox}>
              <Text style={styles.nextStepsTitle}>Next Steps:</Text>
              <Text style={styles.nextStepsText}>
                1. Go to Dashboard{'\n'}
                2. Create your first section{'\n'}
                3. Start scanning student QR codes
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
                <Text style={styles.continueButtonText}>Go to Dashboard</Text>
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
    marginBottom: 30,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 20,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  featureBox: {
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    color: '#555',
    fontSize: 13,
  },
  nextStepsBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  nextStepsText: {
    color: '#555',
    fontSize: 13,
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
