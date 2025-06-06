import React, { useState, useEffect, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, StatusBar, Dimensions, Alert, ActivityIndicator, TouchableOpacity } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import DateHeader from "../components/DateHeader"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import MacroCards from "../components/MacroCards"
import ChatInterface from "../components/ChatInterface"
import { supabase, enhancedSupabase, queryCache } from "../utils/supabaseClient"
import { getDailyNutrition, saveDailyNutrition, getWaterTrackerSettings, saveUserGoals, saveWaterTrackerSettings } from "../utils/supabaseutils"
import { getLocalDailyNutrition, saveLocalDailyNutrition, getLocalUserGoals, saveLocalUserGoals, getLocalWaterSettings, saveLocalWaterSettings } from "../utils/localStorage"

// Define types for TypeScript
interface User {
  id: string
  [key: string]: any
}

interface MacroGoals {
  carbs: number
  protein: number
  fat: number
}

interface DailyStats {
  calories: { food: number; exercise: number }
  macros: { carbs: number; protein: number; fat: number }
}

interface WaterTrackerSettings {
  enabled: boolean
  dailyWaterGoal: number
  cupsConsumed: number
}

// Add StatsType interface to match ChatInterface's expected type
interface StatsType {
  calories?: {
    food: number
    exercise: number
  }
  macros?: {
    carbs: number
    protein: number
    fat: number
  }
}

// The interface used by our component state
interface DateSpecificData {
  calorieGoal?: number
  macroGoals?: MacroGoals
  dailyStats?: DailyStats
  waterTrackerSettings?: WaterTrackerSettings
  [key: string]: any
}

// The interface expected by supabase save functions - notice required fields don't have ? marks
interface NutritionData {
  calories: number
  carbs: number
  protein: number
  fat: number
  type: string
  calorieGoal?: number
  macroGoals?: MacroGoals
  dailyStats?: DailyStats
  waterTrackerSettings?: WaterTrackerSettings
}

interface WaterSettings {
  enabled: boolean
  daily_water_goal: number
  [key: string]: any
}

// Layout - memoize dimensions-based styles
const getContentStyle = (height: number, insets: any) => ({
  height: height - (insets.top + insets.bottom + 100),
})

// Static styles are defined outside the component
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
    marginTop: 7,
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
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingApp: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3F00",
    marginTop: 15,
    marginBottom: 5,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  loadingContent: {
    justifyContent: "center",
    alignItems: "center",
  },
})

export default function HomeScreen() {
  const route = useRoute<any>()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateSpecificData, setDateSpecificData] = useState<DateSpecificData>({})
  const [globalWaterTrackerSettings, setGlobalWaterTrackerSettings] = useState<WaterSettings | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const navigation = useNavigation<any>()

  // Format the date once and memoize it
  const formattedDate = useMemo(() => {
    return selectedDate.toISOString().split("T")[0]
  }, [selectedDate])

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
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setUser(session?.user || null)
        // Clear cache when user changes
        queryCache.clear()
      }
    })

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  // Handle updates from route parameters
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

  // Handle water tracker settings updates
  useEffect(() => {
    if (route.params?.waterTrackerSettings) {
      const { enabled, dailyWaterGoal, cupsConsumed } = route.params.waterTrackerSettings

      // Update global water tracker settings
      setGlobalWaterTrackerSettings({
        enabled,
        daily_water_goal: dailyWaterGoal,
      })

      // Update date-specific water consumption
      setDateSpecificData((prevData) => ({
        ...prevData,
        waterTrackerSettings: {
          enabled,
          dailyWaterGoal,
          cupsConsumed,
        },
      }))

      // Save the updated settings asynchronously
      if (user) {
        // Don't wait for this to complete
        saveWaterTrackerSettings({
          enabled,
          daily_water_goal: dailyWaterGoal,
        }).catch((error) => console.error("Error saving water tracker settings:", error))
      } else {
        const localSettings = {
          enabled,
          dailyWaterGoal,
          cupsConsumed,
        }

        saveLocalWaterSettings(localSettings).catch((error) => console.error("Error saving water tracker settings to local storage:", error))
      }

      // Clear the params to prevent re-updating on screen focus
      navigation.setParams({ waterTrackerSettings: undefined })
    }
  }, [route.params?.waterTrackerSettings, user])

  // Optimized version of loadGlobalWaterTrackerSettings
  const loadGlobalWaterTrackerSettings = useCallback(async () => {
    try {
      let settings

      if (user) {
        // Use the cached version if possible
        const cacheKey = `water_settings:${user.id}`
        const cachedSettings = queryCache.get(cacheKey)

        if (cachedSettings) {
          settings = cachedSettings
        } else {
          settings = await getWaterTrackerSettings()
          if (settings) {
            queryCache.set(cacheKey, settings)
          }
        }
      } else {
        settings = await getLocalWaterSettings()
        settings = settings
          ? {
              enabled: Boolean(settings.enabled),
              daily_water_goal: settings.dailyWaterGoal,
            }
          : null
      }

      if (settings) {
        setGlobalWaterTrackerSettings(settings)
      } else {
        // Set default settings if none were found
        setGlobalWaterTrackerSettings({
          enabled: false,
          daily_water_goal: 4,
        })
      }

      return settings
    } catch (error) {
      console.error("Error loading global water tracker settings:", error)
      // Set default settings on error
      const defaultSettings = {
        enabled: false,
        daily_water_goal: 4,
      }
      setGlobalWaterTrackerSettings(defaultSettings)
      return defaultSettings
    }
  }, [user])

  // Optimized version of loadDateData
  const loadDateData = useCallback(
    async (date: Date) => {
      try {
        setIsLoading(true)
        let data

        // Format the date to YYYY-MM-DD
        const formattedDate = date.toISOString().split("T")[0]

        if (user) {
          // Try to get from cache first
          const cacheKey = `nutrition:${user.id}:${formattedDate}`
          const cachedData = queryCache.get(cacheKey)

          if (cachedData) {
            data = cachedData
          } else {
            data = await getDailyNutrition(formattedDate)
            if (data) {
              queryCache.set(cacheKey, data)
            }
          }
        } else {
          data = await getLocalDailyNutrition(formattedDate)
        }

        if (data) {
          setDateSpecificData(data)
        }

        setDataLoaded(true)
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
    async (data: DateSpecificData) => {
      try {
        // Format the date to ensure consistent format
        const formattedDate = selectedDate.toISOString().split("T")[0]

        if (user) {
          // Clear cache for this date
          const cacheKey = `nutrition:${user.id}:${formattedDate}`
          queryCache.clearByPattern(cacheKey)

          // Save to Supabase
          const nutritionData: NutritionData = {
            ...data,
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            type: "manual",
          }
          return await saveDailyNutrition(formattedDate, nutritionData)
        } else {
          // Save to local storage
          return await saveLocalDailyNutrition(formattedDate, data)
        }
      } catch (error) {
        console.error("Error saving date data:", error)
        Alert.alert("Error", "Failed to save nutrition data")
        return false
      }
    },
    [selectedDate, user],
  )

  // Handle date change
  const handleDateChange = useCallback(
    (newDate: Date) => {
      // Only reload data if the date has actually changed
      if (newDate.toDateString() !== selectedDate.toDateString()) {
        setDataLoaded(false) // Mark that we need to load new data
        setSelectedDate(newDate)
      }
    },
    [selectedDate],
  )

  // Update daily stats (used by ChatInterface)
  const handleUpdateStats = useCallback(
    (updateFn: (stats: StatsType) => StatsType) => {
      setDateSpecificData((prevData) => {
        // Make a deep copy to avoid reference issues
        const newData = JSON.parse(JSON.stringify(prevData))

        // Create a default stats object to ensure we have valid data structure
        const defaultStats: StatsType = {
          calories: { food: 0, exercise: 0 },
          macros: { carbs: 0, protein: 0, fat: 0 },
        }

        // Apply update function to daily stats with StatsType structure
        const updatedStats = updateFn(
          prevData.dailyStats
            ? {
                calories: prevData.dailyStats.calories,
                macros: prevData.dailyStats.macros,
              }
            : defaultStats,
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

        // Save the updated data (but don't wait for it)
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
    async (goal: number) => {
      try {
        // Update local state first
        setDateSpecificData((prevData) => {
          const newData = { ...prevData, calorieGoal: goal }
          return newData
        })

        if (user) {
          // User is logged in, save to Supabase
          await saveUserGoals({
            calorie_goal: goal,
            // Keep existing macro goals
            carbs_goal: dateSpecificData.macroGoals?.carbs,
            protein_goal: dateSpecificData.macroGoals?.protein,
            fat_goal: dateSpecificData.macroGoals?.fat,
          })
        } else {
          // User is not logged in, save to local storage
          await saveLocalUserGoals({
            calorieGoal: goal,
            macroGoals: dateSpecificData.macroGoals,
          })
        }

        Alert.alert("Success", "Your calorie goal has been updated")
      } catch (error) {
        console.error("Error saving calorie goal:", error)
        Alert.alert("Error", "Failed to save calorie goal")
      }
    },
    [dateSpecificData, user],
  )

  // Set macro goals from modal (global goal update)
  const handleSetMacroGoals = useCallback(
    async (goals: { carbs: number; protein: number; fat: number }) => {
      try {
        // Update local state first
        setDateSpecificData((prevData) => {
          const newData = { ...prevData, macroGoals: goals }
          return newData
        })

        if (user) {
          // User is logged in, save to Supabase
          await saveUserGoals({
            // Keep existing calorie goal
            calorie_goal: dateSpecificData.calorieGoal,
            carbs_goal: goals.carbs,
            protein_goal: goals.protein,
            fat_goal: goals.fat,
          })
        } else {
          // User is not logged in, save to local storage
          await saveLocalUserGoals({
            calorieGoal: dateSpecificData.calorieGoal,
            macroGoals: goals,
          })
        }

        Alert.alert("Success", "Your macro goals have been updated")
      } catch (error) {
        console.error("Error saving macro goals:", error)
        Alert.alert("Error", "Failed to save macro goals")
      }
    },
    [dateSpecificData, user],
  )

  // Load water tracker settings when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!globalWaterTrackerSettings) {
        loadGlobalWaterTrackerSettings()
      }
      return () => {}
    }, [loadGlobalWaterTrackerSettings, globalWaterTrackerSettings]),
  )

  // Load date data when user, selected date changes, or data needs loading
  useEffect(() => {
    if (!dataLoaded || user !== null) {
      loadDateData(selectedDate)
    }
  }, [selectedDate, loadDateData, user, dataLoaded])

  // Layout
  const insets = useSafeAreaInsets()
  const { height } = Dimensions.get("window")

  // Show loading state
  // if (isLoading && !dataLoaded) {
  //   return (
  //     <View style={[styles.container, styles.loadingContainer]}>
  //       <View style={styles.loadingContent}>
  //         <ActivityIndicator size="large" color="#2C3F00" />
  //         <Text style={styles.loadingTitle}>Loading ZestFit</Text>
  //         <Text style={styles.loadingSubtitle}>Preparing your nutrition data and daily insights...</Text>
  //       </View>
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

      <View style={[styles.content, getContentStyle(height, insets)]}>
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
              // Prioritize the latest settings from route.params if available
              enabled: Boolean(route.params?.waterTrackerSettings?.enabled !== undefined ? route.params.waterTrackerSettings.enabled : dateSpecificData.waterTrackerSettings?.enabled || globalWaterTrackerSettings?.enabled || false),
              dailyWaterGoal: globalWaterTrackerSettings?.daily_water_goal || 4,
              cupsConsumed: dateSpecificData.waterTrackerSettings?.cupsConsumed || 0,
            }}
            isWaterTrackerEnabled={Boolean(route.params?.waterTrackerSettings?.enabled !== undefined ? route.params.waterTrackerSettings.enabled : dateSpecificData.waterTrackerSettings?.enabled || globalWaterTrackerSettings?.enabled || false)}
            onIncrementWater={handleIncrementWater}
            onDecrementWater={handleDecrementWater}
            setCalorieGoal={handleSetCalorieGoal}
            setMacroGoals={handleSetMacroGoals}
          />
        </View>

        <View style={styles.chatSection}>
          <ChatInterface date={formattedDate} onUpdateStats={handleUpdateStats} user={user} />
        </View>
      </View>
    </View>
  )
}
