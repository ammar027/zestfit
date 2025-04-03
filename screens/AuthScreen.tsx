import React, { useState, useEffect, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, Keyboard, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { RootStackParamList } from "../types/navigation"
import { DrawerNavigationProp } from "@react-navigation/drawer"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { AuthContext } from "../App"

type AuthScreenNavigationProp = DrawerNavigationProp<RootStackParamList, "Auth">

export default function AuthScreen() {
  const [mode, setMode] = useState("login") // or 'signup'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigation = useNavigation<AuthScreenNavigationProp>()
  const { setIsLoggedIn } = useContext(AuthContext)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const { height: screenHeight } = Dimensions.get("window")

  // Check for existing session to auto-login
  useEffect(() => {
    checkForExistingSession()
  }, [])

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const checkForExistingSession = async () => {
    try {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        // Update global auth state
        setIsLoggedIn(true)
        // Redirect to Home screen
        navigation.navigate("Home")
      }
    } catch (error: any) {
      console.error("Session check error:", error.message)
      setIsLoggedIn(false)
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
          // Update global auth state
          setIsLoggedIn(true)
          // Redirect to Home screen
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

          // Don't set global auth state for signup until email verification
          // setIsLoggedIn(true)
        }

        Alert.alert("Signup Successful", "Please check your email for confirmation", [{ text: "OK", onPress: () => setMode("login") }])
      }
    } catch (error: any) {
      Alert.alert(`${mode === "login" ? "Login" : "Signup"} Error`, error.message)
      setIsLoggedIn(false)
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 20}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.logoContainer, keyboardVisible && styles.logoContainerSmall]}>
            <Image
              source={require("../assets/icons/adaptive-icon.png")}
              style={{
                width: keyboardVisible ? 200 : 320,
                height: keyboardVisible ? 200 : 320,
                alignSelf: "center",
                marginVertical: keyboardVisible ? -30 : -70,
                marginBottom: keyboardVisible ? -80 : -120,
              }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerContainer}>
            {/* <Text style={styles.header}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text> */}
            <Text style={styles.subHeader}>{mode === "login" ? "Sign in to access your health and fitness journey" : "Join ZestFit to start your health and fitness journey"}</Text>
          </View>

          <View style={styles.formContainer}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={22} color="#7A869A" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" returnKeyType="next" blurOnSubmit={false} />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#7A869A" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" blurOnSubmit={false} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={22} color="#7A869A" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" returnKeyType={mode === "login" ? "done" : "next"} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={22} color="#7A869A" />
                </TouchableOpacity>
              </View>
            </View>

            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#7A869A" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCapitalize="none" returnKeyType="done" />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#7A869A" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mode === "login" && (
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons name={mode === "login" ? "login" : "account-plus"} size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode(mode === "login" ? "signup" : "login")} activeOpacity={0.8}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name={mode === "login" ? "account-plus-outline" : "login-variant"} size={20} color="#2C3F00" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>{mode === "login" ? "Create New Account" : "Sign In Instead"}</Text>
            </View>
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
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 5,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    height: 52,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 4,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPasswordText: {
    textAlign: "right",
    color: "#2C3F00",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "500",
  },
  primaryButton: {
    height: 56,
    backgroundColor: "#2C3F00",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
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
    marginTop: 7,
  },
  secondaryButtonText: {
    color: "#2C3F00",
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
    color: "#2C3F00",
    fontWeight: "500",
  },
  logoContainerSmall: {
    marginBottom: 0,
  },
})
