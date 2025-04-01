import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../utils/supabse';

export default function ProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = route.params?.user;
  const [profile, setProfile] = useState({
    username: user?.email || '',
    age: '',
    height: '',
    gender: '',
    // add other fields as needed
  });
  const [loading, setLoading] = useState(false);

  // Load profile data from Supabase on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Assuming a "profiles" table exists with columns: user_id, username, age, height, gender
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        Alert.alert('Error', error.message);
      } else if (data) {
        setProfile({
          username: data.username || user.email,
          age: data.age ? String(data.age) : '',
          height: data.height ? String(data.height) : '',
          gender: data.gender || ''
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const updates = {
        user_id: user.id,
        username: profile.username,
        age: parseInt(profile.age, 10) || null,
        height: parseFloat(profile.height) || null,
        gender: profile.gender,
      };
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { returning: 'minimal' });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Profile updated successfully');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={profile.username}
        onChangeText={(text) => setProfile({ ...profile, username: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={profile.age}
        onChangeText={(text) => setProfile({ ...profile, age: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={profile.height}
        onChangeText={(text) => setProfile({ ...profile, height: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={profile.gender}
        onChangeText={(text) => setProfile({ ...profile, gender: text })}
      />
      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12
  },
  buttonText: {
    color: 'white',
    fontSize: 18
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
});