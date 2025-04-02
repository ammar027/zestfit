import { supabase } from './supabaseClient';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

// Existing functions
export const getChatMessages = async (date) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });
    
  if (error) {
    throw error;
  }
  
  return data || [];
};

export const saveChatMessages = async (date, messages) => {
  // First delete existing messages for this date
  const { error: deleteError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('date', date);
    
  if (deleteError) {
    throw deleteError;
  }
  
  // Then insert new messages
  const { error: insertError } = await supabase
    .from('chat_messages')
    .insert(
      messages.map(msg => ({
        date: date,
        message_data: msg,
        created_at: new Date().toISOString()
      }))
    );
    
  if (insertError) {
    throw insertError;
  }
};

// New function for image upload
export const uploadImage = async (imageUri, userId) => {
  try {
    // Generate a unique file name
    const fileExt = imageUri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `food_images/${fileName}`;
    
    // Read the file as base64 data
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user_uploads')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('user_uploads')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};