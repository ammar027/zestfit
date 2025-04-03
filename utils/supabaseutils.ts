import { supabase } from "./supabaseClient"
import { queryCache } from "./supabaseClient"
import { decode } from "base64-arraybuffer"
import * as FileSystem from "expo-file-system"

// ========== GET FUNCTIONS ==========

// Define type for Message
interface Message {
  id: number
  type: "user" | "ai"
  text: string
  imageUri?: string
  imageUrl?: string
  timestamp?: Date | string
}

// Define type for NutritionData
interface NutritionData {
  calories: number
  carbs: number
  protein: number
  fat: number
  type: string
  dailyStats?: {
    calories: {
      food: number
      exercise: number
    }
    macros: {
      carbs: number
      protein: number
      fat: number
    }
  }
  waterTrackerSettings?: {
    cupsConsumed: number
  }
}

// Define type for UserGoals
interface UserGoals {
  calorie_goal?: number
  caloriesGoal?: number
  carbs_goal?: number
  carbsGoal?: number
  protein_goal?: number
  proteinGoal?: number
  fat_goal?: number
  fatGoal?: number
  macroGoals?: {
    carbs: number
    protein: number
    fat: number
  }
}

// Define type for UserSettings
interface UserSettings {
  notifications: boolean
  darkMode: boolean
  language: string
}

// Define type for WaterTrackerSettings
interface WaterTrackerSettings {
  cupsGoal?: number
  cupSize?: number
  cupsConsumed?: number
  reminders?: boolean
  enabled?: boolean
  daily_water_goal?: number
  dailyWaterGoal?: number
}

// Get user's nutrition goals
// Get user's nutrition goals
export async function getUserGoals(userId: string): Promise<UserGoals | null> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data, error } = await supabase.from("user_goals").select("*").eq("user_id", user.user.id)

  if (error) {
    console.error("Error fetching user goals:", error)
    return null
  }

  // If no data or empty array, create default values
  if (!data || data.length === 0) {
    const defaultGoals = {
      calorie_goal: 2000,
      carbs_goal: 250,
      protein_goal: 150,
      fat_goal: 65,
    }

    await saveUserGoals(defaultGoals)
    return defaultGoals
  }

  // Return the first record
  return data[0]
}

// Get water tracker settings
export async function getWaterTrackerSettings() {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data, error } = await supabase.from("water_tracker_settings").select("*").eq("user_id", user.user.id)

  if (error) {
    console.error("Error fetching water tracker settings:", error)
    return null
  }

  // If no data or empty array, create default values
  if (!data || data.length === 0) {
    const defaultSettings = {
      enabled: false,
      daily_water_goal: 4,
    }

    await saveWaterTrackerSettings(defaultSettings)
    return defaultSettings
  }

  // Ensure proper mapping from database to app
  const settings = {
    ...data[0],
    // Make sure 'enabled' is a true boolean
    enabled: Boolean(data[0].enabled),
  }

  return settings
}
// Get daily nutrition data for a specific date
export async function getDailyNutrition(date: string, useCache = true) {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  // Format date to YYYY-MM-DD
  const formattedDate = new Date(date).toISOString().split("T")[0]

  // Check cache first if enabled
  if (useCache) {
    const cacheKey = `nutrition:${user.user.id}:${formattedDate}`
    const cachedData = queryCache.get(cacheKey)
    if (cachedData) {
      return cachedData
    }
  }

  try {
    // Make all database calls in parallel using Promise.all for better performance
    const [nutritionResult, goalsResult, waterSettingsResult] = await Promise.all([supabase.from("daily_nutrition").select("*").eq("user_id", user.user.id).eq("date", formattedDate), supabase.from("user_goals").select("*").eq("user_id", user.user.id), supabase.from("water_tracker_settings").select("*").eq("user_id", user.user.id)])

    // Handle any errors
    if (nutritionResult.error) {
      console.error("Error fetching daily nutrition:", nutritionResult.error)
    }

    if (goalsResult.error) {
      console.error("Error fetching user goals:", goalsResult.error)
    }

    if (waterSettingsResult.error) {
      console.error("Error fetching water tracker settings:", waterSettingsResult.error)
    }

    // Extract data from results
    const data = nutritionResult.data
    const goals = goalsResult.data && goalsResult.data.length > 0 ? goalsResult.data[0] : null
    const waterSettings =
      waterSettingsResult.data && waterSettingsResult.data.length > 0
        ? {
            ...waterSettingsResult.data[0],
            enabled: Boolean(waterSettingsResult.data[0].enabled),
          }
        : null

    // Default goals
    const defaultGoals = {
      calorie_goal: 2000,
      carbs_goal: 250,
      protein_goal: 150,
      fat_goal: 65,
    }

    // Default water settings
    const defaultWaterSettings = {
      enabled: false,
      daily_water_goal: 4,
    }

    // If goals don't exist, save default values (but don't wait for it to complete)
    if (!goals) {
      saveUserGoals(defaultGoals).catch((err) => console.error("Error saving default user goals:", err))
    }

    // If water settings don't exist, save default values (but don't wait for it to complete)
    if (!waterSettings) {
      saveWaterTrackerSettings(defaultWaterSettings).catch((err) => console.error("Error saving default water settings:", err))
    }

    // If no data or empty array, return default structure
    if (!data || data.length === 0) {
      const result = {
        calorieGoal: goals?.calorie_goal || defaultGoals.calorie_goal,
        macroGoals: {
          carbs: goals?.carbs_goal || defaultGoals.carbs_goal,
          protein: goals?.protein_goal || defaultGoals.protein_goal,
          fat: goals?.fat_goal || defaultGoals.fat_goal,
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
          enabled: waterSettings?.enabled || defaultWaterSettings.enabled,
          dailyWaterGoal: waterSettings?.daily_water_goal || defaultWaterSettings.daily_water_goal,
          cupsConsumed: 0,
        },
      }

      // Store in cache if enabled
      if (useCache) {
        queryCache.set(`nutrition:${user.user.id}:${formattedDate}`, result)
      }

      return result
    }

    // Use the first record (should only be one since we're filtering by user_id and date)
    const record = data[0]

    // Convert from database structure to app structure
    const result = {
      calorieGoal: goals?.calorie_goal || defaultGoals.calorie_goal,
      macroGoals: {
        carbs: goals?.carbs_goal || defaultGoals.carbs_goal,
        protein: goals?.protein_goal || defaultGoals.protein_goal,
        fat: goals?.fat_goal || defaultGoals.fat_goal,
      },
      dailyStats: {
        calories: {
          food: record.calories_food || 0,
          exercise: record.calories_exercise || 0,
        },
        macros: {
          carbs: record.carbs || 0,
          protein: record.protein || 0,
          fat: record.fat || 0,
        },
      },
      waterTrackerSettings: {
        enabled: waterSettings?.enabled || defaultWaterSettings.enabled,
        dailyWaterGoal: waterSettings?.daily_water_goal || defaultWaterSettings.daily_water_goal,
        cupsConsumed: record.cups_consumed || 0,
      },
    }

    // Store in cache if enabled
    if (useCache) {
      queryCache.set(`nutrition:${user.user.id}:${formattedDate}`, result)
    }

    return result
  } catch (error) {
    console.error("Error in getDailyNutrition:", error)
    return null
  }
}

// Get multiple days' nutrition data for dashboard (batch optimized)
export async function getBatchNutrition(dates: string[]) {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  // Format dates consistently
  const formattedDates = dates.map((date) => new Date(date).toISOString().split("T")[0])

  try {
    // Create a cache key for this batch
    const batchKey = `nutritionBatch:${user.user.id}:${formattedDates.join(",")}`

    // Check if we have this batch in cache
    const cachedBatch = queryCache.get(batchKey)
    if (cachedBatch) {
      return cachedBatch
    }

    // Get the goals and water settings once for all dates
    const [goalsResult, waterSettingsResult] = await Promise.all([supabase.from("user_goals").select("*").eq("user_id", user.user.id), supabase.from("water_tracker_settings").select("*").eq("user_id", user.user.id)])

    // Default goals
    const defaultGoals = {
      calorie_goal: 2000,
      carbs_goal: 250,
      protein_goal: 150,
      fat_goal: 65,
    }

    // Default water settings
    const defaultWaterSettings = {
      enabled: false,
      daily_water_goal: 4,
    }

    // Extract shared data
    const goals = goalsResult.data && goalsResult.data.length > 0 ? goalsResult.data[0] : null
    const waterSettings =
      waterSettingsResult.data && waterSettingsResult.data.length > 0
        ? {
            ...waterSettingsResult.data[0],
            enabled: Boolean(waterSettingsResult.data[0].enabled),
          }
        : null

    // Batch query for all dates at once
    const { data: nutritionData, error } = await supabase.from("daily_nutrition").select("*").eq("user_id", user.user.id).in("date", formattedDates)

    if (error) {
      console.error("Error fetching batch nutrition:", error)
      return []
    }

    // Map each date to its nutrition data
    const results = formattedDates.map((date) => {
      const record = nutritionData?.find((item) => item.date === date)

      if (!record) {
        return {
          date,
          calorieGoal: goals?.calorie_goal || defaultGoals.calorie_goal,
          macroGoals: {
            carbs: goals?.carbs_goal || defaultGoals.carbs_goal,
            protein: goals?.protein_goal || defaultGoals.protein_goal,
            fat: goals?.fat_goal || defaultGoals.fat_goal,
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
            enabled: waterSettings?.enabled || defaultWaterSettings.enabled,
            dailyWaterGoal: waterSettings?.daily_water_goal || defaultWaterSettings.daily_water_goal,
            cupsConsumed: 0,
          },
        }
      }

      return {
        date,
        calorieGoal: goals?.calorie_goal || defaultGoals.calorie_goal,
        macroGoals: {
          carbs: goals?.carbs_goal || defaultGoals.carbs_goal,
          protein: goals?.protein_goal || defaultGoals.protein_goal,
          fat: goals?.fat_goal || defaultGoals.fat_goal,
        },
        dailyStats: {
          calories: {
            food: record.calories_food || 0,
            exercise: record.calories_exercise || 0,
          },
          macros: {
            carbs: record.carbs || 0,
            protein: record.protein || 0,
            fat: record.fat || 0,
          },
        },
        waterTrackerSettings: {
          enabled: waterSettings?.enabled || defaultWaterSettings.enabled,
          dailyWaterGoal: waterSettings?.daily_water_goal || defaultWaterSettings.daily_water_goal,
          cupsConsumed: record.cups_consumed || 0,
        },
      }
    })

    // Store in cache
    queryCache.set(batchKey, results, 10 * 60 * 1000) // 10 minutes cache

    return results
  } catch (error) {
    console.error("Error in getBatchNutrition:", error)
    return []
  }
}

// Get chat messages for a specific date
export async function getChatMessages(date: string): Promise<Message[]> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  try {
    // Format date to YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split("T")[0]

    // Get messages from the database
    const { data, error } = await supabase.from("chat_messages").select("*").eq("user_id", user.user.id).eq("date", formattedDate).order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching chat messages:", error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // First convert basic message data without image URL fetching
    const basicMessages = data.map((item) => ({
      id: item.timestamp,
      type: item.message_type || "user",
      text: item.message || "",
      timestamp: new Date(item.timestamp),
    }))

    // Only fetch image URLs for AI messages in a batch request to reduce API calls
    const aiMessages = basicMessages.filter((msg) => msg.type === "ai")
    let imageResults: { [key: number]: string | null } = {}

    if (aiMessages.length > 0) {
      try {
        // Batch search for images
        const messageIds = aiMessages.map((msg) => `${user.user.id}_${msg.id}`)
        const { data: imageData, error: imageError } = await supabase.storage.from("user_uploads").list("food_images", { search: user.user.id })

        if (imageError) {
          console.error("Error fetching image list:", imageError)
        } else if (imageData) {
          // Map image data to messages
          for (const item of imageData) {
            const filename = item.name
            // Extract message ID from filename
            for (const msgId of messageIds) {
              if (filename.includes(msgId)) {
                const id = parseInt(msgId.split("_")[1])
                const filePath = `food_images/${filename}`
                const { data: urlData } = supabase.storage.from("user_uploads").getPublicUrl(filePath)
                imageResults[id] = urlData.publicUrl
                break
              }
            }
          }
        }
      } catch (imageListError) {
        console.error("Error in batch image processing:", imageListError)
      }
    }

    // Update messages with image URLs
    return basicMessages.map((msg) => {
      if (msg.type === "ai" && imageResults[msg.id]) {
        const imageUrl = imageResults[msg.id]
        return { ...msg, imageUrl: imageUrl || undefined }
      }
      return msg
    })
  } catch (error) {
    console.error("Exception fetching chat messages:", error)
    return []
  }
}

// ========== SAVE FUNCTIONS ==========

// Save user's nutrition goals
// Save user's nutrition goals
export async function saveUserGoals(goals: UserGoals): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false

  // Create consistent goal objects regardless of input format
  const calorieGoal = goals.caloriesGoal || goals.calorie_goal || 2000
  let carbsGoal = goals.carbs_goal || goals.carbsGoal || 250
  let proteinGoal = goals.protein_goal || goals.proteinGoal || 150
  let fatGoal = goals.fat_goal || goals.fatGoal || 65

  // Handle macroGoals object if provided
  if (goals.macroGoals) {
    carbsGoal = goals.macroGoals.carbs
    proteinGoal = goals.macroGoals.protein
    fatGoal = goals.macroGoals.fat
  }

  // First check if record exists
  const { data, error: fetchError } = await supabase.from("user_goals").select("id").eq("user_id", user.user.id)

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching user goals:", fetchError)
    return false
  }

  let saveError

  if (data && data.length > 0) {
    // Record exists, update it
    const { error } = await supabase
      .from("user_goals")
      .update({
        calorie_goal: calorieGoal,
        carbs_goal: carbsGoal,
        protein_goal: proteinGoal,
        fat_goal: fatGoal,
        updated_at: new Date(),
      })
      .eq("id", data[0].id)

    saveError = error
  } else {
    // Record doesn't exist, insert new one
    const { error } = await supabase.from("user_goals").insert({
      user_id: user.user.id,
      calorie_goal: calorieGoal,
      carbs_goal: carbsGoal,
      protein_goal: proteinGoal,
      fat_goal: fatGoal,
    })

    saveError = error
  }

  if (saveError) {
    console.error("Error saving user goals:", saveError)
    return false
  }

  return true
}

// Save water tracker settings
export async function saveWaterTrackerSettings(settings: WaterTrackerSettings): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false

  // First check if record exists
  const { data, error: fetchError } = await supabase.from("water_tracker_settings").select("*").eq("user_id", user.user.id)

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching water tracker settings:", fetchError)
    return false
  }

  let saveError

  // Convert settings.enabled to a boolean to ensure consistency
  const enabledValue = Boolean(settings.enabled)

  if (data && data.length > 0) {
    // Get the first record ID
    const firstRecordId = data[0].id

    // Update first record
    const updateData = {
      enabled: enabledValue,
      daily_water_goal: settings.dailyWaterGoal || settings.daily_water_goal || 4,
      updated_at: new Date(),
    }

    const { error } = await supabase.from("water_tracker_settings").update(updateData).eq("id", firstRecordId)

    saveError = error

    // If there are extra records, delete them
    if (data.length > 1) {
      const extraIds = data.slice(1).map((record) => record.id)

      const { error: deleteError } = await supabase.from("water_tracker_settings").delete().in("id", extraIds)

      if (deleteError) {
        console.error("Error deleting extra water tracker records:", deleteError)
      }
    }
  } else {
    // Record doesn't exist, insert new one
    const insertData = {
      user_id: user.user.id,
      enabled: enabledValue,
      daily_water_goal: settings.dailyWaterGoal || settings.daily_water_goal || 4,
    }

    const { error } = await supabase.from("water_tracker_settings").insert(insertData)
    saveError = error
  }

  if (saveError) {
    console.error("Error saving water tracker settings:", saveError)
    return false
  }

  return true
}

// Save daily nutrition data for a specific date
export async function saveDailyNutrition(date: string, nutritionData: NutritionData): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false

  // Format date to YYYY-MM-DD
  const formattedDate = new Date(date).toISOString().split("T")[0]

  // Validate input data to ensure we have proper structure
  if (!nutritionData.dailyStats) {
    console.error("Missing dailyStats in nutritionData", nutritionData)
    nutritionData.dailyStats = {
      calories: { food: 0, exercise: 0 },
      macros: { carbs: 0, protein: 0, fat: 0 },
    }
  }

  // Convert decimal values to integers by rounding
  const caloriesFood = Math.round(nutritionData.dailyStats?.calories?.food || 0)
  const caloriesExercise = Math.round(nutritionData.dailyStats?.calories?.exercise || 0)
  const carbs = Math.round(nutritionData.dailyStats?.macros?.carbs || 0)
  const protein = Math.round(nutritionData.dailyStats?.macros?.protein || 0)
  const fat = Math.round(nutritionData.dailyStats?.macros?.fat || 0)
  const cupsConsumed = Math.round(nutritionData.waterTrackerSettings?.cupsConsumed || 0)

  // Add validation to ensure we don't save negative values (which can happen during rollbacks)
  const record = {
    user_id: user.user.id,
    date: formattedDate,
    calories_food: Math.max(0, caloriesFood),
    calories_exercise: Math.max(0, caloriesExercise),
    carbs: Math.max(0, carbs),
    protein: Math.max(0, protein),
    fat: Math.max(0, fat),
    cups_consumed: Math.max(0, cupsConsumed),
    updated_at: new Date(),
  }

  console.log(`Saving nutrition data for ${formattedDate}:`, JSON.stringify(record))

  // Save daily nutrition data - can use upsert here because we have a composite unique constraint
  try {
    const { error } = await supabase.from("daily_nutrition").upsert(record, {
      onConflict: "user_id,date", // Specify both columns that make up the unique constraint
    })

    if (error) {
      console.error("Error saving daily nutrition:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Exception during daily nutrition save:", err)
    return false
  }
}

// Save chat messages for a specific date
export async function saveChatMessages(date: string, messages: Message[]): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return false

  try {
    // Format date to YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split("T")[0]

    // First, delete existing messages for this date to prevent duplicates
    await supabase.from("chat_messages").delete().eq("user_id", user.user.id).eq("date", formattedDate)

    // Then add all current messages
    if (messages.length > 0) {
      // Format messages without the image_url field which doesn't exist in the database
      const formattedMessages = messages.map((msg: Message) => ({
        user_id: user.user.id,
        date: formattedDate,
        message: msg.text || "",
        message_type: msg.type || "user",
        timestamp: msg.id || Date.now(),
        // Note: imageUri/imageUrl are stored separately in Supabase Storage, not in this table
      }))

      console.log("Saving formatted messages:", JSON.stringify(formattedMessages))

      const { error } = await supabase.from("chat_messages").insert(formattedMessages)

      if (error) {
        console.error("Error saving chat messages:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Exception saving chat messages:", error)
    return false
  }
}

export const uploadImage = async (imageUri: string, userId: string): Promise<string | null> => {
  try {
    // Generate a unique file name
    const fileExt = imageUri.split(".").pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    const filePath = `food_images/${fileName}`

    // Read the file as base64 data
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("user_uploads").upload(filePath, decode(base64), {
      contentType: `image/${fileExt}`,
      upsert: true, // Add this to overwrite existing files with the same name
      cacheControl: "3600", // Cache control for better performance
    })

    if (uploadError) {
      throw uploadError
    }

    // Get the public URL - Ensure this is directly accessible
    const { data } = supabase.storage.from("user_uploads").getPublicUrl(filePath)

    // Test the URL to make sure it's accessible
    const testResponse = await fetch(data.publicUrl, { method: "HEAD" })
    if (!testResponse.ok) {
      throw new Error(`URL not accessible: ${testResponse.status}`)
    }

    console.log("Image uploaded successfully to:", data.publicUrl)
    return data.publicUrl
  } catch (error: unknown) {
    console.error("Image upload error:", error)
    return null
  }
}

export async function deleteMessage(messageId: number): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return false

    // Delete the specific message by its timestamp (which is used as id)
    const { error } = await supabase.from("chat_messages").delete().eq("timestamp", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Exception when deleting message:", err)
    return false
  }
}

// Functions for image handling

export const getImageUrlForMessage = async (messageId: number): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    // Check if an image exists for this message ID in the user_uploads/food_images directory
    const { data, error } = await supabase.storage.from("user_uploads").list(`food_images`, {
      search: `${user.user.id}_${messageId}`,
      limit: 1,
    })

    if (error) {
      console.error("Error checking for image:", error)
      return null
    }

    // If an image is found, get its public URL
    if (data && data.length > 0) {
      const filePath = `food_images/${data[0].name}`
      const { data: urlData } = supabase.storage.from("user_uploads").getPublicUrl(filePath)
      return urlData.publicUrl
    }

    return null
  } catch (error) {
    console.error("Error retrieving image URL:", error)
    return null
  }
}
