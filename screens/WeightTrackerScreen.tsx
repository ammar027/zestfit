import React, { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView, Alert, ScrollView, Dimensions, Animated } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../theme"
import { DrawerActions } from "@react-navigation/native"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

export default function WeightTrackerScreen({ navigation }) {
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [weightLog, setWeightLog] = useState<Array<{ id: number; weight: number; date: Date }>>([])
  const [weightModalVisible, setWeightModalVisible] = useState(false)
  const [targetModalVisible, setTargetModalVisible] = useState(false)
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const [weightInput, setWeightInput] = useState("")
  const [dateInput, setDateInput] = useState(new Date())
  const [targetWeightInput, setTargetWeightInput] = useState("")
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

  // Load saved data on component mount
  useEffect(() => {
    loadSavedData()
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    saveData()
  }, [currentWeight, targetWeight, weightLog])

  const loadSavedData = async () => {
    try {
      const savedCurrentWeight = await AsyncStorage.getItem("currentWeight")
      const savedTargetWeight = await AsyncStorage.getItem("targetWeight")
      const savedWeightLog = await AsyncStorage.getItem("weightLog")

      if (savedCurrentWeight) setCurrentWeight(JSON.parse(savedCurrentWeight))
      if (savedTargetWeight) setTargetWeight(JSON.parse(savedTargetWeight))
      if (savedWeightLog) setWeightLog(JSON.parse(savedWeightLog))
    } catch (error) {
      console.error("Error loading data", error)
    }
  }

  const saveData = async () => {
    try {
      await AsyncStorage.setItem("currentWeight", JSON.stringify(currentWeight))
      await AsyncStorage.setItem("targetWeight", JSON.stringify(targetWeight))
      await AsyncStorage.setItem("weightLog", JSON.stringify(weightLog))
    } catch (error) {
      console.error("Error saving data", error)
    }
  }

  const openWeightModal = () => {
    setWeightModalVisible(true)
  }

  const openTargetWeightModal = () => {
    setTargetModalVisible(true)
  }

  const saveWeightEntry = () => {
    // Validate weight input
    const weight = parseFloat(weightInput)
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid weight")
      return
    }

    const entry = {
      id: Date.now(), // Unique identifier
      weight: weight,
      date: dateInput,
    }

    // Update current weight with the latest entry
    setCurrentWeight(entry.weight)

    // Add to weight log
    const updatedLog = [...weightLog, entry].sort((a, b) => new Date(b.date) - new Date(a.date))
    setWeightLog(updatedLog)

    // Reset modal
    setWeightModalVisible(false)
    setWeightInput("")
  }

  const saveTargetWeight = () => {
    // Validate target weight input
    const weight = parseFloat(targetWeightInput)
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid target weight")
      return
    }

    setTargetWeight(weight)
    setTargetModalVisible(false)
    setTargetWeightInput("")
  }

  const deleteWeightEntry = (id) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this weight entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedLog = weightLog.filter((entry) => entry.id !== id)
          setWeightLog(updatedLog)

          // Update current weight to the most recent entry
          if (updatedLog.length > 0) {
            setCurrentWeight(updatedLog[0].weight)
          } else {
            setCurrentWeight(null)
          }
        },
      },
    ])
  }

  const { width, height } = Dimensions.get("window")

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <View style={styles.weightCards}>
                <TouchableOpacity style={[styles.weightCard, { backgroundColor: theme.colors.primary + "20" }]} onPress={openWeightModal}>
                  <MaterialCommunityIcons name="scale-bathroom" size={32} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Current Weight</Text>
                  <Text style={[styles.cardValue, { color: theme.colors.primary }]}>{currentWeight ? `${currentWeight.toFixed(1)} kg` : "Not Set"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.weightCard, { backgroundColor: theme.colors.primary + "20" }]} onPress={openTargetWeightModal}>
                  <MaterialCommunityIcons name="target" size={32} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Target Weight</Text>
                  <Text style={[styles.cardValue, { color: theme.colors.primary }]}>{targetWeight ? `${targetWeight.toFixed(1)} kg` : "Set Target"}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        <Animated.View style={[styles.logSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <View style={styles.logHeader}>
                <Text style={[styles.logTitle, { color: theme.colors.text }]}>Weight Log</Text>
                <TouchableOpacity onPress={openWeightModal} style={[styles.addButton, { backgroundColor: theme.colors.primary + "20" }]}>
                  <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {weightLog.map((entry) => (
                  <View key={entry.id} style={[styles.logEntry, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.logEntryContent}>
                      <Text style={[styles.logEntryText, { color: theme.colors.subtext }]}>{new Date(entry.date).toLocaleString()}</Text>
                      <Text style={[styles.logEntryWeight, { color: theme.colors.text }]}>{entry.weight} kg</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteWeightEntry(entry.id)} style={[styles.deleteButton, { backgroundColor: theme.colors.error + "20" }]}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Weight Entry Modal */}
      <Modal visible={weightModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setWeightModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.modalContent, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Weight Entry</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                    color: theme.colors.input.text,
                  },
                ]}
                placeholder="Enter weight (kg)"
                keyboardType="numeric"
                value={weightInput}
                onChangeText={setWeightInput}
                placeholderTextColor={theme.colors.input.placeholder}
              />
              <TouchableOpacity
                onPress={() => setDatePickerVisible(true)}
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#eee",
                  },
                ]}
              >
                <Text style={{ color: theme.colors.text }}>Date: {dateInput.toLocaleString()}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                date={dateInput}
                onConfirm={(selectedDate) => {
                  setDateInput(selectedDate)
                  setDatePickerVisible(false)
                }}
                onCancel={() => setDatePickerVisible(false)}
                themeVariant={theme.dark ? "dark" : "light"}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#ddd" }]} onPress={() => setWeightModalVisible(false)}>
                  <Text style={{ color: theme.colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveWeightEntry}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>

      {/* Target Weight Modal */}
      <Modal visible={targetModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setTargetModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.modalContent, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set Target Weight</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : theme.colors.input.background,
                    color: theme.colors.input.text,
                  },
                ]}
                placeholder="Enter target weight (kg)"
                keyboardType="numeric"
                value={targetWeightInput}
                onChangeText={setTargetWeightInput}
                placeholderTextColor={theme.colors.input.placeholder}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#ddd" }]} onPress={() => setTargetModalVisible(false)}>
                  <Text style={{ color: theme.colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveTargetWeight}>
                  <Text style={styles.saveButtonText}>Save</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  cardContainer: {
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
  weightCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  weightCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  logSection: {
    flex: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logEntryContent: {
    flex: 1,
  },
  logEntryText: {
    fontSize: 14,
  },
  logEntryWeight: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#2C3F00",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
