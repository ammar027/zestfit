import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../theme"
import HomeScreen from "./HomeScreen"
import DashboardScreen from "./DashboardScreen"
import GoalsEditorScreen from "./GoalsEditorScreen"
import ProfileScreen from "./ProfileScreen"
import TrackerScreen from "./TrackerScreen"
import { View, Text, StyleSheet, Pressable, Animated } from "react-native"
import { BlurView } from "expo-blur"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useEffect, useRef } from "react"
import { LinearGradient } from "expo-linear-gradient"

const Tab = createBottomTabNavigator()

type TabBarIconProps = {
  focused: boolean
  name: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
}

function TabBarIcon({ focused, name, color }: TabBarIconProps) {
  const scaleValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [focused])

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  )
}

type CustomTabBarProps = {
  state: any
  descriptors: any
  navigation: any
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: "transparent",
        },
      ]}
    >
      <View style={[styles.tabBarBackground, { borderColor: theme.colors.border }]}>
        <BlurView intensity={85} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.gradientOverlay} />
      </View>

      <View style={[styles.tabBar, { borderColor: theme.colors.border }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const label = route.name
          const isFocused = state.index === index

          let iconName: keyof typeof MaterialCommunityIcons.glyphMap
          if (route.name === "Home") {
            iconName = isFocused ? "home" : "home-outline"
          } else if (route.name === "Dashboard") {
            iconName = isFocused ? "chart-box" : "chart-box-outline"
          } else if (route.name === "Trackers") {
            iconName = isFocused ? "chart-line" : "chart-line-variant"
          } else if (route.name === "Goals") {
            iconName = isFocused ? "flag" : "flag-outline"
          } else if (route.name === "Profile") {
            iconName = isFocused ? "account" : "account-outline"
          } else {
            iconName = "circle-outline" // Fallback icon
          }

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <Pressable
              key={index}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, isFocused && styles.tabItemFocused, pressed && styles.tabItemPressed]}
              android_ripple={{
                color: "transparent",
                borderless: true,
                radius: 25,
              }}
            >
              {isFocused && <LinearGradient colors={[theme.colors.primary + "20", theme.colors.primary + "05"]} style={styles.activeTabBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}

              <TabBarIcon focused={isFocused} name={iconName} color={isFocused ? theme.colors.primary : theme.colors.subtext} />

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? theme.colors.primary : theme.colors.subtext,
                    fontWeight: isFocused ? "600" : "400",
                  },
                ]}
              >
                {label}
              </Text>

              {/* {isFocused && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />} */}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function AppNavigator() {
  const { theme } = useTheme()

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trackers" component={TrackerScreen} />
      <Tab.Screen name="Goals" component={GoalsEditorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    elevation: 0,
    height: 80,
    alignItems: "center",
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 8,
    marginHorizontal: 25,
    marginBottom: 8,
    height: 63,
    borderRadius: 24,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },
  tabItemFocused: {
    paddingBottom: 0,
    backgroundColor: "transparent",
    borderWidth: 0.1,
    borderColor: "darkgrey",
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  activeTabBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
})

export default AppNavigator
