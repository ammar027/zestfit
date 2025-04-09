import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Animated, BackHandler } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useRoute } from "@react-navigation/native"
import { useTheme } from "../theme"
import { useToast } from "../utils/toast"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

// Define the type for route params
type WelcomeScreenParams = {
  onLoginPress: () => void
  onContinuePress: () => void
}

export default function WelcomeScreen() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const route = useRoute()
  const params = route.params as WelcomeScreenParams
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

  const handleContinueWithoutLogin = () => {
    showToast("Welcome to ZestFit! You can sign in anytime from your profile.", "info", 5000)
    if (params?.onContinuePress) {
      params.onContinuePress()
    }
  }

  const handleLogin = () => {
    if (params?.onLoginPress) {
      params.onLoginPress()
    }
  }

  // Define features with proper types
  const features = [
    {
      icon: "food-apple-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
      title: "Nutrition Tracking",
      description: "Track your daily meals and nutrition intake with ease",
      animValue: featureAnimValues[0],
      color: "#FF6B6B",
    },
    {
      icon: "water-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
      title: "Water Monitoring",
      description: "Stay hydrated with our water consumption tracker",
      animValue: featureAnimValues[1],
      color: "#3498db",
    },
    {
      icon: "scale-bathroom" as keyof typeof MaterialCommunityIcons.glyphMap,
      title: "Weight Tracking",
      description: "Monitor your weight and body measurements over time",
      animValue: featureAnimValues[2],
      color: "#4ECDC4",
    },
    {
      icon: "chart-line" as keyof typeof MaterialCommunityIcons.glyphMap,
      title: "Progress Analytics",
      description: "Visualize your journey with detailed charts and insights",
      animValue: featureAnimValues[3],
      color: "#FFA726",
    },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />

      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Image source={theme.dark ? require("../assets/icons/adaptive-icon-dark.png") : require("../assets/icons/adaptive-icon.png")} style={styles.logo} resizeMode="contain" />
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
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: feature.animValue }],
                },
              ]}
            >
              <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.blurContainer, { borderColor: theme.colors.border }]}>
                <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={styles.featureGradient}>
                  <View style={styles.featureIconContainer}>
                    <LinearGradient colors={[`${feature.color}20`, `${feature.color}10`]} style={styles.iconGradient}>
                      <MaterialCommunityIcons name={feature.icon} size={28} color={feature.color} />
                    </LinearGradient>
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDescription, { color: theme.colors.subtext }]}>{feature.description}</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonsContainer, { opacity: buttonFadeAnim }]}>
        <TouchableOpacity onPress={handleLogin} activeOpacity={0.7} style={styles.buttonWrapper}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={styles.buttonBlurContainer}>
            <LinearGradient colors={[theme.colors.primary, `${theme.colors.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, styles.loginButton]}>
              <MaterialCommunityIcons name="account" size={22} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.loginButtonText}>Sign In / Create Account</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContinueWithoutLogin} activeOpacity={0.7} style={styles.buttonWrapper}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={[styles.buttonBlurContainer, { borderColor: theme.colors.border }]}>
            <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]} style={[styles.button, styles.skipButton]}>
              <Text style={[styles.skipButtonText, { color: theme.colors.text }]}>Continue Without Login</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  featureCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blurContainer: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
  },
  featureGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  featureIconContainer: {
    marginRight: 6,
  },
  iconGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
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
  buttonWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  buttonBlurContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
  },
  skipButton: {
    borderWidth: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
