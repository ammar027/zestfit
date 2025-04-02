import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Switch, TouchableOpacity, Modal, TextInput } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"

export default function WaterTrackerScreen() {
  const [enabled, setEnabled] = useState(false)
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4) // default 4 cups
  const [isGoalModalVisible, setGoalModalVisible] = useState(false)
  const [tempGoal, setTempGoal] = useState(dailyWaterGoal.toString())

  const navigation = useNavigation()

  // Load water tracker settings from AsyncStorage on mount
  useEffect(() => {
    ;(async () => {
      try {
        const storedSettings = await AsyncStorage.getItem("water_tracker_settings")
        if (storedSettings) {
          const settings = JSON.parse(storedSettings)
          setEnabled(settings.enabled || false)
          setDailyWaterGoal(settings.dailyWaterGoal || 4)
        }
      } catch (error) {
        console.error("Error loading water tracker settings:", error)
      }
    })()
  }, [])

  const insets = useSafeAreaInsets()

  const toggleSwitch = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)

    // Save water tracker settings globally
    const settings = {
      enabled: newEnabled,
      dailyWaterGoal,
      cupsConsumed: 0,
    }

    // First, save to AsyncStorage
    await AsyncStorage.setItem("water_tracker_settings", JSON.stringify(settings))

    // Then save to database
    await saveWaterTrackerSettings(settings)

    // Force enabled state to match what we just set
    setEnabled(newEnabled)
  }

  const saveWaterGoal = async () => {
    const newGoal = parseInt(tempGoal, 10)
    if (newGoal > 0) {
      setDailyWaterGoal(newGoal)
      setGoalModalVisible(false)

      await saveWaterTrackerSettings({
        enabled,
        dailyWaterGoal: newGoal,
        cupsConsumed: 0,
      })
    }
  }

  interface WaterTrackerSettings {
    enabled: boolean
    dailyWaterGoal: number
    cupsConsumed: number
  }

  const saveWaterTrackerSettings = async (settings: WaterTrackerSettings) => {
    try {
      // Save to global storage
      await AsyncStorage.setItem("water_tracker_settings", JSON.stringify(settings))

      // Navigate to HomeScreen with water tracker settings
      const params = {
        screen: "HomeScreen",
        params: {
          waterTrackerSettings: {
            enabled: Boolean(settings.enabled), // Ensure it's a boolean
            dailyWaterGoal: settings.dailyWaterGoal,
            cupsConsumed: settings.cupsConsumed,
          },
        },
      }

      // @ts-ignore - Ignore navigation type issues
      navigation.navigate("Home", params)

      return true
    } catch (error) {
      console.error("Error saving water tracker settings:", error)
      return false
    }
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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water Tracker</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Enable Water Tracker</Text>
          <Switch value={enabled} onValueChange={toggleSwitch} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={enabled ? "#f5dd4b" : "#f4f3f4"} />
        </View>

        {enabled && (
          <View style={styles.goalContainer}>
            <Text style={styles.goalText}>Daily Water Goal</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(true)}>
              <Text style={styles.editGoalText}>{dailyWaterGoal} cups</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal transparent={true} visible={isGoalModalVisible} animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Daily Water Goal</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={tempGoal} onChangeText={setTempGoal} placeholder="Enter cups" />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setGoalModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={saveWaterGoal}>
                <Text style={styles.modalButtonText}>Save</Text>
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
  },
  goalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalText: {
    fontSize: 16,
  },
  editGoalText: {
    fontSize: 16,
    color: "#007AFF",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
})
