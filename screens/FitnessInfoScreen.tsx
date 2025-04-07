import React, { useState } from "react"
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useTheme } from "../theme"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export default function FitnessInfoScreen() {
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
      Alert.alert("Success", "Fitness information updated successfully")
      navigation.goBack()
    } catch (error) {
      Alert.alert("Error", "Failed to update fitness information")
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Fitness Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Fitness Goal</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={profile.goal}
              onChangeText={(text) => setProfile({ ...profile, goal: text })}
              placeholder="What's your fitness goal?"
              placeholderTextColor={theme.colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Activity Level</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={profile.activity_level}
              onChangeText={(text) => setProfile({ ...profile, activity_level: text })}
              placeholder="How active are you?"
              placeholderTextColor={theme.colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.subtext }]}>Medical Conditions</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={profile.medical_conditions}
              onChangeText={(text) => setProfile({ ...profile, medical_conditions: text })}
              placeholder="Any relevant medical information"
              placeholderTextColor={theme.colors.subtext}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: theme.colors.subtext }]}>This information helps us personalize your fitness experience and provide appropriate recommendations.</Text>
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
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
