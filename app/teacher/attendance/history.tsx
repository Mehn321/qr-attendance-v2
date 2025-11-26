import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { apiClient, OFFLINE_MODE } from "../../../hooks/useApi";
import { offlineApi } from "../../../hooks/useOfflineApi";
import { authStore } from "../../../store/authStore";

interface AttendanceRecord {
  id: string;
  studentId: string;
  fullName: string;
  department: string;
  section: string;
  subject?: string;
  sectionId?: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  status: string;
}

interface Section {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  sections?: string[]; // section IDs in this subject
}

export default function AttendanceHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacherId } = authStore();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sectionSubjectMap, setSectionSubjectMap] = useState<
    Map<string, string>
  >(new Map());
  const [error, setError] = useState("");

  // Load sections and subjects only once on mount
  useEffect(() => {
    loadSections();
    loadSubjects();
  }, []);

  // Load and filter attendance when filters change
  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedSection, searchQuery, selectedSubject]);

  // Apply filters to records
  useEffect(() => {
    applyFilters();
  }, [
    allRecords,
    searchQuery,
    selectedSection,
    selectedDate,
    selectedSubject,
    sectionSubjectMap,
  ]);

  const loadSections = async () => {
    try {
      setError("");
      if (OFFLINE_MODE) {
        console.log("📱 Loading sections from OFFLINE MODE");
        if (teacherId) {
          const offlineSections = await offlineApi.getSections(teacherId);
          const mapped = offlineSections.map((s: any) => ({
            id: s.id,
            name: s.name,
          }));
          setSections(mapped);

          // Build section to subject map
          const map = new Map<string, string>();
          offlineSections.forEach((s: any) => {
            if (s.subjectId) {
              map.set(s.id, s.subjectId);
            }
          });
          setSectionSubjectMap(map);
          console.log("✅ Loaded", mapped.length, "sections");
          console.log("📍 Section-Subject map built:", map);
        }
      } else {
        console.log("🔌 Loading sections from ONLINE API");
        const response = await apiClient.get("/sections");
        const sectionList = response.data.sections || [];
        setSections(sectionList);

        // Build section to subject map
        const map = new Map<string, string>();
        sectionList.forEach((s: any) => {
          if (s.subjectId) {
            map.set(s.id, s.subjectId);
          }
        });
        setSectionSubjectMap(map);
        console.log("✅ Loaded", sectionList.length, "sections");
        console.log("📍 Section-Subject map built:", map);
      }
    } catch (err: any) {
      console.error("Error loading sections:", err);
      setError("Failed to load sections");
    }
  };

  const loadSubjects = async () => {
    try {
      if (OFFLINE_MODE) {
        console.log("📱 Loading subjects from OFFLINE MODE");
        if (teacherId) {
          const offlineSubjects = await offlineApi.getSubjects(teacherId);
          const mapped = offlineSubjects.map((s: any) => ({
            id: s.id,
            name: s.name,
          }));
          setSubjects(mapped);
          console.log("✅ Loaded", mapped.length, "subjects");
        }
      } else {
        console.log("🔌 Loading subjects from ONLINE API");
        const response = await apiClient.get("/subjects");
        const subjectList = response.data.subjects || [];
        setSubjects(subjectList);
        console.log("✅ Loaded", subjectList.length, "subjects");
      }
    } catch (err: any) {
      console.error("Error loading subjects:", err);
      // Don't fail if subjects can't be loaded
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      if (OFFLINE_MODE) {
        console.log("📱 Loading attendance from OFFLINE MODE");
        const allAttendance = await offlineApi.getAllAttendance();
        const sectionData = await offlineApi.getAllSections();

        // ✅ CRITICAL: Filter attendance by teacher
        const teacherAttendance = allAttendance.filter((a: any) => a.teacherId === teacherId);

        // Map section IDs to section names
        const sectionMap = new Map(sectionData.map((s: any) => [s.id, s.name]));

        const transformed = teacherAttendance.map((a: any) => ({
          id: a.id,
          studentId: a.studentId,
          fullName: a.studentName,
          department: a.course,
          section: sectionMap.get(a.sectionId) || a.sectionId,
          sectionId: a.sectionId,
          date: a.createdAt.split("T")[0],
          timeIn: a.timeIn,
          timeOut: a.timeOut || null,
          status: a.timeOut ? "Checked Out" : "Checked In",
        }));

        setAllRecords(transformed);
        console.log("✅ Loaded", transformed.length, "attendance records for teacher", teacherId);
      } else {
        console.log("🔌 Loading attendance from ONLINE API");
        const dateStr = selectedDate.toISOString().split("T")[0];

        const response = await apiClient.get("/attendance/history", {
          params: {
            date: dateStr,
            section: selectedSection !== "all" ? selectedSection : undefined,
          },
        });

        const recordList = response.data.records || [];
        setAllRecords(recordList);
        console.log("✅ Loaded", recordList.length, "attendance records");
      }
    } catch (err: any) {
      console.error("Error loading attendance:", err);
      setError("Failed to load attendance records");
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allRecords];

    // Filter by date (offline mode)
    if (OFFLINE_MODE) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      filtered = filtered.filter((record) => record.date === dateStr);
    }

    // Filter by subject
    if (selectedSubject !== "all") {
      console.log("🔍 Filtering by subject:", selectedSubject);
      console.log("📍 Using map:", sectionSubjectMap);
      filtered = filtered.filter((record) => {
        const recordSectionId = record.sectionId;
        const recordSubjectId = sectionSubjectMap.get(recordSectionId);
        console.log(
          `  Record ${
            record.studentId
          }: sectionId=${recordSectionId}, subjectId=${recordSubjectId}, selected=${selectedSubject}, match=${
            recordSubjectId === selectedSubject
          }`
        );
        return recordSubjectId === selectedSubject;
      });
    }

    // Filter by section
    if (selectedSection !== "all") {
      filtered = filtered.filter(
        (record) => (record as any).sectionId === selectedSection
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.fullName.toLowerCase().includes(query) ||
          record.studentId.toLowerCase().includes(query)
      );
    }

    setRecords(filtered);
  }, [
    allRecords,
    searchQuery,
    selectedSection,
    selectedDate,
    selectedSubject,
    sectionSubjectMap,
  ]);

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSection("all");
    setSelectedSubject("all");
    setSelectedDate(new Date());
  };

  const renderEmptyState = () => {
    if (allRecords.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>📋 No attendance records found</Text>
          <Text style={styles.emptySubtext}>
            Try a different date or section
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>🔍 No matching records</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Search input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />

        {/* Date picker button */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {/* Subject filter */}
        {subjects.length > 0 && (
          <View style={styles.sectionFilterContainer}>
            <Text style={styles.filterLabel}>Subject:</Text>
            <View style={styles.sectionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.sectionButton,
                  selectedSubject === "all" && styles.sectionButtonActive,
                ]}
                onPress={() => setSelectedSubject("all")}
              >
                <Text
                  style={[
                    styles.sectionButtonText,
                    selectedSubject === "all" && styles.sectionButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.sectionButton,
                    selectedSubject === subject.id &&
                      styles.sectionButtonActive,
                  ]}
                  onPress={() => setSelectedSubject(subject.id)}
                >
                  <Text
                    style={[
                      styles.sectionButtonText,
                      selectedSubject === subject.id &&
                        styles.sectionButtonTextActive,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section filter */}
        <View style={styles.sectionFilterContainer}>
          <Text style={styles.filterLabel}>Section:</Text>
          <View style={styles.sectionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.sectionButton,
                selectedSection === "all" && styles.sectionButtonActive,
              ]}
              onPress={() => setSelectedSection("all")}
            >
              <Text
                style={[
                  styles.sectionButtonText,
                  selectedSection === "all" && styles.sectionButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {sections.length > 0 ? (
              sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.sectionButton,
                    selectedSection === section.id &&
                      styles.sectionButtonActive,
                  ]}
                  onPress={() => setSelectedSection(section.id)}
                >
                  <Text
                    style={[
                      styles.sectionButtonText,
                      selectedSection === section.id &&
                        styles.sectionButtonTextActive,
                    ]}
                  >
                    {section.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noSectionsText}>No sections</Text>
            )}
          </View>
        </View>
      </View>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}

      {/* Records list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : records.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.listWrapper}>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {records.length} record{records.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>{item.fullName}</Text>
                    <Text style={styles.recordId}>ID: {item.studentId}</Text>
                  </View>
                  <Text
                    style={[styles.recordStatus, getStatusStyle(item.status)]}
                  >
                    {item.status}
                  </Text>
                </View>

                <View style={styles.recordDetailsRow}>
                  <View style={styles.recordDetailsLeft}>
                    <Text style={styles.recordDetail}>
                      {item.department} • {item.section}
                    </Text>
                    {item.subject && (
                      <Text style={styles.recordSubject}>
                        Subject: {item.subject}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.recordDate}>{item.date}</Text>
                </View>

                <View style={styles.timeContainer}>
                  {item.timeIn ? (
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>In:</Text>
                      <Text style={styles.timeValue}>
                        {new Date(item.timeIn).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                    </View>
                  ) : null}
                  {item.timeOut ? (
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>Out:</Text>
                      <Text style={styles.timeValue}>
                        {new Date(item.timeOut).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Checked In":
    case "In":
      return { color: "#34C759" };
    case "Checked Out":
    case "Out":
    case "Completed":
      return { color: "#007AFF" };
    default:
      return { color: "#FF3B30" };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "500",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
    gap: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  sectionFilterContainer: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginLeft: 4,
  },
  sectionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  sectionButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sectionButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  sectionButtonTextActive: {
    color: "#fff",
  },
  noSectionsText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  listWrapper: {
    flex: 1,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  countText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#bbb",
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  recordId: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  recordStatus: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  recordDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recordDetailsLeft: {
    flex: 1,
    gap: 4,
  },
  recordDetail: {
    fontSize: 12,
    color: "#666",
  },
  recordSubject: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  recordDate: {
    fontSize: 12,
    color: "#999",
  },
  timeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  timeValue: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },
});
