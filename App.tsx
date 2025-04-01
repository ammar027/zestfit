import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import HomeScreen from "./screens/HomeScreen";
import GoalsEditorScreen from "./screens/GoalsEditorScreen";
import WeightTrackerScreen from "./screens/WeightTrackerScreen";
import WaterTrackerScreen from "./screens/WaterTrackerScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <Toaster />
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="Daily Goals Editor" component={GoalsEditorScreen} />
          <Drawer.Screen name="Weight Tracker" component={WeightTrackerScreen} />
          <Drawer.Screen name="Water Tracker" component={WaterTrackerScreen} />
          <Drawer.Screen name="Dashboard" component={DashboardScreen} />
          <Drawer.Screen name="Auth" component={AuthScreen} />
          <Drawer.Screen name="Profile" component={ProfileScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});