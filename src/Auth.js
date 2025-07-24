import { supabase } from './supabaseClient';

export const signInWithEmail = async (email, password) => {
    try {
  
      // Proceed with signing in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,// Use hashed password for comparison
      });
  
      if (signInError) throw signInError;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

    const createUserProfile = async (id, name, email) => {
    try {
      const { data, error } = await supabase
        .from('user')
        .insert({
          id: id,
          name: name,
          email: email,
        })
        .select()
        .single();
  
      if (error) throw error;
      return { artist: data, error: null };
    } catch (error) {
      console.error('Error creating artist profile:', error);
      return { artist: null, error };
    }
  };

  export const signout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  export const signUpWithEmail = async (email, password, name) => {
    try {
      
      // Attempt to sign up the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
  
      if (error) throw error;
  
      // Create a user profile for the new user
      await createUserProfile(data.user.id, name, email);
  
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };