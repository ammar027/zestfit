import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useTheme } from "../theme"
import HomeScreen from "../screens/HomeScreen"
import DashboardScreen from "../screens/DashboardScreen"
import GoalsEditorScreen from "../screens/GoalsEditorScreen"
import ProfileScreen from "../screens/ProfileScreen"

const Tab = createBottomTabNavigator()

function AppNavigator() {
  const { theme } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Dashboard") {
            iconName = focused ? "chart-bar" : "chart-bar-stacked"
          } else if (route.name === "Goals") {
            iconName = focused ? "flag" : "flag-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "account" : "account-outline"
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Goals" component={GoalsEditorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default AppNavigator
