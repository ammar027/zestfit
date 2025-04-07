import React, { useState } from "react"
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useTheme } from "../theme"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export default function PersonalInfoScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { theme } = useTheme()
  const [saving, setSaving] = useState(false)

  // Get profile and saveProfile function from route params
  const { profile: initialProfile, saveProfile } = route.params as any

  // Create local state for form data
  const [profile, setProfile] = useState(initialProfile)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveProfile(profile)
      Alert.alert("Success", "Profile updated successfully")
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={profile.full_name}
              onChangeText={(text) => setProfile({ ...profile, full_name: text })}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={profile.username}
              onChangeText={(text) => setProfile({ ...profile, username: text })}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.subtext}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { width: "48%" }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Age</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={profile.age}
                onChangeText={(text) => setProfile({ ...profile, age: text })}
                placeholder="Years"
                placeholderTextColor={theme.colors.subtext}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { width: "48%" }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Gender</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={profile.gender}
                onChangeText={(text) => setProfile({ ...profile, gender: text })}
                placeholder="Gender"
                placeholderTextColor={theme.colors.subtext}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { width: "48%" }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Height</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={profile.height}
                onChangeText={(text) => setProfile({ ...profile, height: text })}
                placeholder="cm"
                placeholderTextColor={theme.colors.subtext}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { width: "48%" }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Weight</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={profile.weight}
                onChangeText={(text) => setProfile({ ...profile, weight: text })}
                placeholder="kg"
                placeholderTextColor={theme.colors.subtext}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
