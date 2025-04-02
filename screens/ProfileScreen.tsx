import React, { useState, useEffect } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { RootStackParamList } from "../types/navigation"
import { DrawerNavigationProp } from "@react-navigation/drawer"

type ProfileScreenNavigationProp = DrawerNavigationProp<RootStackParamList, "Profile">

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
  avatar_url: string | null
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const [userId, setUserId] = useState<string | null>(null)

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

  // Load profile data from Supabase on mount
  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      setLoading(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (userData && userData.user) {
        setUserId(userData.user.id)
        await loadProfile(userData.user.id)
      } else {
        // No user is logged in, redirect to auth
        navigation.navigate("Auth")
      }
    } catch (err) {
      console.error("Error getting current user:", err)
      Alert.alert("Error", "Could not retrieve user information")
      navigation.navigate("Auth")
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
      navigation.navigate("Auth")
    } catch (err) {
      console.error("Logout error:", err)
      Alert.alert("Error", "Failed to log out")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4184E4" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarButton}>
                <Text style={styles.editAvatarText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.welcomeText}>Welcome, {profile.full_name || profile.username}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Your full name" value={profile.full_name} onChangeText={(text) => setProfile({ ...profile, full_name: text })} />

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput style={styles.input} placeholder="Username" value={profile.username} onChangeText={(text) => setProfile({ ...profile, username: text })} />

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={profile.age} onChangeText={(text) => setProfile({ ...profile, age: text })} />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TextInput style={styles.input} placeholder="Gender" value={profile.gender} onChangeText={(text) => setProfile({ ...profile, gender: text })} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>

          <View style={styles.rowContainer}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput style={styles.input} placeholder="Height in cm" keyboardType="numeric" value={profile.height} onChangeText={(text) => setProfile({ ...profile, height: text })} />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput style={styles.input} placeholder="Weight in kg" keyboardType="numeric" value={profile.weight} onChangeText={(text) => setProfile({ ...profile, weight: text })} />
            </View>
          </View>

          <Text style={styles.inputLabel}>Health Goal</Text>
          <TextInput style={styles.input} placeholder="e.g., Weight loss, Muscle gain" value={profile.goal} onChangeText={(text) => setProfile({ ...profile, goal: text })} />

          <Text style={styles.inputLabel}>Activity Level</Text>
          <TextInput style={styles.input} placeholder="e.g., Sedentary, Moderate, Active" value={profile.activity_level} onChangeText={(text) => setProfile({ ...profile, activity_level: text })} />

          <Text style={styles.inputLabel}>Medical Conditions</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="List any relevant medical conditions" multiline numberOfLines={4} value={profile.medical_conditions} onChangeText={(text) => setProfile({ ...profile, medical_conditions: text })} />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFC",
  },
  header: {
    backgroundColor: "#c2e2ff",
    paddingTop: 46,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E1E9F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4184E4",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE1E6",
  },
  editAvatarText: {
    color: "#4184E4",
    fontSize: 12,
    fontWeight: "600",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7A869A",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  saveButton: {
    height: 56,
    backgroundColor: "#4184E4",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    height: 56,
    borderWidth: 1,
    borderColor: "#DFE1E6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoutButtonText: {
    color: "#F76660",
    fontSize: 16,
    fontWeight: "600",
  },
})
