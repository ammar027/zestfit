import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Animated, SafeAreaView, StatusBar } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { getChatMessages, saveChatMessages, uploadImage, deleteMessage, saveDailyNutrition } from "../utils/supabaseutils"
import { saveLocalChatMessages, getLocalChatMessages, deleteLocalChatMessage } from "../utils/localStorage"
import { queryCache } from "../utils/supabaseClient"
import { useTheme } from "../theme"
import { LinearGradient } from "expo-linear-gradient"

// Define types for the component props and state
interface ChatInterfaceProps {
  date: string
  onUpdateStats: (statsUpdater: (prevStats: StatsType) => StatsType) => void
  user: any // Replace with your User type if available
}

interface StatsType {
  calories?: {
    food: number
    exercise: number
  }
  macros?: {
    carbs: number
    protein: number
    fat: number
  }
}

interface NutritionData {
  type: "food" | "exercise"
  name?: string
  description?: string
  calories?: number
  carbs?: number
  protein?: number
  fat?: number
  imageUrl?: string
}

interface Message {
  id: number
  type: "user" | "ai"
  text: string
  imageUri?: string
  imageUrl?: string
  timestamp?: Date | string
}

interface ChatInterfaceState {
  isExpanded: boolean
  expandAnimation: Animated.Value
}

// Type declaration for the StyleSheet to include the new style properties
type ExtendedStyles = typeof styles & {
  actionButtons: any
  actionButton: any
  actionButtonDelete: any
  messageEditing: any
  editingIndicator: any
  editingText: any
  activeActionButton: any
  messageMenu: any
  menuItem: any
  menuItemText: any
  menuDivider: any
  menuButton: any
}

export default function ChatInterface({ date, onUpdateStats, user }: ChatInterfaceProps) {
  const { theme } = useTheme()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number; messageId: number } | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [initialLayout, setInitialLayout] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const expandAnim = useRef(new Animated.Value(0)).current
  const chatHeight = useRef(Dimensions.get("window").height * 0.6).current
  const modalSlideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current
  const [modalVisible, setModalVisible] = useState(false)

  // Cache the date in a ref to detect changes
  const dateRef = useRef(date)

  // Track if component is mounted
  const isMountedRef = useRef(true)

  // Window dimensions for layout calculations
  const windowHeight = Dimensions.get("window").height

  // Load messages for the specific date - optimized version
  const loadMessages = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      setIsLoading(true)
      let chatMessages: Message[] = []

      // Check if date has changed
      const dateChanged = dateRef.current !== date
      dateRef.current = date

      // Try to get cached messages if user is logged in
      let useCache = false
      if (user && !dateChanged) {
        const cacheKey = `messages:${user.id}:${date}`
        const cachedMessages = queryCache.get(cacheKey)
        if (cachedMessages) {
          setMessages(cachedMessages)
          setIsLoading(false)
          useCache = true
          return
        }
      }

      if (!useCache) {
        if (user) {
          // If user is logged in, get messages from Supabase
          chatMessages = await getChatMessages(date)

          // Cache the results
          if (chatMessages && user) {
            const cacheKey = `messages:${user.id}:${date}`
            queryCache.set(cacheKey, chatMessages)
          }
        } else {
          // If user is not logged in, get messages from local storage
          chatMessages = await getLocalChatMessages(date)
        }

        // Add timestamps to messages if they don't exist
        const messagesWithTimestamps = chatMessages.map((msg: Message) => {
          if (!msg.timestamp) {
            return {
              ...msg,
              timestamp: new Date(), // Use current date for old messages
            }
          }
          return msg
        })

        if (isMountedRef.current) {
          setMessages(messagesWithTimestamps)
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      if (isMountedRef.current) {
        Alert.alert("Error", "Failed to load chat messages")
        setMessages([])
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [date, user])

  // Set up mounted ref cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle keyboard dismissal when date changes
  useEffect(() => {
    // Dismiss keyboard when changing dates
    Keyboard.dismiss()

    // Clear messages when date changes to avoid showing old data
    setMessages([])

    // Load messages for the new date
    loadMessages()
  }, [date, loadMessages])

  // Save messages with optimistic updates and caching
  const saveMessages = useCallback(
    async (messagesToSave: Message[]) => {
      try {
        // Update cache first for better responsiveness
        if (user) {
          const cacheKey = `messages:${user.id}:${date}`
          queryCache.set(cacheKey, messagesToSave)
        }

        if (user) {
          // If user is logged in, save to Supabase
          await saveChatMessages(date, messagesToSave)
        } else {
          // If user is not logged in, save to local storage
          await saveLocalChatMessages(date, messagesToSave)
        }
      } catch (error) {
        console.error("Error saving messages:", error)
        if (isMountedRef.current) {
          Alert.alert("Error", "Failed to save chat messages")
        }
      }
    },
    [date, user],
  )

  // Request permission for camera roll access
  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please grant camera roll permissions to upload food images")
        }
      } catch (error) {
        console.error("Error requesting permissions:", error)
      }
    })()
  }, [])

  // Improve image picking quality
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for better food photos
        quality: 1, // Highest quality
        exif: true, // Get image metadata
      })

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri)
        setImagePreview(result.assets[0].uri)
        setShowPreview(true)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  // Improve camera photo quality
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera permissions to take photos")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for better food photos
        quality: 1, // Highest quality
        exif: true, // Get image metadata
      })

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri)
        setImagePreview(result.assets[0].uri)
        setShowPreview(true)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo")
    }
  }

  const clearSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setShowPreview(false)
  }

  // Analyze image and return nutrition data
  const analyzeImage = async (imageUri: string): Promise<NutritionData | null> => {
    try {
      // Start upload process
      setUploading(true)

      let imageUrl: string | null = null

      // Only attempt to upload to server if logged in
      if (user) {
        // Only continue if we have a valid user ID
        if (!user.id) {
          console.error("No user ID available for image upload")
          return null
        }

        // Upload image to Supabase storage
        imageUrl = await uploadImage(imageUri, user.id)

        if (!imageUrl) {
          throw new Error("Failed to upload image")
        }
      } else {
        // For offline mode, we just use the local URI
        // No upload needed, we'll use the URI directly
        imageUrl = imageUri
      }

      // Mock API for food image recognition
      const randomCalories = Math.floor(Math.random() * 200) + 100
      const randomCarbs = Math.floor(Math.random() * 20) + 10
      const randomProtein = Math.floor(Math.random() * 15) + 5
      const randomFat = Math.floor(Math.random() * 10) + 2

      // Return nutrition data
      return {
        type: "food",
        name: "Food Item",
        description: "Analyzed from image",
        calories: randomCalories,
        carbs: randomCarbs,
        protein: randomProtein,
        fat: randomFat,
        imageUrl,
      }
    } catch (error) {
      console.error("Error analyzing image:", error)
      Alert.alert("Error", "Failed to analyze image")
      return null
    } finally {
      setUploading(false)
    }
  }

  const calculateNutrition = async (userMessage: string) => {
    try {
      // First, determine if this is clearly an exercise entry by checking for exercise-related keywords
      const exerciseKeywords = ["exercise", "workout", "run", "ran", "jog", "walk", "swim", "cycling", "biking", "gym", "training", "cardio", "weights", "fitness", "minutes of", "hours of"]
      const lowerCaseMessage = userMessage.toLowerCase()
      const isLikelyExercise = exerciseKeywords.some((keyword) => lowerCaseMessage.includes(keyword))

      // If it's an image analysis request (contains URL), don't pre-categorize
      const isImageAnalysis = userMessage.includes("Analyze this food image")

      const systemPrompt = isImageAnalysis
        ? `You are an extremely accurate nutrition expert AI with advanced computer vision and language understanding. When given a food image URL, analyze it very carefully – identify common foods with precise details. For each item, provide its name, a brief description, and accurate nutritional values (calories and macros). For instance, if the image is of a banana, describe "ripe banana" and provide realistic nutritional estimates. 
      Respond ONLY with a valid JSON object in this format:
      {"type": "food", "name": "Detailed Food Name", "description": "Brief food description", "calories": 105, "carbs": 27, "protein": 1, "fat": 0}`
        : `You are an extremely accurate nutrition expert AI. Analyze the user's message to determine whether they are describing FOOD or EXERCISE, and provide the appropriate nutritional data.

      - If the input describes FOOD (e.g., "3 eggs", "banana", "chicken salad", "protein shake"):
        Respond ONLY with a valid JSON: {"type": "food", "name": "Detailed Food Name", "description": "Brief description", "calories": 210, "carbs": 0, "protein": 18, "fat": 14}

      - If the input explicitly describes EXERCISE (e.g., "30 min running", "1 hour swimming", "gym workout"):
        Respond ONLY with a valid JSON: {"type": "exercise", "calories": 150}

      DEFAULT TO FOOD if there is any ambiguity. Only categorize as exercise if the input EXPLICITLY mentions activity. Simple foods like "3 eggs" or "apple" should always be categorized as food.`

      const response = await fetch("https://api.a0.dev/ai/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      let nutritionData
      const completion = data.completion || ""

      try {
        // Try parsing the entire completion as JSON
        nutritionData = JSON.parse(completion)
      } catch (parseError) {
        // If direct parsing fails, try extracting JSON using regex
        const jsonMatch = completion.match(/\{[^}]+\}/)
        if (jsonMatch) {
          try {
            nutritionData = JSON.parse(jsonMatch[0])
          } catch (error) {
            throw new Error(`Unable to extract valid JSON from: ${completion}`)
          }
        } else {
          throw new Error(`Unable to extract valid JSON from: ${completion}`)
        }
      }

      // Extra validation to ensure food items aren't incorrectly categorized as exercise
      if (!isImageAnalysis && !isLikelyExercise && nutritionData.type === "exercise") {
        // Override to food type with default values if a simple food entry is miscategorized
        console.log("Overriding incorrect exercise categorization for food item")
        nutritionData = {
          type: "food",
          name: userMessage.trim(),
          description: "Food item",
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
        }
      }

      // Update stats based on nutrition type
      updateStats(nutritionData)

      return nutritionData
    } catch (error) {
      console.error("Nutrition Calculation Error:", error)
      Alert.alert("Nutrition Calculation Error", "Unable to process nutrition information. Please try again.")
      return null
    }
  }

  const updateStats = (nutritionData: NutritionData) => {
    onUpdateStats((prevStats: StatsType) => {
      if (nutritionData.type === "food") {
        return {
          calories: {
            food: (prevStats.calories?.food || 0) + (nutritionData.calories || 0),
            exercise: prevStats.calories?.exercise || 0,
          },
          macros: {
            carbs: (prevStats.macros?.carbs || 0) + (nutritionData.carbs || 0),
            protein: (prevStats.macros?.protein || 0) + (nutritionData.protein || 0),
            fat: (prevStats.macros?.fat || 0) + (nutritionData.fat || 0),
          },
        }
      } else if (nutritionData.type === "exercise") {
        return {
          calories: {
            food: prevStats.calories?.food || 0,
            exercise: (prevStats.calories?.exercise || 0) + (nutritionData.calories || 0),
          },
          macros: prevStats.macros || {
            carbs: 0,
            protein: 0,
            fat: 0,
          },
        }
      }
      return prevStats
    })
  }

  // Rollback stats when deleting a message
  const rollbackStats = (nutritionData: NutritionData) => {
    if (!nutritionData) return

    console.log("Rolling back nutrition data:", JSON.stringify(nutritionData))

    onUpdateStats((prevStats: StatsType) => {
      if (nutritionData.type === "food") {
        const calories = Math.max(0, (prevStats.calories?.food || 0) - (nutritionData.calories || 0))
        const carbs = Math.max(0, (prevStats.macros?.carbs || 0) - (nutritionData.carbs || 0))
        const protein = Math.max(0, (prevStats.macros?.protein || 0) - (nutritionData.protein || 0))
        const fat = Math.max(0, (prevStats.macros?.fat || 0) - (nutritionData.fat || 0))

        console.log(`Food stats rollback - Calories: ${prevStats.calories?.food} -> ${calories}`)

        return {
          calories: {
            food: calories,
            exercise: prevStats.calories?.exercise || 0,
          },
          macros: {
            carbs: carbs,
            protein: protein,
            fat: fat,
          },
        }
      } else if (nutritionData.type === "exercise") {
        const exercise = Math.max(0, (prevStats.calories?.exercise || 0) - (nutritionData.calories || 0))

        console.log(`Exercise stats rollback - Calories: ${prevStats.calories?.exercise} -> ${exercise}`)

        return {
          calories: {
            food: prevStats.calories?.food || 0,
            exercise: exercise,
          },
          macros: prevStats.macros || {
            carbs: 0,
            protein: 0,
            fat: 0,
          },
        }
      }
      return prevStats
    })
  }

  // Extract nutrition data from AI response text with improved pattern matching
  const extractNutritionDataFromText = (text: string): NutritionData | null => {
    try {
      // Handle exercise case first - should be explicit
      if (text.includes("Exercise Calories Burned") || text.toLowerCase().includes("exercise") || text.toLowerCase().includes("workout")) {
        const caloriesMatch = text.match(/(\d+)\s*kcal/) || text.match(/calories[:\s]*(\d+)/i) || text.match(/(\d+)\s*calories/i) || text.match(/burned[:\s]*(\d+)/i)

        const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0
        console.log(`Extracted exercise calories: ${calories} from text: "${text.substring(0, 30)}..."`)
        return {
          type: "exercise",
          calories: calories,
        }
      } else {
        // Improved regex patterns for food nutritional data
        const calories = parseInt(text.match(/Calories:\s*(\d+)/i)?.[1] || text.match(/calories[:\s]*(\d+)/i)?.[1] || "0")

        const carbs = parseInt(text.match(/Carbs:\s*(\d+)/i)?.[1] || text.match(/carbs[:\s]*(\d+)/i)?.[1] || text.match(/carbohydrates[:\s]*(\d+)/i)?.[1] || "0")

        const protein = parseInt(text.match(/Protein:\s*(\d+)/i)?.[1] || text.match(/protein[:\s]*(\d+)/i)?.[1] || "0")

        const fat = parseInt(text.match(/Fat:\s*(\d+)/i)?.[1] || text.match(/fat[:\s]*(\d+)/i)?.[1] || "0")

        // More flexible name extraction
        const nameMatch = text.match(/Nutrition Info:\s*\n(.*?)(?:\n|$)/) || text.match(/name[:\s]*(.*?)(?:\n|$)/i) || text.match(/food[:\s]*(.*?)(?:\n|$)/i)

        console.log(`Extracted food data - Name: ${nameMatch?.[1]?.trim() || "Food"}, Calories: ${calories}, Carbs: ${carbs}, Protein: ${protein}, Fat: ${fat}`)

        return {
          type: "food",
          name: nameMatch ? nameMatch[1].trim() : "Food",
          calories: calories,
          carbs: carbs,
          protein: protein,
          fat: fat,
        }
      }
    } catch (error) {
      console.error("Error extracting nutrition data:", error)
      return null
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      // Find the message to delete
      const messageToDelete = messages.find((msg) => msg.id === messageId)
      if (!messageToDelete) return

      // Find the corresponding AI response if it's a user message
      let aiResponseToDelete = null
      if (messageToDelete.type === "user") {
        // Find the next AI message after this user message
        const messageIndex = messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex >= 0 && messageIndex + 1 < messages.length && messages[messageIndex + 1].type === "ai") {
          aiResponseToDelete = messages[messageIndex + 1]
        }
      }

      // Rollback stats if deleting an AI response or the user message with associated AI response
      if (messageToDelete.type === "ai") {
        const nutritionData = extractNutritionDataFromText(messageToDelete.text)
        if (nutritionData) {
          console.log("Rolling back stats for AI message:", nutritionData)
          rollbackStats(nutritionData)
        }
      } else if (aiResponseToDelete) {
        const nutritionData = extractNutritionDataFromText(aiResponseToDelete.text)
        if (nutritionData) {
          console.log("Rolling back stats for associated AI response:", nutritionData)
          rollbackStats(nutritionData)
        }
      }

      // Remove messages from local state
      let updatedMessages
      if (messageToDelete.type === "user" && aiResponseToDelete) {
        // Remove both user message and AI response
        updatedMessages = messages.filter((msg) => msg.id !== messageId && msg.id !== aiResponseToDelete.id)
      } else {
        // Remove just the selected message
        updatedMessages = messages.filter((msg) => msg.id !== messageId)
      }

      setMessages(updatedMessages)

      // Save updated messages to database or local storage
      await saveMessages(updatedMessages)

      // Delete from database (only if logged in)
      if (user) {
        await deleteMessage(messageId)
        if (aiResponseToDelete) {
          await deleteMessage(aiResponseToDelete.id)
        }
      } else {
        // For local storage, we already updated the messages above
        // by filtering out the deleted message(s)
      }

      // IMPORTANT: Force update stats in parent component to ensure UI is in sync
      onUpdateStats((prevStats: StatsType) => {
        // Just return the previous stats to trigger a re-render, actual changes already applied by rollbackStats
        return { ...prevStats }
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      Alert.alert("Error", "Failed to delete message")
    }
  }

  const handleEditMessage = (messageId: number) => {
    const messageToEdit = messages.find((msg) => msg.id === messageId)
    if (messageToEdit && messageToEdit.type === "user") {
      setMessage(messageToEdit.text)
      setEditingMessage(messageToEdit)
      if (messageToEdit.imageUri) {
        setSelectedImage(messageToEdit.imageUri)
        setImagePreview(messageToEdit.imageUri)
      }
    }
  }

  // Create an AI message with correct type structure
  const createAiMessage = (id: number, text: string, imageUrl?: string): Message => {
    const aiMsg: Message = {
      id,
      type: "ai",
      text,
      timestamp: new Date(),
    }

    if (imageUrl) {
      aiMsg.imageUrl = imageUrl
    }

    return aiMsg
  }

  // Create a user message with correct type structure
  const createUserMessage = (id: number, text: string, imageUri?: string): Message => {
    const userMsg: Message = {
      id,
      type: "user",
      text,
      timestamp: new Date(),
    }

    if (imageUri) {
      userMsg.imageUri = imageUri
    }

    return userMsg
  }

  // Format nutrition info to be more visually appealing in the AI message
  const formatNutritionInfo = (nutritionData: NutritionData): string => {
    if (nutritionData.type === "exercise") {
      return `🔥 *Exercise Calories Burned*\n${nutritionData.calories || 0} kcal`
    } else {
      const foodName = nutritionData.name ? `*${nutritionData.name}*\n` : ""
      const description = nutritionData.description ? `${nutritionData.description}\n\n` : ""

      return `📊 *Nutrition Info*\n${foodName}${description}• Calories: ${nutritionData.calories || 0} kcal\n• Carbs: ${nutritionData.carbs || 0}g\n• Protein: ${nutritionData.protein || 0}g\n• Fat: ${nutritionData.fat || 0}g`
    }
  }

  // Utility function to format message timestamp
  const formatMessageTime = (timestamp?: Date | string): string => {
    if (!timestamp) return ""

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Handle both Date objects and string dates
    const messageDate = typeof timestamp === "string" ? new Date(timestamp) : timestamp
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())

    // Time formatting
    const hours = messageDate.getHours()
    const minutes = messageDate.getMinutes()
    const formattedHours = hours < 10 ? `0${hours}` : hours
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const timeStr = `${formattedHours}:${formattedMinutes}`

    // If message is from today, just return the time
    if (messageDay.getTime() === today.getTime()) {
      return timeStr
    }

    // If message is from yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (messageDay.getTime() === yesterday.getTime()) {
      return `Yesterday, ${timeStr}`
    }

    // For older messages, include date
    const month = messageDate.getMonth() + 1
    const day = messageDate.getDate()
    return `${day}/${month}, ${timeStr}`
  }

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return

    try {
      // Dismiss keyboard after sending
      Keyboard.dismiss()

      // Check if this is a reset command
      if (message.trim().toLowerCase() === "reset") {
        // Create a special reset message
        const resetMsg = createUserMessage(Date.now(), "Reset nutrition data for today")
        const updatedMessages = [...messages, resetMsg]
        setMessages(updatedMessages)
        await saveMessages(updatedMessages)

        // Reset the daily nutrition data
        onUpdateStats((prevStats: StatsType) => {
          return {
            calories: {
              food: 0,
              exercise: 0,
            },
            macros: {
              carbs: 0,
              protein: 0,
              fat: 0,
            },
          }
        })

        // Explicitly reset data in the database with all zeros
        const resetData = {
          type: "food",
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
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
            cupsConsumed: 0,
          },
        }

        // Save zeros directly to the database for today's date
        if (user) {
          await saveDailyNutrition(date, resetData)
        }

        // Add AI confirmation message
        const aiResetMsg = createAiMessage(Date.now() + 1, "Today's nutrition data has been reset. All calories and macros are now set to zero.")
        const finalMessages = [...updatedMessages, aiResetMsg]
        setMessages(finalMessages)
        await saveMessages(finalMessages)

        // Clear the input
        setMessage("")
        return
      }

      // If we're editing an existing message
      if (editingMessage) {
        const messageIndex = messages.findIndex((msg) => msg.id === editingMessage.id)

        // If there's an AI response tied to this message, delete it so we can recalculate
        let aiResponseIndex = -1
        if (messageIndex >= 0 && messageIndex + 1 < messages.length && messages[messageIndex + 1].type === "ai") {
          aiResponseIndex = messageIndex + 1
          const aiResponse = messages[aiResponseIndex]
          const nutritionData = extractNutritionDataFromText(aiResponse.text)
          if (nutritionData) {
            rollbackStats(nutritionData)
          }
        }

        // Update the existing message
        const updatedMessage: Message = {
          ...editingMessage,
          text: message,
          imageUri: selectedImage || editingMessage.imageUri,
        }

        let updatedMessages
        if (aiResponseIndex >= 0) {
          // Remove the AI response from the messages array
          updatedMessages = [...messages]
          updatedMessages[messageIndex] = updatedMessage
          updatedMessages.splice(aiResponseIndex, 1)
        } else {
          // Just update the user message
          updatedMessages = messages.map((msg) => (msg.id === editingMessage.id ? updatedMessage : msg))
        }

        setMessages(updatedMessages)

        // Save the updated messages to the database
        // Note: We're not storing imageUrl in the messages table anymore
        await saveMessages(updatedMessages)

        // Reset editing state
        setEditingMessage(null)
        setMessage("")
        setSelectedImage(null)
        setImagePreview(null)
        setShowPreview(false)

        // Now recalculate if there was an AI response
        if (aiResponseIndex >= 0) {
          let aiResponse

          if (updatedMessage.imageUri) {
            // Only upload and analyze the image if it exists
            aiResponse = await analyzeImage(updatedMessage.imageUri)
          } else {
            aiResponse = await calculateNutrition(updatedMessage.text)
          }

          if (aiResponse) {
            const aiMessageId = Date.now() + 2
            let aiMsg: Message

            if (aiResponse.type === "food") {
              const formattedText = formatNutritionInfo(aiResponse)

              // Store the imageUrl separately in the message object but don't save it to the database table
              aiMsg = createAiMessage(aiMessageId, formattedText)
              // Store the image URL in memory for this session
              if (aiResponse.imageUrl) {
                aiMsg.imageUrl = aiResponse.imageUrl
              }
            } else {
              const formattedText = formatNutritionInfo(aiResponse)
              aiMsg = createAiMessage(aiMessageId, formattedText)
            }

            const finalMessages = [...updatedMessages, aiMsg]
            setMessages(finalMessages)
            await saveMessages(finalMessages)
          }
        }

        return
      }

      // If we're sending a new message
      let userMsg: Message

      // Create a user message
      if (selectedImage) {
        userMsg = createUserMessage(Date.now(), message.trim() ? message : "Food image", selectedImage)
      } else {
        userMsg = createUserMessage(Date.now(), message)
      }

      // Add user message to chat
      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)

      // Save messages to database (without image URLs)
      await saveMessages(updatedMessages)

      setMessage("")
      setSelectedImage(null)
      setImagePreview(null)
      setShowPreview(false)

      let aiResponse

      if (userMsg.imageUri) {
        // If an image was sent, analyze it
        aiResponse = await analyzeImage(userMsg.imageUri)
      } else {
        // Otherwise, calculate nutrition based on text
        aiResponse = await calculateNutrition(userMsg.text)
      }

      if (aiResponse) {
        const aiMessageId = Date.now() + 2
        let aiMsg: Message

        if (aiResponse.type === "food") {
          const formattedText = formatNutritionInfo(aiResponse)

          // Store the imageUrl separately in the message object but don't save it to the database table
          aiMsg = createAiMessage(aiMessageId, formattedText)
          // Store the image URL in memory for this session
          if (aiResponse.imageUrl) {
            aiMsg.imageUrl = aiResponse.imageUrl
          }
        } else {
          const formattedText = formatNutritionInfo(aiResponse)
          aiMsg = createAiMessage(aiMessageId, formattedText)
        }

        // Add AI response to chat
        const finalMessages = [...updatedMessages, aiMsg]
        setMessages(finalMessages)

        // Save updated messages (without image URLs in the database table)
        await saveMessages(finalMessages)
      }
    } catch (error) {
      console.error("Send Message Error:", error)
      Alert.alert("Error", "Failed to send message")
    }
  }

  // Updated method to handle showing the context menu
  const handleShowMenu = (messageId: number, event: any) => {
    // Get the location of the touch
    const { pageY, pageX } = event.nativeEvent

    // Set the menu position
    setMenuPosition({
      top: pageY - 100, // Position above the touch point
      right: 20,
      messageId,
    })
  }

  // Handle keyboard events with improved initial handling
  useEffect(() => {
    // Make sure layout is initialized
    setInitialLayout(true)

    const keyboardWillShowListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillShow", (e) => {
            const height = e.endCoordinates.height
            setKeyboardHeight(height)
            setKeyboardVisible(true)
          })
        : { remove: () => {} }

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (event) => {
      const height = event.endCoordinates.height
      setKeyboardHeight(height)
      setKeyboardVisible(true)

      // Scroll to bottom with delay to ensure proper positioning
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 150)
    })

    const keyboardWillHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => {
            setKeyboardVisible(false)
            setKeyboardHeight(0)
          })
        : { remove: () => {} }

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    // Force initial scroll
    setTimeout(() => {
      if (messages.length > 0) {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }
    }, 300)

    return () => {
      keyboardWillShowListener.remove()
      keyboardDidShowListener.remove()
      keyboardWillHideListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [messages.length])

  // Add a layout effect to handle initial render
  useEffect(() => {
    if (initialLayout && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
  }, [initialLayout, messages.length])

  // Memoize the empty state UI
  const EmptyState = useMemo(
    () => (
      <View style={styles.emptyStateContainer}>
        <MaterialCommunityIcons name="food-apple-outline" size={48} color={theme.colors.primary + "80"} />
        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No entries yet</Text>
        <Text style={[styles.emptyStateText, { color: theme.colors.subtext }]}>Track your meals by typing or uploading photos. Exercise tracking is also available.</Text>
        <TouchableOpacity style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary + "20" }]} onPress={() => setMessage("I had ")}>
          <MaterialCommunityIcons name="food" size={18} color={theme.colors.primary} />
          <Text style={[styles.emptyStateButtonText, { color: theme.colors.primary }]}>Add a meal</Text>
        </TouchableOpacity>
      </View>
    ),
    [theme],
  )

  // Memoize the message rendering function for better list performance
  const renderMessage = useCallback(
    (msg: Message) => {
      const isUser = msg.type === "user"

      return (
        <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.aiMessageWrapper, { zIndex: isUser ? 1 : 0 }]}>
          {/* Bot Avatar - Only show for AI messages */}
          {!isUser && (
            <View style={[styles.botAvatar, { backgroundColor: theme.colors.primary }]}>
              <Image source={require("../assets/icons/adaptive-icon-dark.png")} style={styles.avatarImage} />
            </View>
          )}

          {/* Message Content */}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={(event) => isUser && handleShowMenu(msg.id, event)}
            style={[
              styles.messageContent,
              isUser
                ? [styles.userMessageContent, { backgroundColor: theme.colors.primary + "30" }]
                : [
                    styles.aiMessageContent,
                    {
                      backgroundColor: theme.colors.card,
                      borderLeftColor: theme.colors.primary,
                    },
                  ],
              editingMessage?.id === msg.id && (styles as any).messageEditing,
            ]}
          >
            {/* Menu button for user messages */}
            {isUser && (
              <TouchableOpacity style={styles.menuButton} onPress={(event) => handleShowMenu(msg.id, event)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <MaterialCommunityIcons name="dots-vertical" size={16} color={theme.colors.subtext} />
              </TouchableOpacity>
            )}

            {/* Lazy-load images with loading indicator */}
            {(msg.imageUri || msg.imageUrl) && (
              <View style={styles.messageImageContainer}>
                <Image
                  source={{ uri: msg.imageUri || msg.imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                  // Add loading placeholder
                  onLoadStart={() => setActiveMessageId(msg.id)}
                  onLoadEnd={() => setActiveMessageId(null)}
                />
                {activeMessageId === msg.id && (
                  <View style={styles.imageLoadingIndicator}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                )}
              </View>
            )}

            {/* Optimized message text rendering - preprocess and memoize text parts */}
            {msg.text.split("\n").map((line, index) => {
              // Check if line contains bold formatting with asterisks
              if (line.includes("*")) {
                const parts = line.split("*")
                return (
                  <Text key={`line-${index}`} style={[styles.messageText, !isUser && styles.aiMessageText, { color: theme.colors.text }]}>
                    {parts.map((part, pIndex) => {
                      // Every second part (odd index) is bold
                      return pIndex % 2 === 1 ? (
                        <Text key={`part-${pIndex}`} style={{ fontWeight: "bold" }}>
                          {part}
                        </Text>
                      ) : (
                        <Text key={`part-${pIndex}`}>{part}</Text>
                      )
                    })}
                  </Text>
                )
              }

              // Render bullet points with proper formatting
              if (line.trim().startsWith("•")) {
                return (
                  <Text key={`line-${index}`} style={[styles.messageText, !isUser && styles.aiMessageText, styles.bulletItem, { color: theme.colors.text }]}>
                    {line}
                  </Text>
                )
              }

              return (
                <Text key={`line-${index}`} style={[styles.messageText, !isUser && styles.aiMessageText, { color: theme.colors.text }]}>
                  {line}
                </Text>
              )
            })}

            {/* Message Time with real timestamp */}
            <Text style={[styles.messageTime, { color: theme.colors.subtext }]}>{formatMessageTime(msg.timestamp)}</Text>

            {/* Editing Indicator */}
            {editingMessage?.id === msg.id && (
              <View style={(styles as any).editingIndicator}>
                <Text style={(styles as any).editingText}>Editing...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )
    },
    [editingMessage, handleShowMenu, activeMessageId, theme],
  )

  // Toggle expansion of chat interface
  const toggleExpansion = () => {
    // Open the full-screen modal instead of expanding in place
    openChatModal()
  }

  // Open the chat modal
  const openChatModal = () => {
    setModalVisible(true)
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      friction: 10,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }

  // Close the chat modal
  const closeChatModal = () => {
    // Use timing animation instead of spring for more reliable closing
    Animated.timing(modalSlideAnim, {
      toValue: Dimensions.get("window").height,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setModalVisible(false)
      } else {
        // Force close if animation didn't finish properly
        setModalVisible(false)
      }
    })
  }

  const handleOverlayPress = () => {
    closeChatModal()
  }

  // Calculate animated height for the collapsed view
  const animatedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 90], // Increased height to show message preview
  })

  // Get the most recent message for the preview
  const mostRecentMessage = useMemo(() => {
    if (messages.length === 0) return null

    // Find the most recent AI message
    const recentAiMessage = [...messages].reverse().find((msg) => msg.type === "ai")

    return recentAiMessage || messages[messages.length - 1]
  }, [messages])

  // Format preview text
  const getPreviewText = (message: Message | null) => {
    if (!message) return "No recent conversations"

    // For AI messages, extract the first line with nutrition info
    if (message.type === "ai") {
      const text = message.text
      if (text.includes("Nutrition Info")) {
        const caloriesMatch = text.match(/Calories: (\d+)/)
        if (caloriesMatch) {
          return `${caloriesMatch[0]} | Last tracked item`
        }
      }
      if (text.includes("Exercise Calories")) {
        const caloriesMatch = text.match(/(\d+) kcal/)
        if (caloriesMatch) {
          return `Burned ${caloriesMatch[1]} kcal | Last exercise`
        }
      }
      return text.split("\n")[0]
    }

    // For user messages
    return message.text.length > 40 ? `${message.text.substring(0, 40)}...` : message.text
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            height: animatedHeight,
            borderRadius: 22,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay}>
          {/* Header - Now just a trigger for the modal */}
          <TouchableOpacity style={styles.header} onPress={toggleExpansion} activeOpacity={0.7}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="chat-processing-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nutrition Assistant</Text>
            </View>
            <MaterialCommunityIcons name="chevron-up" size={24} color={theme.colors.subtext} />
          </TouchableOpacity>

          {/* Message preview in collapsed state */}
          <View style={styles.previewContainer}>
            {mostRecentMessage?.imageUri || mostRecentMessage?.imageUrl ? (
              <View style={styles.previewImageContainer}>
                <Image source={{ uri: mostRecentMessage.imageUri || mostRecentMessage.imageUrl }} style={styles.previewImage} resizeMode="cover" />
              </View>
            ) : (
              <MaterialCommunityIcons name={mostRecentMessage?.type === "ai" ? "chart-box-outline" : "text-box-outline"} size={18} color={theme.colors.primary} style={styles.previewIcon} />
            )}
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.previewText, { color: theme.colors.subtext }]}>
              {getPreviewText(mostRecentMessage)}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Full-screen Modal Chat Interface */}
      <Modal visible={modalVisible} transparent={true} animationType="none" onRequestClose={closeChatModal} statusBarTranslucent={true}>
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: modalSlideAnim }],
            },
          ]}
        >
          <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.9)", "rgba(20,20,30,0.95)"] : ["rgba(255,255,255,0.98)", "rgba(250,250,255,0.95)"]} style={styles.modalGradient}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.modalHeaderContent}>
                  <MaterialCommunityIcons name="nutrition" size={22} color={theme.colors.primary} />
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nutrition Assistant</Text>
                </View>
                <TouchableOpacity style={styles.closeModalButton} onPress={closeChatModal}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              {/* Messages Content */}
              <View style={styles.messagesContainer}>
                <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  {messages.length === 0 ? EmptyState : messages.map(renderMessage)}
                </ScrollView>
              </View>

              {/* Input Area */}
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
                <View style={[styles.inputWrapper, { backgroundColor: theme.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)" }]}>
                  {selectedImage && (
                    <View style={styles.selectedImageContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.selectedImagePreview} />
                      <TouchableOpacity style={styles.clearImageButton} onPress={() => setSelectedImage(null)}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TextInput style={[styles.input, { color: theme.colors.text }]} placeholder={editingMessage ? "Edit your message..." : "Type food, drinks, or exercise..."} placeholderTextColor={theme.colors.subtext} value={message} onChangeText={setMessage} multiline />

                  <View style={styles.inputActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                      <MaterialCommunityIcons name="image" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                      <MaterialCommunityIcons name="camera" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        {
                          backgroundColor: message.trim() || selectedImage ? theme.colors.primary : theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        },
                      ]}
                      onPress={handleSend}
                      disabled={!message.trim() && !selectedImage}
                    >
                      <MaterialCommunityIcons name={editingMessage ? "check" : "send"} size={20} color={message.trim() || selectedImage ? "#FFFFFF" : theme.colors.subtext} />
                    </TouchableOpacity>
                  </View>
                </View>

                {editingMessage && (
                  <View style={styles.editingBar}>
                    <Text style={[styles.editingText, { color: theme.colors.primary }]}>Editing message</Text>
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={() => {
                        setEditingMessage(null)
                        setMessage("")
                        setSelectedImage(null)
                      }}
                    >
                      <Text style={[styles.cancelEditText, { color: theme.colors.error || "#ff5252" }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </KeyboardAvoidingView>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginHorizontal: 16,
    marginTop: 0,
  },
  gradientOverlay: {
    flex: 1,
    borderRadius: 22,
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Preview styles
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  previewText: {
    fontSize: 13,
    flex: 1,
  },
  previewIcon: {
    marginRight: 8,
  },
  previewImageContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 24,
  },
  modalHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: "relative",
    marginTop: 15,
  },
  headerPill: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(150,150,150,0.25)",
    position: "absolute",
    top: 8,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
  },
  closeModalButton: {
    position: "absolute",
    right: 16,
    top: 19,
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(150,150,150,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  // Message area styles
  messageArea: {
    flex: 1,
    display: "flex",
  },
  messagesContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "90%",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  aiMessageWrapper: {
    alignSelf: "flex-start",
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageContent: {
    borderTopRightRadius: 4,
  },
  aiMessageContent: {
    borderTopLeftRadius: 4,
    borderLeftWidth: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageText: {
    fontSize: 15,
  },
  bulletItem: {
    paddingLeft: 8,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
    opacity: 0.6,
  },
  messageImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageLoadingIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
  },
  // Input area
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectedImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  selectedImagePreview: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  clearImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Editing bar
  editingBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  editingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cancelEditButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Message menu
  messageMenu: {
    position: "absolute",
    borderRadius: 12,
    width: 130,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    width: "100%",
  },
  menuButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Empty state container
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
})
