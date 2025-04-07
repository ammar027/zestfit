import { NavigatorScreenParams } from "@react-navigation/native"

export type TrackerStackParamList = {
  TrackerHome: undefined
  WaterTracker: undefined
}

export type AuthStackParamList = {
  AuthScreen: undefined
}

export type TabParamList = {
  Home: undefined
  Goals: undefined
  Dashboard: undefined
  Trackers: NavigatorScreenParams<TrackerStackParamList>
  Profile: undefined
}

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>
  Auth: NavigatorScreenParams<AuthStackParamList>
}

export type RootStackParamList = {
  Welcome: undefined
  Main: NavigatorScreenParams<MainStackParamList>
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
