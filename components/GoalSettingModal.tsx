import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';

export default function GoalSettingModal({ visible, onClose, type, goals, onSave }) {
  const [localGoals, setLocalGoals] = useState(goals);

  return (
    <Modal
      visible={visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Set {type === 'calories' ? 'Calorie' : 'Macro'} Goals
          </Text>
          
          {type === 'calories' ? (
            <View style={styles.inputContainer}>
              <Text>Daily Calorie Goal:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(localGoals.calories)}
                onChangeText={(text) => setLocalGoals({ calories: parseInt(text) || 0 })}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text>Carbs (g):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(localGoals.carbs)}
                  onChangeText={(text) => 
                    setLocalGoals(prev => ({ ...prev, carbs: parseInt(text) || 0 }))
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Text>Protein (g):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(localGoals.protein)}
                  onChangeText={(text) => 
                    setLocalGoals(prev => ({ ...prev, protein: parseInt(text) || 0 }))
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Text>Fat (g):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(localGoals.fat)}
                  onChangeText={(text) => 
                    setLocalGoals(prev => ({ ...prev, fat: parseInt(text) || 0 }))
                  }
                />
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave(localGoals)}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
  },
});