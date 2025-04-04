import { useMemo } from "react"
import { StyleSheet } from "react-native"
import { useTheme } from "./ThemeContext"
import { AppTheme } from "./types"

// Type to allow functions that take a theme and return styles
type StylesFunction<T> = (theme: AppTheme) => T

/**
 * A hook that generates themed styles
 * @param stylesCreator Function that creates styles based on theme
 * @returns Memoized styles
 */
export function useThemedStyles<T>(stylesCreator: StylesFunction<T>): T {
  const { theme } = useTheme()

  // Memoize the styles to avoid recreating them on every render
  const styles = useMemo(() => {
    return stylesCreator(theme)
  }, [theme, stylesCreator])

  return styles
}

/**
 * Helper function to create themed stylesheets
 * @param stylesCreator Function that creates styles based on theme
 * @returns Function that creates StyleSheet with theme
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(stylesCreator: (theme: AppTheme) => T): StylesFunction<T> {
  return (theme: AppTheme) => StyleSheet.create(stylesCreator(theme))
}
