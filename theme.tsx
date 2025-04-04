import React, { createContext, useState, useContext, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance } from "react-native"

// Re-export everything from theme directory
export * from "./theme/colors"
export * from "./theme/ThemeContext"
export * from "./theme/useThemedStyles"

// Import directly for use in this file
import { AppTheme, ColorScheme, lightTheme, darkTheme } from "./theme/colors"

// Define the theme context
export const ThemeContext = createContext<{
  theme: AppTheme
  colorScheme: ColorScheme
  isThemeLoaded: boolean
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}>({
  theme: lightTheme,
  colorScheme: "light",
  isThemeLoaded: false,
  setColorScheme: () => {},
  toggleColorScheme: () => {},
})

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system color scheme
  const deviceColorScheme = useColorScheme() as ColorScheme
  const defaultColorScheme: ColorScheme = deviceColorScheme || "light"

  // State for user-selected color scheme
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme)
  const [isThemeLoaded, setIsThemeLoaded] = useState(false)

  // Get theme based on color scheme
  const theme = colorScheme === "dark" ? darkTheme : lightTheme

  // Load saved theme preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("colorScheme")
        if (savedTheme) {
          setColorScheme(savedTheme as ColorScheme)
        } else {
          // If no saved theme, use system preference
          setColorScheme(defaultColorScheme)
        }
      } catch (error) {
        console.error("Error loading theme preference:", error)
      } finally {
        setIsThemeLoaded(true)
      }
    }

    loadSavedTheme()
  }, [defaultColorScheme])

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem("colorScheme", colorScheme)
      } catch (error) {
        console.error("Error saving theme preference:", error)
      }
    }

    if (isThemeLoaded) {
      saveThemePreference()
    }
  }, [colorScheme, isThemeLoaded])

  // Handle system color scheme changes
  useEffect(() => {
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      // Only automatically change if user hasn't manually set a preference
      const autoChangeWithSystem = async () => {
        try {
          const hasUserPreference = await AsyncStorage.getItem("userPreference")
          if (!hasUserPreference && newColorScheme) {
            setColorScheme(newColorScheme as ColorScheme)
          }
        } catch (error) {
          console.error("Error checking user theme preference:", error)
        }
      }

      autoChangeWithSystem()
    })

    // Clean up listener on unmount
    return () => {
      subscription.remove()
    }
  }, [])

  // Function to toggle between light and dark
  const toggleColorScheme = async () => {
    const newScheme = colorScheme === "light" ? "dark" : "light"
    setColorScheme(newScheme)

    // Mark that user has manually set a preference
    try {
      await AsyncStorage.setItem("userPreference", "true")
    } catch (error) {
      console.error("Error saving user theme preference:", error)
    }
  }

  // Function to set specific color scheme
  const handleSetColorScheme = async (scheme: ColorScheme) => {
    setColorScheme(scheme)

    // Mark that user has manually set a preference
    try {
      await AsyncStorage.setItem("userPreference", "true")
    } catch (error) {
      console.error("Error saving user theme preference:", error)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        isThemeLoaded,
        setColorScheme: handleSetColorScheme,
        toggleColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext)
