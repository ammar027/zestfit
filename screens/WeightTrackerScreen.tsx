import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView, Alert, ScrollView, Dimensions } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../theme"
import { DrawerActions } from "@react-navigation/native"

export default function WeightTrackerScreen({ navigation }) {
  const [currentWeight, setCurrentWeight] = useState(null)
  const [targetWeight, setTargetWeight] = useState(null)
  const [weightLog, setWeightLog] = useState([])
  const [weightModalVisible, setWeightModalVisible] = useState(false)
  const [targetModalVisible, setTargetModalVisible] = useState(false)
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const [weightInput, setWeightInput] = useState("")
  const [dateInput, setDateInput] = useState(new Date())
  const [targetWeightInput, setTargetWeightInput] = useState("")
  const { theme } = useTheme()

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

  const Header = () => {
    return (
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <MaterialCommunityIcons name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Weight Tracker</Text>
        <View style={{ width: 28 }} />
      </View>
    )
  }

  const insets = useSafeAreaInsets()
  const { width, height } = Dimensions.get("window")

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />
      <View style={[styles.header, {}]}>
        <Header />
        <TouchableOpacity onPress={openWeightModal} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]} onPress={openWeightModal}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Current Weight</Text>
            <Text style={[styles.cardValue, { color: theme.colors.primary }]}>{currentWeight ? `${currentWeight.toFixed(1)} kg` : "Not Set"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]} onPress={openTargetWeightModal}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Target Weight</Text>
            <Text style={[styles.cardValue, { color: theme.colors.primary }]}>{targetWeight ? `${targetWeight.toFixed(1)} kg` : "Set Target"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.logSection, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
          <Text style={[styles.logTitle, { color: theme.colors.text }]}>Weight Log</Text>
          <ScrollView>
            {weightLog.map((entry) => (
              <View key={entry.id} style={[styles.logEntry, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.logEntryContent}>
                  <Text style={[styles.logEntryText, { color: theme.colors.subtext }]}>{new Date(entry.date).toLocaleString()}</Text>
                  <Text style={[styles.logEntryWeight, { color: theme.colors.text }]}>{entry.weight} kg</Text>
                </View>
                <TouchableOpacity onPress={() => deleteWeightEntry(entry.id)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Weight Entry Modal */}
      <Modal visible={weightModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setWeightModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Weight Entry</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.input.background,
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
          </View>
        </View>
      </Modal>

      {/* Target Weight Modal */}
      <Modal visible={targetModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setTargetModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set Target Weight</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.input.background,
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
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
    right: 15,
  },
  content: { flex: 1, padding: 16, marginBottom: -10 },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    right: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#2C3F00",
  },
  segmentButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  segmentButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  segmentIcon: {
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    width: "48%",
  },
  cardTitle: { fontSize: 16, color: "#333" },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3F00",
    marginTop: 8,
  },
  logSection: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  logEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logEntryContent: {
    flex: 1,
  },
  logEntryText: {
    fontSize: 14,
    color: "#666",
  },
  logEntryWeight: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  dateButton: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#2C3F00",
  },
  saveButtonText: {
    color: "white",
  },
})
