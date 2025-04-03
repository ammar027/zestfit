import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Switch, TouchableOpacity, Modal, TextInput, Dimensions, ScrollView } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"

export default function WaterTrackerScreen() {
  const [enabled, setEnabled] = useState(false)
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4) // default 4 cups
  const [cupsConsumed, setCupsConsumed] = useState(0) // track water consumption
  const [isGoalModalVisible, setGoalModalVisible] = useState(false)
  const [tempGoal, setTempGoal] = useState(dailyWaterGoal.toString())

  // Define cup size in ml (standard cup = 250ml)
  const CUP_SIZE_ML = 250

  const navigation = useNavigation()
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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Tracker</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsCard}>
          <View style={[styles.switchContainer, !enabled && styles.noBottomMargin]}>
            <View style={styles.switchLabel}>
              <MaterialCommunityIcons name="water-outline" size={24} color="#2C3F00" />
              <Text style={styles.label}>Enable Water Tracker</Text>
            </View>
            <Switch value={enabled} onValueChange={toggleSwitch} trackColor={{ false: "#2C3F00", true: "#e2e6da" }} thumbColor={enabled ? "#2C3F00" : "#f4f3f4"} ios_backgroundColor="#E0E0E0" />
          </View>

          {enabled && (
            <TouchableOpacity style={styles.goalButton} onPress={() => setGoalModalVisible(true)}>
              <View style={styles.goalButtonContent}>
                <MaterialCommunityIcons name="target" size={24} color="#2C3F00" />
                <Text style={styles.goalText}>Daily Water Goal</Text>
              </View>
              <View style={styles.goalValueContainer}>
                <Text style={styles.editGoalText}>{dailyWaterGoal} cups</Text>
                <Text style={styles.goalLiterText}>({goalLiters} L)</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal transparent={true} visible={isGoalModalVisible} animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Daily Water Goal</Text>
            <Text style={styles.modalSubtitle}>Recommended: 8 cups (2.0 L) per day</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={tempGoal} onChangeText={setTempGoal} placeholder="Enter cups" />
            <Text style={styles.modalLiterText}>Equals {cupsToLiters(parseInt(tempGoal) || 0)} liters</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setGoalModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveWaterGoal}>
                <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 16,
    color: "#333333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333333",
  },
  goalButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
  },
  goalButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333333",
  },
  goalValueContainer: {
    alignItems: "flex-end",
  },
  editGoalText: {
    fontSize: 16,
    color: "#2C3F00",
    fontWeight: "500",
  },
  goalLiterText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  waterCardContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  waterCounterCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  waterCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  waterCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333333",
  },
  literInfoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  literInfo: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  literValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3F00",
  },
  literLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  literDivider: {
    height: 40,
    width: 1,
    backgroundColor: "#EFEFEF",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: 16,
    backgroundColor: "#2C3F00",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  counterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1EFFD",
  },
  disabledButton: {
    backgroundColor: "#F8F8F8",
    borderColor: "#EFEFEF",
  },
  counterValue: {
    alignItems: "center",
  },
  counterText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3F00",
  },
  counterLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cupIconsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  messageContainer: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2C3F00",
  },
  hydrationStatus: {
    textAlign: "center",
    fontSize: 16,
    color: "#2C3F00",
    fontWeight: "500",
  },
  tipsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333333",
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  modalLiterText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginRight: 8,
  },
  modalCancelText: {
    color: "#666",
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#2C3F00",
    borderRadius: 8,
    marginLeft: 8,
  },
  modalSaveText: {
    color: "white",
    fontWeight: "600",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#2C3F00",
    fontWeight: "600",
  },
  noBottomMargin: {
    marginBottom: 0,
  },
})
