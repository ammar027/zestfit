import React, { useEffect, useRef } from "react"
import { View, Text, Switch, StyleSheet, TouchableOpacity, Platform, Animated } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../theme"

type ThemeToggleProps = {
  containerStyle?: any
  labelStyle?: any
  compact?: boolean // For a more compact version of the toggle
  showIcons?: boolean // Option to show sun/moon icons
}

export const ThemeToggle = ({ containerStyle, labelStyle, compact = false, showIcons = true }: ThemeToggleProps) => {
  const { theme, colorScheme, toggleColorScheme } = useTheme()
  const spinValue = useRef(new Animated.Value(0)).current

  // Trigger spin animation when theme changes
  useEffect(() => {
    Animated.timing(spinValue, {
      toValue: colorScheme === "dark" ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [colorScheme, spinValue])

  // Create the rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  })

  if (compact) {
    return (
      <TouchableOpacity
        onPress={toggleColorScheme}
        style={[
          styles.compactContainer,
          {
            backgroundColor: theme.dark ? theme.colors.card : "rgba(255, 255, 255, 0.8)",
            shadowColor: theme.colors.text,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
          },
          containerStyle,
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialCommunityIcons name={colorScheme === "dark" ? "weather-night" : "white-balance-sunny"} size={24} color={colorScheme === "dark" ? theme.colors.accent : theme.colors.primary} />
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text,
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 0,
          borderWidth: 1,
        },
        containerStyle,
      ]}
    >
      <View style={styles.labelContainer}>
        {showIcons && (
          <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 10 }}>
            <MaterialCommunityIcons name={colorScheme === "dark" ? "weather-night" : "white-balance-sunny"} size={24} color={colorScheme === "dark" ? theme.colors.primary : theme.colors.accent} />
          </Animated.View>
        )}
        {/* <Text style={[styles.label, { color: theme.colors.text }, labelStyle]}>{colorScheme === "dark" ? "Dark Mode" : "Light Mode"}</Text> */}
      </View>
      <Switch
        value={colorScheme === "dark"}
        onValueChange={toggleColorScheme}
        trackColor={{
          false: Platform.OS === "ios" ? "#E9E9EA" : "rgba(0,0,0,0.1)",
          true: theme.colors.input.background,
        }}
        thumbColor={Platform.OS === "ios" ? "#FFFFFF" : colorScheme === "dark" ? theme.colors.primary : "#FFFFFF"}
        ios_backgroundColor="#E9E9EA"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginVertical: 8,
  },
  compactContainer: {
    padding: 10,
    borderRadius: 30,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ThemeToggle
