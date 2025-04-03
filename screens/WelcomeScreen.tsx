import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Animated, BackHandler } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { DrawerNavigationProp } from "@react-navigation/drawer"
import { RootStackParamList } from "../types/navigation"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"

type WelcomeScreenNavigationProp = DrawerNavigationProp<RootStackParamList, "Welcome">

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>()
  const screenWidth = Dimensions.get("window").width

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const buttonFadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Prevent going back with hardware back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Always return true to prevent default back behavior
      return true
    })

    // Cleanup
    return () => backHandler.remove()
  }, [fadeAnim, slideAnim, buttonFadeAnim])

  const handleContinueWithoutLogin = async () => {
    try {
      // Mark that the welcome screen has been shown
      await AsyncStorage.setItem("HAS_SEEN_WELCOME", "true")

      // Force a complete navigation stack reset to prevent back navigation
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      })

      // Additional safety measure - delay a bit and reset again to ensure clean slate
      setTimeout(() => {
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Home" }],
            }),
          )
        } catch (e) {
          console.error("Error in delayed navigation reset:", e)
        }
      }, 300)
    } catch (error) {
      console.error("Error navigating from welcome screen:", error)
      // Fallback navigation if there's an error
      navigation.navigate("Home")
    }
  }

  const handleLogin = async () => {
    try {
      // Mark that the welcome screen has been shown
      await AsyncStorage.setItem("HAS_SEEN_WELCOME", "true")

      // Force a complete navigation stack reset to prevent back navigation
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })

      // Additional safety measure - delay a bit and reset again to ensure clean slate
      setTimeout(() => {
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            }),
          )
        } catch (e) {
          console.error("Error in delayed navigation reset:", e)
        }
      }, 300)
    } catch (error) {
      console.error("Error navigating from welcome screen:", error)
      // Fallback navigation if there's an error
      navigation.navigate("Auth")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Image source={require("../assets/icons/adaptive-icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* <Text style={styles.welcomeTitle}>Welcome to ZestFit!</Text> */}
        <Text style={styles.welcomeDescription}>Your personal health and fitness companion to help you achieve your wellness goals</Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="food-apple" size={28} color="#2C3F00" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Nutrition Tracking</Text>
              <Text style={styles.featureDescription}>Track your daily meals and nutrition intake with ease</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="water" size={28} color="#2C3F00" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Water Monitoring</Text>
              <Text style={styles.featureDescription}>Stay hydrated with our water consumption tracker</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="scale-bathroom" size={28} color="#2C3F00" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Weight Tracking</Text>
              <Text style={styles.featureDescription}>Monitor your weight and body measurements over time</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="chart-line" size={28} color="#2C3F00" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Progress Analytics</Text>
              <Text style={styles.featureDescription}>Visualize your journey with detailed charts and insights</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonsContainer, { opacity: buttonFadeAnim }]}>
        <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleLogin} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account" size={22} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.loginButtonText}>Sign In / Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={handleContinueWithoutLogin} activeOpacity={0.8}>
          <Text style={styles.skipButtonText}>Continue Without Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  header: {
    alignItems: "center",
    paddingTop: 48,
    marginBottom: 0,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: -60,
    marginTop: -50,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left",
    marginBottom: 7,
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#666",
    fontWeight: "semibold",
    textAlign: "center",
    lineHeight: 24,
    marginHorizontal: 12,
    marginBottom: 7,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#DFE1E6",
  },
  featureTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  buttonsContainer: {
    padding: 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#2C3F00",
    flexDirection: "row",
  },
  skipButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE1E6",
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButtonText: {
    color: "#2C3F00",
    fontSize: 16,
    fontWeight: "500",
  },
})
