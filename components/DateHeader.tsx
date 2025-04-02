import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Dimensions,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, subDays, isAfter } from 'date-fns';
import CalendarPicker from 'react-native-calendar-picker';

export default function DateHeader({ 
  date, 
  onDateChange, 
  onDrawerPress 
}) {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const handleDateChange = (selectedDate) => {
    // Check if the selected date is a future date
    if (isAfter(selectedDate, new Date())) {
      // Show an alert if the user tries to select a future date
      Alert.alert(
        'Invalid Date', 
        'You cannot select a future date.', 
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    // If not a future date, proceed with date change
    onDateChange(selectedDate);
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {/* Drawer Menu Button */}
        <TouchableOpacity 
          onPress={onDrawerPress} 
          style={styles.drawerButton}
        >
          <MaterialCommunityIcons 
            name="menu" 
            size={28} 
            color="#333" 
          />
        </TouchableOpacity>

        {/* Date Display with Press Functionality */}
        <TouchableOpacity 
          style={styles.dateContainer}
          onPress={() => setDatePickerVisible(true)}
        >
          {/* Calendar Icon */}
          <MaterialCommunityIcons 
            name="calendar" 
            size={24} 
            color="#ff3b30" 
            style={styles.calendarIcon}
          />

          {/* Full Date Text */}
          <Text style={styles.dateText}>
            {format(date, 'MMMM d, yyyy')}
          </Text>

          {/* Navigation Arrows */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              onPress={() => {
                const newDate = subDays(date, 1);
                // Ensure we don't go beyond today
                onDateChange(newDate);
              }}
              style={styles.navButton}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const newDate = addDays(date, 1);
                // Prevent moving to future dates
                if (!isAfter(newDate, new Date())) {
                  onDateChange(newDate);
                }
              }}
              style={[
                styles.navButton,
                isAfter(addDays(date, 1), new Date()) && {opacity: 0.6}
              ]}
              disabled={isAfter(addDays(date, 1), new Date())}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={isAfter(addDays(date, 1), new Date()) ? "#ccc" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Modal for Date Picker */}
      <Modal
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        visible={isDatePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setDatePickerVisible(false)}
            >
              <MaterialCommunityIcons 
                name="close" 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>

            {/* Calendar Picker with max date set to today */}
            <CalendarPicker
              width={Dimensions.get('window').width * 0.9}
              selectedStartDate={date}
              onDateChange={handleDateChange}
              selectedDayColor="#ff3b30"
              selectedDayTextColor="white"
              maxDate={new Date()} // Restrict to today and past dates
            />

            {/* Quick Date Selection Buttons */}
            <View style={styles.quickDateButtons}>
              <TouchableOpacity 
                style={styles.quickDateButton}
                onPress={() => handleDateChange(new Date())}
              >
                <Text style={styles.quickDateButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerButton: {
    marginRight: 12,
    padding: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  dateNavigation: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  quickDateButtons: {
    marginTop: 20,
    width: '100%',
  },
  quickDateButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickDateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});