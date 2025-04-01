import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GoalSettingModal from './GoalSettingModal';

export default function MacroCards({ 
  calorieGoal, 
  macroGoals, 
  dailyStats, 
  setCalorieGoal, 
  setMacroGoals,
  waterTrackerSettings = {
    enabled: false,
    dailyWaterGoal: 0,
    cupsConsumed: 0
  },
  isWaterTrackerEnabled = false,
  onIncrementWater,
  onDecrementWater
}) {
  const [isCalorieModalVisible, setCalorieModalVisible] = useState(false);
  const [isMacroModalVisible, setMacroModalVisible] = useState(false);

  const totalCalories = dailyStats.calories.food - dailyStats.calories.exercise;
  const remainingCalories = calorieGoal - totalCalories;

   const MacroCard = ({ 
    icon, 
    title, 
    current, 
    goal, 
    color, 
    onPress 
  }) => {
    const progress = (current / goal) * 100;
    
    return (
      <TouchableOpacity 
        style={styles.macroCard}
        onPress={onPress}
      >
        <View style={styles.macroCardHeader}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={color} 
          />
          <Text style={styles.macroCardTitle}>{title}</Text>
        </View>
        
        <View style={styles.macroCardContent}>
          <View style={styles.macroProgressContainer}>
            <View 
              style={[
                styles.macroProgressBar, 
                { 
                  width: `${Math.min(progress, 100)}%`, 
                  backgroundColor: color 
                }
              ]} 
            />
          </View>
          
          <View style={styles.macroValueContainer}>
            <Text style={styles.macroCurrentValue}>{current}g</Text>
            <Text style={styles.macroGoalValue}>/ {goal}g</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const WaterCard = () => {
    // Explicitly check if water tracker is enabled
    if (!waterTrackerSettings.enabled) return null;

    const progress = (waterTrackerSettings.cupsConsumed / waterTrackerSettings.dailyWaterGoal) * 100;

    return (
      <View style={styles.waterCard}>
        <View style={styles.waterCardContent}>
          <View style={styles.waterCardHeader}>
            <MaterialCommunityIcons 
              name="water" 
              size={20} 
              color="#007AFF" 
            />
            <Text style={styles.waterCardTitle}>Water  </Text>
                                 <Text style={styles.waterLitersText}>
            {(waterTrackerSettings.cupsConsumed * 0.25).toFixed(2)} liters
          </Text>           
          </View>

          
          <View style={styles.waterProgressContainer}>
            <View 
              style={[
                styles.waterProgressBar, 
                { 
                  width: `${Math.min(progress, 100)}%`, 
                  backgroundColor: '#007AFF' 
                }
              ]} 
            />
          </View>
          
          <View style={styles.waterCardControls}>
            <TouchableOpacity 
              style={styles.waterControlButton}
              onPress={onDecrementWater}
              disabled={waterTrackerSettings.cupsConsumed === 0}
            >
              <MaterialCommunityIcons 
                name="minus" 
                size={16} 
                color={waterTrackerSettings.cupsConsumed === 0 ? "#CCCCCC" : "#007AFF"} 
              />
            </TouchableOpacity>
            
            <Text style={styles.waterCountText}>
              {waterTrackerSettings.cupsConsumed} / {waterTrackerSettings.dailyWaterGoal} cups
            </Text>
            
            <TouchableOpacity 
              style={styles.waterControlButton}
              onPress={onIncrementWater}
              disabled={waterTrackerSettings.cupsConsumed === waterTrackerSettings.dailyWaterGoal}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={16} 
                color={waterTrackerSettings.cupsConsumed === waterTrackerSettings.dailyWaterGoal ? "#CCCCCC" : "#007AFF"} 
              />
            </TouchableOpacity>

          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.calorieCard}
        onPress={() => setCalorieModalVisible(true)}
      >
        <View style={styles.calorieCardHeader}>
          <View style={styles.calorieHeaderLeft}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
          <Text style={styles.remainingCalories}>
            {remainingCalories > 0 ? `${remainingCalories} cal remaining` : 'Goal Exceeded'}
          </Text>
        </View>
        
        <View style={styles.calorieContent}>
          <Text style={styles.calorieMainText}>{totalCalories}</Text>
          <Text style={styles.calorieSubText}>/ {calorieGoal} cal</Text>
        </View>

        <View style={styles.calorieDetailContainer}>
          <View style={styles.calorieDetailItem}>
            <MaterialCommunityIcons name="food" size={20} color="#4ECDC4" />
            <Text style={styles.calorieDetailLabel}>Food</Text>
            <Text style={styles.calorieDetailValue}>+ {dailyStats.calories.food}</Text>
          </View>
          <View style={styles.calorieDetailItem}>
            <MaterialCommunityIcons name="run" size={20} color="#FF6B6B" />
            <Text style={styles.calorieDetailLabel}>Exercise</Text>
            <Text style={styles.calorieDetailValue}>- {dailyStats.calories.exercise}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.macroCardsContainer}>
        <MacroCard 
          icon="bread-slice"
          title="Carbs"
          current={dailyStats.macros.carbs}
          goal={macroGoals.carbs}
          color="#FF6B6B"
          onPress={() => setMacroModalVisible(true)}
        />
        
        <MacroCard 
          icon="food-steak"
          title="Protein"
          current={dailyStats.macros.protein}
          goal={macroGoals.protein}
          color="#4ECDC4"
          onPress={() => setMacroModalVisible(true)}
        />
        
        <MacroCard 
          icon="oil-lamp"
          title="Fat"
          current={dailyStats.macros.fat}
          goal={macroGoals.fat}
          color="#FFA726"
          onPress={() => setMacroModalVisible(true)}
        />
      </View>

      <WaterCard/>

      <GoalSettingModal
        visible={isCalorieModalVisible}
        onClose={() => setCalorieModalVisible(false)}
        type="calories"
        goals={{ calories: calorieGoal }}
        onSave={(goals) => {
          setCalorieGoal(goals.calories);
          setCalorieModalVisible(false);
        }}
      />

      <GoalSettingModal
        visible={isMacroModalVisible}
        onClose={() => setMacroModalVisible(false)}
        type="macros"
        goals={macroGoals}
        onSave={(goals) => {
          setMacroGoals(goals);
          setMacroModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  calorieCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calorieCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  remainingCalories: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  calorieContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  calorieMainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  calorieSubText: {
    fontSize: 16,
    color: '#888',
  },
  calorieDetailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  calorieDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  calorieDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  macroCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#333',
  },
  macroCardContent: {
    flexDirection: 'column',
  },
  macroProgressContainer: {
    height: 6,
    backgroundColor: '#E9E9E9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  macroValueContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
  },
  macroCurrentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 4,
  },
  macroGoalValue: {
    fontSize: 14,
    color: '#888',
  },
  waterCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    waterCardContent: {
      padding: 12,
    },
    waterCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    waterCardTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
      color: '#333',
    },
    waterProgressContainer: {
      height: 6,
      backgroundColor: '#E9E9E9',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    waterProgressBar: {
      height: '100%',
      borderRadius: 3,
    },
    waterCardControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    waterControlButton: {
      padding: 6,
    },
    waterCountText: {
      fontSize: 14,
      fontWeight: '500',
    },
      waterLitersText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 0,
  },
  });