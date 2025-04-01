import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  ScrollView,
  TouchableOpacity ,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GoalsEditorScreen({ navigation, route }) {
  // Get initial goals from route params or use defaults
  const initialCalorieGoal = route.params?.calorieGoal || 2000;
  const initialMacroGoals = route.params?.macroGoals || {
    carbs: 250,
    protein: 150,
    fat: 65,
  };

  const [calorieGoal, setCalorieGoal] = useState(initialCalorieGoal);
  const [macroGoals, setMacroGoals] = useState(initialMacroGoals);

  const handleSaveGoals = () => {
    // Pass updated goals back to previous screen
    navigation.navigate('Home', { 
      calorieGoal, 
      macroGoals 
    });
  };

    const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  return (
    <SafeAreaView style={[styles.container,       { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right 
      }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Goals</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calorie Goal</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Daily Calories</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={calorieGoal.toString()}
              onChangeText={(text) => setCalorieGoal(parseInt(text) || 0)}
              placeholder="Enter daily calorie goal"
            />
          </View>
        </View>

        {/* Macro Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macro Goals</Text>
          
          {/* Carbs Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Carbohydrates (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.carbs.toString()}
              onChangeText={(text) => 
                setMacroGoals(prev => ({ 
                  ...prev, 
                  carbs: parseInt(text) || 0 
                }))
              }
              placeholder="Enter daily carbs goal"
            />
          </View>

          {/* Protein Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.protein.toString()}
              onChangeText={(text) => 
                setMacroGoals(prev => ({ 
                  ...prev, 
                  protein: parseInt(text) || 0 
                }))
              }
              placeholder="Enter daily protein goal"
            />
          </View>

          {/* Fat Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={macroGoals.fat.toString()}
              onChangeText={(text) => 
                setMacroGoals(prev => ({ 
                  ...prev, 
                  fat: parseInt(text) || 0 
                }))
              }
              placeholder="Enter daily fat goal"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveGoals}
        >
          <Text style={styles.saveButtonText}>Save Goals</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { flexDirection:'row', alignItems:'center', padding:16, backgroundColor:'white', elevation:2 },
  headerTitle: { fontSize:20, fontWeight:'bold', flex:1, textAlign:'center' },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 40 
  },
  section: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  inputContainer: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 16, 
    color: '#333', 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16 
  },
  saveButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});