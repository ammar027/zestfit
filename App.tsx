import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { StyleSheet, BackHandler, Platform, StatusBar, useColorScheme } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from "sonner-native"
import * as NavigationBar from "expo-navigation-bar"
import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "./utils/supabaseClient"
import React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { ThemeProvider, useTheme } from "./theme"
import { ToastProvider } from "./utils/toast"
import PersonalInfoScreen from "./screens/PersonalInfoScreen"
import FitnessInfoScreen from "./screens/FitnessInfoScreen"
import WelcomeScreen from "./screens/WelcomeScreen"
import AppNavigator from "./screens/App"
import AuthScreen from "./screens/AuthScreen"

const Stack = createStackNavigator()

// Create a context for managing authentication state
export const AuthContext = React.createContext({
  isLoggedIn: false,
  setIsLoggedIn: (value: boolean) => {},
})

// Create screen stacks for modals and full-screen flows
function RootStack() {
  const { isLoggedIn } = React.useContext(AuthContext)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppNavigator} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="FitnessInfo" component={FitnessInfoScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  )
}

// Main navigation structure
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={RootStack} />
    </Stack.Navigator>
  )
}

// Main App component wrapped with ThemeProvider
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null)
  const navigationRef = useRef<any>(null)
  const firstTimeRef = useRef(true)
  const { theme } = useTheme()

  // Create custom navigation theme based on our app theme
  const navigationTheme = useMemo(
    () => ({
      ...(theme.dark ? DarkTheme : DefaultTheme),
      colors: {
        ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    }),
    [theme],
  )

  useEffect(() => {
    // Set status bar and navigation bar colors based on theme
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(theme.colors.statusBar)
      NavigationBar.setButtonStyleAsync(theme.dark ? "light" : "dark")
    }

    // Check if user has seen welcome screen
    checkWelcomeStatus()

    // Check current auth state when app loads
    checkAuthStatus()

    // Set up a listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true)
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false)
      }
    })

    // // Add back handler for system back button
    // const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
    //   if (navigationRef.current) {
    //     const state = navigationRef.current.getRootState()
    //     const routes = state.routes
    //     const currentRoute = routes[state.index]

    //     // If we're already on Home, let the default back behavior proceed (exit app)
    //     if (currentRoute.name === "Home") {
    //       return false
    //     }

    //     // For any other screen, reset navigation to Home
    //     try {
    //       navigationRef.current.dispatch(
    //         CommonActions.reset({
    //           index: 0,
    //           routes: [{ name: "Root" }],
    //         }),
    //       )
    //       return true // Prevent default back behavior
    //     } catch (e) {
    //       console.error("Error resetting navigation:", e)
    //     }
    //   }

    //   return false // Allow default back behavior if something fails
    // })

    // Cleanup listeners when component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
      // backHandler.remove()
    }
  }, [hasSeenWelcome, theme])

  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcomeValue = await AsyncStorage.getItem("HAS_SEEN_WELCOME")
      setHasSeenWelcome(hasSeenWelcomeValue === "true")
    } catch (error) {
      console.error("Error checking welcome status:", error)
      setHasSeenWelcome(false)
    }
  }

  // Add a helper function to move from welcome to main app
  const handleWelcomeComplete = async (navigateToAuth = false) => {
    try {
      await AsyncStorage.setItem("HAS_SEEN_WELCOME", "true")
      setHasSeenWelcome(true)

      // If we need to navigate to auth, we'll do it after transition
      if (navigateToAuth && navigationRef.current) {
        setTimeout(() => {
          navigationRef.current.navigate("Main", {
            screen: "Auth",
          })
        }, 300)
      }
    } catch (error) {
      console.error("Error handling welcome completion:", error)
    }
  }

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsLoggedIn(session !== null)
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsLoggedIn(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Render nothing while checking welcome status
  if (hasSeenWelcome === null) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />
      <SafeAreaProvider style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Toaster theme={theme.dark ? "dark" : "light"} />
        <ToastProvider>
          <NavigationContainer ref={navigationRef} theme={navigationTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>{hasSeenWelcome === false ? <Stack.Screen name="Welcome" component={WelcomeScreen} initialParams={{ onLoginPress: () => handleWelcomeComplete(true), onContinuePress: () => handleWelcomeComplete(false) }} /> : <Stack.Screen name="Root" component={MainNavigator} />}</Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </AuthContext.Provider>
  )
}

// Root component with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
