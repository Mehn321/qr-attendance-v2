import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export interface Teacher {
  teacherId: string;
  fullName: string;
  email?: string;
}

export interface AuthState {
  token: string | null;
  teacherId: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  teacher: Teacher | null;
  selectedSection: string | null;
  selectedSectionId: string | null;
  sessionStartTime: number | null;

  setAuth: (
    token: string,
    teacherId: string,
    teacherName: string,
    teacherEmail?: string
  ) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setSelectedSection: (sectionId: string, sectionName: string) => Promise<void>;
  clearSelectedSection: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const authStore = create<AuthState>((set) => ({
  token: null,
  teacherId: null,
  teacherName: null,
  teacherEmail: null,
  teacher: null,
  selectedSection: null,
  selectedSectionId: null,
  sessionStartTime: null,

  setAuth: async (token: string, teacherId: string, teacherName: string, teacherEmail?: string) => {
    try {
      await SecureStore.setItemAsync("authToken", token);
      await AsyncStorage.setItem("teacherId", teacherId);
      await AsyncStorage.setItem("teacherName", teacherName);
      if (teacherEmail) {
        await AsyncStorage.setItem("teacherEmail", teacherEmail);
      }
      await AsyncStorage.setItem("sessionStartTime", Date.now().toString());

      set({
        token,
        teacherId,
        teacherName,
        teacherEmail: teacherEmail || null,
        teacher: {
          teacherId,
          fullName: teacherName,
          email: teacherEmail,
        },
        sessionStartTime: Date.now(),
      });
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await AsyncStorage.removeItem("teacherId");
      await AsyncStorage.removeItem("teacherName");
      await AsyncStorage.removeItem("teacherEmail");
      await AsyncStorage.removeItem("sessionStartTime");

      set({
        token: null,
        teacherId: null,
        teacherName: null,
        teacherEmail: null,
        teacher: null,
        selectedSection: null,
        selectedSectionId: null,
        sessionStartTime: null,
      });
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  },

  logout: async () => {
    // logout is an alias for clearAuth
    const { clearAuth } = authStore.getState();
    await clearAuth();
  },

  setSelectedSection: async (sectionId: string, sectionName: string) => {
    try {
      await AsyncStorage.setItem("selectedSectionId", sectionId);
      await AsyncStorage.setItem("selectedSection", sectionName);

      set({
        selectedSectionId: sectionId,
        selectedSection: sectionName,
      });
    } catch (error) {
      console.error("Error setting section:", error);
    }
  },

  clearSelectedSection: async () => {
    try {
      await AsyncStorage.removeItem("selectedSectionId");
      await AsyncStorage.removeItem("selectedSection");

      set({
        selectedSectionId: null,
        selectedSection: null,
      });
    } catch (error) {
      console.error("Error clearing section:", error);
    }
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const teacherId = await AsyncStorage.getItem("teacherId");
      const teacherName = await AsyncStorage.getItem("teacherName");
      const teacherEmail = await AsyncStorage.getItem("teacherEmail");
      const sessionStartTime = await AsyncStorage.getItem("sessionStartTime");
      const selectedSectionId = await AsyncStorage.getItem("selectedSectionId");
      const selectedSection = await AsyncStorage.getItem("selectedSection");

      if (token && teacherId) {
        set({
          token,
          teacherId,
          teacherName,
          teacherEmail,
          teacher: teacherName
            ? {
                teacherId,
                fullName: teacherName,
                email: teacherEmail || undefined,
              }
            : null,
          sessionStartTime: sessionStartTime
            ? parseInt(sessionStartTime)
            : null,
          selectedSectionId,
          selectedSection,
        });
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    }
  },
}));
