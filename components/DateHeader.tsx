import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert, Image, SafeAreaView, GestureResponderEvent, PanResponder } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format, addDays, subDays, isAfter, startOfWeek, getDay, isSameDay, isToday as isDateToday } from "date-fns"
// @ts-ignore - Ignoring type checking for third-party module
import CalendarPicker from "react-native-calendar-picker"
import { useTheme } from "../theme"
import { AppTheme } from "../theme/types"
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"

interface DateHeaderProps {
  date: Date
  onDateChange?: (date: Date) => void
  setDate?: (date: Date) => void
}

export default function DateHeader({ date, onDateChange, setDate }: DateHeaderProps) {
  const { theme } = useTheme()
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(date))
  const navigation = useNavigation<NavigationProp<ParamListBase>>()

  // Calculate the week dates when the week start date changes
  useEffect(() => {
    generateWeekDates(weekStartDate)
  }, [weekStartDate])

  // Update week start date when selected date changes to a different week
  useEffect(() => {
    const currentWeekStart = startOfWeek(date)
    if (!isSameDay(currentWeekStart, weekStartDate)) {
      setWeekStartDate(currentWeekStart)
    }
  }, [date])

  // Function to check if a date is in the future
  const isFutureDate = (dateToCheck: Date) => {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return isAfter(dateToCheck, today)
  }

  // Generate array of dates for the week view - Sunday to Saturday
  const generateWeekDates = (weekStart: Date) => {
    const dates: Date[] = []

    // Generate 7 days from Sunday to Saturday - including future dates
    for (let i = 0; i < 7; i++) {
      const dayToAdd = addDays(weekStart, i)
      dates.push(dayToAdd)
    }

    // Always show the full week, including future dates
    setWeekDates(dates)
  }

  // Function to handle date changes, works with either prop
  const updateDate = (newDate: Date) => {
    // Validate the date isn't in the future
    if (isFutureDate(newDate)) {
      Alert.alert("Invalid Date", "You cannot select a future date.", [{ text: "OK", style: "cancel" }])
      return false
    }

    // Update the date through the appropriate prop
    if (onDateChange) {
      onDateChange(newDate)
    } else if (setDate) {
      setDate(newDate)
    }

    return true
  }

  const handleDateChange = (selectedDate: Date) => {
    // If date update was successful, close the modal
    if (updateDate(selectedDate)) {
      setDatePickerVisible(false)
    }
  }

  // Handle selecting a date from the week view
  const handleWeekDateSelect = (selectedDate: Date) => {
    updateDate(selectedDate)
  }

  const handlePreviousWeek = () => {
    // Go to the previous week without changing the selected date
    if (weekDates.length > 0) {
      // Navigate to previous week
      const previousWeekStart = subDays(weekStartDate, 7)
      setWeekStartDate(previousWeekStart)
    }
  }

  const handleNextWeek = () => {
    // Don't allow navigating to future weeks if all days are in the future
    if (weekDates.length === 0) return

    // Calculate next week's start date
    const nextWeekStart = addDays(weekStartDate, 7)

    // If the entire next week is in the future, don't allow navigation
    if (isFutureDate(nextWeekStart)) {
      return
    }

    // Navigate to next week
    setWeekStartDate(nextWeekStart)
  }

  // Check if we can go to next week - if there's at least one valid date
  const isNextWeekAvailable = weekDates.length > 0 && !isFutureDate(addDays(weekStartDate, 7))

  // Format the date for the header
  const formattedDate = format(date, "MMMM yyyy")
  const monthDay = format(date, "MMM d")

  // Day abbreviations - single letter for maximum compactness
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"]

  // Calculate width for day buttons based on screen width to ensure they fit
  const screenWidth = Dimensions.get("window").width
  const buttonWidth = (screenWidth - 56) / 7 // 56px for padding and margins

  // Simpler swipe handling
  const handleTouchMove = (e: GestureResponderEvent, startX: number) => {
    const currentX = e.nativeEvent.pageX
    const deltaX = currentX - startX

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Right swipe - go to previous week
        handlePreviousWeek()
        return true
      } else if (isNextWeekAvailable) {
        // Left swipe - go to next week if available
        handleNextWeek()
        return true
      }
    }
    return false
  }

  return (
    <View style={styles.container}>
      {/* Date Header Card */}
      <View style={[styles.dateHeaderCard, {}]}>
       
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <MaterialCommunityIcons name="menu" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateButton, { borderColor: theme.colors.border, borderWidth: 0.5 }]} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>{format(date, "MMM d")}</Text>
            </TouchableOpacity>

            <View style={styles.navigationContainer}>
              <TouchableOpacity style={styles.navigationButton} onPress={handlePreviousWeek}>
                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.navigationButton, { opacity: isNextWeekAvailable ? 1 : 0.5 }]} onPress={handleNextWeek} disabled={!isNextWeekAvailable}>
                <MaterialCommunityIcons name="chevron-right" size={20} color={isNextWeekAvailable ? theme.colors.text : theme.colors.subtext} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.todayButton, { borderColor: theme.colors.border, borderWidth: 0.5 }]} onPress={() => handleDateChange(new Date())}>
              <Text style={[styles.todayButtonText, { color: theme.colors.primary }]}>Today</Text>
            </TouchableOpacity>
          </View>
      </View>

      {/* Week View Card */}
      <LinearGradient
        colors={theme.dark ? ["rgba(30,30,40,0.8)", "rgba(20,20,30,0.75)"] : ["rgba(255,255,255,0.9)", "rgba(250,250,255,0.85)"]}
        style={[styles.weekCard, { borderColor: theme.colors.border }]}
        onTouchStart={(e) => {
          ;(e.currentTarget as any).startX = e.nativeEvent.pageX
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any).startX
          if (startX) {
            handleTouchMove(e, startX)
            delete (e.currentTarget as any).startX
          }
        }}
      >
        {weekDates.map((dayDate, index) => {
          const dayNum = format(dayDate, "d")
          const dayName = dayNames[getDay(dayDate)]
          const isSelected = isSameDay(dayDate, date)
          const isDayToday = isDateToday(dayDate)
          const isFuture = isFutureDate(dayDate)

          return (
            <TouchableOpacity key={index} style={[styles.dayButton, { width: buttonWidth - 2 }, isSelected && styles.selectedDayButton, isFuture && styles.futureDayButton, { backgroundColor: isSelected ? theme.colors.primary + "15" : "transparent", borderColor: theme.colors.border }]} onPress={() => !isFuture && handleWeekDateSelect(dayDate)} activeOpacity={isFuture ? 1 : 0.7} disabled={isFuture}>
              <Text
                style={[
                  styles.dayNameText,
                  {
                    color: isSelected ? theme.colors.primary : theme.colors.subtext,
                  },
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumText,
                  {
                    color: isSelected ? theme.colors.primary : theme.colors.text,
                  },
                ]}
              >
                {dayNum}
              </Text>
              {isDayToday && <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />}
            </TouchableOpacity>
          )
        })}
      </LinearGradient>

      {/* Enhanced Date Picker Modal */}
      <Modal transparent={true} statusBarTranslucent animationType="slide" visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="chevron-down" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date</Text>
                <TouchableOpacity style={[styles.modalTodayButton]} onPress={() => handleDateChange(new Date())}>
                  <Text style={[styles.modalTodayButtonText, { color: theme.colors.primary }]}>Today</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarContainer}>
                <CalendarPicker onDateChange={handleDateChange} selectedStartDate={date} maxDate={new Date()} selectedDayColor={theme.colors.primary} selectedDayTextColor="#FFFFFF" textStyle={{ color: theme.colors.text }} todayBackgroundColor={theme.colors.border} todayTextStyle={{ color: theme.colors.secondary, fontWeight: "bold" }} width={Dimensions.get("window").width - 48} monthTitleStyle={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }} yearTitleStyle={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }} dayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]} />
              </View>

              <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.colors.primary }]} onPress={() => setDatePickerVisible(false)}>
                <Text style={[styles.applyButtonText, { color: theme.colors.button.text }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 19,
    paddingTop: 12,
    gap: 10,
  },
  gradientOverlay: {
    borderRadius: 17,
    padding: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    marginRight: 0,
  },
  dateHeaderCard: {
    padding: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    right: 25,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  navigationContainer: {
    flexDirection: "row",
    gap: 4,
  },
  navigationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 20,
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  weekCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
    borderRadius: 17,
    borderWidth: 1,
  },
  dayButton: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 1,
    borderRadius: 13,
    paddingVertical: 15,
  },
  selectedDayButton: {
    borderColor: "transparent",
    borderWidth: 1,
  },
  futureDayButton: {
    opacity: 0.5,
  },
  dayNameText: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: "500",
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: "600",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    paddingBottom: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  modalTodayButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalTodayButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calendarContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  applyButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
