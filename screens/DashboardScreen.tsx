import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LineChart, BarChart } from "react-native-chart-kit"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getDailyNutrition } from "../utils/supabaseutils"
import { supabase } from "../utils/supabaseClient"

const { width } = Dimensions.get("window")

// Define TypeScript interfaces
interface NutritionDataPoint {
  date: string
  calories: number
  carbs: number
  protein: number
  fat: number
}

interface NavigationProps {
  navigation: any
}

export default function DashboardScreen({ navigation }: NavigationProps) {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly")
  const [nutritionData, setNutritionData] = useState<NutritionDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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

  const fetchNutritionData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      let startDate: Date, endDate: Date

      if (timeframe === "weekly") {
        startDate = startOfWeek(new Date())
        endDate = endOfWeek(new Date())
      } else {
        startDate = startOfMonth(new Date())
        endDate = endOfMonth(new Date())
      }

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

      const data = await Promise.all(
        dateRange.map(async (date) => {
          const dateString = date.toISOString().split("T")[0]

          // Use supabase to get nutrition data directly
          const nutritionInfo = await getDailyNutrition(dateString)

          if (nutritionInfo && nutritionInfo.dailyStats) {
            return {
              date: dateString,
              calories: (nutritionInfo.dailyStats.calories.food || 0) - (nutritionInfo.dailyStats.calories.exercise || 0),
              carbs: nutritionInfo.dailyStats.macros.carbs || 0,
              protein: nutritionInfo.dailyStats.macros.protein || 0,
              fat: nutritionInfo.dailyStats.macros.fat || 0,
            }
          }

          return {
            date: dateString,
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
          }
        }),
      )

      setNutritionData(data)
    } catch (error) {
      console.error("Error fetching nutrition data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [timeframe, user])

  useEffect(() => {
    fetchNutritionData()
  }, [fetchNutritionData])

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
      },
    ]

    return { labels, datasets }
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
      strokeWidth: "2",
      stroke: "#007AFF",
    },
    propsForLabels: {
      fontSize: 10,
    },
  }

  // Function to refresh data
  const handleRefresh = () => {
    fetchNutritionData()
  }

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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.timeframeSelector}>
        <TouchableOpacity style={[styles.timeframeButton, timeframe === "weekly" && styles.timeframeButtonActive]} onPress={() => setTimeframe("weekly")}>
          <Text style={[styles.timeframeButtonText, timeframe === "weekly" && styles.timeframeButtonTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeframeButton, timeframe === "monthly" && styles.timeframeButtonActive]} onPress={() => setTimeframe("monthly")}>
          <Text style={[styles.timeframeButtonText, timeframe === "monthly" && styles.timeframeButtonTextActive]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chartContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Calories</Text>
          {getChartData("calories") && <LineChart data={getChartData("calories") || { labels: [], datasets: [{ data: [0], color: () => "rgba(0,0,0,0)" }] }} width={width - 40} height={200} chartConfig={chartConfig} bezier style={styles.chart} withInnerLines={false} withOuterLines={true} withVerticalLabels={true} withHorizontalLabels={true} fromZero={true} />}
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
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "rgba(255, 107, 107, 1)" }]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "rgba(78, 205, 196, 1)" }]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "rgba(255, 167, 38, 1)" }]} />
              <Text style={styles.legendText}>Fat</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF3B30" />
            <Text style={styles.statLabel}>Avg. Calories</Text>
            <Text style={styles.statValue}>{nutritionData.length > 0 ? Math.round(nutritionData.reduce((acc, curr) => acc + curr.calories, 0) / nutritionData.length) : 0}</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Highest Day</Text>
            <Text style={styles.statValue}>{nutritionData.length > 0 ? Math.max(...nutritionData.map((item) => item.calories)) : 0}</Text>
          </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    flex: 1,
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
    backgroundColor: "#007AFF",
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
    marginBottom: 30,
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
})
