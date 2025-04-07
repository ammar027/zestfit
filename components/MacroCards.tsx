import React, { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg"
import { BlurView } from "expo-blur"
import GoalSettingModal from "./GoalSettingModal"
import { useTheme } from "../theme"

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
  onEditWater?: () => void
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
  onEditWater,
}: MacroCardsProps) {
  const { theme } = useTheme()
  const [isCalorieModalVisible, setCalorieModalVisible] = useState(false)
  const [isMacroModalVisible, setMacroModalVisible] = useState(false)

  // Animated values
  const calorieProgressAnim = useRef(new Animated.Value(0)).current
  const carbsProgressAnim = useRef(new Animated.Value(0)).current
  const proteinProgressAnim = useRef(new Animated.Value(0)).current
  const fatProgressAnim = useRef(new Animated.Value(0)).current
  const waterProgressAnim = useRef(new Animated.Value(0)).current

  // Get device width for responsive sizing
  const windowWidth = Dimensions.get("window").width

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

  // Calculate percentages for visualizations
  const caloriePercentage = Math.min(100, Math.max(0, (totalCalories / safeCalorieGoal) * 100))
  const carbsPercentage = Math.min(100, Math.max(0, (safeCarbsCurrent / safeCarbsGoal) * 100))
  const proteinPercentage = Math.min(100, Math.max(0, (safeProteinCurrent / safeProteinGoal) * 100))
  const fatPercentage = Math.min(100, Math.max(0, (safeFatCurrent / safeFatGoal) * 100))

  // Macro distribution
  const totalMacroGrams = safeCarbsCurrent + safeProteinCurrent + safeFatCurrent
  const carbsRatio = totalMacroGrams > 0 ? safeCarbsCurrent / totalMacroGrams : 0.33
  const proteinRatio = totalMacroGrams > 0 ? safeProteinCurrent / totalMacroGrams : 0.33
  const fatRatio = totalMacroGrams > 0 ? safeFatCurrent / totalMacroGrams : 0.33

  // Animate progress bars when values change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(calorieProgressAnim, {
        toValue: caloriePercentage / 100,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(carbsProgressAnim, {
        toValue: carbsPercentage / 100,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(proteinProgressAnim, {
        toValue: proteinPercentage / 100,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fatProgressAnim, {
        toValue: fatPercentage / 100,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start()
  }, [safeCaloriesFood, safeCaloriesExercise, safeCarbsCurrent, safeProteinCurrent, safeFatCurrent, safeCalorieGoal, safeCarbsGoal, safeProteinGoal, safeFatGoal])

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
      <TouchableOpacity style={[styles.macroCard, { backgroundColor: theme.colors.card }]} onPress={onPress}>
        <View style={styles.macroCardHeader}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={[styles.macroCardTitle, { color: theme.colors.text }]}>{title}</Text>
        </View>

        <View style={styles.macroCardContent}>
          <View style={[styles.macroProgressContainer, { backgroundColor: theme.dark ? "rgba(255, 255, 255, 0.21)" : "#E9E9E9" }]}>
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
            <Text style={[styles.macroGoalValue, { color: theme.colors.subtext }]}>/ {Math.round(goal)}g</Text>
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

    // Ensure progress is between 0 and 100% (cap at 100% for visual display)
    const progress = Math.min(100, Math.max(0, (cupsConsumed / dailyWaterGoal) * 100))

    // Update animated progress when values change
    useEffect(() => {
      Animated.timing(waterProgressAnim, {
        toValue: progress / 100,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }, [cupsConsumed, dailyWaterGoal])

    // Check if goal achieved or exceeded
    const goalAchieved = cupsConsumed >= dailyWaterGoal

    // Convert cups to liters
    const liters = (cupsConsumed * 0.25).toFixed(1)
    const goalLiters = (dailyWaterGoal * 0.25).toFixed(1)

    return (
      <View style={[styles.watercardmain, { backgroundColor: "transparent" }]}>
        <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
          <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
            <View style={styles.watercardHeader}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons name={goalAchieved ? "water-check" : "water"} size={20} color={goalAchieved ? "#4CAF50" : "#3498db"} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Water</Text>
              </View>

              {goalAchieved && (
                <View style={styles.achievementBadge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.achievementText}>Goal met!</Text>
                </View>
              )}

              <View style={styles.watersettingsIconContainer}>
                <TouchableOpacity onPress={onEditWater}>
                  <MaterialCommunityIcons name="cog-outline" size={16} color={theme.colors.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.waterCardMainContent}>
              {/* Water Visualization */}
              <View style={styles.waterVisualizationContainer}>
                <View style={styles.waterContainer}>
                  {/* Progress Bar */}
                  <View style={styles.waterProgressContainer}>
                    <Animated.View
                      style={[
                        styles.waterProgressFill,
                        {
                          width: waterProgressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: goalAchieved ? "#4CAF50" : "#3498db",
                        },
                      ]}
                    />
                  </View>

                  {/* Water Stats */}
                  <View style={styles.waterStatsContainer}>
                    <View style={styles.waterStats}>
                      <Text style={[styles.waterAmountText, { color: goalAchieved ? "#4CAF50" : "#3498db" }]}>{cupsConsumed}</Text>
                      <Text style={[styles.waterUnitText, { color: theme.colors.subtext }]}> cups</Text>
                    </View>
                    <Text style={[styles.waterLitersText, { color: theme.colors.subtext }]}>
                      {liters}L / {goalLiters}L
                    </Text>
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.waterControlsModern}>
                  <TouchableOpacity
                    style={[
                      styles.waterButtonModern,
                      {
                        backgroundColor: theme.dark ? "rgba(255,255,255,0.08)" : "#F0F0F0",
                        opacity: cupsConsumed === 0 ? 0.5 : 1,
                      },
                    ]}
                    onPress={onDecrementWater}
                    disabled={cupsConsumed === 0}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.waterButtonModern,
                      {
                        backgroundColor: goalAchieved ? "#4CAF50" : "#3498db",
                      },
                    ]}
                    onPress={onIncrementWater}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    )
  }

  // Custom circular progress component for calories
  const CalorieCircularProgress = () => {
    const size = windowWidth * 0.22
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = calorieProgressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
    })

    const progressColor = remainingCalories < 0 ? theme.colors.error : remainingCalories < 200 ? theme.colors.warning : "#4CAF50"

    return (
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Circle */}
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={"rgba(90, 90, 90, 0.1)"} strokeWidth={strokeWidth} fill="transparent" />

          {/* Progress Circle */}
          <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={progressColor} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90, ${size / 2}, ${size / 2})`} />

          {/* Center Text */}
          <G x={size / 2} y={size / 2}>
            <SvgText textAnchor="middle" fontSize="22" fontWeight="bold" fill={theme.colors.text} dy="0">
              {totalCalories}
            </SvgText>
            <SvgText textAnchor="start" fontSize="11" fill={theme.colors.subtext} opacity="0.6" dy="15" dx="-15">
              /{safeCalorieGoal}
            </SvgText>
          </G>
        </Svg>
      </View>
    )
  }

  // Create an animated circle component
  const AnimatedCircle = Animated.createAnimatedComponent(Circle)

  // Helper function to describe arcs for the pie chart
  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ")
  }

  return (
    <View style={styles.container}>
      {/* Top Row with Calorie and Macro Cards */}
      <View style={styles.topRow}>
        {/* Calorie Card */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.calorieCard,
            {
              backgroundColor: "transparent",
            },
          ]}
          onPress={() => setCalorieModalVisible(true)}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Calories</Text>
                </View>
                <View style={styles.settingsIconContainer}>
                  <MaterialCommunityIcons name="cog-outline" size={16} color={theme.colors.subtext} />
                </View>
              </View>

              <CalorieCircularProgress />

              <View style={[styles.calorieSeparator, { backgroundColor: theme.colors.border }]} />

              <View style={styles.calorieDetailsContainer}>
                <View style={styles.calorieDetail}>
                  <View style={[styles.calorieDetailIcon, { backgroundColor: "rgba(78, 205, 196, 0.1)" }]}>
                    <MaterialCommunityIcons name="food-apple" size={16} color="#4ECDC4" />
                  </View>
                  <View style={styles.calorieDetailText}>
                    <Text style={[styles.calorieDetailLabel, { color: theme.colors.subtext }]}>Food</Text>
                    <Text style={[styles.calorieDetailValue, { color: theme.colors.text }]}>+{safeCaloriesFood}</Text>
                  </View>
                </View>

                <View style={styles.calorieDetail}>
                  <View style={[styles.calorieDetailIcon, { backgroundColor: "rgba(255, 107, 107, 0.1)" }]}>
                    <MaterialCommunityIcons name="run" size={16} color="#FF6B6B" />
                  </View>
                  <View style={styles.calorieDetailText}>
                    <Text style={[styles.calorieDetailLabel, { color: theme.colors.subtext }]}>Exercise</Text>
                    <Text style={[styles.calorieDetailValue, { color: theme.colors.text }]}>-{safeCaloriesExercise}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.calorieRemainingContainer}>
                <LinearGradient colors={remainingCalories < 0 ? ["rgba(255,107,107,0.2)", "rgba(255,107,107,0.05)"] : remainingCalories < 200 ? ["rgba(255,193,7,0.2)", "rgba(255,193,7,0.05)"] : ["rgba(76,175,80,0.2)", "rgba(76,175,80,0.05)"]} style={styles.remainingBadge}>
                  <Text
                    style={[
                      styles.remainingText,
                      {
                        color: remainingCalories < 0 ? theme.colors.error : remainingCalories < 200 ? theme.colors.warning : theme.colors.success,
                      },
                    ]}
                  >
                    {remainingCalories > 0 ? remainingCalories + " cal left" : Math.abs(remainingCalories) + " cal over"}
                  </Text>
                </LinearGradient>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* Macro Card */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.macroSummaryCard,
            {
              backgroundColor: "transparent",
            },
          ]}
          onPress={() => setMacroModalVisible(true)}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <MaterialCommunityIcons name="chart-donut" size={20} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Macros</Text>
                </View>
                <View style={styles.settingsIconContainer}>
                  <MaterialCommunityIcons name="cog-outline" size={16} color={theme.colors.subtext} />
                </View>
              </View>

              {/* Macro Pie Chart */}
              <View style={styles.macroPieChartContainer}>
                <Svg height="65" width="65" viewBox="0 0 100 100">
                  {/* Create a pie chart showing macro distribution */}
                  {totalMacroGrams > 0 ? (
                    <>
                      {/* Carbs Slice */}
                      <Path d={describeArc(50, 50, 32, 0, 360 * carbsRatio)} fill="#FF6B6B" strokeWidth="0" stroke="none" />
                      {/* Protein Slice */}
                      <Path d={describeArc(50, 50, 32, 360 * carbsRatio, 360 * (carbsRatio + proteinRatio))} fill="#4ECDC4" strokeWidth="0" stroke="none" />
                      {/* Fat Slice */}
                      <Path d={describeArc(50, 50, 32, 360 * (carbsRatio + proteinRatio), 360)} fill="#FFA726" strokeWidth="0" stroke="none" />
                      {/* Inner white circle for donut effect */}
                      <Circle cx="50" cy="50" r="18" fill={theme.dark ? "#1E1E28" : "white"} />
                    </>
                  ) : (
                    /* Empty chart */
                    <>
                      <Circle cx="50" cy="50" r="32" fill={"rgba(0,0,0,0.03)"} />
                      <Circle cx="50" cy="50" r="18" fill={theme.dark ? "#1E1E28" : "white"} />
                    </>
                  )}
                </Svg>

                {/* Legend */}
                <View style={styles.macroLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#FF6B6B" }]} />
                    <Text style={[styles.legendText, { color: theme.colors.text }]}>Carbs</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#4ECDC4" }]} />
                    <Text style={[styles.legendText, { color: theme.colors.text }]}>Protein</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#FFA726" }]} />
                    <Text style={[styles.legendText, { color: theme.colors.text }]}>Fat</Text>
                  </View>
                </View>
              </View>

              <View style={styles.macroProgressBars}>
                {/* Carbs Progress */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <MaterialCommunityIcons name="bread-slice" size={14} color="#FF6B6B" />
                    <Text style={[styles.macroLabelModern, { color: theme.colors.text }]}>Carbs</Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      <Text style={{ color: "#FF6B6B", fontWeight: "bold" }}>{safeCarbsCurrent}</Text>
                      <Text style={{ color: theme.colors.subtext }}> / {safeCarbsGoal}g</Text>
                    </Text>
                  </View>
                  <View style={[styles.macroProgressBarBg, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#E9E9E9" }]}>
                    <Animated.View
                      style={[
                        styles.macroProgressFill,
                        {
                          width: carbsProgressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: "#FF6B6B",
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Protein Progress */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <MaterialCommunityIcons name="food-steak" size={14} color="#4ECDC4" />
                    <Text style={[styles.macroLabelModern, { color: theme.colors.text }]}>Protein</Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      <Text style={{ color: "#4ECDC4", fontWeight: "bold" }}>{safeProteinCurrent}</Text>
                      <Text style={{ color: theme.colors.subtext }}> / {safeProteinGoal}g</Text>
                    </Text>
                  </View>
                  <View style={[styles.macroProgressBarBg, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#E9E9E9" }]}>
                    <Animated.View
                      style={[
                        styles.macroProgressFill,
                        {
                          width: proteinProgressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: "#4ECDC4",
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Fat Progress */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <MaterialCommunityIcons name="oil" size={14} color="#FFA726" />
                    <Text style={[styles.macroLabelModern, { color: theme.colors.text }]}>Fat</Text>
                    <Text style={[styles.macroValue, { color: theme.colors.text }]}>
                      <Text style={{ color: "#FFA726", fontWeight: "bold" }}>{safeFatCurrent}</Text>
                      <Text style={{ color: theme.colors.subtext }}> / {safeFatGoal}g</Text>
                    </Text>
                  </View>
                  <View style={[styles.macroProgressBarBg, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#E9E9E9" }]}>
                    <Animated.View
                      style={[
                        styles.macroProgressFill,
                        {
                          width: fatProgressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: "#FFA726",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
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
    paddingHorizontal: 13,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: 9,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  card: {
    flex: 1,
    borderRadius: 24,
    minHeight: 230,
    marginHorizontal: 4,
    overflow: "hidden",
  },
  watercardmain: {
    flex: 1,
    borderRadius: 24,
    minHeight: 105,
    marginHorizontal: 4,
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  gradientOverlay: {
    flex: 1,
    padding: 16,
  },
  calorieCard: {
    marginRight: 6,
  },
  macroSummaryCard: {
    marginLeft: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  watercardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -18,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIconContainer: {
    padding: 4,
  },
  watersettingsIconContainer: {
    padding: 4,
    right: 37,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  // Calorie card styles
  calorieDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  calorieDetail: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  calorieDetailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  calorieDetailText: {
    flexDirection: "column",
  },
  calorieDetailLabel: {
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.7,
  },
  calorieDetailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  calorieSeparator: {
    height: 1,
    marginVertical: 0,
    opacity: 0.08,
  },
  calorieRemainingContainer: {
    alignItems: "center",
    marginTop: 9,
  },
  remainingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Macro card styles
  macroPieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  macroLegend: {
    marginLeft: 8,
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "400",
  },
  macroProgressBars: {
    marginTop: 4,
  },
  macroProgressItem: {
    marginBottom: 8,
  },
  macroProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  macroLabelModern: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  macroValue: {
    fontSize: 12,
    textAlign: "right",
  },
  macroProgressBarBg: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
    marginTop: 2,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  macroProgressFill: {
    height: "100%",
    borderRadius: 1.5,
  },

  // Water card styles
  waterCardMainContent: {
    marginTop: 8,
    alignItems: "stretch",
  },
  waterVisualizationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  waterContainer: {
    flex: 1,
    marginRight: 16,
  },
  waterProgressContainer: {
    height: 10,
    backgroundColor: "rgba(69, 69, 69, 0.09)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "rgba(17, 17, 17, 0.06)",
  },
  waterProgressFill: {
    height: "100%",
    borderRadius: 5,
  },
  waterStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  waterStats: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  waterAmountText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  waterUnitText: {
    fontSize: 13,
    opacity: 0.7,
  },
  waterLitersText: {
    fontSize: 11,
    opacity: 0.6,
  },
  waterControlsModern: {
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: 16,
    width: 30,
  },
  waterButtonModern: {
    width: 30,
    height: 30,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    top: -16,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  achievementText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4CAF50",
    marginLeft: 3,
  },
  macroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  macroCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  macroCardContent: {
    marginTop: 6,
  },
  macroProgressContainer: {
    height: 5,
    backgroundColor: "#E9E9E9",
    borderRadius: 2.5,
    overflow: "hidden",
    marginBottom: 6,
  },
  macroProgressBar: {
    height: "100%",
    borderRadius: 2.5,
  },
  macroValueContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    marginRight: 8,
  },
  macroCurrentValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 2,
  },
  macroGoalValue: {
    fontSize: 12,
    color: "#888",
  },
  macroCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
})
