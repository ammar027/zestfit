import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { StyleSheet, BackHandler, View, Animated, Platform, StatusBar, useColorScheme } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from "sonner-native"
import HomeScreen from "./screens/HomeScreen"
import GoalsEditorScreen from "./screens/GoalsEditorScreen"
import WeightTrackerScreen from "./screens/WeightTrackerScreen"
import WaterTrackerScreen from "./screens/WaterTrackerScreen"
import DashboardScreen from "./screens/DashboardScreen"
import AuthScreen from "./screens/AuthScreen"
import ProfileScreen from "./screens/ProfileScreen"
import WelcomeScreen from "./screens/WelcomeScreen"
import ChatScreen from "./screens/ChatScreen"
import * as NavigationBar from "expo-navigation-bar"
import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "./utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { BlurView } from "expo-blur"
import { ThemeProvider, useTheme } from "./theme"
import { AppTheme } from "./theme/types"
import { ToastProvider } from "./utils/toast"
import PersonalDetailsScreen from "./screens/PersonalDetailsScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Create a context for managing authentication state
export const AuthContext = React.createContext({
  isLoggedIn: false,
  setIsLoggedIn: (value: boolean) => {},
})

// Tab Icon component for consistent styling
function TabIcon({ name, color, focused, theme }: { name: any; color: string; focused: boolean; theme: AppTheme }) {
  // Use an animated value based on the tab's focused state
  const animatedScale = React.useRef(new Animated.Value(focused ? 1 : 0.9)).current
  const animatedOpacity = React.useRef(new Animated.Value(focused ? 1 : 0.6)).current

  // Run animation when focused state changes
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: focused ? 1 : 0.9,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [focused, animatedScale, animatedOpacity])

  return (
    <Animated.View
      style={{
        height: 44,
        width: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? theme.colors.tabBar.highlight : "transparent",
        transform: [{ scale: animatedScale }],
        opacity: animatedOpacity,
      }}
    >
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  )
}

// Main tab navigation
function TabNavigator() {
  const { isLoggedIn } = React.useContext(AuthContext)
  const { theme } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBar.active,
        tabBarInactiveTintColor: theme.colors.tabBar.inactive,
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarStyle: {
          position: "absolute",
          height: 65,
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: Platform.OS === "ios" ? 25 : 0,
          paddingHorizontal: 10,
          bottom: 5,
          left: 15,
          right: 15,
          borderRadius: 22.5,
          overflow: "hidden",
          marginHorizontal: 20,
        },
        tabBarItemStyle: {
          padding: 13.5,
          height: 30,
        },
        tabBarBackground: () => {
          return (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.colors.tabBar.background,
                borderRadius: 22.5,
                borderWidth: 1,
                borderColor: theme.colors.border,
                overflow: "hidden",
                shadowColor: theme.colors.text,
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              {Platform.OS === "ios" && (
                <BlurView
                  tint={theme.dark ? "dark" : "light"}
                  intensity={90}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
              )}
            </View>
          )
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} theme={theme} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="view-dashboard" color={color} focused={focused} theme={theme} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="chat-processing" color={color} focused={focused} theme={theme} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={isLoggedIn ? ProfileScreen : AuthScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name={isLoggedIn ? "account" : "login"} color={color} focused={focused} theme={theme} />,
          tabBarLabel: isLoggedIn ? "Profile" : "Sign In",
        }}
      />
    </Tab.Navigator>
  )
}

// Create screen stacks
function WeightTrackerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrackerHome" component={WeightTrackerScreen} />
    </Stack.Navigator>
  )
}

function WaterTrackerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WaterTrackerHome" component={WaterTrackerScreen} />
    </Stack.Navigator>
  )
}

// Create Auth stack to handle authentication flow
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthScreen" component={AuthScreen} />
    </Stack.Navigator>
  )
}

// Main navigation structure
function MainNavigator() {
  const { isLoggedIn } = React.useContext(AuthContext)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Trackers" component={WeightTrackerStack} />
      <Stack.Screen name="WaterTracker" component={WaterTrackerStack} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
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

    // Add back handler for system back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Always completely reset the navigation to Home screen when back button is pressed
      // This ensures there's never any navigation history that could go back to welcome
      if (navigationRef.current) {
        const state = navigationRef.current.getRootState()
        const routes = state.routes
        const currentRoute = routes[state.index]

        // If we're already on Home, let the default back behavior proceed (exit app)
        if (currentRoute.name === "Home") {
          return false
        }

        // For any other screen, reset navigation to Home
        try {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Main" }],
            }),
          )
          return true // Prevent default back behavior
        } catch (e) {
          console.error("Error resetting navigation:", e)
        }
      }

      return false // Allow default back behavior if something fails
    })

    // Cleanup listeners when component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
      backHandler.remove()
    }
  }, [hasSeenWelcome, theme])

  // Effect that runs when navigation is ready
  useEffect(() => {
    // If navigation ref is available and welcome has been seen (meaning we've navigated from welcome to home)
    if (navigationRef.current && hasSeenWelcome === true && firstTimeRef.current) {
      // Reset the navigation stack completely to prevent back button from going to welcome
      setTimeout(() => {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Main" }],
          }),
        )
        firstTimeRef.current = false
      }, 100)
    }
  }, [hasSeenWelcome, navigationRef.current])

  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcomeValue = await AsyncStorage.getItem("HAS_SEEN_WELCOME")
      // If no value is found (first launch), set to false to show welcome screen
      setHasSeenWelcome(hasSeenWelcomeValue === "true")
    } catch (error) {
      console.error("Error checking welcome status:", error)
      setHasSeenWelcome(false)
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
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onStateChange={(state) => {
              // When navigation state changes, check if we need to clear history
              if (state && navigationRef.current) {
                const routes = state.routes
                const currentRoute = routes[state.index]

                // If we just navigated to Main and we should have seen welcome
                if (currentRoute.name === "Main" && firstTimeRef.current && hasSeenWelcome === false) {
                  // Completely reset navigation stack to fix any history issues
                  setTimeout(() => {
                    navigationRef.current.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: "Main" }],
                      }),
                    )

                    // Update app state
                    AsyncStorage.setItem("HAS_SEEN_WELCOME", "true")
                    setHasSeenWelcome(true)
                    firstTimeRef.current = false
                  }, 100)
                }
              }
            }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>{hasSeenWelcome === false ? <Stack.Screen name="Welcome" component={WelcomeScreen} /> : <Stack.Screen name="Main" component={MainNavigator} />}</Stack.Navigator>
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

// Simplified styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
