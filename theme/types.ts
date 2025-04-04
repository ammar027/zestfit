export interface ThemeColors {
  primary: string
  background: string
  card: string
  text: string
  subtext: string
  border: string
  notification: string
  success: string
  warning: string
  error: string
  statusBar: string
  input: {
    background: string
    text: string
    placeholder: string
    border: string
  }
  button: {
    primary: {
      background: string
      text: string
    }
    secondary: {
      background: string
      text: string
    }
    danger?: string
  }
  tabBar: {
    background: string
    active: string
    inactive: string
    highlight: string
    border?: string
  }
}

export interface AppTheme {
  dark: boolean
  colors: ThemeColors
}
