import React, { useState, useEffect, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, Keyboard, Dimensions, Animated, StatusBar } from "react-native"
import { useNavigation, NavigationProp, ParamListBase, useRoute } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { AuthContext } from "../App"
import { useTheme } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

// Define the type for route params
type AuthScreenParams = {
  onLoginSuccess: () => void
}

export default function AuthScreen() {
  const { theme } = useTheme()
  const [mode, setMode] = useState("login") // or 'signup'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()
  const params = route.params as AuthScreenParams
  const { setIsLoggedIn } = useContext(AuthContext)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const { height: screenHeight } = Dimensions.get("window")
  const insets = useSafeAreaInsets()

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(20)).current

  // Start fade-in animation on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

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

  // Animation when switching between login/signup modes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [mode])

  const checkForExistingSession = async () => {
    try {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setIsLoggedIn(true)
        if (params?.onLoginSuccess) {
          params.onLoginSuccess()
        } else {
          navigation.goBack()
        }
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
          setIsLoggedIn(true)
          if (params?.onLoginSuccess) {
            params.onLoginSuccess()
          } else {
            navigation.goBack()
          }
        }
      } else {
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

  // Custom header component
  const Header = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
        <View style={{ width: 40 }} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      {/* <LinearGradient colors={theme.dark ? ["#1E1E28", "#242430"] : ["#f7f7fc", "#f0f0f7"]} style={StyleSheet.absoluteFill} /> */}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 20}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.logoContainer, keyboardVisible && styles.logoContainerSmall]}>
            <Image
              source={theme.dark ? require("../assets/icons/adaptive-icon-dark.png") : require("../assets/icons/adaptive-icon.png")}
              style={{
                width: keyboardVisible ? 200 : 290,
                height: keyboardVisible ? 200 : 290,
                alignSelf: "center",
                marginVertical: keyboardVisible ? -30 : -70,
                marginBottom: keyboardVisible ? -80 : -120,
              }}
              resizeMode="contain"
            />
          </View>

          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.subHeader, { color: theme.colors.subtext }]}>{mode === "login" ? "Sign in to access your health and fitness journey" : "Join ZestFit to start your health and fitness journey"}</Text>
          </Animated.View>

          <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
              <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.formGradient}>
                <View style={styles.formContainer}>
                  {mode === "signup" && (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Full Name</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: theme.colors.input.border,
                            backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                        <TextInput style={[styles.input, { color: theme.colors.input.text }]} placeholder="Enter your full name" placeholderTextColor={theme.colors.input.placeholder} value={fullName} onChangeText={setFullName} autoCapitalize="words" returnKeyType="next" blurOnSubmit={false} />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: theme.colors.input.border,
                          backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                      <TextInput style={[styles.input, { color: theme.colors.input.text }]} placeholder="Enter your email" placeholderTextColor={theme.colors.input.placeholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" blurOnSubmit={false} />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: theme.colors.input.border,
                          backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="lock-outline" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                      <TextInput style={[styles.input, { color: theme.colors.input.text }]} placeholder="Enter your password" placeholderTextColor={theme.colors.input.placeholder} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" returnKeyType={mode === "login" ? "done" : "next"} />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={22} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {mode === "signup" && (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirm Password</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: theme.colors.input.border,
                            backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="lock-outline" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                        <TextInput style={[styles.input, { color: theme.colors.input.text }]} placeholder="Confirm your password" placeholderTextColor={theme.colors.input.placeholder} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCapitalize="none" returnKeyType="done" />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                          <MaterialCommunityIcons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {mode === "login" && (
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity style={styles.buttonWrapper} onPress={handleAuth} disabled={loading} activeOpacity={0.7}>
              <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={styles.buttonBlurContainer}>
                <LinearGradient colors={[theme.colors.primary, `${theme.colors.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primaryButton]}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <MaterialCommunityIcons name={mode === "login" ? "login" : "account-plus"} size={20} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={[styles.primaryButtonText]}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
                    </View>
                  )}
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.subtext }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            </View>

            <TouchableOpacity style={styles.secondaryButtonWrapper} onPress={() => setMode(mode === "login" ? "signup" : "login")} activeOpacity={0.7}>
              <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.buttonBlurContainer, { borderColor: theme.colors.border }]}>
                <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={[styles.secondaryButton]}>
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons name={mode === "login" ? "account-plus-outline" : "login-variant"} size={20} color={theme.colors.text} style={styles.buttonIcon} />
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{mode === "login" ? "Create New Account" : "Sign In Instead"}</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: theme.colors.subtext }]}>
              By continuing, you agree to our <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Terms of Service</Text> and <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  formCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  formGradient: {
    padding: 20,
    borderRadius: 24,
  },
  formContainer: {
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 0,
    marginTop: -70,
    paddingTop: 20,
  },
  logoContainerSmall: {
    marginBottom: 0,
  },
  headerContainer: {
    marginBottom: 24,
  },
  subHeader: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
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
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPasswordText: {
    textAlign: "right",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "500",
  },
  buttonWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  secondaryButtonWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonBlurContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
})
