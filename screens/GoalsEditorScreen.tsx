import React, { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TextInput, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Animated } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation, NavigationProp, ParamListBase, DrawerActions } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { saveUserGoals } from "../utils/supabaseutils"
import { useTheme } from "../theme"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

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
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

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

  // Custom header component
  const Header = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Daily Goals</Text>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSaveGoals} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </View>
    )
  }

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Calorie Goal</Text>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Daily Calories</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.input.border, backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background }]}>
                  <MaterialCommunityIcons name="fire" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: theme.colors.input.text }]} keyboardType="numeric" value={calorieGoal.toString()} onChangeText={(text) => setCalorieGoal(parseInt(text) || 0)} placeholder="Enter daily calorie goal" placeholderTextColor={theme.colors.input.placeholder} />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Macro Goals Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Macro Goals</Text>

              {/* Carbs Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Carbohydrates (g)</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.input.border, backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background }]}>
                  <MaterialCommunityIcons name="food-apple-outline" size={22} color="#FF6B6B" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.input.text }]}
                    keyboardType="numeric"
                    value={macroGoals.carbs.toString()}
                    onChangeText={(text) =>
                      setMacroGoals((prev: MacroGoals) => ({
                        ...prev,
                        carbs: parseInt(text) || 0,
                      }))
                    }
                    placeholder="Enter daily carbs goal"
                    placeholderTextColor={theme.colors.input.placeholder}
                  />
                </View>
              </View>

              {/* Protein Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Protein (g)</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.input.border, backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background }]}>
                  <MaterialCommunityIcons name="food-steak" size={22} color="#3498db" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.input.text }]}
                    keyboardType="numeric"
                    value={macroGoals.protein.toString()}
                    onChangeText={(text) =>
                      setMacroGoals((prev: MacroGoals) => ({
                        ...prev,
                        protein: parseInt(text) || 0,
                      }))
                    }
                    placeholder="Enter daily protein goal"
                    placeholderTextColor={theme.colors.input.placeholder}
                  />
                </View>
              </View>

              {/* Fat Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Fat (g)</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.input.border, backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background }]}>
                  <MaterialCommunityIcons name="food-variant" size={22} color="#4ECDC4" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.input.text }]}
                    keyboardType="numeric"
                    value={macroGoals.fat.toString()}
                    onChangeText={(text) =>
                      setMacroGoals((prev: MacroGoals) => ({
                        ...prev,
                        fat: parseInt(text) || 0,
                      }))
                    }
                    placeholder="Enter daily fat goal"
                    placeholderTextColor={theme.colors.input.placeholder}
                  />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </ScrollView>
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
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  gradientOverlay: {
    padding: 20,
    borderRadius: 16,
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
})
