import React, { useState } from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from "react-native"
import { useTheme } from "../theme"

interface GoalSettingModalProps {
  visible: boolean
  onClose: () => void
  type: "calories" | "macros"
  goals: {
    calories?: number
    carbs?: number
    protein?: number
    fat?: number
  }
  onSave: (goals: any) => void
  isGlobalGoal?: boolean
}

export default function GoalSettingModal({ visible, onClose, type, goals, onSave, isGlobalGoal = true }: GoalSettingModalProps) {
  const [localGoals, setLocalGoals] = useState(goals)
  const { theme } = useTheme()

  return (
    <Modal visible={visible} transparent={true} animationType="fade" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set {type === "calories" ? "Calorie" : "Macro"} Goals</Text>

          {type === "calories" ? (
            <View style={styles.inputContainer}>
              <Text style={{ color: theme.colors.text }}>Daily Calorie Goal:</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.input.background,
                    color: theme.colors.input.text,
                  },
                ]}
                keyboardType="numeric"
                value={String(localGoals.calories)}
                onChangeText={(text) => setLocalGoals({ ...localGoals, calories: parseInt(text) || 0 })}
                placeholderTextColor={theme.colors.input.placeholder}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={{ color: theme.colors.text }}>Carbs (g):</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.input.background,
                      color: theme.colors.input.text,
                    },
                  ]}
                  keyboardType="numeric"
                  value={String(localGoals.carbs)}
                  onChangeText={(text) => setLocalGoals((prev) => ({ ...prev, carbs: parseInt(text) || 0 }))}
                  placeholderTextColor={theme.colors.input.placeholder}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={{ color: theme.colors.text }}>Protein (g):</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.input.background,
                      color: theme.colors.input.text,
                    },
                  ]}
                  keyboardType="numeric"
                  value={String(localGoals.protein)}
                  onChangeText={(text) => setLocalGoals((prev) => ({ ...prev, protein: parseInt(text) || 0 }))}
                  placeholderTextColor={theme.colors.input.placeholder}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={{ color: theme.colors.text }}>Fat (g):</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.input.background,
                      color: theme.colors.input.text,
                    },
                  ]}
                  keyboardType="numeric"
                  value={String(localGoals.fat)}
                  onChangeText={(text) => setLocalGoals((prev) => ({ ...prev, fat: parseInt(text) || 0 }))}
                  placeholderTextColor={theme.colors.input.placeholder}
                />
              </View>
            </>
          )}

          {/* <Text style={styles.noteText}>Note: These changes will update your goals for all days.</Text> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { borderColor: theme.colors.border }]} onPress={onClose}>
              <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={() => onSave(localGoals)}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  saveButtonText: {
    color: "white",
  },
})
