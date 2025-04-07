import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer"
import { StyleSheet, BackHandler, View, Animated, Platform, StatusBar, useColorScheme, Image } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
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
import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "./utils/supabaseClient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { BlurView } from "expo-blur"
import { ThemeProvider, useTheme } from "./theme"
import { ToastProvider } from "./utils/toast"
import PersonalInfoScreen from "./screens/PersonalInfoScreen"
import FitnessInfoScreen from "./screens/FitnessInfoScreen"
import { AppTheme } from "./theme/types"
import { Text, Pressable } from "react-native"

// Create a Drawer Navigator instead of Tab Navigator
const Drawer = createDrawerNavigator()
const Stack = createStackNavigator()

// Create a context for managing authentication state
export const AuthContext = React.createContext({
  isLoggedIn: false,
  setIsLoggedIn: (value: boolean) => {},
})

// Custom Drawer Content component with animations and modern styling
function CustomDrawerContent(props: any) {
  const { theme } = useTheme()
  const { isLoggedIn } = React.useContext(AuthContext)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.drawerLogoContainer, { backgroundColor: theme.colors.primary + "20" }]}>
          <Image source={theme.dark ? require("./assets/icons/adaptive-icon-dark.png") : require("./assets/icons/adaptive-icon.png")} style={{ width: 140, height: 140 }} resizeMode="contain" />
        </View>
        {/* <Text style={[styles.drawerTitle, { color: theme.colors.text }]}>ZestFit</Text>*/}
        <Text style={[styles.drawerSubtitle, { color: theme.colors.subtext }]}>Stay Healthy, Stay Fit</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={{ marginTop: 16, paddingHorizontal: 10 }}>
          {props.state.routes.map((route: any, index: number) => {
            const { title, drawerIcon } = props.descriptors[route.key].options
            const focused = index === props.state.index
            const color = focused ? theme.colors.primary : theme.colors.text

            return (
              <Pressable
                key={route.key}
                onPress={() => props.navigation.navigate(route.name)}
                style={({ pressed }) => [
                  styles.drawerItem,
                  {
                    backgroundColor: focused ? theme.colors.primary + "20" : pressed ? theme.colors.card : "transparent",
                  },
                ]}
              >
                {drawerIcon && drawerIcon({ color, size: 24, focused })}
                <Text
                  style={[
                    styles.drawerItemText,
                    {
                      color: focused ? theme.colors.primary : theme.colors.text,
                      fontWeight: focused ? "600" : "400",
                    },
                  ]}
                >
                  {title}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <Text style={[styles.drawerFooterText, { color: theme.colors.subtext }]}>v1.0.0 • ZestFit 2025</Text>
      </View>
    </SafeAreaView>
  )
}

// Custom Drawer Item with animation
function AnimatedDrawerItem({ label, iconName, focused, onPress, theme }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.drawerItem,
        {
          backgroundColor: focused ? theme.colors.primary + "20" : pressed ? theme.colors.card : "transparent",
        },
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={24} color={focused ? theme.colors.primary : theme.colors.text} />
      <Text
        style={[
          styles.drawerItemText,
          {
            color: focused ? theme.colors.primary : theme.colors.text,
            fontWeight: focused ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

// Main drawer navigation
function DrawerNavigator() {
  const { isLoggedIn } = React.useContext(AuthContext)
  const { theme } = useTheme()

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        drawerStyle: {
          width: "75%",
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
        swipeEdgeWidth: 50,
        drawerLabelStyle: {
          marginLeft: -20,
        },
        overlayColor: theme.dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)",
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Goals"
        component={GoalsEditorScreen}
        options={{
          title: "Goals",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name="clipboard-list" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Water"
        component={WaterTrackerScreen}
        options={{
          title: "Water Tracker",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name="water" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Weight"
        component={WeightTrackerScreen}
        options={{
          title: "Weight Tracker",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name="scale-bathroom" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={isLoggedIn ? ProfileScreen : AuthScreen}
        options={{
          title: isLoggedIn ? "Profile" : "Sign In",
          drawerIcon: ({ focused, color }) => <MaterialCommunityIcons name={isLoggedIn ? "account" : "login"} size={24} color={color} />,
        }}
      />
    </Drawer.Navigator>
  )
}

// Create screen stacks for modals and full-screen flows
function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DrawerMain" component={DrawerNavigator} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="FitnessInfo" component={FitnessInfoScreen} />
    </Stack.Navigator>
  )
}

// Main navigation structure
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={RootStack} />
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
              routes: [{ name: "Root" }],
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
            routes: [{ name: "Root" }],
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
                if (currentRoute.name === "Root" && firstTimeRef.current && hasSeenWelcome === false) {
                  // Completely reset navigation stack to fix any history issues
                  setTimeout(() => {
                    navigationRef.current.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: "Root" }],
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
            <Stack.Navigator screenOptions={{ headerShown: false }}>{hasSeenWelcome === false ? <Stack.Screen name="Welcome" component={WelcomeScreen} /> : <Stack.Screen name="Root" component={MainNavigator} />}</Stack.Navigator>
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

// Updated styles with drawer-specific styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  drawerLogoContainer: {
    width: 90,
    height: 90,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  drawerSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingLeft: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  drawerItemText: {
    fontSize: 15,
    marginLeft: 16,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  drawerFooterText: {
    fontSize: 12,
  },
})
