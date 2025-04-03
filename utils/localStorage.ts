import AsyncStorage from "@react-native-async-storage/async-storage"

// Define types
interface DailyStats {
  calories: { food: number; exercise: number }
  macros: { carbs: number; protein: number; fat: number }
}

interface WaterTrackerSettings {
  enabled: boolean
  dailyWaterGoal: number
  cupsConsumed: number
}

interface MacroGoals {
  carbs: number
  protein: number
  fat: number
}

interface NutritionData {
  calorieGoal?: number
  macroGoals?: MacroGoals
  dailyStats?: DailyStats
  waterTrackerSettings?: WaterTrackerSettings
}

interface Message {
  id: number
  type: "user" | "ai"
  text: string
  imageUri?: string
  imageUrl?: string
  timestamp?: Date | string
}

// Keys for AsyncStorage
const KEYS = {
  DAILY_NUTRITION: (date: string) => `DAILY_NUTRITION_${date}`,
  USER_GOALS: "USER_GOALS",
  WATER_SETTINGS: "WATER_SETTINGS",
  CHAT_MESSAGES: (date: string) => `CHAT_MESSAGES_${date}`,
}

// Save daily nutrition data locally
export async function saveLocalDailyNutrition(date: string, nutritionData: NutritionData): Promise<boolean> {
  try {
    const key = KEYS.DAILY_NUTRITION(date)
    await AsyncStorage.setItem(key, JSON.stringify(nutritionData))
    return true
  } catch (error) {
    console.error("Error saving local nutrition data:", error)
    return false
  }
}

// Get daily nutrition data locally
export async function getLocalDailyNutrition(date: string): Promise<NutritionData | null> {
  try {
    const key = KEYS.DAILY_NUTRITION(date)
    const data = await AsyncStorage.getItem(key)

    if (!data) {
      // Return default structure if no data exists
      const goals = await getLocalUserGoals()
      const waterSettings = await getLocalWaterSettings()

      return {
        calorieGoal: goals?.calorieGoal || 2000,
        macroGoals: {
          carbs: goals?.macroGoals?.carbs || 250,
          protein: goals?.macroGoals?.protein || 150,
          fat: goals?.macroGoals?.fat || 65,
        },
        dailyStats: {
          calories: {
            food: 0,
            exercise: 0,
          },
          macros: {
            carbs: 0,
            protein: 0,
            fat: 0,
          },
        },
        waterTrackerSettings: {
          enabled: waterSettings?.enabled || false,
          dailyWaterGoal: waterSettings?.dailyWaterGoal || 4,
          cupsConsumed: 0,
        },
      }
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("Error getting local nutrition data:", error)
    return null
  }
}

// Save user goals locally
export async function saveLocalUserGoals(goals: { calorieGoal?: number; macroGoals?: MacroGoals }): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.USER_GOALS, JSON.stringify(goals))
    return true
  } catch (error) {
    console.error("Error saving local user goals:", error)
    return false
  }
}

// Get user goals locally
export async function getLocalUserGoals(): Promise<{
  calorieGoal: number
  macroGoals: MacroGoals
} | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_GOALS)

    if (!data) {
      return {
        calorieGoal: 2000,
        macroGoals: {
          carbs: 250,
          protein: 150,
          fat: 65,
        },
      }
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("Error getting local user goals:", error)
    return null
  }
}

// Save water settings locally
export async function saveLocalWaterSettings(settings: { enabled: boolean; dailyWaterGoal: number }): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.WATER_SETTINGS, JSON.stringify(settings))
    return true
  } catch (error) {
    console.error("Error saving local water settings:", error)
    return false
  }
}

// Get water settings locally
export async function getLocalWaterSettings(): Promise<{
  enabled: boolean
  dailyWaterGoal: number
} | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WATER_SETTINGS)

    if (!data) {
      return {
        enabled: false,
        dailyWaterGoal: 4,
      }
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("Error getting local water settings:", error)
    return null
  }
}

// Save chat messages locally
export async function saveLocalChatMessages(date: string, messages: Message[]): Promise<boolean> {
  try {
    const key = KEYS.CHAT_MESSAGES(date)
    await AsyncStorage.setItem(key, JSON.stringify(messages))
    return true
  } catch (error) {
    console.error("Error saving local chat messages:", error)
    return false
  }
}

// Get chat messages locally
export async function getLocalChatMessages(date: string): Promise<Message[]> {
  try {
    const key = KEYS.CHAT_MESSAGES(date)
    const data = await AsyncStorage.getItem(key)

    if (!data) {
      return []
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("Error getting local chat messages:", error)
    return []
  }
}

// Delete a chat message locally
export async function deleteLocalChatMessage(date: string, messageId: number): Promise<boolean> {
  try {
    const messages = await getLocalChatMessages(date)
    const updatedMessages = messages.filter((msg) => msg.id !== messageId)
    return await saveLocalChatMessages(date, updatedMessages)
  } catch (error) {
    console.error("Error deleting local chat message:", error)
    return false
  }
}
