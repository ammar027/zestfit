import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Alert, Image, SafeAreaView, GestureResponderEvent, PanResponder } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format, addDays, subDays, isAfter, startOfWeek, getDay, isSameDay, isToday as isDateToday } from "date-fns"
// @ts-ignore - Ignoring type checking for third-party module
import CalendarPicker from "react-native-calendar-picker"
import { useTheme } from "../theme"
import { AppTheme } from "../theme/types"

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
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Top Row - Date and Controls */}
      <View style={styles.headerRow}>
        <View style={styles.dateDisplay}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>{monthDay}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.navigationButton, { backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]} onPress={handlePreviousWeek}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navigationButton,
            {
              backgroundColor: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              opacity: isNextWeekAvailable ? 1 : 0.5,
            },
          ]}
          onPress={handleNextWeek}
          disabled={!isNextWeekAvailable}
        >
          <MaterialCommunityIcons name="chevron-right" size={20} color={isNextWeekAvailable ? theme.colors.text : theme.colors.subtext} />
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: theme.colors.primary + "10" }]} onPress={() => handleDateChange(new Date())}>
            <Text style={[styles.controlButtonText, { color: theme.colors.primary }]}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Week View with swipe gesture support */}
      <View
        style={styles.weekContainer}
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
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                { width: buttonWidth - 2 },
                isSelected && {
                  backgroundColor: theme.colors.primary + "15",
                  borderColor: theme.colors.primary,
                  borderBottomWidth: 2,
                },
                isFuture && styles.futureDayButton,
              ]}
              onPress={() => !isFuture && handleWeekDateSelect(dayDate)}
              activeOpacity={isFuture ? 1 : 0.5}
              disabled={isFuture}
            >
              <Text style={[styles.dayNameText, { color: theme.colors.subtext }, isSelected && { color: theme.colors.primary }]}>{dayName}</Text>
              <Text style={[styles.dayNumText, { color: theme.colors.text }, isSelected && { color: theme.colors.primary, fontWeight: "bold" }, isDayToday && { fontWeight: "bold", color: theme.colors.primary }]}>{dayNum}</Text>
              {isDayToday && <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />}
              {/* {isFuture && <MaterialCommunityIcons name="lock-outline" size={10} color={theme.dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"} style={styles.futureIcon} />} */}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Enhanced Date Picker Modal */}
      <Modal transparent={true} animationType="slide" visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
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
                <CalendarPicker onDateChange={handleDateChange} selectedStartDate={date} maxDate={new Date()} selectedDayColor={theme.colors.primary} selectedDayTextColor="#FFFFFF" textStyle={{ color: theme.colors.text }} todayBackgroundColor={theme.colors.border} todayTextStyle={{ color: theme.colors.primary, fontWeight: "bold" }} width={Dimensions.get("window").width - 48} monthTitleStyle={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }} yearTitleStyle={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }} dayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]} />
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  yearDisplay: {
    alignItems: "center",
  },
  yearText: {
    fontSize: 14,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  weekNavigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navigationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  weekContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 0,
    paddingVertical: 2,
  },
  dayButton: {
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 1,
    paddingVertical: 6,
  },
  futureDayButton: {
    opacity: 0.5,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  futureDayText: {
    opacity: 0.5,
  },
  futureIcon: {
    position: "absolute",
    bottom: 7,
  },
  dayNameText: {
    fontSize: 13,
    marginBottom: 2,
  },
  dayNumText: {
    fontSize: 16,
    fontWeight: "500",
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
