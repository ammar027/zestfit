import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, StatusBar, Dimensions, Alert, ActivityIndicator, TouchableOpacity } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import DateHeader from "../components/DateHeader"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import MacroCards from "../components/MacroCards"
import ChatInterface from "../components/ChatInterface"
import { supabase } from "../utils/supabaseClient"
import { getDailyNutrition, saveDailyNutrition, getWaterTrackerSettings, saveUserGoals, saveWaterTrackerSettings } from "../utils/supabaseutils"

export default function HomeScreen() {
  const route = useRoute()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateSpecificData, setDateSpecificData] = useState({})
  const [globalWaterTrackerSettings, setGlobalWaterTrackerSettings] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)
      } catch (error) {
        console.error("Error checking user:", error)
      }
    }

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (route.params?.updatedGoals) {
      const { calorieGoal, macroGoals } = route.params.updatedGoals

      // Update local state with the new universal goals
      setDateSpecificData((prevData) => ({
        ...prevData,
        calorieGoal,
        macroGoals,
      }))

      // Clear the params to prevent re-updating on screen focus
      navigation.setParams({ updatedGoals: undefined })
    }
  }, [route.params?.updatedGoals])

  // Load global water tracker settings
  const loadGlobalWaterTrackerSettings = useCallback(async () => {
    try {
      if (!user) return

      const settings = await getWaterTrackerSettings()
      if (settings) {
        setGlobalWaterTrackerSettings(settings)
      }
    } catch (error) {
      console.error("Error loading global water tracker settings:", error)
    }
  }, [user])

  // Load data for a specific date
  const loadDateData = useCallback(
    async (date) => {
      try {
        setIsLoading(true)
        if (!user) {
          setIsLoading(false)
          return
        }

        // Format the date to YYYY-MM-DD
        const formattedDate = date.toISOString().split("T")[0]
        const data = await getDailyNutrition(formattedDate)
        if (data) {
          setDateSpecificData(data)
        }
      } catch (error) {
        console.error("Error loading date data:", error)
        Alert.alert("Error", "Failed to load nutrition data")
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  // Save data for the current date
  const saveDateData = useCallback(
    async (data) => {
      try {
        if (!user) {
          Alert.alert("Login Required", "Please log in to save your data")
          return false
        }

        // Format the date to ensure consistent format
        const formattedDate = selectedDate.toISOString().split("T")[0]
        return await saveDailyNutrition(formattedDate, data)
      } catch (error) {
        console.error("Error saving date data:", error)
        Alert.alert("Error", "Failed to save nutrition data")
        return false
      }
    },
    [selectedDate, user],
  )

  // Handle date change
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate)
  }, [])

  // Update daily stats (used by ChatInterface)
  const handleUpdateStats = useCallback(
    (updateFn) => {
      setDateSpecificData((prevData) => {
        // Make a deep copy to avoid reference issues
        const newData = JSON.parse(JSON.stringify(prevData))

        // Apply update function to daily stats
        const updatedStats = updateFn(
          prevData.dailyStats || {
            calories: { food: 0, exercise: 0 },
            macros: { carbs: 0, protein: 0, fat: 0 },
          },
        )

        // Handle case where prevData has no dailyStats property (first update)
        if (!newData.dailyStats) {
          newData.dailyStats = {
            calories: { food: 0, exercise: 0 },
            macros: { carbs: 0, protein: 0, fat: 0 },
          }
        }

        // Update daily stats with new values, ensuring default values if undefined
        newData.dailyStats = {
          calories: {
            food: updatedStats.calories?.food ?? (prevData.dailyStats?.calories?.food || 0),
            exercise: updatedStats.calories?.exercise ?? (prevData.dailyStats?.calories?.exercise || 0),
          },
          macros: {
            carbs: updatedStats.macros?.carbs ?? (prevData.dailyStats?.macros?.carbs || 0),
            protein: updatedStats.macros?.protein ?? (prevData.dailyStats?.macros?.protein || 0),
            fat: updatedStats.macros?.fat ?? (prevData.dailyStats?.macros?.fat || 0),
          },
        }

        console.log("Updating nutrition stats:", JSON.stringify(newData.dailyStats))

        // Save the updated data
        saveDateData(newData).catch((error) => {
          console.error("Error saving updated nutrition data:", error)
        })

        return newData
      })
    },
    [saveDateData],
  )

  // Increment water cups
  const handleIncrementWater = useCallback(() => {
    setDateSpecificData((prevData) => {
      const currentSettings = prevData.waterTrackerSettings || {
        enabled: false,
        dailyWaterGoal: globalWaterTrackerSettings?.daily_water_goal || 4,
        cupsConsumed: 0,
      }

      if (currentSettings.cupsConsumed < (globalWaterTrackerSettings?.daily_water_goal || 4)) {
        const newData = {
          ...prevData,
          waterTrackerSettings: {
            ...currentSettings,
            cupsConsumed: currentSettings.cupsConsumed + 1,
          },
        }

        saveDateData(newData)
        return newData
      }

      return prevData
    })
  }, [saveDateData, globalWaterTrackerSettings])

  // Decrement water cups
  const handleDecrementWater = useCallback(() => {
    setDateSpecificData((prevData) => {
      const currentSettings = prevData.waterTrackerSettings || {
        enabled: false,
        dailyWaterGoal: globalWaterTrackerSettings?.daily_water_goal || 4,
        cupsConsumed: 0,
      }

      if (currentSettings.cupsConsumed > 0) {
        const newData = {
          ...prevData,
          waterTrackerSettings: {
            ...currentSettings,
            cupsConsumed: currentSettings.cupsConsumed - 1,
          },
        }

        saveDateData(newData)
        return newData
      }

      return prevData
    })
  }, [saveDateData, globalWaterTrackerSettings])

  // Set calorie goal from modal (global goal update)
  const handleSetCalorieGoal = useCallback(
    async (goal) => {
      try {
        // Update local state first
        setDateSpecificData((prevData) => {
          const newData = { ...prevData, calorieGoal: goal }
          return newData
        })

        // Save to global user goals
        await saveUserGoals({
          calorie_goal: goal,
          // Keep existing macro goals
          carbs_goal: dateSpecificData.macroGoals?.carbs,
          protein_goal: dateSpecificData.macroGoals?.protein,
          fat_goal: dateSpecificData.macroGoals?.fat,
        })

        Alert.alert("Success", "Your calorie goal has been updated")
      } catch (error) {
        console.error("Error saving calorie goal:", error)
        Alert.alert("Error", "Failed to save calorie goal")
      }
    },
    [dateSpecificData],
  )

  // Set macro goals from modal (global goal update)
  const handleSetMacroGoals = useCallback(
    async (goals) => {
      try {
        // Update local state first
        setDateSpecificData((prevData) => {
          const newData = { ...prevData, macroGoals: goals }
          return newData
        })

        // Save to global user goals
        await saveUserGoals({
          // Keep existing calorie goal
          calorie_goal: dateSpecificData.calorieGoal,
          carbs_goal: goals.carbs,
          protein_goal: goals.protein,
          fat_goal: goals.fat,
        })

        Alert.alert("Success", "Your macro goals have been updated")
      } catch (error) {
        console.error("Error saving macro goals:", error)
        Alert.alert("Error", "Failed to save macro goals")
      }
    },
    [dateSpecificData],
  )

  // Update water tracker settings from Settings screen
  useEffect(() => {
    if (route.params?.waterTrackerSettings) {
      const newSettings = route.params.waterTrackerSettings

      // Force enabled to be a boolean
      const enabled = Boolean(newSettings.enabled)

      // Update global settings
      setGlobalWaterTrackerSettings((prev) => ({
        ...prev,
        enabled: enabled,
        daily_water_goal: newSettings.dailyWaterGoal,
      }))

      // Save to database with forced boolean
      saveWaterTrackerSettings({
        ...newSettings,
        enabled: enabled,
      })
    }
  }, [route.params?.waterTrackerSettings])

  // Load water tracker settings when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadGlobalWaterTrackerSettings()
      }
      return () => {}
    }, [loadGlobalWaterTrackerSettings, user]),
  )

  // Load date data when user or selected date changes
  useEffect(() => {
    if (user) {
      loadDateData(selectedDate)
    }
  }, [selectedDate, loadDateData, user])

  // Navigation and layout
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { height } = Dimensions.get("window")

  // Login prompt screen
  // if (!user) {
  //   return (
  //     <View
  //       style={[
  //         styles.container,
  //         {
  //           paddingTop: insets.top,
  //           paddingBottom: insets.bottom,
  //           paddingLeft: insets.left,
  //           paddingRight: insets.right,
  //           justifyContent: "center",
  //           alignItems: "center",
  //         },
  //       ]}
  //     >
  //       <Text style={styles.loginPrompt}>Please log in to track your nutrition</Text>
  //       <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("Auth")}>
  //         <Text style={styles.loginButtonText}>Go to Login</Text>
  //       </TouchableOpacity>
  //     </View>
  //   )
  // }

  // // Loading screen
  // if (isLoading) {
  //   return (
  //     <View
  //       style={[
  //         styles.container,
  //         {
  //           paddingTop: insets.top,
  //           paddingBottom: insets.bottom,
  //           paddingLeft: insets.left,
  //           paddingRight: insets.right,
  //           justifyContent: "center",
  //           alignItems: "center",
  //         },
  //       ]}
  //     >
  //       <ActivityIndicator size="large" color="#007AFF" />
  //       <Text style={styles.loadingText}>Loading your nutrition data...</Text>
  //     </View>
  //   )
  // }

  // Main screen
  return (
    <View
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.headerContainer}>
        <DateHeader date={selectedDate} onDateChange={handleDateChange} onDrawerPress={() => navigation.openDrawer()} />
      </View>

      <View
        style={[
          styles.content,
          {
            height: height - (insets.top + insets.bottom + 100),
          },
        ]}
      >
        <View style={styles.statsSection}>
          <MacroCards
            calorieGoal={dateSpecificData.calorieGoal || 2000}
            macroGoals={
              dateSpecificData.macroGoals || {
                carbs: 250,
                protein: 150,
                fat: 65,
              }
            }
            dailyStats={
              dateSpecificData.dailyStats || {
                calories: { food: 0, exercise: 0 },
                macros: { carbs: 0, protein: 0, fat: 0 },
              }
            }
            waterTrackerSettings={{
              enabled: globalWaterTrackerSettings?.enabled || false,
              dailyWaterGoal: globalWaterTrackerSettings?.daily_water_goal || 4,
              cupsConsumed: dateSpecificData.waterTrackerSettings?.cupsConsumed || 0,
            }}
            isWaterTrackerEnabled={globalWaterTrackerSettings?.enabled || false}
            onIncrementWater={handleIncrementWater}
            onDecrementWater={handleDecrementWater}
            setCalorieGoal={handleSetCalorieGoal}
            setMacroGoals={handleSetMacroGoals}
          />
        </View>

        <View style={styles.chatSection}>
          <ChatInterface date={selectedDate.toISOString().split("T")[0]} onUpdateStats={handleUpdateStats} user={user} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    paddingTop: 1,
    marginTop: 10,
  },
  chatSection: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waterCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  waterCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 8,
    flex: 1,
  },
  settingsIcon: {
    padding: 4,
  },
  waterProgressContainer: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  waterProgressBar: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  waterCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterCountControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    padding: 8,
  },
  waterCountText: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  waterLitersText: {
    fontSize: 12,
    color: "#888",
  },
})
