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
  Chat: undefined
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
  Tabs: { updatedProfile?: ProfileData }
  Auth: undefined
  Trackers: undefined
  WaterTracker: undefined
  PersonalDetails: { userId: string | null; profile: ProfileData }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type ProfileData = {
  full_name: string
  username: string
  age: string
  height: string
  weight: string
  gender: string
  goal: string
  activity_level: string
  medical_conditions: string
  avatar_url: string | null
}
