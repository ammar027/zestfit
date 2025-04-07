import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Switch, TouchableOpacity, Modal, TextInput, Dimensions, ScrollView } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute, useFocusEffect, NavigationProp, ParamListBase, DrawerActions } from "@react-navigation/native"
import { useTheme } from "../theme"

export default function WaterTrackerScreen() {
  const [enabled, setEnabled] = useState(false)
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4) // default 4 cups
  const [cupsConsumed, setCupsConsumed] = useState(0) // track water consumption
  const [isGoalModalVisible, setGoalModalVisible] = useState(false)
  const [tempGoal, setTempGoal] = useState(dailyWaterGoal.toString())
  const { theme } = useTheme()

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

  const insets = useSafeAreaInsets()

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

      <Header />

      <ScrollView style={styles.scrollContainer}>
        {/* Enable/Disable Switch */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.switchContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Water Tracking</Text>
            <Switch value={enabled} onValueChange={toggleSwitch} trackColor={{ false: "#767577", true: theme.colors.primary }} />
          </View>
        </View>

        {/* Daily Goal Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Goal</Text>
          <View style={styles.goalContainer}>
            <Text style={[styles.goalText, { color: theme.colors.text }]}>
              {dailyWaterGoal} cups ({goalLiters}L)
            </Text>
            <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary }]} onPress={() => setGoalModalVisible(true)}>
              <MaterialCommunityIcons name="pencil" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Section */}
        {/* <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: progressWidth, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {cupsConsumed} of {dailyWaterGoal} cups ({consumedLiters}L)
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleRemoveCup}>
              <MaterialCommunityIcons name="minus" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleAddCup}>
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>

      {/* Goal Setting Modal */}
      <Modal visible={isGoalModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set Daily Water Goal</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.colors.input.text,
                  backgroundColor: theme.colors.input.background,
                  borderColor: theme.colors.border,
                },
              ]}
              keyboardType="numeric"
              value={tempGoal}
              onChangeText={setTempGoal}
              placeholder="Enter cups per day"
              placeholderTextColor={theme.colors.input.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.colors.button.secondary }]} onPress={() => setGoalModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveWaterGoal}>
                <Text style={[styles.saveButtonText, { color: theme.colors.secondaryButtonText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    padding: 5,
    borderRadius: 8,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    padding: 20,
    borderRadius: 12,
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
