import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Animated, BackHandler } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { DrawerNavigationProp } from "@react-navigation/drawer"
import { RootStackParamList } from "../types/navigation"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CommonActions } from "@react-navigation/native"
import { useTheme } from "../theme"
import { useToast } from "../utils/toast"

type WelcomeScreenNavigationProp = DrawerNavigationProp<RootStackParamList, "Welcome">

export default function WelcomeScreen() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const navigation = useNavigation<WelcomeScreenNavigationProp>()
  const screenWidth = Dimensions.get("window").width

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const buttonFadeAnim = useRef(new Animated.Value(0)).current
  const featureAnimValues = useRef([new Animated.Value(40), new Animated.Value(40), new Animated.Value(40), new Animated.Value(40)]).current

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
        // Staggered animation for features
        Animated.stagger(150, [
          Animated.timing(featureAnimValues[0], {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimValues[1], {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimValues[2], {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimValues[3], {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
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
  }, [fadeAnim, slideAnim, buttonFadeAnim, featureAnimValues])

  const handleContinueWithoutLogin = async () => {
    try {
      // Mark that the welcome screen has been shown
      await AsyncStorage.setItem("HAS_SEEN_WELCOME", "true")

      // Force a complete navigation stack reset to prevent back navigation
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      })

      // Show success toast
      showToast("Welcome to ZestFit! You can sign in anytime from your profile.", "info", 5000)

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />

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
        <Text style={[styles.welcomeDescription, { color: theme.colors.subtext }]}>Your personal health and fitness companion to help you achieve your wellness goals</Text>

        <View style={styles.featuresContainer}>
          {[
            {
              icon: "food-apple",
              title: "Nutrition Tracking",
              description: "Track your daily meals and nutrition intake with ease",
              animValue: featureAnimValues[0],
            },
            {
              icon: "water",
              title: "Water Monitoring",
              description: "Stay hydrated with our water consumption tracker",
              animValue: featureAnimValues[1],
            },
            {
              icon: "scale-bathroom",
              title: "Weight Tracking",
              description: "Monitor your weight and body measurements over time",
              animValue: featureAnimValues[2],
            },
            {
              icon: "chart-line",
              title: "Progress Analytics",
              description: "Visualize your journey with detailed charts and insights",
              animValue: featureAnimValues[3],
            },
          ].map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureItem,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.text,
                  opacity: fadeAnim,
                  transform: [{ translateY: feature.animValue }],
                },
              ]}
            >
              <MaterialCommunityIcons name={feature.icon} size={28} color={theme.colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: theme.colors.subtext }]}>{feature.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonsContainer, { opacity: buttonFadeAnim }]}>
        <TouchableOpacity style={[styles.button, styles.loginButton, { backgroundColor: theme.colors.button.primary }]} onPress={handleLogin} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account" size={22} color={theme.colors.button.text} style={styles.buttonIcon} />
          <Text style={[styles.loginButtonText, { color: theme.colors.button.text }]}>Sign In / Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.skipButton,
            {
              backgroundColor: theme.colors.button.secondary,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleContinueWithoutLogin}
          activeOpacity={0.8}
        >
          <Text style={[styles.skipButtonText, { color: theme.colors.text }]}>Continue Without Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  welcomeDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginHorizontal: 12,
    marginBottom: 16,
    fontWeight: "500",
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    elevation: 2,
  },
  featureTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
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
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skipButton: {
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
