import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { authStore } from "../../store/authStore";
import { apiClient, OFFLINE_MODE } from "../../hooks/useApi";
import { offlineApi } from "../../hooks/useOfflineApi";

interface Stats {
  totalPresent?: number;
  currentlyIn?: number;
  checkedOut?: number;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, teacher, logout, teacherId } = authStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-logout if no token
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token]);

  // Prevent back button from logging out
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Return true to prevent default back button behavior
        // This keeps the user on the dashboard
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (OFFLINE_MODE) {
        // Use offline API
        if (teacherId) {
          const subjectsList = await offlineApi.getSubjects(teacherId);
          setSubjects(subjectsList);
          
          // ✅ CRITICAL: Pass teacherId to getStats
          const statsData = await offlineApi.getStats(teacherId);
          setStats({
            totalPresent: statsData.totalPresent || 0,
            currentlyIn: statsData.currentlyIn || 0,
            checkedOut: statsData.checkedOut || 0,
          });
        } else {
          setSubjects([]);
          setStats({
            totalPresent: 0,
            currentlyIn: 0,
            checkedOut: 0,
          });
        }
      } else {
        // Use online API
        const subjectsResponse = await apiClient.get("/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(subjectsResponse.data.subjects || []);

        const statsResponse = await apiClient.get("/attendance/stats/today", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Ensure stats has default values
        const statsData = statsResponse.data || {};
        setStats({
          totalPresent: statsData.totalPresent || 0,
          currentlyIn: statsData.currentlyIn || 0,
          checkedOut: statsData.checkedOut || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      // Set default empty data on error
      setSubjects([]);
      setStats({
        totalPresent: 0,
        currentlyIn: 0,
        checkedOut: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        setLoading(true);
        fetchDashboardData();
      }
    }, [token, teacherId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      if (!OFFLINE_MODE) {
        await apiClient.post(
          "/teacher/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await logout();
      router.replace("/");
    }
  };

  const handleManageSubject = (subject: Subject) => {
    router.push({
      pathname: '/teacher/subjects/[id]',
      params: { id: subject.id, name: subject.name },
    });
  };

  const handleStartScanning = () => {
    if (subjects.length === 0) {
      Alert.alert("Error", "Please create a subject first");
      return;
    }
    router.push("/teacher/session/choose-section-before-scan");
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>Welcome</Text>
              <Text style={styles.teacherName}>
                {teacher?.fullName || "Teacher"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.statIcon}>👥</Text>
              </View>
              <Text style={styles.statNumber}>{stats.totalPresent || 0}</Text>
              <Text style={styles.statLabel}>Total Present</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.statIcon}>✓</Text>
              </View>
              <Text style={styles.statNumber}>{stats.currentlyIn || 0}</Text>
              <Text style={styles.statLabel}>Checked In</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.statIcon}>✕</Text>
              </View>
              <Text style={styles.statNumber}>{stats.checkedOut || 0}</Text>
              <Text style={styles.statLabel}>Checked Out</Text>
            </View>
          </View>
        </View>

        <View style={styles.subjectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <TouchableOpacity
              onPress={() => router.push("/teacher/subjects/create")}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {subjects.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No subjects yet</Text>
              <Text style={styles.emptySubtext}>
                Create a subject to start organizing your classes
              </Text>
              <TouchableOpacity
                style={styles.createSubjectButton}
                onPress={() => router.push("/teacher/subjects/create")}
              >
                <Text style={styles.createSubjectButtonText}>Create First Subject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.subjectsList}>
              {subjects.map((subject) => (
                <View key={subject.id} style={styles.subjectCard}>
                  <View style={styles.subjectCardContent}>
                    <Text style={styles.subjectCardName}>{subject.name}</Text>
                    {subject.description && (
                      <Text style={styles.subjectCardDescription}>
                        {subject.description}
                      </Text>
                    )}
                    <Text style={styles.subjectCardDate}>
                      Created: {new Date(subject.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => handleManageSubject(subject)}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.primaryAction,
              subjects.length === 0 && styles.primaryActionDisabled,
            ]}
            onPress={handleStartScanning}
            disabled={subjects.length === 0}
          >
            <Text style={styles.primaryActionText}>📱 Start Scanning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push("/teacher/attendance/history")}
          >
            <Text style={styles.secondaryActionText}>
              📊 Attendance History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push("/teacher/settings")}
          >
            <Text style={styles.secondaryActionText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  greeting: {
    fontSize: 14,
    color: "#666",
  },
  teacherName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "600",
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  subjectsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#34C759",
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  createSubjectButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createSubjectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  subjectsList: {
    gap: 10,
  },
  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectCardContent: {
    flex: 1,
  },
  subjectCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subjectCardDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  subjectCardDate: {
    fontSize: 11,
    color: "#999",
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  manageButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  secondaryActionText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },
});
