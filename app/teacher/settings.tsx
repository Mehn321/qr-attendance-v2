import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { authStore } from "../../store/authStore";
import { apiClient, OFFLINE_MODE } from "../../hooks/useApi";
import { offlineApi } from "../../hooks/useOfflineApi";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teacher, token } = authStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password validation rules (same as registration)
  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
  };

  const isNewPasswordValid = Object.values(passwordRules).every((rule) => rule);

  const validateForm = () => {
    if (!currentPassword.trim()) {
      setError("Current password is required");
      return false;
    }
    if (!newPassword.trim()) {
      setError("New password is required");
      return false;
    }
    if (!isNewPasswordValid) {
      setError(
        "New password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
      );
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Changing password...");

      let response;

      if (OFFLINE_MODE) {
        console.log("📱 Using OFFLINE MODE");
        response = await offlineApi.changePassword(
          currentPassword,
          newPassword
        );
      } else {
        console.log("🔌 Using ONLINE MODE");
        const apiResponse = await apiClient.post(
          "/teacher/change-password",
          {
            currentPassword,
            newPassword,
            confirmPassword,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        response = apiResponse.data;
      }

      console.log("Change password response:", response);

      if (response.success) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Show success alert and navigate back
        Alert.alert(
          "Success",
          "Your password has been changed successfully",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        setError(response.message || "Failed to change password. Please try again.");
      }
    } catch (err: any) {
      console.error("Change password error:", err);

      let errorMessage = "Failed to change password. Please try again.";

      if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.message ||
          "Invalid input. Check your information.";
      } else if (err.response?.status === 401) {
        errorMessage = "Current password is incorrect";
      } else if (err.message === "Network Error") {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      console.error("Error message set:", errorMessage);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Account Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                 <Text style={styles.infoLabel}>Name</Text>
                 <Text style={styles.infoValue}>{teacher?.fullName || "N/A"}</Text>
               </View>
            </View>
          </View>

          {/* Change Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <View style={styles.form}>
              {/* Current Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showNewPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Password Requirements */}
                {newPassword.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>
                      Password Requirements:
                    </Text>
                    <View style={styles.requirementItem}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          passwordRules.minLength
                            ? styles.valid
                            : styles.invalid,
                        ]}
                      >
                        {passwordRules.minLength ? "✓" : "✗"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRules.minLength
                            ? styles.validText
                            : styles.invalidText,
                        ]}
                      >
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          passwordRules.hasUppercase
                            ? styles.valid
                            : styles.invalid,
                        ]}
                      >
                        {passwordRules.hasUppercase ? "✓" : "✗"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRules.hasUppercase
                            ? styles.validText
                            : styles.invalidText,
                        ]}
                      >
                        One uppercase letter (A-Z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          passwordRules.hasLowercase
                            ? styles.valid
                            : styles.invalid,
                        ]}
                      >
                        {passwordRules.hasLowercase ? "✓" : "✗"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRules.hasLowercase
                            ? styles.validText
                            : styles.invalidText,
                        ]}
                      >
                        One lowercase letter (a-z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          passwordRules.hasNumber
                            ? styles.valid
                            : styles.invalid,
                        ]}
                      >
                        {passwordRules.hasNumber ? "✓" : "✗"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRules.hasNumber
                            ? styles.validText
                            : styles.invalidText,
                        ]}
                      >
                        One number (0-9)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          passwordRules.hasSpecialChar
                            ? styles.valid
                            : styles.invalid,
                        ]}
                      >
                        {passwordRules.hasSpecialChar ? "✓" : "✗"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRules.hasSpecialChar
                            ? styles.validText
                            : styles.invalidText,
                        ]}
                      >
                        One special character (!@#$%^&*...)
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error && <Text style={styles.error}>{error}</Text>}

              {/* Success Message */}
              {success && <Text style={styles.success}>{success}</Text>}

              {/* Change Password Button */}
              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={loading || !isNewPasswordValid}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
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
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#FFE5E5",
    borderRadius: 6,
  },
  success: {
    color: "#34C759",
    fontSize: 14,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
  },
  changePasswordButton: {
    backgroundColor: "#34C759",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  changePasswordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  requirementsContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9500",
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  requirementIcon: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 16,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
  valid: {
    color: "#34C759",
  },
  invalid: {
    color: "#FF3B30",
  },
  validText: {
    color: "#34C759",
  },
  invalidText: {
    color: "#666",
  },
});
