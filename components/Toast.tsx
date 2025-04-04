import React, { useRef, useEffect } from "react"
import { View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "../theme"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  duration?: number
  onDismiss: () => void
}

const getIconName = (type: ToastType) => {
  switch (type) {
    case "success":
      return "check-circle"
    case "error":
      return "alert-circle"
    case "warning":
      return "alert"
    case "info":
    default:
      return "information"
  }
}

export const Toast = ({ visible, message, type = "info", duration = 3000, onDismiss }: ToastProps) => {
  const { theme } = useTheme()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Auto dismiss after duration
      timeout = setTimeout(() => {
        dismiss()
      }, duration)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [visible, duration])

  const dismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss()
    })
  }

  // Don't render anything if not visible
  if (!visible) return null

  // Get color based on type
  const getColor = () => {
    switch (type) {
      case "success":
        return theme.colors.success
      case "error":
        return theme.colors.error
      case "warning":
        return theme.colors.warning
      case "info":
      default:
        return theme.colors.primary
    }
  }

  const color = getColor()
  const iconName = getIconName(type)

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: theme.dark ? theme.colors.card : "#FFFFFF",
            opacity: fadeAnim,
            transform: [{ translateY }],
            shadowColor: theme.colors.text,
            shadowOpacity: theme.dark ? 0.3 : 0.1,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons name={iconName} size={24} color={color} />
          <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={2}>
            {message}
          </Text>
          <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: color,
              width: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
    padding: 16,
  },
  toast: {
    width: "92%",
    minHeight: 60,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  dismissButton: {
    marginLeft: 12,
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
})

export default Toast
