import React, { useState, useEffect, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from "react-native"
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

export default function DashboardScreen({ navigation }: NavigationProps) {
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

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "1",
      stroke: "#2C3F00",
    },
    propsForLabels: {
      fontSize: 10,
    },
  }

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

  if (isLoading) {
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Home")}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Nutrition Dashboard</Text>
            {user && <Text style={styles.headerSubtitle}>Your health insights at a glance</Text>}
          </View>
          <TouchableOpacity disabled style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.timeframeSelector}>
          <TouchableOpacity disabled style={[styles.timeframeButton]}>
            <Text style={styles.timeframeButtonText}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled style={[styles.timeframeButton]}>
            <Text style={styles.timeframeButtonText}>Monthly</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chartContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.performanceIndicator}>
            <ActivityIndicator size="small" color="#2C3F00" style={{ marginRight: 8 }} />
            <Text style={styles.performanceText}>Loading dashboard data...</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Calories</Text>
            <RenderSkeletonChart />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Macronutrients</Text>
            <RenderSkeletonChart />
          </View>

          <RenderSkeletonCards />

          <View style={styles.macroCardsContainer}>
            <RenderSkeletonMacroCards />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nutrition Dashboard</Text>
          {user && <Text style={styles.headerSubtitle}>Your health insights at a glance</Text>}
        </View>
        <View style={styles.headerActionsContainer}>
          <Text style={styles.lastRefreshText}>{lastRefreshText}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={isRefreshing}>
            {isRefreshing ? <ActivityIndicator size="small" color="#2C3F00" /> : <MaterialCommunityIcons name="refresh" size={24} color="#333" />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timeframeSelector}>
        <TouchableOpacity style={[styles.timeframeButton, timeframe === "weekly" && styles.timeframeButtonActive]} onPress={() => setTimeframe("weekly")}>
          <Text style={[styles.timeframeButtonText, timeframe === "weekly" && styles.timeframeButtonTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeframeButton, timeframe === "monthly" && styles.timeframeButtonActive]} onPress={() => setTimeframe("monthly")}>
          <Text style={[styles.timeframeButtonText, timeframe === "monthly" && styles.timeframeButtonTextActive]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chartContainer} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2C3F00"]} tintColor="#2C3F00" />}>
        <View style={styles.performanceIndicator}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#888" />
          <Text style={styles.performanceText}>Last refreshed: {lastRefreshText}</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Calories</Text>
          {getChartData("calories") && (
            <LineChart
              data={getChartData("calories") || { labels: [], datasets: [{ data: [0], color: () => "rgba(0,0,0,0)" }] }}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
              onDataPointClick={({ index }: { index: number }) => handleSelectDay(index)}
              renderDotContent={({ x, y, index }: { x: number; y: number; index: number }) => {
                const dataPoint = nutritionData[index]
                const isSelected = selectedDataPoint && selectedDataPoint.date === dataPoint.date

                return isSelected ? (
                  <MotiView
                    key={`tooltip-${dataPoint.date}`}
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      position: "absolute",
                      top: y - 30,
                      left: x - 30,
                      backgroundColor: "white",
                      padding: 4,
                      borderRadius: 8,
                      elevation: 3,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      width: 60,
                    }}
                  >
                    <Text style={styles.dataPointLabel}>{dataPoint.calories} cal</Text>
                  </MotiView>
                ) : null
              }}
              decorator={() => {
                if (!selectedDataPoint) return null

                // Find the index of the selected data point
                const index = nutritionData.findIndex((item) => item.date === selectedDataPoint.date)

                if (index === -1) return null

                return (
                  <MotiView
                    key={`highlight-${selectedDataPoint.date}`}
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: 300 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: index * ((width - 60) / nutritionData.length) + 35,
                      width: 2,
                      backgroundColor: "rgba(44, 63, 0, 0.5)",
                    }}
                  />
                )
              }}
            />
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Macronutrients</Text>
          {nutritionData.length > 0 && (
            <BarChart
              data={{
                labels: nutritionData.map((item) => format(new Date(item.date), timeframe === "weekly" ? "EEE" : "d")),
                datasets: [
                  {
                    data: nutritionData.map((item) => item.carbs || 0),
                  },
                  {
                    data: nutritionData.map((item) => item.protein || 0),
                  },
                  {
                    data: nutritionData.map((item) => item.fat || 0),
                  },
                ],
              }}
              width={width - 40}
              height={200}
              chartConfig={{
                ...chartConfig,
                stackedBar: false,
                barPercentage: 0.6,
                decimalPlaces: 0,
                propsForBackgroundLines: {
                  strokeDasharray: "",
                },
                color: (opacity = 1, index = 0) => {
                  const colors = [
                    `rgba(255, 107, 107, ${opacity})`, // carbs
                    `rgba(78, 205, 196, ${opacity})`, // protein
                    `rgba(255, 167, 38, ${opacity})`, // fat
                  ]
                  return colors[index % colors.length]
                },
              }}
              style={styles.chart}
              withInnerLines={false}
              showBarTops={false}
              fromZero={true}
              yAxisLabel=""
              yAxisSuffix="g"
            />
          )}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem} key="legend-carbs">
              <View style={[styles.legendColor, { backgroundColor: "rgba(255, 107, 107, 1)" }]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem} key="legend-protein">
              <View style={[styles.legendColor, { backgroundColor: "rgba(78, 205, 196, 1)" }]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem} key="legend-fat">
              <View style={[styles.legendColor, { backgroundColor: "rgba(255, 167, 38, 1)" }]} />
              <Text style={styles.legendText}>Fat</Text>
            </View>
          </View>
        </View>

        {selectedDataPoint && (
          <View style={styles.selectedDayCard}>
            <Text style={styles.selectedDayTitle}>{format(new Date(selectedDataPoint.date), "MMMM d, yyyy")}</Text>

            {renderCalorieProgress()}

            <View style={styles.macroDistributionContainer}>
              {getMacroDistribution().length > 0 ? (
                <PieChart data={getMacroDistribution()} width={width - 40} height={180} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="15" absolute={false} hasLegend={false} />
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="nutrition-outline" size={40} color="#ccc" />
                  <Text style={styles.noDataText}>No nutrition data recorded</Text>
                </View>
              )}

              <View style={styles.macroDetailsContainer}>
                <View style={styles.macroDetailItem} key="macro-carbs">
                  <View style={[styles.macroDetailColor, { backgroundColor: "rgba(255, 107, 107, 1)" }]} />
                  <View>
                    <Text style={styles.macroDetailLabel}>Carbs</Text>
                    <Text style={styles.macroDetailValue}>{selectedDataPoint.carbs}g</Text>
                  </View>
                </View>
                <View style={styles.macroDetailItem} key="macro-protein">
                  <View style={[styles.macroDetailColor, { backgroundColor: "rgba(78, 205, 196, 1)" }]} />
                  <View>
                    <Text style={styles.macroDetailLabel}>Protein</Text>
                    <Text style={styles.macroDetailValue}>{selectedDataPoint.protein}g</Text>
                  </View>
                </View>
                <View style={styles.macroDetailItem} key="macro-fat">
                  <View style={[styles.macroDetailColor, { backgroundColor: "rgba(255, 167, 38, 1)" }]} />
                  <View>
                    <Text style={styles.macroDetailLabel}>Fat</Text>
                    <Text style={styles.macroDetailValue}>{selectedDataPoint.fat}g</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF3B30" />
            <Text style={styles.statLabel}>Avg. Calories</Text>
            <Text style={styles.statValue}>{nutritionData.length > 0 ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.calories, 0) / nutritionData.length) : 0}</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#2C3F00" />
            <Text style={styles.statLabel}>Highest Day</Text>
            <Text style={styles.statValue}>{nutritionData.length > 0 ? Math.max(...nutritionData.map((item) => item.calories)) : 0}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>
              {getStreak} {getStreak === 1 ? "day" : "days"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="scale-balance" size={24} color="#5856D6" />
            <Text style={styles.statLabel}>Avg. Protein</Text>
            <Text style={styles.statValue}>{nutritionData.length > 0 ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.protein, 0) / nutritionData.length) : 0}g</Text>
          </View>
        </View>

        <View style={styles.macroCardsContainer}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          <MacroCards calorieGoal={calorieGoalState} macroGoals={macroGoalsState} dailyStats={dailyStatsState} setCalorieGoal={handleSetCalorieGoal} setMacroGoals={handleSetMacroGoals} waterTrackerSettings={waterTrackerSettings} isWaterTrackerEnabled={waterTrackerSettings.enabled} onIncrementWater={handleIncrementWater} onDecrementWater={handleDecrementWater} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastRefreshText: {
    fontSize: 12,
    color: "#888",
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
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
  timeframeButtonActive: {
    backgroundColor: "#2C3F00",
  },
  timeframeButtonText: {
    fontSize: 16,
    color: "#666666",
  },
  timeframeButtonTextActive: {
    color: "white",
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
  selectedDayCard: {
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
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  macroDistributionContainer: {
    alignItems: "center",
  },
  macroDetailsContainer: {
    width: "100%",
    marginTop: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
  },
  macroDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  macroDetailColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  macroDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  macroDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  noDataContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: "center",
  },
  dataPointLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
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
})
