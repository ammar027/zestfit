import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getChatMessages, saveChatMessages } from '../utils/supabaseutils';

export default function ChatInterface({ date, onUpdateStats, user }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Load messages for the specific date
  const loadMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const chatMessages = await getChatMessages(date);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load chat messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, user]);

  // Save messages to Supabase
  const saveMessages = useCallback(async (messagesToSave) => {
    if (!user) return;
    
    try {
      await saveChatMessages(date, messagesToSave);
    } catch (error) {
      console.error('Error saving messages:', error);
      Alert.alert('Error', 'Failed to save chat messages');
    }
  }, [date, user]);

  // Load messages when date changes
  useEffect(() => {
    loadMessages();
  }, [date, loadMessages]);

  const calculateNutrition = async (userMessage) => {
    try {
      const response = await fetch('https://api.a0.dev/ai/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a nutrition expert AI. Calculate approximate calories and macros for food items or exercises. 
Respond ONLY with a valid JSON object in this format:
{"type": "food", "calories": 2050, "carbs": 300, "protein": 200, "fat": 100}
or 
{"type": "exercise", "calories": 150}`
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let nutritionData;
      const completion = data.completion || '';

      try {
        // Try parsing the entire completion as JSON
        nutritionData = JSON.parse(completion);
      } catch (parseError) {
        // If direct parsing fails, try extracting JSON using regex
        const jsonMatch = completion.match(/\{[^}]+\}/);
        if (jsonMatch) {
          nutritionData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Unable to extract valid JSON from: ${completion}`);
        }
      }

      // Update stats based on nutrition type
      onUpdateStats((prevStats) => {
        if (nutritionData.type === 'food') {
          return {
            calories: {
              food: (prevStats.calories?.food || 0) + (nutritionData.calories || 0),
              exercise: prevStats.calories?.exercise || 0
            },
            macros: {
              carbs: (prevStats.macros?.carbs || 0) + (nutritionData.carbs || 0),
              protein: (prevStats.macros?.protein || 0) + (nutritionData.protein || 0),
              fat: (prevStats.macros?.fat || 0) + (nutritionData.fat || 0)
            }
          };
        } else if (nutritionData.type === 'exercise') {
          return {
            calories: {
              food: prevStats.calories?.food || 0,
              exercise: (prevStats.calories?.exercise || 0) + (nutritionData.calories || 0)
            },
            macros: prevStats.macros || {}
          };
        }
        return prevStats;
      });

      return nutritionData;
    } catch (error) {
      console.error('Nutrition Calculation Error:', error);
      
      // Show an alert to the user
      Alert.alert(
        'Nutrition Calculation Error', 
        'Unable to process nutrition information. Please try again.'
      );

      return null;
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!user) {
      Alert.alert('Login Required', 'Please log in to use the chat feature');
      return;
    }

    const userMsg = {
      id: Date.now(),
      text: message,
      type: 'user'
    };
    
    // Add user message to chat
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    // Save messages
    saveMessages(updatedMessages);
    
    setMessage('');

    try {
      const aiResponse = await calculateNutrition(message);
      
      if (aiResponse) {
        const aiMsg = {
          id: Date.now() + 2,
          text: aiResponse.type === 'food' 
            ? `Nutrition Info:\nCalories: ${aiResponse.calories || 0}\nCarbs: ${aiResponse.carbs || 0}g\nProtein: ${aiResponse.protein || 0}g\nFat: ${aiResponse.fat || 0}g`
            : `Exercise Calories Burned: ${aiResponse.calories || 0} kcal`,
          type: 'ai'
        };
        
        // Add AI response to chat
        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        
        // Save updated messages
        saveMessages(finalMessages);
      }
    } catch (error) {
      console.error('Send Message Error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        style={styles.messagesContainer}
      >
        {messages.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Track your meals and exercises by typing them here
            </Text>
          </View>
        )}
        
        {messages.map(msg => (
          <View 
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.type === 'user' ? styles.userMessage : styles.aiMessage
            ]}
          >
            <Text style={[styles.messageText, msg.type === 'ai' && styles.aiMessageText]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your meals or exercise..."
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialCommunityIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f0f0f0',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f2ff',
  },
  messageText: {
    fontSize: 16,
  },
  aiMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#ff3b30',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});