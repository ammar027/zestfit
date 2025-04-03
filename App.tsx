import { NavigationContainer } from "@react-navigation/native"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { StyleSheet, BackHandler } from "react-native"
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
import * as NavigationBar from "expo-navigation-bar"
import { useEffect, useState, useRef } from "react"
import { supabase } from "./utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"

const Drawer = createDrawerNavigator()
const ACCENT_COLOR = "#2C3F00"

// Create a context for managing authentication state
export const AuthContext = React.createContext({
  isLoggedIn: false,
  setIsLoggedIn: (value: boolean) => {},
})

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null)
  const navigationRef = useRef<any>(null)
  const firstTimeRef = useRef(true)

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#ffffff")

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
              routes: [{ name: "Home" }],
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
  }, [hasSeenWelcome])

  // Effect that runs when navigation is ready
  useEffect(() => {
    // If navigation ref is available and welcome has been seen (meaning we've navigated from welcome to home)
    if (navigationRef.current && hasSeenWelcome === true && firstTimeRef.current) {
      // Reset the navigation stack completely to prevent back button from going to welcome
      setTimeout(() => {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Home" }],
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

  // Determine initial route based on whether the user has seen the welcome screen
  const initialRouteName = hasSeenWelcome === false ? "Welcome" : "Home"

  // Conditionally render screens based on whether user has seen welcome
  const renderScreens = () => {
    // If loading or still determining if welcome has been seen, return null
    if (hasSeenWelcome === null) return null

    return (
      <>
        {/* Only include Welcome screen if it hasn't been seen */}
        {hasSeenWelcome === false && (
          <Drawer.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              drawerItemStyle: { display: "none", height: 0 },
              // Prevent going back to welcome screen
              headerLeft: () => null,
              // Completely disable the drawer for this screen
              swipeEnabled: false,
            }}
          />
        )}

        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="home-outline" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Daily Goals Editor"
          component={GoalsEditorScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Weight Tracker"
          component={WeightTrackerScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="scale-bathroom" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Water Tracker"
          component={WaterTrackerScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="water-outline" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={color} />,
          }}
        />

        {/* Separator */}
        <Drawer.Screen
          name="Separator"
          component={EmptyComponent}
          options={{
            drawerItemStyle: { height: 1, backgroundColor: "#E0E0E0", marginVertical: 13 },
            drawerLabel: () => null,
          }}
        />

        <Drawer.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            drawerLabel: isLoggedIn ? () => null : "Sign In",
            drawerItemStyle: isLoggedIn ? { display: "none", height: 0 } : undefined,
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="login" size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            drawerIcon: ({ color }) => <MaterialCommunityIcons name="account-outline" size={22} color={color} />,
          }}
        />
      </>
    )
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <SafeAreaProvider style={styles.container}>
        <Toaster />
        <NavigationContainer
          ref={navigationRef}
          onStateChange={(state) => {
            // When navigation state changes, check if we need to clear history
            if (state && navigationRef.current) {
              const routes = state.routes
              const currentRoute = routes[state.index]

              // If we just navigated to Home and we should have seen welcome
              if (currentRoute.name === "Home" && firstTimeRef.current && hasSeenWelcome === false) {
                // Completely reset navigation stack to fix any history issues
                setTimeout(() => {
                  navigationRef.current.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: "Home" }],
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
          <Drawer.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false,
              drawerActiveTintColor: ACCENT_COLOR,
              drawerInactiveTintColor: "#333333",
              drawerActiveBackgroundColor: "#E8ECDD",
              drawerLabelStyle: {
                fontWeight: "500",
                fontSize: 16,
              },
              drawerStyle: {
                backgroundColor: "#FFFFFF",
                width: 280,
                borderTopRightRadius: 10,
                borderBottomRightRadius: 10,
                paddingTop: 10,
              },
              drawerItemStyle: {
                marginVertical: 2,
                borderRadius: 8,
                marginHorizontal: 5,
              },
            }}
          >
            {renderScreens()}
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  )
}

// Empty component for the separator
const EmptyComponent = () => null

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
