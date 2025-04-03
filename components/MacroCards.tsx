import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import GoalSettingModal from "./GoalSettingModal"

interface MacroGoals {
  carbs: number
  protein: number
  fat: number
}

interface CaloriesStats {
  food: number
  exercise: number
}

interface MacrosStats {
  carbs: number
  protein: number
  fat: number
}

interface DailyStats {
  calories: CaloriesStats
  macros: MacrosStats
}

interface WaterTrackerSettings {
  enabled: boolean
  dailyWaterGoal: number
  cupsConsumed: number
}

interface MacroCardsProps {
  calorieGoal: number
  macroGoals: MacroGoals
  dailyStats: DailyStats
  setCalorieGoal: (calories: number) => void
  setMacroGoals: (macros: MacroGoals) => void
  waterTrackerSettings?: WaterTrackerSettings
  isWaterTrackerEnabled?: boolean
  onIncrementWater?: () => void
  onDecrementWater?: () => void
}

interface MacroCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  title: string
  current: number
  goal: number
  color: string
  onPress: () => void
}

export default function MacroCards({
  calorieGoal,
  macroGoals,
  dailyStats,
  setCalorieGoal,
  setMacroGoals,
  waterTrackerSettings = {
    enabled: false,
    dailyWaterGoal: 0,
    cupsConsumed: 0,
  },
  isWaterTrackerEnabled = false,
  onIncrementWater,
  onDecrementWater,
}: MacroCardsProps) {
  const [isCalorieModalVisible, setCalorieModalVisible] = useState(false)
  const [isMacroModalVisible, setMacroModalVisible] = useState(false)

  // Ensure all values are integers to prevent display issues
  const safeCalorieGoal = Math.round(calorieGoal || 2000)
  const safeCaloriesFood = Math.round(dailyStats?.calories?.food || 0)
  const safeCaloriesExercise = Math.round(dailyStats?.calories?.exercise || 0)
  const safeCarbsGoal = Math.round(macroGoals?.carbs || 250)
  const safeProteinGoal = Math.round(macroGoals?.protein || 150)
  const safeFatGoal = Math.round(macroGoals?.fat || 65)
  const safeCarbsCurrent = Math.round(dailyStats?.macros?.carbs || 0)
  const safeProteinCurrent = Math.round(dailyStats?.macros?.protein || 0)
  const safeFatCurrent = Math.round(dailyStats?.macros?.fat || 0)

  // Calculate total calories and remaining calories
  const totalCalories = safeCaloriesFood - safeCaloriesExercise
  const remainingCalories = safeCalorieGoal - totalCalories

  // Log stats for debugging
  useEffect(() => {
    console.log("MacroCards received updated stats:", {
      calories: { food: safeCaloriesFood, exercise: safeCaloriesExercise },
      macros: {
        carbs: safeCarbsCurrent,
        protein: safeProteinCurrent,
        fat: safeFatCurrent,
      },
    })
  }, [safeCaloriesFood, safeCaloriesExercise, safeCarbsCurrent, safeProteinCurrent, safeFatCurrent])

  // Handle calorie goal updates
  const handleCalorieGoalUpdate = (goals: { calories: number }) => {
    const newCalorieGoal = Math.round(goals.calories)

    // Update state in parent component
    setCalorieGoal(newCalorieGoal)

    // Close modal
    setCalorieModalVisible(false)
  }

  // Handle macro goals updates
  const handleMacroGoalsUpdate = (goals: { carbs: number; protein: number; fat: number }) => {
    const newMacroGoals = {
      carbs: Math.round(goals.carbs),
      protein: Math.round(goals.protein),
      fat: Math.round(goals.fat),
    }

    // Update state in parent component
    setMacroGoals(newMacroGoals)

    // Close modal
    setMacroModalVisible(false)
  }

  const MacroCard = ({ icon, title, current, goal, color, onPress }: MacroCardProps) => {
    // Ensure progress is between 0 and 100%
    const progress = Math.min(100, Math.max(0, (current / goal) * 100))

    return (
      <TouchableOpacity style={styles.macroCard} onPress={onPress}>
        <View style={styles.macroCardHeader}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={styles.macroCardTitle}>{title}</Text>
        </View>

        <View style={styles.macroCardContent}>
          <View style={styles.macroProgressContainer}>
            <View
              style={[
                styles.macroProgressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>

          <View style={styles.macroValueContainer}>
            <Text style={[styles.macroCurrentValue, { color }]}>{Math.round(current)}g</Text>
            <Text style={styles.macroGoalValue}>/ {Math.round(goal)}g</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const WaterCard = () => {
    // Show the card if either flag is true
    const shouldShow = waterTrackerSettings.enabled || isWaterTrackerEnabled

    if (!shouldShow) return null

    // Ensure cups consumed and daily goal are valid integers
    const cupsConsumed = Math.round(waterTrackerSettings.cupsConsumed || 0)
    const dailyWaterGoal = Math.round(waterTrackerSettings.dailyWaterGoal || 4)

    // Ensure progress is between 0 and 100%
    const progress = Math.min(100, Math.max(0, (cupsConsumed / dailyWaterGoal) * 100))

    return (
      <View style={styles.waterCard}>
        <View style={styles.waterCardHeader}>
          <MaterialCommunityIcons name="water" size={18} color="#2C3F00" />
          <Text style={styles.waterCardTitle}>Water</Text>
          <Text style={styles.waterLitersText}>{(cupsConsumed * 0.25).toFixed(1)}L</Text>
        </View>

        <View style={styles.waterMainContent}>
          <View style={styles.waterProgressContainer}>
            <View
              style={[
                styles.waterProgressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: "#2C3F00",
                },
              ]}
            />
          </View>

          <View style={styles.waterCardControls}>
            <TouchableOpacity style={styles.waterControlButton} onPress={onDecrementWater} disabled={cupsConsumed === 0}>
              <MaterialCommunityIcons name="minus" size={14} color={cupsConsumed === 0 ? "#CCCCCC" : "#2C3F00"} />
            </TouchableOpacity>

            <Text style={styles.waterCountText}>
              {cupsConsumed}/{dailyWaterGoal}
            </Text>

            <TouchableOpacity style={styles.waterControlButton} onPress={onIncrementWater} disabled={cupsConsumed === dailyWaterGoal}>
              <MaterialCommunityIcons name="plus" size={14} color={cupsConsumed === dailyWaterGoal ? "#CCCCCC" : "#2C3F00"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Top Row with Calorie and Macro Cards */}
      <View style={styles.topRow}>
        {/* Calorie Card */}
        <TouchableOpacity style={[styles.card, styles.calorieCard]} onPress={() => setCalorieModalVisible(true)}>
          <View style={styles.calorieCardHeader}>
            <MaterialCommunityIcons name="fire" size={22} color="#e39454" />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
          <View style={styles.calorieContent}>
            <Text style={[styles.calorieMainText, { color: remainingCalories < 0 ? "#FF3B30" : "#2C3F00" }]}>{totalCalories}</Text>
            <Text style={styles.calorieSubText}>/ {safeCalorieGoal}</Text>
          </View>
          <View style={styles.calorieSeparator} />
          <View style={styles.calorieDetailContainer}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="food" size={16} color="#4ECDC4" />
              <Text style={styles.detailLabel}>+{safeCaloriesFood} </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="run" size={16} color="#FF6B6B" />
              <Text style={styles.detailLabel}>-{safeCaloriesExercise}</Text>
            </View>
            <View style={styles.remainingContainer}>
              <Text style={[styles.remainingText, { color: remainingCalories < 0 ? "#FF3B30" : remainingCalories < 200 ? "#FFA726" : "#4ECDC4" }]}>{remainingCalories > 0 ? remainingCalories + " left" : Math.abs(remainingCalories) + " over"}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Macro Card */}
        <TouchableOpacity style={[styles.card, styles.macroSummaryCard]} onPress={() => setMacroModalVisible(true)}>
          <View style={styles.macroCardHeader}>
            <MaterialCommunityIcons name="progress-check" size={22} color="#2C3F00" />
            <Text style={styles.cardTitle}>Macros</Text>
          </View>

          <View style={styles.macroValues}>
            <View style={styles.macroRow}>
              <MaterialCommunityIcons name="bread-slice" size={16} color="#e39454" />
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroProgressMini}>
                <View
                  style={[
                    styles.macroProgressBarMini,
                    {
                      width: `${Math.min(100, (safeCarbsCurrent / safeCarbsGoal) * 100)}%`,
                      backgroundColor: "#FF6B6B",
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValueText}>
                <Text style={[styles.macroCurrentText, { color: "#FF6B6B" }]}>{safeCarbsCurrent}</Text>
                <Text style={styles.macroSlashText}> / </Text>
                <Text style={styles.macroGoalText}>{safeCarbsGoal}g</Text>
              </Text>
            </View>
            <View style={styles.macroRow}>
              <MaterialCommunityIcons name="food-steak" size={16} color="#4ECDC4" />
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroProgressMini}>
                <View
                  style={[
                    styles.macroProgressBarMini,
                    {
                      width: `${Math.min(100, (safeProteinCurrent / safeProteinGoal) * 100)}%`,
                      backgroundColor: "#4ECDC4",
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValueText}>
                <Text style={[styles.macroCurrentText, { color: "#4ECDC4" }]}>{safeProteinCurrent}</Text>
                <Text style={styles.macroSlashText}> / </Text>
                <Text style={styles.macroGoalText}>{safeProteinGoal}g</Text>
              </Text>
            </View>
            <View style={styles.macroRow}>
              <MaterialCommunityIcons name="human" size={16} color="#FFA726" />
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroProgressMini}>
                <View
                  style={[
                    styles.macroProgressBarMini,
                    {
                      width: `${Math.min(100, (safeFatCurrent / safeFatGoal) * 100)}%`,
                      backgroundColor: "#FFA726",
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValueText}>
                <Text style={[styles.macroCurrentText, { color: "#FFA726" }]}>{safeFatCurrent}</Text>
                <Text style={styles.macroSlashText}> / </Text>
                <Text style={styles.macroGoalText}>{safeFatGoal}g</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Row with Water Card */}
      {(Boolean(waterTrackerSettings.enabled) || Boolean(isWaterTrackerEnabled)) && (
        <View style={styles.bottomRow}>
          <WaterCard />
        </View>
      )}

      <GoalSettingModal visible={isCalorieModalVisible} onClose={() => setCalorieModalVisible(false)} type="calories" goals={{ calories: safeCalorieGoal }} onSave={handleCalorieGoalUpdate} />

      <GoalSettingModal
        visible={isMacroModalVisible}
        onClose={() => setMacroModalVisible(false)}
        type="macros"
        goals={{
          carbs: safeCarbsGoal,
          protein: safeProteinGoal,
          fat: safeFatGoal,
        }}
        onSave={handleMacroGoalsUpdate}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  calorieCard: {
    marginRight: 8,
  },
  macroSummaryCard: {
    marginLeft: 1,
    padding: 10,
  },
  calorieCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  calorieContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
  },
  calorieMainText: {
    fontSize: 26,
    fontWeight: "bold",
    marginRight: 4,
  },
  calorieSubText: {
    fontSize: 16,
    color: "#888",
  },
  calorieSeparator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 10,
  },
  calorieDetailContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  remainingContainer: {
    marginLeft: "auto",
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  macroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  macroValues: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  macroLabel: {
    fontSize: 13,
    marginLeft: 5,
    color: "#333",
    width: 45,
    fontWeight: "500",
  },
  macroProgressMini: {
    flex: 1,
    height: 4,
    backgroundColor: "#E9E9E9",
    borderRadius: 2,
    overflow: "hidden",
    marginHorizontal: 6,
  },
  macroProgressBarMini: {
    height: "100%",
    borderRadius: 2,
  },
  macroValueText: {
    fontSize: 12,
    color: "#333",
    width: 72,
    textAlign: "right",
    marginRight: 10,
  },
  macroCurrentText: {
    fontWeight: "bold",
  },
  macroSlashText: {
    color: "#999",
  },
  macroGoalText: {
    color: "#666",
  },
  // MacroCard component styles
  macroCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  macroCardContent: {
    marginTop: 8,
  },
  macroProgressContainer: {
    height: 6,
    backgroundColor: "#E9E9E9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  macroProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  macroValueContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    marginRight: 10,
  },
  macroCurrentValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 2,
  },
  macroGoalValue: {
    fontSize: 14,
    color: "#888",
  },
  // Water card styles
  waterCard: {
    backgroundColor: "white",
    borderRadius: 16,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 9,
    padding: 12,
  },
  waterCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  waterCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#333",
  },
  waterProgressContainer: {
    height: 4,
    backgroundColor: "#E9E9E9",
    borderRadius: 2,
    overflow: "hidden",
    flex: 1,
    marginRight: 10,
  },
  waterProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  waterMainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  waterCardControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  waterControlButton: {
    padding: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  waterCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 6,
  },
  waterLitersText: {
    fontSize: 11,
    color: "#888",
    marginLeft: "auto",
    fontWeight: "500",
  },
})
