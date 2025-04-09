import { AppTheme, ThemeColors } from "./types"

// Define color types for better TypeScript support
export type ColorScheme = "light" | "dark"

// Define the light theme colors
const lightColors: ThemeColors = {
  primary: "#34C759", // Nike Green
  background: "#FFFFFF", // White
  card: "#F2F2F7", // Light Gray
  text: "#1C1C1E", // Rich Black
  subtext: "#3A3A3C", // Neutral Gray
  border: "#D1D1D6", // Light Border
  notification: "#FF3B30", // Red
  success: "#34C759", // Green
  warning: "#FFCC00", // Yellow
  error: "#FF3B30", // Red
  statusBar: "#FFFFFF", // Status bar color
  input: {
    background: "#F9F9FB",
    text: "#1C1C1E",
    placeholder: "#8E8E93",
    border: "#D1D1D6",
  },
  button: {
    primary: {
      background: "#34C759",
      text: "#FFFFFF",
    },
    secondary: {
      background: "#E9E9EB",
      text: "#1C1C1E",
    },
    danger: "#FF3B30",
  },
  tabBar: {
    background: "rgba(242, 242, 247, 0.9)", // Semi-transparent card color
    active: "#34C759", // Primary color
    inactive: "#8E8E93", // Gray
    highlight: "rgba(52, 199, 89, 0.1)", // Light green background for selected tab
    border: "#D1D1D6",
  },
}

// Define the dark theme colors
const darkColors: ThemeColors = {
  primary: "#30D158", // Nike Green Dark
  background: "#0c0c12", // Deep Blue
  card: "#14141e", // Dark Gray
  text: "#FFFFFF", // White
  subtext: "#A1A1A6", // Cool Gray
  border: "#38383A", // Dark Border
  notification: "#FF453A", // Bright Red
  success: "#30D158", // Bright Green
  warning: "#FFD60A", // Bright Yellow
  error: "#FF453A", // Bright Red
  statusBar: "#0c0c12", // Status bar color
  input: {
    background: "#2C2C2E",
    text: "#FFFFFF",
    placeholder: "#8E8E93",
    border: "#38383A",
  },
  button: {
    primary: {
      background: "#30D158",
      text: "#FFFFFF",
    },
    secondary: {
      background: "#2C2C2E",
      text: "#FFFFFF",
    },
    danger: "#FF453A",
  },
  tabBar: {
    background: "rgba(28, 28, 30, 0.9)", // Semi-transparent dark card color
    active: "#30D158", // Primary color in dark
    inactive: "#8E8E93", // Gray
    highlight: "rgba(48, 209, 88, 0.15)", // Dark green background for selected tab
    border: "#38383A",
  },
}

// Export the complete themes
export const lightTheme: AppTheme = {
  dark: false,
  colors: lightColors,
}

export const darkTheme: AppTheme = {
  dark: true,
  colors: darkColors,
}
