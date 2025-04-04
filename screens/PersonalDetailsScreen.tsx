import React, { useState, useEffect } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { supabase } from "../utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../theme"
import { ProfileData } from "../types/navigation"

type PersonalDetailsProps = {
  route: {
    params: {
      userId: string
      profile: ProfileData
    }
  }
}

export default function PersonalDetailsScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { theme } = useTheme()

  // Get profile data and userId from route params
  const { userId, profile: initialProfile } = route.params as any

  const [profile, setProfile] = useState(initialProfile)
  const [saving, setSaving] = useState(false)

  const saveProfile = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please try again later.")
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

      // Navigate back to the previous screen
      navigation.goBack()

      // Pass the updated profile data back to the Tabs stack
      navigation.navigate("Tabs", { updatedProfile: profile })
    } catch (err: any) {
      console.error("Profile update error:", err)
      Alert.alert("Error", "Failed to update profile: " + (err.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Personal Details</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input.background,
                    borderColor: theme.colors.input.border,
                    color: theme.colors.input.text,
                  },
                ]}
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.subtext}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Email / Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input.background,
                    borderColor: theme.colors.input.border,
                    color: theme.colors.input.text,
                  },
                ]}
                value={profile.username}
                onChangeText={(text) => setProfile({ ...profile, username: text })}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.subtext}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Age</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: theme.colors.input.border,
                      color: theme.colors.input.text,
                    },
                  ]}
                  value={profile.age}
                  onChangeText={(text) => setProfile({ ...profile, age: text })}
                  keyboardType="numeric"
                  placeholder="Years"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Gender</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: theme.colors.input.border,
                      color: theme.colors.input.text,
                    },
                  ]}
                  value={profile.gender}
                  onChangeText={(text) => setProfile({ ...profile, gender: text })}
                  placeholder="Gender"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Height</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: theme.colors.input.border,
                      color: theme.colors.input.text,
                    },
                  ]}
                  value={profile.height}
                  onChangeText={(text) => setProfile({ ...profile, height: text })}
                  keyboardType="numeric"
                  placeholder="cm"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Weight</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input.background,
                      borderColor: theme.colors.input.border,
                      color: theme.colors.input.text,
                    },
                  ]}
                  value={profile.weight}
                  onChangeText={(text) => setProfile({ ...profile, weight: text })}
                  keyboardType="numeric"
                  placeholder="kg"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>
            </View>
          </View>

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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Fitness Information</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Fitness Goal</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input.background,
                    borderColor: theme.colors.input.border,
                    color: theme.colors.input.text,
                  },
                ]}
                value={profile.goal}
                onChangeText={(text) => setProfile({ ...profile, goal: text })}
                placeholder="What's your fitness goal?"
                placeholderTextColor={theme.colors.subtext}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Activity Level</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input.background,
                    borderColor: theme.colors.input.border,
                    color: theme.colors.input.text,
                  },
                ]}
                value={profile.activity_level}
                onChangeText={(text) => setProfile({ ...profile, activity_level: text })}
                placeholder="How active are you?"
                placeholderTextColor={theme.colors.subtext}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.subtext }]}>Medical Conditions</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.input.background,
                    borderColor: theme.colors.input.border,
                    color: theme.colors.input.text,
                  },
                ]}
                value={profile.medical_conditions}
                onChangeText={(text) => setProfile({ ...profile, medical_conditions: text })}
                placeholder="Any relevant medical information"
                placeholderTextColor={theme.colors.subtext}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

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
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40, // Balance the header with an empty view
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttons: {
    marginTop: 8,
    marginBottom: 40,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
