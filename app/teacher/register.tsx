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

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth } = authStore();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every((rule) => rule);

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Invalid email format");
      return false;
    }
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!password.trim()) {
      setError("Password is required");
      return false;
    }
    if (!isPasswordValid) {
      setError(
        "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
      );
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      console.log("Registering teacher...", {
        email: email.trim(),
        fullName: fullName.trim(),
      });

      let response;

      if (OFFLINE_MODE) {
        console.log("📱 Using OFFLINE MODE");
        response = await offlineApi.register(
          email.trim(),
          fullName.trim(),
          password
        );
      } else {
        console.log("🔌 Using ONLINE MODE");
        const apiResponse = await apiClient.post("/teacher/register", {
          email: email.trim(),
          fullName: fullName.trim(),
          password,
          confirmPassword,
        });
        response = apiResponse.data;
      }

      console.log("Registration response:", response);

      if (response.success && response.tempToken) {
        // Navigate to QR scan screen to verify with QR code
        console.log(
          "Navigating to QR scan screen for registration verification..."
        );
        router.replace({
          pathname: "/teacher/register-qr-scan",
          params: {
            tempToken: response.tempToken,
            tempTeacherId: response.tempTeacherId,
            fullName: fullName,
            email: email,
            isRegistration: "true",
          },
        });
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.message ||
          "Invalid input. Check your information.";
      } else if (err.response?.status === 409) {
        errorMessage = "Email already registered. Please login instead.";
      } else if (err.message === "Network Error") {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      console.error("Error message set:", errorMessage);

      // Show alert for specific errors
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("Email")
      ) {
        Alert.alert("Email Issue", errorMessage);
      }
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Teacher Registration</Text>

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
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Smith"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
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
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>
                    Password Requirements:
                  </Text>
                  <View style={styles.requirementItem}>
                    <Text
                      style={[
                        styles.requirementIcon,
                        passwordRules.minLength ? styles.valid : styles.invalid,
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
                        passwordRules.hasNumber ? styles.valid : styles.invalid,
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
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

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.backText}>← Back to Login</Text>
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
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
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
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#FFE5E5",
    borderRadius: 6,
  },
  registerButton: {
    backgroundColor: "#34C759",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 12,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backText: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
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
