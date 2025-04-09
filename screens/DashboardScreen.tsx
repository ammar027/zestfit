import React, { useState, useEffect, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl, StatusBar } from "react-native"
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { getDailyNutrition, getBatchNutrition, saveUserGoals, saveDailyNutrition } from "../utils/supabaseutils"
import { supabase } from "../utils/supabaseClient"
import SkeletonPlaceholder from "react-native-skeleton-placeholder"
import { MotiView } from "moti"
import { queryCache } from "../utils/supabaseClient"
import MacroCards from "../components/MacroCards"
import { getLocalDailyNutrition, saveLocalDailyNutrition, getLocalUserGoals, saveLocalUserGoals, getLocalWaterSettings, saveLocalWaterSettings } from "../utils/localStorage"
import { useTheme } from "../theme"
import { useNavigation, NavigationProp, ParamListBase, DrawerActions } from "@react-navigation/native"

const { width } = Dimensions.get("window")

// Define TypeScript interfaces
interface NutritionDataPoint {
  date: string
  calories: number
  carbs: number
  protein: number
  fat: number
  calorieGoal?: number
}

interface NavigationProps {
  navigation: any
}

interface MacroDistribution {
  name: string
  population: number
  color: string
  legendFontColor: string
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

export default function DashboardScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly")
  const [nutritionData, setNutritionData] = useState<NutritionDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dataCacheTime, setDataCacheTime] = useState<number | null>(null)
  const [selectedDataPoint, setSelectedDataPoint] = useState<NutritionDataPoint | null>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])

  // Add state for MacroCards
  const [macroGoalsState, setMacroGoalsState] = useState<MacroGoals>({
    carbs: 250,
    protein: 150,
    fat: 65,
  })
  const [calorieGoalState, setCalorieGoalState] = useState<number>(2000)
  const [dailyStatsState, setDailyStatsState] = useState<DailyStats>({
    calories: { food: 0, exercise: 0 },
    macros: { carbs: 0, protein: 0, fat: 0 },
  })

  // Initialize water tracker settings
  const [waterTrackerSettings, setWaterTrackerSettings] = useState({
    enabled: false,
    dailyWaterGoal: 4,
    cupsConsumed: 0,
  })

  const insets = useSafeAreaInsets()

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
  }, [])

  const fetchNutritionData = useCallback(
    async (refresh = false) => {
      // Check cache first if not refreshing
      if (!refresh && dataCacheTime && Date.now() - dataCacheTime < 5 * 60 * 1000) {
        // Use cached data if less than 5 minutes old
        return
      }

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        let startDate: Date, endDate: Date
        const today = new Date()

        if (timeframe === "weekly") {
          startDate = startOfWeek(today)
          endDate = endOfWeek(today)
        } else {
          startDate = startOfMonth(today)
          endDate = endOfMonth(today)
        }

        const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

        // Try to get from cache first
        const cacheKey = `dashboard:${user?.id || "local"}:${timeframe}`
        const cachedData = queryCache.get(cacheKey)

        if (!refresh && cachedData) {
          setNutritionData(cachedData)
          setDataCacheTime(Date.now())
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }

        // Use the new batch function instead of individual calls
        const dateStrings = dateRange.map((date) => date.toISOString().split("T")[0])

        let batchResults = []

        if (user) {
          // User is logged in, use Supabase
          batchResults = await getBatchNutrition(dateStrings)
        } else {
          // User is not logged in, use localStorage
          batchResults = await Promise.all(
            dateStrings.map(async (date) => {
              const nutritionInfo = await getLocalDailyNutrition(date)
              return {
                date,
                calorieGoal: nutritionInfo?.calorieGoal || 2000,
                macroGoals: nutritionInfo?.macroGoals || {
                  carbs: 250,
                  protein: 150,
                  fat: 65,
                },
                dailyStats: nutritionInfo?.dailyStats || {
                  calories: { food: 0, exercise: 0 },
                  macros: { carbs: 0, protein: 0, fat: 0 },
                },
                waterTrackerSettings: nutritionInfo?.waterTrackerSettings || {
                  enabled: false,
                  dailyWaterGoal: 4,
                  cupsConsumed: 0,
                },
              }
            }),
          )
        }

        setBatchResults(batchResults)

        // Transform batch results to the expected format
        const dataResults = batchResults.map((item: any) => ({
          date: item.date,
          calories: (item.dailyStats?.calories.food || 0) - (item.dailyStats?.calories.exercise || 0),
          carbs: item.dailyStats?.macros.carbs || 0,
          protein: item.dailyStats?.macros.protein || 0,
          fat: item.dailyStats?.macros.fat || 0,
          calorieGoal: item.calorieGoal || 2000,
        }))

        // Store in cache
        queryCache.set(cacheKey, dataResults)
        setNutritionData(dataResults)
        setDataCacheTime(Date.now())

        // Initialize macro goals from the first item
        if (dataResults.length > 0) {
          const firstItem = batchResults[0]
          if (firstItem) {
            setCalorieGoalState(firstItem.calorieGoal || 2000)
            if (firstItem.macroGoals) {
              setMacroGoalsState({
                carbs: firstItem.macroGoals.carbs || 250,
                protein: firstItem.macroGoals.protein || 150,
                fat: firstItem.macroGoals.fat || 65,
              })
            }
          }
        }

        // Auto-select today's data point
        const todayData = dataResults.find((item: NutritionDataPoint) => isSameDay(new Date(item.date), today))
        if (todayData) {
          setSelectedDataPoint(todayData)
        }
      } catch (error) {
        console.error("Error fetching nutrition data:", error)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [timeframe, user, dataCacheTime],
  )

  useEffect(() => {
    fetchNutritionData()
  }, [fetchNutritionData])

  // Calculate time since last refresh
  const lastRefreshText = useMemo(() => {
    if (!dataCacheTime) return "Never refreshed"

    const minutes = Math.floor((Date.now() - dataCacheTime) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes === 1) return "1 minute ago"
    return `${minutes} minutes ago`
  }, [dataCacheTime])

  const getChartData = (metric: string) => {
    if (!nutritionData || nutritionData.length === 0) return null

    const labels = nutritionData.map((item) => format(new Date(item.date), timeframe === "weekly" ? "EEE" : "d"))

    const datasets = [
      {
        data: nutritionData.map((item) => (item[metric as keyof NutritionDataPoint] as number) || 0),
        color: (opacity = 1) => {
          switch (metric) {
            case "calories":
              return `rgba(255, 59, 48, ${opacity})`
            case "carbs":
              return `rgba(255, 107, 107, ${opacity})`
            case "protein":
              return `rgba(78, 205, 196, ${opacity})`
            case "fat":
              return `rgba(255, 167, 38, ${opacity})`
            default:
              return `rgba(0, 122, 255, ${opacity})`
          }
        },
        strokeWidth: 2,
      },
    ]

    return { labels, datasets }
  }

  // Calculate macro distribution for pie chart
  const getMacroDistribution = (): MacroDistribution[] => {
    if (!selectedDataPoint) return []

    const total = selectedDataPoint.carbs + selectedDataPoint.protein + selectedDataPoint.fat
    if (total === 0) return []

    return [
      {
        name: "Carbs",
        population: selectedDataPoint.carbs,
        color: "rgba(255, 107, 107, 1)",
        legendFontColor: "#7F7F7F",
      },
      {
        name: "Protein",
        population: selectedDataPoint.protein,
        color: "rgba(78, 205, 196, 1)",
        legendFontColor: "#7F7F7F",
      },
      {
        name: "Fat",
        population: selectedDataPoint.fat,
        color: "rgba(255, 167, 38, 1)",
        legendFontColor: "#7F7F7F",
      },
    ]
  }

  // Get weekday streak (consecutive days with logged nutrition)
  const getStreak = useMemo(() => {
    if (!nutritionData || nutritionData.length === 0) return 0

    // Sort by date descending
    const sortedData = [...nutritionData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let streak = 0
    for (const entry of sortedData) {
      const hasData = entry.calories > 0 || entry.carbs > 0 || entry.protein > 0 || entry.fat > 0
      if (hasData) {
        streak++
      } else {
        break
      }
    }

    return streak
  }, [nutritionData])

  // Calculate progress towards calorie goal
  const calorieProgress = useMemo(() => {
    if (!selectedDataPoint || !nutritionData.length) return 0

    // Get the calorie goal from the first data point (all should have same goal)
    const calorieGoal = nutritionData[0]?.calorieGoal || 2000

    // Calculate percentage (cap at 100%)
    return Math.min(100, (selectedDataPoint.calories / calorieGoal) * 100)
  }, [selectedDataPoint, nutritionData])

  // Render progress bar for calories
  const renderCalorieProgress = () => {
    if (!selectedDataPoint) return null

    // Get color based on percentage
    const getColor = () => {
      if (calorieProgress < 70) return "#4cd964" // Green
      if (calorieProgress < 90) return "#ffcc00" // Yellow
      return "#ff3b30" // Red - over goal
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <MotiView
            from={{
              width: "0%",
            }}
            animate={{
              width: `${calorieProgress}%`,
            }}
            transition={{
              type: "timing",
              duration: 1000,
            }}
            style={[styles.progressFill, { backgroundColor: getColor() }]}
          />
        </View>
        <Text style={styles.progressText}>
          {selectedDataPoint.calories} cal
          {nutritionData[0]?.calorieGoal ? ` / ${nutritionData[0].calorieGoal} cal` : ""}
        </Text>
      </View>
    )
  }

  // Memoized chart config using theme colors
  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.colors.card,
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(${theme.dark ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${theme.dark ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "5",
        strokeWidth: "1",
        stroke: theme.colors.primary,
      },
      propsForLabels: {
        fontSize: 10,
        fill: theme.colors.text,
      },
    }),
    [theme],
  )

  // Function to refresh data
  const handleRefresh = () => {
    fetchNutritionData(true)
  }

  // Function to select a data point
  const handleSelectDay = (index: number) => {
    if (nutritionData && nutritionData[index]) {
      setSelectedDataPoint(nutritionData[index])
    }
  }

  // Skeleton loading components
  const RenderSkeletonChart = () => (
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item width={width - 40} height={200} borderRadius={16} />
    </SkeletonPlaceholder>
  )

  const RenderSkeletonCards = () => (
    <View style={styles.statsContainer}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item width={(width - 40) / 2 - 8} height={100} borderRadius={16} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item width={(width - 40) / 2 - 8} height={100} borderRadius={16} />
      </SkeletonPlaceholder>
    </View>
  )

  const RenderSkeletonMacroCards = () => (
    <SkeletonPlaceholder>
      <View style={{ marginHorizontal: 20 }}>
        <SkeletonPlaceholder.Item width={width - 40} height={30} borderRadius={4} marginBottom={16} />
        <SkeletonPlaceholder.Item width={width - 40} height={150} borderRadius={16} marginBottom={16} />
      </View>
    </SkeletonPlaceholder>
  )

  // Add an onRefresh function
  const onRefresh = useCallback(() => {
    fetchNutritionData(true)
  }, [fetchNutritionData])

  // Extract daily stats from the selected data point for MacroCards
  useEffect(() => {
    if (selectedDataPoint && nutritionData.length > 0) {
      // Find the full nutrition data for the selected date
      const selectedDateData = nutritionData.find((item) => item.date === selectedDataPoint.date)

      // Get the first item for calorie goal (all should have same goal)
      if (selectedDateData) {
        const fullDateData = nutritionData.find((item) => item.date === selectedDateData.date)

        if (fullDateData && fullDateData.calorieGoal) {
          setCalorieGoalState(fullDateData.calorieGoal)
        }
      }

      // Update the daily stats for MacroCards
      setDailyStatsState({
        calories: {
          food: selectedDataPoint.calories > 0 ? selectedDataPoint.calories : 0,
          exercise: 0,
        },
        macros: {
          carbs: selectedDataPoint.carbs,
          protein: selectedDataPoint.protein,
          fat: selectedDataPoint.fat,
        },
      })
    }
  }, [selectedDataPoint, nutritionData])

  // Handler for setting calorie goals
  const handleSetCalorieGoal = (goal: number) => {
    setCalorieGoalState(goal)

    if (user) {
      // Save to database
      saveUserGoals({
        calorie_goal: goal,
        carbs_goal: macroGoalsState.carbs,
        protein_goal: macroGoalsState.protein,
        fat_goal: macroGoalsState.fat,
      }).catch((err) => console.error("Error saving calorie goal:", err))

      // Update the cache and refresh data
      queryCache.clearByPattern(`dashboard:${user?.id}`)
    } else {
      // Save to local storage
      saveLocalUserGoals({
        calorieGoal: goal,
        macroGoals: macroGoalsState,
      }).catch((err) => console.error("Error saving local calorie goal:", err))

      // Update the cache
      queryCache.clearByPattern(`dashboard:local`)
    }

    fetchNutritionData(true)
  }

  // Handler for setting macro goals
  const handleSetMacroGoals = (goals: MacroGoals) => {
    setMacroGoalsState(goals)

    if (user) {
      // Save to database
      saveUserGoals({
        calorie_goal: calorieGoalState,
        carbs_goal: goals.carbs,
        protein_goal: goals.protein,
        fat_goal: goals.fat,
      }).catch((err) => console.error("Error saving macro goals:", err))

      // Update the cache and refresh data
      queryCache.clearByPattern(`dashboard:${user?.id}`)
    } else {
      // Save to local storage
      saveLocalUserGoals({
        calorieGoal: calorieGoalState,
        macroGoals: goals,
      }).catch((err) => console.error("Error saving local macro goals:", err))

      // Update the cache
      queryCache.clearByPattern(`dashboard:local`)
    }

    fetchNutritionData(true)
  }

  // Water tracker handlers
  const handleIncrementWater = useCallback(() => {
    if (selectedDataPoint && waterTrackerSettings.cupsConsumed < waterTrackerSettings.dailyWaterGoal) {
      const updatedSettings = {
        ...waterTrackerSettings,
        cupsConsumed: waterTrackerSettings.cupsConsumed + 1,
      }

      setWaterTrackerSettings(updatedSettings)

      if (user) {
        // Update nutrition data in database with new water consumption
        saveDailyNutrition(selectedDataPoint.date, {
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
          type: "manual",
          dailyStats: dailyStatsState,
          waterTrackerSettings: {
            cupsConsumed: updatedSettings.cupsConsumed,
          },
        })
          .then(() => {
            // Optionally refresh data
            queryCache.clearByPattern(`nutrition:${user?.id}:${selectedDataPoint.date}`)
          })
          .catch((error) => {
            console.error("Error saving water tracker update:", error)
          })
      } else {
        // Update local storage
        getLocalDailyNutrition(selectedDataPoint.date)
          .then((data) => {
            if (data) {
              const updatedData = {
                ...data,
                waterTrackerSettings: {
                  enabled: data.waterTrackerSettings?.enabled || false,
                  dailyWaterGoal: data.waterTrackerSettings?.dailyWaterGoal || 4,
                  cupsConsumed: updatedSettings.cupsConsumed,
                },
              }
              saveLocalDailyNutrition(selectedDataPoint.date, updatedData)
              queryCache.clearByPattern(`dashboard:local`)
            }
          })
          .catch((error) => {
            console.error("Error updating local water tracker:", error)
          })
      }
    }
  }, [selectedDataPoint, waterTrackerSettings, dailyStatsState, user])

  const handleDecrementWater = useCallback(() => {
    if (selectedDataPoint && waterTrackerSettings.cupsConsumed > 0) {
      const updatedSettings = {
        ...waterTrackerSettings,
        cupsConsumed: waterTrackerSettings.cupsConsumed - 1,
      }

      setWaterTrackerSettings(updatedSettings)

      if (user) {
        // Update nutrition data in database with new water consumption
        saveDailyNutrition(selectedDataPoint.date, {
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
          type: "manual",
          dailyStats: dailyStatsState,
          waterTrackerSettings: {
            cupsConsumed: updatedSettings.cupsConsumed,
          },
        })
          .then(() => {
            // Optionally refresh data
            queryCache.clearByPattern(`nutrition:${user?.id}:${selectedDataPoint.date}`)
          })
          .catch((error) => {
            console.error("Error saving water tracker update:", error)
          })
      } else {
        // Update local storage
        getLocalDailyNutrition(selectedDataPoint.date)
          .then((data) => {
            if (data) {
              const updatedData = {
                ...data,
                waterTrackerSettings: {
                  enabled: data.waterTrackerSettings?.enabled || false,
                  dailyWaterGoal: data.waterTrackerSettings?.dailyWaterGoal || 4,
                  cupsConsumed: updatedSettings.cupsConsumed,
                },
              }
              saveLocalDailyNutrition(selectedDataPoint.date, updatedData)
              queryCache.clearByPattern(`dashboard:local`)
            }
          })
          .catch((error) => {
            console.error("Error updating local water tracker:", error)
          })
      }
    }
  }, [selectedDataPoint, waterTrackerSettings, dailyStatsState, user])

  // Update water tracker from selected data point
  useEffect(() => {
    if (selectedDataPoint && batchResults && batchResults.length > 0) {
      const fullData = batchResults.find((item: any) => item.date === selectedDataPoint.date)

      if (fullData && fullData.waterTrackerSettings) {
        setWaterTrackerSettings({
          enabled: fullData.waterTrackerSettings.enabled || false,
          dailyWaterGoal: fullData.waterTrackerSettings.dailyWaterGoal || 4,
          cupsConsumed: fullData.waterTrackerSettings.cupsConsumed || 0,
        })
      }
    }
  }, [selectedDataPoint, batchResults])

  // Custom header component
  const Header = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.colors.card }]} onPress={handleRefresh}>
              <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

        <Header />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

      <Header />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.timeframeSelector}>
          <TouchableOpacity style={[styles.timeframeButton, { backgroundColor: timeframe === "weekly" ? theme.colors.primary : theme.dark ? "rgba(255,255,255,0.1)" : "#f0f0f0" }]} onPress={() => setTimeframe("weekly")}>
            <Text style={[styles.timeframeButtonText, { color: timeframe === "weekly" ? "#ffffff" : theme.colors.subtext }]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timeframeButton, { backgroundColor: timeframe === "monthly" ? theme.colors.primary : theme.dark ? "rgba(255,255,255,0.1)" : "#f0f0f0" }]} onPress={() => setTimeframe("monthly")}>
            <Text style={[styles.timeframeButtonText, { color: timeframe === "monthly" ? "#ffffff" : theme.colors.subtext }]}>Monthly</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.performanceIndicator}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.subtext} />
            <Text style={[styles.performanceText, { color: theme.colors.subtext }]}>Last refreshed: {lastRefreshText}</Text>
          </View>

          <View style={[styles.chartCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Calories</Text>
            <RenderSkeletonChart />
          </View>

          <View style={[styles.chartCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Macronutrients</Text>
            <RenderSkeletonChart />
          </View>

          <RenderSkeletonCards />

          <View style={styles.macroCardsContainer}>
            <RenderSkeletonMacroCards />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <MaterialCommunityIcons name="fire" size={24} color={theme.dark ? "#FF6B6B" : "#FF3B30"} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Avg. Calories</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{nutritionData.length > 0 ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.calories, 0) / nutritionData.length) : 0}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <MaterialCommunityIcons name="trending-up" size={24} color={theme.colors.primary} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Highest Day</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{nutritionData.length > 0 ? Math.max(...nutritionData.map((item) => item.calories)) : 0}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={theme.dark ? "#64D2FF" : "#007AFF"} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Current Streak</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {getStreak} {getStreak === 1 ? "day" : "days"}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <MaterialCommunityIcons name="scale-balance" size={24} color={theme.dark ? "#BF5AF2" : "#5856D6"} />
            <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>Avg. Protein</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{nutritionData.length > 0 ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.protein, 0) / nutritionData.length) : 0}g</Text>
          </View>
        </View>

        <View style={styles.macroCardsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Nutrition</Text>
          <MacroCards calorieGoal={calorieGoalState} macroGoals={macroGoalsState} dailyStats={dailyStatsState} setCalorieGoal={handleSetCalorieGoal} setMacroGoals={handleSetMacroGoals} waterTrackerSettings={waterTrackerSettings} isWaterTrackerEnabled={waterTrackerSettings.enabled} onIncrementWater={handleIncrementWater} onDecrementWater={handleDecrementWater} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timeframeSelector: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "center",
    gap: 16,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
  },
  timeframeButtonText: {
    fontSize: 16,
    color: "#666666",
  },
  chartContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  performanceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  performanceText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },
  macroCardsContainer: {
    marginTop: 16,
    marginBottom: 30,
    marginHorizontal: -16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "right",
  },
})
