import React, { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Switch, TouchableOpacity, Modal, TextInput, Dimensions, ScrollView, Animated } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute, useFocusEffect, NavigationProp, ParamListBase, DrawerActions } from "@react-navigation/native"
import { useTheme } from "../theme"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

export default function WaterTrackerScreen() {
  const [enabled, setEnabled] = useState(false)
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4) // default 4 cups
  const [cupsConsumed, setCupsConsumed] = useState(0) // track water consumption
  const [isGoalModalVisible, setGoalModalVisible] = useState(false)
  const [tempGoal, setTempGoal] = useState(dailyWaterGoal.toString())
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

  // Define cup size in ml (standard cup = 250ml)
  const CUP_SIZE_ML = 250

  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const route = useRoute()

  // Load water tracker settings from AsyncStorage every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadWaterSettings = async () => {
        try {
          console.log("Loading water tracker settings on focus")
          const storedSettings = await AsyncStorage.getItem("water_tracker_settings")
          if (storedSettings) {
            const settings = JSON.parse(storedSettings)
            console.log("Loaded settings:", settings)
            setEnabled(Boolean(settings.enabled))
            setDailyWaterGoal(settings.dailyWaterGoal || 4)
            setCupsConsumed(settings.cupsConsumed || 0)
          }
        } catch (error) {
          console.error("Error loading water tracker settings:", error)
        }
      }

      loadWaterSettings()

      return () => {
        // Cleanup if needed
      }
    }, []),
  )

  const toggleSwitch = async () => {
    // Make sure we toggle from the current state
    const newEnabled = !enabled

    // Update immediately for a responsive UI
    setEnabled(Boolean(newEnabled))

    console.log("Toggle water tracker to:", newEnabled)

    // Prepare settings object with proper boolean type
    const settings = {
      enabled: Boolean(newEnabled),
      dailyWaterGoal,
      cupsConsumed,
    }

    // Save to AsyncStorage first
    try {
      await AsyncStorage.setItem("water_tracker_settings", JSON.stringify(settings))
      console.log("Saved to AsyncStorage:", settings)
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error)
    }

    // Save to local state without navigating
    await saveSettingsWithoutNavigating(settings)

    // At this point, we've already updated the local state and AsyncStorage,
    // now navigate to Home with the updated settings for an immediate UI update
    try {
      // @ts-ignore - Ignore navigation type issues
      navigation.navigate("Home", {
        waterTrackerUpdated: true,
        waterTrackerSettings: {
          enabled: Boolean(newEnabled),
          dailyWaterGoal,
          cupsConsumed,
        },
      })
      console.log("Navigated to Home with settings:", settings)
    } catch (error) {
      console.error("Error navigating to Home:", error)
    }
  }

  const saveWaterGoal = async () => {
    const newGoal = parseInt(tempGoal, 10)
    if (newGoal > 0) {
      // Update local UI immediately
      setDailyWaterGoal(newGoal)
      setGoalModalVisible(false)

      console.log("Saving new water goal:", newGoal)

      // Prepare settings with proper types
      const settings = {
        enabled: Boolean(enabled),
        dailyWaterGoal: newGoal,
        cupsConsumed,
      }

      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem("water_tracker_settings", JSON.stringify(settings))
        console.log("Saved new goal to AsyncStorage:", settings)
      } catch (error) {
        console.error("Error saving goal to AsyncStorage:", error)
      }

      // Save locally without navigation
      await saveSettingsWithoutNavigating(settings)

      // Navigate to Home with latest settings for immediate UI update
      try {
        // @ts-ignore - Ignore navigation type issues
        navigation.navigate("Home", {
          waterTrackerUpdated: true,
          waterTrackerSettings: {
            enabled: Boolean(enabled),
            dailyWaterGoal: newGoal,
            cupsConsumed,
          },
        })
        console.log("Navigated to Home with new goal settings")
      } catch (error) {
        console.error("Error navigating to Home with goal:", error)
      }
    }
  }

  const handleAddCup = async () => {
    if (cupsConsumed < dailyWaterGoal) {
      const newCount = cupsConsumed + 1
      setCupsConsumed(newCount)

      const settings = {
        enabled,
        dailyWaterGoal,
        cupsConsumed: newCount,
      }

      await updateCupsConsumed(settings)

      // // Update the HomeScreen with the latest water tracker settings
      // updateHomeScreenWaterSettings(settings)
    }
  }

  const handleRemoveCup = async () => {
    if (cupsConsumed > 0) {
      const newCount = cupsConsumed - 1
      setCupsConsumed(newCount)

      const settings = {
        enabled,
        dailyWaterGoal,
        cupsConsumed: newCount,
      }

      await updateCupsConsumed(settings)

      // // Update the HomeScreen with the latest water tracker settings
      // updateHomeScreenWaterSettings(settings)
    }
  }

  const updateCupsConsumed = async (settings: WaterTrackerSettings) => {
    await saveSettingsWithoutNavigating(settings)
  }

  interface WaterTrackerSettings {
    enabled: boolean
    dailyWaterGoal: number
    cupsConsumed: number
  }

  // Save settings without navigating away from the screen
  const saveSettingsWithoutNavigating = async (settings: WaterTrackerSettings) => {
    try {
      // Save to global storage only
      await AsyncStorage.setItem("water_tracker_settings", JSON.stringify(settings))
      return true
    } catch (error) {
      console.error("Error saving water tracker settings:", error)
      return false
    }
  }

  // Update HomeScreen's water tracker settings
  const updateHomeScreenWaterSettings = (settings: WaterTrackerSettings) => {
    // @ts-ignore - Ignore navigation type issues
    navigation.navigate("Home", {
      waterTrackerUpdated: true,
      waterTrackerSettings: {
        enabled: settings.enabled,
        dailyWaterGoal: settings.dailyWaterGoal,
        cupsConsumed: settings.cupsConsumed,
      },
    })
  }

  // Convert cups to liters
  const cupsToLiters = (cups: number): string => {
    const totalMl = cups * CUP_SIZE_ML
    const liters = totalMl / 1000
    return liters.toFixed(1)
  }

  // Calculate progress percentage
  const progressPercentage = dailyWaterGoal > 0 ? (cupsConsumed / dailyWaterGoal) * 100 : 0
  const progressWidth = (Dimensions.get("window").width - 64) * (progressPercentage / 100)

  // Get goal in liters
  const goalLiters = cupsToLiters(dailyWaterGoal)
  const consumedLiters = cupsToLiters(cupsConsumed)

  // Custom header component
  const Header = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <MaterialCommunityIcons name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Water Tracker</Text>
        <View style={{ width: 28 }} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

      <ScrollView style={styles.scrollContainer}>
        {/* Enable/Disable Switch */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <View style={styles.switchContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Water Tracking</Text>
                <Switch value={enabled} onValueChange={toggleSwitch} trackColor={{ false: "#767577", true: theme.colors.primary }} />
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Daily Goal Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Goal</Text>
              <View style={styles.goalContainer}>
                <Text style={[styles.goalText, { color: theme.colors.text }]}>
                  {dailyWaterGoal} cups ({goalLiters}L)
                </Text>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary + "20" }]} onPress={() => setGoalModalVisible(true)}>
                  <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </ScrollView>

      {/* Goal Setting Modal */}
      <Modal visible={isGoalModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.modalContent, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set Daily Water Goal</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                    color: theme.colors.input.text,
                  },
                ]}
                keyboardType="numeric"
                value={tempGoal}
                onChangeText={setTempGoal}
                placeholder="Enter cups per day"
                placeholderTextColor={theme.colors.input.placeholder}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#ddd" }]} onPress={() => setGoalModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveWaterGoal}>
                  <Text style={[styles.saveButtonText, { color: theme.colors.secondaryButtonText }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  goalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalText: {
    fontSize: 20,
    fontWeight: "semibold",
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {},
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
