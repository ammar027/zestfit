import { NavigatorScreenParams } from "@react-navigation/native"

export type RootStackParamList = {
  "Welcome": undefined
  "Home": undefined
  "Auth": undefined
  "Profile": undefined
  "Daily Goals Editor": undefined
  "Weight Tracker": undefined
  "Water Tracker": undefined
  "Dashboard": undefined
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
