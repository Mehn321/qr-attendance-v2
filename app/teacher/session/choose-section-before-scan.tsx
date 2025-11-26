import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { authStore } from "../../../store/authStore";
import { apiClient, OFFLINE_MODE } from "../../../hooks/useApi";
import { offlineApi } from "../../../hooks/useOfflineApi";

interface Section {
  id: string;
  name: string;
  subjectId?: string;
  subjectName?: string;
  createdAt: string;
}

export default function ChooseSectionBeforeScan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacherName, setSelectedSection, teacherId } = authStore();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError("");

      let sectionsList: Section[] = [];

      if (OFFLINE_MODE) {
        console.log("📱 Loading sections from OFFLINE MODE");
        if (teacherId) {
          const offlineSections = await offlineApi.getSections(teacherId);
          const subjects = await offlineApi.getSubjects(teacherId);

          // Create a subject map for quick lookup
          const subjectMap = new Map(subjects.map((s: any) => [s.id, s.name]));

          sectionsList = offlineSections.map((s: any) => ({
            id: s.id,
            name: s.name,
            subjectId: s.subjectId,
            subjectName: s.subjectId ? subjectMap.get(s.subjectId) : undefined,
            createdAt: s.createdAt,
          }));
        }
      } else {
        console.log("🔌 Loading sections from ONLINE API");
        const response = await apiClient.get("/sections");
        const sections = response.data.sections || [];

        // Map API response to include subjectName if available
        sectionsList = sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          createdAt: s.createdAt,
        }));
      }

      setSections(sectionsList);

      if (!sectionsList || sectionsList.length === 0) {
        setError("No sections found. Please create one first.");
      }
    } catch (err: any) {
      console.error("Error loading sections:", err);
      setError(err.response?.data?.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = async (section: Section) => {
    try {
      await setSelectedSection(section.id, section.name);
      router.replace("/teacher/scanner");
    } catch (err) {
      console.error("Error selecting section:", err);
      Alert.alert("Error", "Failed to select section");
    }
  };

  const handleCreateSection = () => {
    router.push("/teacher/sections/create");
  };

  const handleViewDashboard = () => {
    router.replace("/teacher/dashboard");
  };

  const handleDeleteSection = (id: string, name: string) => {
    Alert.alert(
      "Remove Section?",
      `Are you sure you want to remove "${name}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Remove",
          onPress: async () => {
            try {
              if (OFFLINE_MODE) {
                await offlineApi.deleteSection(id);
              } else {
                await apiClient.delete(`/sections/${id}`);
              }
              loadSections();
              Alert.alert("Success", "Section removed");
            } catch (err) {
              Alert.alert("Error", "Failed to remove section");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Select a Section</Text>
        <Text style={styles.subtitle}>
          Hi, {teacherName}. Choose the section you're teaching today.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSection}
          >
            <Text style={styles.buttonText}>Create First Section</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => handleSelectSection(item)}
                >
                  {item.subjectName && (
                    <Text style={styles.subjectName}>{item.subjectName}</Text>
                  )}
                  <Text style={styles.sectionName}>{item.name}</Text>
                  <Text style={styles.sectionDate}>
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.selectAction}
                    onPress={() => handleSelectSection(item)}
                  >
                    <Text style={styles.selectActionText}>Select</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeAction}
                    onPress={() => handleDeleteSection(item.id, item.name)}
                  >
                    <Text style={styles.removeActionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No sections available</Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCreateSection}
            >
              <Text style={styles.buttonText}>Create New Section</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={handleViewDashboard}
            >
              <Text style={styles.buttonText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFF",
    marginBottom: 6,
  },
  sectionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sectionDate: {
    fontSize: 12,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  selectAction: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectActionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  removeAction: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeActionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  tertiaryButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
