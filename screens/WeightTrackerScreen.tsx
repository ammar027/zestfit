import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView, Alert, ScrollView, Dimensions } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight Tracker</Text>
        <TouchableOpacity onPress={openWeightModal}>
          <MaterialCommunityIcons name="plus" size={28} color="#2C3F00" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={openWeightModal}>
            <Text style={styles.cardTitle}>Current Weight</Text>
            <Text style={styles.cardValue}>{currentWeight ? `${currentWeight.toFixed(1)} kg` : "Not Set"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={openTargetWeightModal}>
            <Text style={styles.cardTitle}>Target Weight</Text>
            <Text style={styles.cardValue}>{targetWeight ? `${targetWeight.toFixed(1)} kg` : "Set Target"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logSection}>
          <Text style={styles.logTitle}>Weight Log</Text>
          <ScrollView>
            {weightLog.map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <View style={styles.logEntryContent}>
                  <Text style={styles.logEntryText}>{new Date(entry.date).toLocaleString()}</Text>
                  <Text style={styles.logEntryWeight}>{entry.weight} kg</Text>
                </View>
                <TouchableOpacity onPress={() => deleteWeightEntry(entry.id)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Weight Entry Modal */}
      <Modal visible={weightModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setWeightModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Weight Entry</Text>
            <TextInput style={styles.input} placeholder="Enter weight (kg)" keyboardType="numeric" value={weightInput} onChangeText={setWeightInput} />
            <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateButton}>
              <Text>Date: {dateInput.toLocaleString()}</Text>
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
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setWeightModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveWeightEntry}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Target Weight Modal */}
      <Modal visible={targetModalVisible} transparent={true} animationType="fade" statusBarTranslucent onRequestClose={() => setTargetModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Target Weight</Text>
            <TextInput style={styles.input} placeholder="Enter target weight (kg)" keyboardType="numeric" value={targetWeightInput} onChangeText={setTargetWeightInput} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setTargetModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveTargetWeight}>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    elevation: 2,
    zIndex: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, padding: 16 },
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
