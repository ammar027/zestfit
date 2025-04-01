import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateHeader from '../components/DateHeader';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MacroCards from '../components/MacroCards';
import ChatInterface from '../components/ChatInterface';
import { supabase } from '../utils/supabse';
import {
  getDailyNutrition,
  saveDailyNutrition,
  getWaterTrackerSettings
} from '../utils/supabaseutils';

export default function HomeScreen() {
  const route = useRoute();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateSpecificData, setDateSpecificData] = useState({});
  const [globalWaterTrackerSettings, setGlobalWaterTrackerSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Load global water tracker settings
  const loadGlobalWaterTrackerSettings = useCallback(async () => {
    try {
      if (!user) return;

      const settings = await getWaterTrackerSettings();
      if (settings) {
        setGlobalWaterTrackerSettings(settings);
      }
    } catch (error) {
      console.error('Error loading global water tracker settings:', error);
    }
  }, [user]);

  // Load or initialize data for a specific date
  const loadDateData = useCallback(async (date) => {
    try {
      setIsLoading(true);
      if (!user) {
        setIsLoading(false);
        return;
      }

      const data = await getDailyNutrition(date);
      if (data) {
        setDateSpecificData(data);
      } else {
        // Use default data if none exists in Supabase
        const defaultData = {
          calorieGoal: 2000,
          macroGoals: {
            carbs: 250,
            protein: 150,
            fat: 65,
          },
          dailyStats: {
            calories: {
              food: 0,
              exercise: 0
            },
            macros: {
              carbs: 0,
              protein: 0,
              fat: 0,
            }
          },
          waterTrackerSettings: {
            cupsConsumed: 0
          }
        };
        setDateSpecificData(defaultData);
      }
    } catch (error) {
      console.error('Error loading date-specific data:', error);
      Alert.alert('Error', 'Failed to load nutrition data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save data for a specific date
  const saveDateData = useCallback(async (data) => {
    try {
      if (!user) {
        Alert.alert('Login Required', 'Please log in to save your data');
        return;
      }

      await saveDailyNutrition(selectedDate, data);
    } catch (error) {
      console.error('Error saving date-specific data:', error);
      Alert.alert('Error', 'Failed to save nutrition data');
    }
  }, [selectedDate, user]);

  // Handle date change
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    loadDateData(newDate);
  }, [loadDateData]);

  // Update stats for the current date
  const handleUpdateStats = useCallback((updateFn) => {
    setDateSpecificData(prevData => {
      const newData = { ...prevData };

      // Apply update function to daily stats
      newData.dailyStats = {
        calories: {
          food: updateFn(prevData.dailyStats).calories?.food ?? prevData.dailyStats.calories.food,
          exercise: updateFn(prevData.dailyStats).calories?.exercise ?? prevData.dailyStats.calories.exercise
        },
        macros: {
          carbs: updateFn(prevData.dailyStats).macros?.carbs ?? prevData.dailyStats.macros.carbs,
          protein: updateFn(prevData.dailyStats).macros?.protein ?? prevData.dailyStats.macros.protein,
          fat: updateFn(prevData.dailyStats).macros?.fat ?? prevData.dailyStats.macros.fat
        }
      };

      // Save the updated data
      saveDateData(newData);

      return newData;
    });
  }, [saveDateData]);

  // Increment water cups
  const handleIncrementWater = () => {
    setDateSpecificData(prevData => {
      const currentSettings = prevData.waterTrackerSettings || {
        enabled: false,
        dailyWaterGoal: 4,
        cupsConsumed: 0
      };

      if (currentSettings.cupsConsumed < (globalWaterTrackerSettings?.daily_water_goal || 4)) {
        const newData = {
          ...prevData,
          waterTrackerSettings: {
            ...currentSettings,
            cupsConsumed: currentSettings.cupsConsumed + 1
          }
        };

        saveDateData(newData);
        return newData;
      }

      return prevData;
    });
  };

  // Decrement water cups
  const handleDecrementWater = () => {
    setDateSpecificData(prevData => {
      const currentSettings = prevData.waterTrackerSettings || {
        enabled: false,
        dailyWaterGoal: 4,
        cupsConsumed: 0
      };

      if (currentSettings.cupsConsumed > 0) {
        const newData = {
          ...prevData,
          waterTrackerSettings: {
            ...currentSettings,
            cupsConsumed: currentSettings.cupsConsumed - 1
          }
        };

        saveDateData(newData);
        return newData;
      }

      return prevData;
    });
  };

  // Update water tracker settings
  const updateWaterTrackerSettings = (settings) => {
    setDateSpecificData(prevData => {
      const newData = {
        ...prevData,
        waterTrackerSettings: {
          ...prevData.waterTrackerSettings,
          ...settings
        }
      };

      saveDateData(newData);
      return newData;
    });
  };

  useEffect(() => {
    // Update water tracker settings if passed from another screen
    if (route.params?.waterTrackerSettings) {
      updateWaterTrackerSettings(route.params.waterTrackerSettings);
    }
  }, [route.params?.waterTrackerSettings]);

  useFocusEffect(
    React.useCallback(() => {
      loadGlobalWaterTrackerSettings();
      return () => { };
    }, [loadGlobalWaterTrackerSettings])
  );

  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate, loadDateData, user]);

  // Navigation and layout
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get('window');

  if (!user) {
    return (
      <View style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          justifyContent: 'center',
          alignItems: 'center'
        }
      ]}>
        <Text style={styles.loginPrompt}>Please log in to track your nutrition</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          justifyContent: 'center',
          alignItems: 'center'
        }
      ]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }
    ]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.headerContainer}>
        <DateHeader
          date={selectedDate}
          onDateChange={handleDateChange}
          onDrawerPress={() => navigation.openDrawer()}
        />
      </View>

      <View
        style={[
          styles.content,
          {
            height: height - (insets.top + insets.bottom + 100),
          }
        ]}
      >
        <View style={styles.statsSection}>
          <MacroCards
            calorieGoal={dateSpecificData.calorieGoal || 2000}
            macroGoals={dateSpecificData.macroGoals || {
              carbs: 250,
              protein: 150,
              fat: 65,
            }}
            dailyStats={dateSpecificData.dailyStats || {
              calories: { food: 0, exercise: 0 },
              macros: { carbs: 0, protein: 0, fat: 0 }
            }}
            waterTrackerSettings={{
              ...globalWaterTrackerSettings,
              cupsConsumed: dateSpecificData.waterTrackerSettings?.cupsConsumed || 0,
              dailyWaterGoal: globalWaterTrackerSettings?.daily_water_goal || 4,
              enabled: globalWaterTrackerSettings?.enabled || false
            }}
            isWaterTrackerEnabled={globalWaterTrackerSettings?.enabled || false}
            onIncrementWater={handleIncrementWater}
            onDecrementWater={handleDecrementWater}
            setCalorieGoal={(goal) => {
              setDateSpecificData(prevData => {
                const newData = { ...prevData, calorieGoal: goal };
                saveDateData(newData);
                return newData;
              });
            }}
            setMacroGoals={(goals) => {
              setDateSpecificData(prevData => {
                const newData = { ...prevData, macroGoals: goals };
                saveDateData(newData);
                return newData;
              });
            }}
          />
        </View>

        <View style={styles.chatSection}>
          <ChatInterface
            date={selectedDate}
            onUpdateStats={handleUpdateStats}
            user={user}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    paddingTop: 16,
  },
  chatSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waterCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  settingsIcon: {
    padding: 4,
  },
  waterProgressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  waterProgressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  waterCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  waterCountText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  waterLitersText: {
    fontSize: 12,
    color: '#888',
  },
});