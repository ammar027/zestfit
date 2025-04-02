import React, { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient" // Fixed typo in import
import { RootStackParamList } from "../types/navigation"
import { DrawerNavigationProp } from "@react-navigation/drawer"

type AuthScreenNavigationProp = DrawerNavigationProp<RootStackParamList, "Auth">

export default function AuthScreen() {
  const [mode, setMode] = useState("login") // or 'signup'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation<AuthScreenNavigationProp>()

  // Check for existing session to auto-login
  useEffect(() => {
    checkForExistingSession()
  }, [])

  const checkForExistingSession = async () => {
    try {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        // Redirect to Home screen instead of Profile
        navigation.navigate("Home")
      }
    } catch (error: any) {
      console.error("Session check error:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateInputs = () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password")
      return false
    }

    if (mode === "signup") {
      if (!fullName) {
        Alert.alert("Missing Field", "Please enter your full name")
        return false
      }

      if (password !== confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match")
        return false
      }

      if (password.length < 6) {
        Alert.alert("Weak Password", "Password must be at least 6 characters")
        return false
      }
    }

    return true
  }

  const handleAuth = async () => {
    if (!validateInputs()) return

    setLoading(true)
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          // Redirect to Home screen instead of Profile
          navigation.navigate("Home")
        }
      } else {
        // Signup mode
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        // Create profile entry
        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            user_id: data.user.id,
            username: email,
            full_name: fullName,
            created_at: new Date(),
          })

          if (profileError) {
            console.error("Profile creation error:", profileError)
          }
        }

        Alert.alert("Signup Successful", "Please check your email for confirmation", [{ text: "OK", onPress: () => setMode("login") }])
      }
    } catch (error: any) {
      Alert.alert(`${mode === "login" ? "Login" : "Signup"} Error`, error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email to reset password")
      return
    }

    Alert.alert("Reset Password", "Would you like to reset your password?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setLoading(true)
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error
            Alert.alert("Password Reset", "Check your email for the password reset link")
          } catch (error: any) {
            Alert.alert("Reset Failed", error.message)
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>Z</Text>
            </View>
            <Text style={styles.appName}>ZestFit</Text>
          </View>

          <Text style={styles.header}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>

          <View style={styles.formContainer}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" returnKeyType="next" blurOnSubmit={false} />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="your.email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" blurOnSubmit={false} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" returnKeyType={mode === "login" ? "done" : "next"} />
            </View>

            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput style={styles.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" returnKeyType="done" />
              </View>
            )}

            {mode === "login" && (
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode(mode === "login" ? "signup" : "login")} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>{mode === "login" ? "Create New Account" : "Sign In Instead"}</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#4184E4",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
  },
  forgotPasswordText: {
    textAlign: "right",
    color: "#4184E4",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    height: 56,
    backgroundColor: "#4184E4",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#DFE1E6",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#7A869A",
    fontSize: 14,
  },
  secondaryButton: {
    height: 56,
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#4184E4",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    textAlign: "center",
    color: "#7A869A",
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: "#4184E4",
    fontWeight: "500",
  },
})
