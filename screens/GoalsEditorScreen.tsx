import React, { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TextInput, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { saveUserGoals } from "../utils/supabaseutils"

// Using any type for now to fix linter errors
interface MacroGoals {
  carbs: number
  protein: number
  fat: number
}

export default function GoalsEditorScreen({ navigation, route }: { navigation: any; route: any }) {
  // Get initial goals from route params or use defaults
  const initialCalorieGoal = route.params?.calorieGoal || 2000
  const initialMacroGoals = route.params?.macroGoals || {
    carbs: 250,
    protein: 150,
    fat: 65,
  }

  const [calorieGoal, setCalorieGoal] = useState(initialCalorieGoal)
  const [macroGoals, setMacroGoals] = useState(initialMacroGoals)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveGoals = async () => {
    try {
      setIsSaving(true)

      // Directly save to Supabase using the saveUserGoals function - these are global user goals
      const success = await saveUserGoals({
        calorie_goal: calorieGoal,
        carbs_goal: macroGoals.carbs,
        protein_goal: macroGoals.protein,
        fat_goal: macroGoals.fat,
      })

      if (success) {
        // Pass updated goals back to previous screen
        navigation.navigate("Home", {
          updatedGoals: {
            calorieGoal,
            macroGoals,
          },
          globalGoalsUpdated: true, // Add a flag to indicate these are global user goals that were updated
        })

        Alert.alert("Success", "Your nutrition goals have been updated")
      } else {
        Alert.alert("Error", "Failed to save goals. Please try again.")
      }
    } catch (error) {
      console.error("Error saving goals:", error)
      Alert.alert("Error", "Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const insets = useSafeAreaInsets()
  const { width, height } = Dimensions.get("window")

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Goals</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calorie Goal</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Daily Calories</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={calorieGoal.toString()} onChangeText={(text) => setCalorieGoal(parseInt(text) || 0)} placeholder="Enter daily calorie goal" />
          </View>
        </View>

        {/* Macro Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macro Goals</Text>

          {/* Carbs Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Carbohydrates (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.carbs.toString()}
              onChangeText={(text) =>
                setMacroGoals((prev: MacroGoals) => ({
                  ...prev,
                  carbs: parseInt(text) || 0,
                }))
              }
              placeholder="Enter daily carbs goal"
            />
          </View>

          {/* Protein Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.protein.toString()}
              onChangeText={(text) =>
                setMacroGoals((prev: MacroGoals) => ({
                  ...prev,
                  protein: parseInt(text) || 0,
                }))
              }
              placeholder="Enter daily protein goal"
            />
          </View>

          {/* Fat Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.fat.toString()}
              onChangeText={(text) =>
                setMacroGoals((prev: MacroGoals) => ({
                  ...prev,
                  fat: parseInt(text) || 0,
                }))
              }
              placeholder="Enter daily fat goal"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoals} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Goals</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "white", elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: "bold", flex: 1, textAlign: "center" },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2C3F00",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})
