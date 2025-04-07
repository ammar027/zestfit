import React, { useState, useEffect, useContext, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView, Platform, Keyboard, Switch, Animated, Pressable } from "react-native"
import { useNavigation, NavigationProp, ParamListBase, DrawerActions } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { AuthContext } from "../App"
import { useTheme } from "../theme"

type ProfileData = {
  full_name: string
  username: string
  age: string
  height: string
  weight: string
  gender: string
  goal: string
  activity_level: string
  medical_conditions: string
}

// Add type definitions at the top of the file
type ProfileCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  title: string
  subtitle?: string
  onPress: () => void
  theme: any // Using any for simplicity, ideally should use proper theme type
  isPrimary?: boolean
}

// Component for stacked card navigation
const ProfileCard = ({ icon, title, subtitle, onPress, theme, isPrimary = false }: ProfileCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ marginBottom: 16 }}>
      <Animated.View
        style={[
          styles.profileCard,
          {
            backgroundColor: isPrimary ? (theme.dark ? "rgba(52, 199, 89, 0.15)" : "rgba(52, 199, 89, 0.08)") : theme.dark ? "rgba(255, 255, 255, 0.05)" : theme.colors.card,
            borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={isPrimary ? theme.colors.primary : theme.colors.text} />
          </View>
          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardTitle,
                {
                  color: isPrimary ? theme.colors.primary : theme.colors.text,
                  fontWeight: isPrimary ? "700" : "600",
                },
              ]}
            >
              {title}
            </Text>
            {subtitle && <Text style={[styles.cardSubtitle, { color: theme.colors.subtext }]}>{subtitle}</Text>}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={isPrimary ? theme.colors.primary : theme.colors.subtext} />
        </View>
      </Animated.View>
    </Pressable>
  )
}

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const { setIsLoggedIn: setAppIsLoggedIn } = useContext(AuthContext)
  const { theme, colorScheme, toggleColorScheme } = useTheme()
  const spinValue = useRef(new Animated.Value(0)).current
  const welcomeOpacity = useRef(new Animated.Value(0)).current
  const cardsTranslateY = useRef(new Animated.Value(20)).current

  // Declare loading state earlier in the component
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

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
  })

  // Trigger spin animation when theme changes
  useEffect(() => {
    Animated.timing(spinValue, {
      toValue: colorScheme === "dark" ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [colorScheme, spinValue])

  // Animation for content when loaded
  useEffect(() => {
    if (!loading && isLoggedIn) {
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(cardsTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading, isLoggedIn])

  // Create the rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  })

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

  const navigateToPersonalInfo = () => {
    // Create a function that accepts updated profile data
    const handleSavePersonalInfo = async (updatedProfile: ProfileData) => {
      // Update the local profile state
      setProfile(updatedProfile)
      // Call the original saveProfile function with the updated data
      return saveProfile()
    }

    // Navigate to the Personal Info screen with profile data and save handler
    navigation.navigate("PersonalInfo", {
      profile,
      saveProfile: handleSavePersonalInfo,
    })
  }

  const navigateToFitnessInfo = () => {
    // Create a function that accepts updated profile data
    const handleSaveFitnessInfo = async (updatedProfile: ProfileData) => {
      // Update the local profile state
      setProfile(updatedProfile)
      // Call the original saveProfile function with the updated data
      return saveProfile()
    }

    // Navigate to the Fitness Info screen with profile data and save handler
    navigation.navigate("FitnessInfo", {
      profile,
      saveProfile: handleSaveFitnessInfo,
    })
  }

  const navigateToWeightTracker = () => {
    navigation.navigate("Weight")
  }

  const navigateToWaterTracker = () => {
    navigation.navigate("Water")
  }

  // Theme toggle component
  const ThemeToggle = () => {
    return (
      <View style={styles.themeToggleContainer}>
        <View style={styles.themeToggleRow}>
          <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 12 }}>
            <MaterialCommunityIcons name={colorScheme === "dark" ? "weather-night" : "white-balance-sunny"} size={24} color={theme.colors.primary} />
          </Animated.View>
          <Text style={[styles.themeToggleText, { color: theme.colors.text }]}>{colorScheme === "dark" ? "Dark Mode" : "Light Mode"}</Text>
        </View>
        <Switch
          value={colorScheme === "dark"}
          onValueChange={toggleColorScheme}
          trackColor={{
            false: Platform.OS === "ios" ? "#E9E9EA" : "rgba(0,0,0,0.1)",
            true: theme.colors.primary,
          }}
          thumbColor={Platform.OS === "ios" ? "#FFFFFF" : colorScheme === "dark" ? theme.colors.primary : "#FFFFFF"}
          ios_backgroundColor="#E9E9EA"
        />
      </View>
    )
  }

  // // Loading indicator
  // if (loading) {
  //   return (
  //     <View style={[styles.centeredContainer, { backgroundColor: theme.colors.background }]}>
  //       <ActivityIndicator size="large" color={theme.colors.primary} />
  //     </View>
  //   )
  // }

  // Not logged in view
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <ThemeToggle />
        </View>

        <View style={styles.centeredContainer}>
          <View style={styles.loginPromptContainer}>
            <MaterialCommunityIcons name="shield-account" size={52} color={theme.colors.primary} style={styles.loginIcon} />
            <Text style={[styles.loginTitle, { color: theme.colors.text }]}>Welcome to ZestFit</Text>
            <Text style={[styles.loginSubtitle, { color: theme.colors.subtext }]}>Sign in to access your profile, track workouts, and reach your fitness goals</Text>

            <TouchableOpacity style={[styles.signInButton, { backgroundColor: theme.colors.primary }]} onPress={navigateToAuth}>
              <View style={styles.signInButtonContent}>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Logged in view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <MaterialCommunityIcons name="menu" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        <ThemeToggle />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <Animated.View style={{ opacity: welcomeOpacity }}>
          <View
            style={[
              styles.welcomeContainer,
              {
                backgroundColor: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(52, 199, 89, 0.03)",
                borderColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(52, 199, 89, 0.2)",
              },
            ]}
          >
            <View style={styles.welcomeContent}>
              <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
                Hello, <Text style={{ fontWeight: "700" }}>{profile.full_name || "User"}</Text>
              </Text>
              <Text style={[styles.emailText, { color: theme.colors.subtext }]}>{profile.username}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Cards Section */}
        <Animated.View style={{ transform: [{ translateY: cardsTranslateY }] }}>
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Information</Text>

            <ProfileCard icon="account-details" title="Personal Information" subtitle="Name, email, age, and more" onPress={navigateToPersonalInfo} theme={theme} isPrimary={true} />

            <ProfileCard icon="run" title="Fitness Information" subtitle="Goals, activity level, medical conditions" onPress={navigateToFitnessInfo} theme={theme} />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tracking</Text>

            <ProfileCard icon="scale-bathroom" title="Weight Tracker" subtitle="Monitor your weight progress" onPress={navigateToWeightTracker} theme={theme} />

            <ProfileCard icon="water" title="Water Tracker" subtitle="Track your daily hydration" onPress={navigateToWaterTracker} theme={theme} />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: theme.dark ? "rgba(255,59,48,0.1)" : "rgba(255,59,48,0.05)",
                  borderColor: theme.dark ? "rgba(255,59,48,0.3)" : "rgba(255,59,48,0.2)",
                },
              ]}
              onPress={handleLogout}
            >
              <View style={styles.logoutContent}>
                <MaterialCommunityIcons name="logout" size={22} color={theme.dark ? "#FF6B6B" : "#FF3B30"} />
                <Text style={[styles.logoutText, { color: theme.dark ? "#FF6B6B" : "#FF3B30" }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    right: 35,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  themeToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  welcomeContainer: {
    borderRadius: 16,
    marginVertical: 16,
    padding: 20,
    borderWidth: 1,
  },
  welcomeContent: {
    flexDirection: "column",
  },
  welcomeText: {
    fontSize: 22,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  loginPromptContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loginIcon: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  signInButton: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  signInButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
  },
})
