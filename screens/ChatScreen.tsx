import React, { useState, useCallback, useEffect, useContext } from "react"
import { View, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from "react-native"
import { useTheme } from "../theme"
import DateHeader from "../components/DateHeader"
import ChatInterface from "../components/ChatInterface"
import { AuthContext } from "../App"
import { format } from "date-fns"
import { supabase } from "../utils/supabaseClient"

// Stats type to manage nutrition data passed between components
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

export default function ChatScreen() {
  const { theme } = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState<StatsType>({
    calories: { food: 0, exercise: 0 },
    macros: { carbs: 0, protein: 0, fat: 0 },
  })
  const [user, setUser] = useState<any>(null)
  const { isLoggedIn } = useContext(AuthContext)

  // Format the date for Supabase queries
  const formattedDate = format(currentDate, "yyyy-MM-dd")

  // Callback to update nutrition stats
  const handleUpdateStats = useCallback((statsUpdater: (prevStats: StatsType) => StatsType) => {
    setStats((prevStats) => statsUpdater(prevStats))
  }, [])

  // Load user data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data?.user) {
          setUser(data.user)
        }
      }
      fetchUser()
    }
  }, [isLoggedIn])

  // Handle date changes
  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          {/* Date selector component */}
          <DateHeader date={currentDate} onDateChange={handleDateChange} />

          {/* Chat interface with nutrition tracking */}
          <ChatInterface date={formattedDate} onUpdateStats={handleUpdateStats} user={user} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
})
