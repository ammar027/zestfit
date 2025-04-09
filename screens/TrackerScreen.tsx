import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, KeyboardAvoidingView, Animated } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../theme"
import WaterTrackerScreen from "./WaterTrackerScreen"
import WeightTrackerScreen from "./WeightTrackerScreen"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from "@react-navigation/native"

export default function TrackerScreen() {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<"water" | "weight">("water")
  const navigation = useNavigation()

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.statusBar} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Trackers</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Monitor your daily progress</Text>
      </View>

      <View style={styles.tabOuterContainer}>
        <View style={[styles.tabContainer, { borderColor: theme.colors.border }]}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={theme.dark ? ["rgba(30,30,40,0.6)", "rgba(20,20,30,0.5)"] : ["rgba(255,255,255,0.8)", "rgba(250,250,255,0.7)"]} style={StyleSheet.absoluteFill} />

          <View
            style={[
              styles.tabIndicator,
              {
                left: activeTab === "water" ? 0 : "50%",
                backgroundColor: theme.colors.primary + "20",
              },
            ]}
          />

          <TouchableOpacity style={[styles.tab, activeTab === "water" && styles.activeTab]} onPress={() => setActiveTab("water")}>
            <MaterialCommunityIcons name="water" size={24} color={activeTab === "water" ? theme.colors.primary : theme.colors.text} />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "water" ? theme.colors.primary : theme.colors.text,
                  fontWeight: activeTab === "water" ? "600" : "400",
                },
              ]}
            >
              Water Intake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, activeTab === "weight" && styles.activeTab]} onPress={() => setActiveTab("weight")}>
            <MaterialCommunityIcons name="scale-bathroom" size={24} color={activeTab === "weight" ? theme.colors.primary : theme.colors.text} />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "weight" ? theme.colors.primary : theme.colors.text,
                  fontWeight: activeTab === "weight" ? "600" : "400",
                },
              ]}
            >
              Weight Log
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {activeTab === "water" ? <WaterTrackerScreen /> : <WeightTrackerScreen navigation={navigation} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  tabOuterContainer: {
    paddingHorizontal: 24,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 18,
    height: 60,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabIndicator: {
    position: "absolute",
    width: "50%",
    height: "100%",
    borderRadius: 18,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 1,
  },
  activeTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
})
