import { supabase } from './supabase'; // Assuming you have this file with your Supabase client

// ==================== User Goals ====================
export const getUserGoals = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return null;
  }
};

export const saveUserGoals = async (calorieGoal, macroGoals) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return false;
    
    // Check if goals already exist
    const { data: existingGoals } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingGoals) {
      // Update existing goals
      const { error } = await supabase
        .from('user_goals')
        .update({ 
          calorie_goal: calorieGoal,
          carbs_goal: macroGoals.carbs,
          protein_goal: macroGoals.protein,
          fat_goal: macroGoals.fat,
          updated_at: new Date()
        })
        .eq('id', existingGoals.id);
        
      if (error) throw error;
    } else {
      // Insert new goals
      const { error } = await supabase
        .from('user_goals')
        .insert({ 
          user_id: user.id,
          calorie_goal: calorieGoal,
          carbs_goal: macroGoals.carbs,
          protein_goal: macroGoals.protein,
          fat_goal: macroGoals.fat
        });
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user goals:', error);
    return false;
  }
};

// ==================== Water Tracker Settings ====================
export const getWaterTrackerSettings = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('water_tracker_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" error
    
    return data || { enabled: false, daily_water_goal: 4 };
  } catch (error) {
    console.error('Error fetching water tracker settings:', error);
    return { enabled: false, daily_water_goal: 4 };
  }
};

export const saveWaterTrackerSettings = async (settings) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return false;
    
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('water_tracker_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('water_tracker_settings')
        .update({ 
          enabled: settings.enabled,
          daily_water_goal: settings.dailyWaterGoal,
          updated_at: new Date()
        })
        .eq('id', existingSettings.id);
        
      if (error) throw error;
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('water_tracker_settings')
        .insert({ 
          user_id: user.id,
          enabled: settings.enabled,
          daily_water_goal: settings.dailyWaterGoal
        });
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving water tracker settings:', error);
    return false;
  }
};

// ==================== Daily Nutrition ====================
export const getDailyNutrition = async (date) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return null;
    
    const dateString = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_nutrition')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      return {
        calorieGoal: (await getUserGoals())?.calorie_goal || 2000,
        macroGoals: {
          carbs: (await getUserGoals())?.carbs_goal || 250,
          protein: (await getUserGoals())?.protein_goal || 150,
          fat: (await getUserGoals())?.fat_goal || 65,
        },
        dailyStats: {
          calories: { 
            food: data.calories_food, 
            exercise: data.calories_exercise 
          },
          macros: {
            carbs: data.carbs,
            protein: data.protein,
            fat: data.fat,
          }
        },
        waterTrackerSettings: {
          cupsConsumed: data.cups_consumed
        }
      };
    }
    
    // Return default data if none exists
    return {
      calorieGoal: (await getUserGoals())?.calorie_goal || 2000,
      macroGoals: {
        carbs: (await getUserGoals())?.carbs_goal || 250,
        protein: (await getUserGoals())?.protein_goal || 150,
        fat: (await getUserGoals())?.fat_goal || 65,
      },
      dailyStats: {
        calories: { food: 0, exercise: 0 },
        macros: { carbs: 0, protein: 0, fat: 0 }
      },
      waterTrackerSettings: {
        cupsConsumed: 0
      }
    };
  } catch (error) {
    console.error('Error fetching daily nutrition:', error);
    return null;
  }
};

export const saveDailyNutrition = async (date, data) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return false;
    
    const dateString = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];
    
    // Check if entry exists for this date
    const { data: existing } = await supabase
      .from('daily_nutrition')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();
    
    const nutritionData = {
      calories_food: data.dailyStats.calories.food,
      calories_exercise: data.dailyStats.calories.exercise,
      carbs: data.dailyStats.macros.carbs,
      protein: data.dailyStats.macros.protein,
      fat: data.dailyStats.macros.fat,
      cups_consumed: data.waterTrackerSettings?.cupsConsumed || 0,
      updated_at: new Date()
    };
    
    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('daily_nutrition')
        .update(nutritionData)
        .eq('id', existing.id);
        
      if (error) throw error;
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('daily_nutrition')
        .insert({ 
          user_id: user.id,
          date: dateString,
          ...nutritionData
        });
        
      if (error) throw error;
    }
    
    // Also update user goals if they've changed
    if (data.calorieGoal && data.macroGoals) {
      await saveUserGoals(data.calorieGoal, data.macroGoals);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving daily nutrition:', error);
    return false;
  }
};

// ==================== Chat Messages ====================
export const getChatMessages = async (date) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return [];
    
    const dateString = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    return data.map(msg => ({
      id: msg.timestamp,
      text: msg.message,
      type: msg.message_type
    }));
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

export const saveChatMessages = async (date, messages) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return false;
    
    const dateString = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];
    
    // First, delete existing messages for this date to avoid duplicates
    // This is a simple approach - a more optimized one would track changes
    await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateString);
    
    // Insert all messages
    if (messages.length > 0) {
      const messagesData = messages.map(msg => ({
        user_id: user.id,
        date: dateString,
        message: msg.text,
        message_type: msg.type,
        timestamp: msg.id
      }));
      
      const { error } = await supabase
        .from('chat_messages')
        .insert(messagesData);
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat messages:', error);
    return false;
  }
};

// ==================== Dashboard Data ====================
export const getNutritionDataRange = async (startDate, endDate) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.id) return [];
    
    const startDateString = startDate instanceof Date 
      ? startDate.toISOString().split('T')[0] 
      : new Date(startDate).toISOString().split('T')[0];
      
    const endDateString = endDate instanceof Date 
      ? endDate.toISOString().split('T')[0] 
      : new Date(endDate).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_nutrition')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateString)
      .lte('date', endDateString)
      .order('date');
      
    if (error) throw error;
    
    return data.map(item => ({
      date: item.date,
      calories: item.calories_food - item.calories_exercise,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat
    }));
  } catch (error) {
    console.error('Error fetching nutrition data range:', error);
    return [];
  }
};