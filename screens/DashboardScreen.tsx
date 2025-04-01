import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' or 'monthly'
  const [nutritionData, setNutritionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const insets = useSafeAreaInsets();

  const fetchNutritionData = useCallback(async () => {
    setIsLoading(true);
    try {
      let startDate, endDate;
      
      if (timeframe === 'weekly') {
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
      } else {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
      }

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      const data = await Promise.all(
        dateRange.map(async (date) => {
          const dateKey = date.toISOString().split('T')[0];
          const storedData = await AsyncStorage.getItem(`home_screen_data_${dateKey}`);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            return {
              date: dateKey,
              calories: parsed.dailyStats.calories.food - parsed.dailyStats.calories.exercise,
              carbs: parsed.dailyStats.macros.carbs,
              protein: parsed.dailyStats.macros.protein,
              fat: parsed.dailyStats.macros.fat
            };
          }
          
          return {
            date: dateKey,
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0
          };
        })
      );

      setNutritionData(data);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  const getChartData = (metric) => {
    if (!nutritionData) return null;

    const labels = nutritionData.map(item => 
      format(new Date(item.date), timeframe === 'weekly' ? 'EEE' : 'd')
    );
    
    const datasets = [{
      data: nutritionData.map(item => item[metric]),
      color: (opacity = 1) => {
        switch(metric) {
          case 'calories': return `rgba(255, 59, 48, ${opacity})`;
          case 'carbs': return `rgba(255, 107, 107, ${opacity})`;
          case 'protein': return `rgba(78, 205, 196, ${opacity})`;
          case 'fat': return `rgba(255, 167, 38, ${opacity})`;
          default: return `rgba(0, 122, 255, ${opacity})`;
        }
      }
    }];

    return { labels, datasets };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right 
      }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right 
    }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <View style={styles.timeframeSelector}>
        <TouchableOpacity
          style={[
            styles.timeframeButton,
            timeframe === 'weekly' && styles.timeframeButtonActive
          ]}
          onPress={() => setTimeframe('weekly')}
        >
          <Text style={[
            styles.timeframeButtonText,
            timeframe === 'weekly' && styles.timeframeButtonTextActive
          ]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeframeButton,
            timeframe === 'monthly' && styles.timeframeButtonActive
          ]}
          onPress={() => setTimeframe('monthly')}
        >
          <Text style={[
            styles.timeframeButtonText,
            timeframe === 'monthly' && styles.timeframeButtonTextActive
          ]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chartContainer}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Calories</Text>
          {getChartData('calories') && (
            <LineChart
              data={getChartData('calories')}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Macronutrients</Text>
          {getChartData('carbs') && (
            <BarChart
              data={{
                labels: getChartData('carbs').labels,
                datasets: [
                  {
                    data: nutritionData.map(item => item.carbs),
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`
                  },
                  {
                    data: nutritionData.map(item => item.protein),
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`
                  },
                  {
                    data: nutritionData.map(item => item.fat),
                    color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`
                  }
                ],
                legend: ['Carbs', 'Protein', 'Fat']
              }}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              verticalLabelRotation={30}
            />
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF3B30" />
            <Text style={styles.statLabel}>Avg. Calories</Text>
            <Text style={styles.statValue}>
              {nutritionData 
                ? Math.round(
                    nutritionData.reduce((acc, curr) => acc + curr.calories, 0) / 
                    nutritionData.length
                  )
                : 0
              }
            </Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Highest Day</Text>
            <Text style={styles.statValue}>
              {nutritionData 
                ? Math.max(...nutritionData.map(item => item.calories))
                : 0
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeSelector: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    gap: 16,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  timeframeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeframeButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  chartContainer: {
    flex: 1,
    padding: 16,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
});