import React, { useState, useEffect, useContext } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView, Image, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { AuthContext } from "../App"
import { useTheme } from "../theme"
import ThemeToggle from "../components/ThemeToggle"
import { ProfileData, RootStackParamList } from "../types/navigation"

export default function ProfileScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<RootStackParamList, "Tabs">>()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const { setIsLoggedIn: setAppIsLoggedIn } = useContext(AuthContext)
  const { theme } = useTheme()

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: "",
    age: "",
    height: "",
    weight: "",
    gender: "",
    goal: "",
    activity_level: "",
    medical_conditions: "",
    avatar_url: null,
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const { height: screenHeight } = Dimensions.get("window")

  // Check for updated profile from the details screen
  useEffect(() => {
    if (route.params && "updatedProfile" in route.params) {
      setProfile(route.params.updatedProfile as ProfileData)
    }
  }, [route.params])

  // Load profile data from Supabase on mount
  useEffect(() => {
    getCurrentUser()
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

  const getCurrentUser = async () => {
    try {
      setLoading(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (userData && userData.user) {
        setUserId(userData.user.id)
        setIsLoggedIn(true)
        setAppIsLoggedIn(true)
        await loadProfile(userData.user.id)
      } else {
        // No user is logged in
        setIsLoggedIn(false)
        setAppIsLoggedIn(false)
      }
    } catch (err) {
      console.error("Error getting current user:", err)
      setIsLoggedIn(false)
      setAppIsLoggedIn(false)
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async (id: string) => {
    try {
      // First get user metadata from auth
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      const fullName = userData.user?.user_metadata?.full_name || ""

      // Then get profile data from profiles table
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", id).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setProfile({
          full_name: data.full_name || fullName,
          username: data.username || userData.user.email || "",
          age: data.age ? String(data.age) : "",
          height: data.height ? String(data.height) : "",
          weight: data.weight ? String(data.weight) : "",
          gender: data.gender || "",
          goal: data.goal || "",
          activity_level: data.activity_level || "",
          medical_conditions: data.medical_conditions || "",
          avatar_url: data.avatar_url,
        })
      } else {
        // If no profile exists yet, just use auth data
        setProfile((prev) => ({
          ...prev,
          full_name: fullName,
          username: userData.user.email || prev.username,
        }))
      }
    } catch (err) {
      console.error("Profile loading error:", err)
      Alert.alert("Error", "Failed to load profile information")
    }
  }

  const saveProfile = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.")
      return
    }

    setSaving(true)
    try {
      const updates = {
        user_id: userId,
        username: profile.username,
        full_name: profile.full_name,
        age: profile.age ? parseInt(profile.age, 10) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        gender: profile.gender,
        goal: profile.goal,
        activity_level: profile.activity_level,
        medical_conditions: profile.medical_conditions,
        updated_at: new Date(),
      }

      // Using proper upsert with the correct options
      const { error } = await supabase.from("profiles").upsert(updates, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      })

      if (error) throw error

      Alert.alert("Success", "Profile updated successfully")
    } catch (err: any) {
      console.error("Profile update error:", err)
      Alert.alert("Error", "Failed to update profile: " + (err.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setIsLoggedIn(false)
      setAppIsLoggedIn(false)
      // Stay on profile tab - it will show auth screen since we're logged out
    } catch (err) {
      console.error("Logout error:", err)
      Alert.alert("Error", "Failed to log out")
    } finally {
      setLoading(false)
    }
  }

  const navigateToAuth = () => {
    // Navigate to Auth stack
    navigation.navigate("Auth" as never)
  }

  const navigateToPersonalDetails = () => {
    // Navigate to the personal details screen with the profile data
    navigation.navigate("PersonalDetails", { userId, profile })
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // Not logged in view
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.text,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>

          <View style={styles.headerRight}>
            <ThemeToggle />
          </View>
        </View>
        <View style={styles.notLoggedInContainer}>
          <MaterialCommunityIcons name="account-lock" size={70} color={theme.colors.subtext} />
          <Text style={[styles.notLoggedInText, { color: theme.colors.text }]}>You need to sign in to view and manage your profile</Text>
          <TouchableOpacity style={[styles.signInButton, { backgroundColor: theme.colors.primary }]} onPress={navigateToAuth}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.text,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{profile.full_name || "Profile"}</Text>
        <View style={styles.headerRight}>
          <ThemeToggle />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Main Action Buttons */}
          <View style={styles.mainButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.mainActionButton,
                {
                  backgroundColor: theme.colors.card,
                  shadowColor: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={navigateToPersonalDetails}
            >
              <MaterialCommunityIcons name="account-details" size={24} color={theme.colors.primary} />
              <Text style={[styles.mainActionButtonText, { color: theme.colors.text }]}>Edit Personal Details</Text>
            </TouchableOpacity>
          </View>

          {/* Utilities Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.card,
                shadowColor: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Utilities</Text>

            <View style={styles.utilities}>
              <TouchableOpacity
                style={[
                  styles.utilityCard,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    shadowColor: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => navigation.navigate("Trackers" as never)}
              >
                <MaterialCommunityIcons name="scale" size={32} color={theme.colors.primary} />
                <Text style={[styles.utilityCardTitle, { color: theme.colors.text }]}>Weight Tracker</Text>
                <Text style={[styles.utilityCardDescription, { color: theme.colors.subtext }]}>Track and manage weight progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.utilityCard,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    shadowColor: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => navigation.navigate("WaterTracker" as never)}
              >
                <MaterialCommunityIcons name="water" size={32} color={theme.colors.primary} />
                <Text style={[styles.utilityCardTitle, { color: theme.colors.text }]}>Water Tracker</Text>
                <Text style={[styles.utilityCardDescription, { color: theme.colors.subtext }]}>Track your daily water intake</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.utilities, { marginTop: 12 }]}>
              <TouchableOpacity
                style={[
                  styles.utilityCard,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    shadowColor: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => navigation.navigate("Goals" as never)}
              >
                <MaterialCommunityIcons name="clipboard-list" size={32} color={theme.colors.primary} />
                <Text style={[styles.utilityCardTitle, { color: theme.colors.text }]}>Goals Editor</Text>
                <Text style={[styles.utilityCardDescription, { color: theme.colors.subtext }]}>Manage nutrition targets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.utilityCard,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    shadowColor: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => navigation.navigate("Chat" as never)}
              >
                <MaterialCommunityIcons name="chat-processing" size={32} color={theme.colors.primary} />
                <Text style={[styles.utilityCardTitle, { color: theme.colors.text }]}>Nutrition Chat</Text>
                <Text style={[styles.utilityCardDescription, { color: theme.colors.subtext }]}>Log and track daily meals</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: theme.dark ? "#382121" : "#FEE2E2",
                shadowColor: theme.colors.text,
                borderColor: theme.dark ? "#4D2C2C" : "#FECACA",
              },
            ]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color={theme.dark ? "#FFAAAA" : "#B91C1C"} />
            <Text style={[styles.signOutButtonText, { color: theme.dark ? "#FFAAAA" : "#B91C1C" }]}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Regular styles without theming
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
  },
  utilities: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  utilityCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    minHeight: 135,
  },
  utilityCardTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  utilityCardDescription: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  themeToggleContainer: {
    alignItems: "center",
    padding: 8,
  },
  themeToggleLabel: {
    fontSize: 16,
  },
  themeSection: {
    width: "85%",
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notLoggedInText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  signInButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  mainButtonsContainer: {
    marginBottom: 16,
  },
  mainActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    elevation: 1,
  },
  mainActionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
