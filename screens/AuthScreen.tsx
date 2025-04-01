import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabse';

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Check for existing session to auto-login
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigation.navigate('Profile', { user: session.user });
      }
    })();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(`Please enter both email and password`);
      return;
    }
    setLoading(true);
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      setLoading(false);
      if (error) {
        Alert.alert(`Login Error`, `${error.message}`);
      } else if (data.user) {
        navigation.navigate('Profile', { user: data.user });
      }
    } else {
      // Signup mode
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      setLoading(false);
      if (error) {
        Alert.alert(`Signup Error`, `${error.message}`);
      } else {
        Alert.alert(`Signup Successful`, `Please check your email for confirmation`);
        setMode('login');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{mode === 'login' ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{mode === 'login' ? 'Login' : 'Sign Up'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.linkText}>
          {mode === 'login' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white'
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
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 12
  }
});