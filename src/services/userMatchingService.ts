// User Matching Service for The Willing Tree
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (will be null without configuration)
const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : null;

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  createdAt: Date;
  lastActive: Date;
}

export interface UserConnection {
  id: string;
  userEmail: string;
  partnerEmail: string;
  status: 'pending' | 'active' | 'declined';
  createdAt: Date;
  acceptedAt?: Date;
}

// Register a new user in the matching database
export const registerUser = async (user: Omit<RegisteredUser, 'id' | 'createdAt' | 'lastActive'>): Promise<{ success: boolean; message: string }> => {
  if (!supabase || !import.meta.env.VITE_ENABLE_USER_MATCHING) {
    // console.log('📊 USER REGISTRATION SIMULATION:', user);
    return {
      success: true,
      message: 'User registration simulated successfully'
    };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        }
      ])
      .select();

    if (error) throw error;

    return {
      success: true,
      message: 'User registered successfully for matching'
    };
  } catch (error) {
    console.error('User registration failed:', error);
    return {
      success: false,
      message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Search for existing users by email
export const findUserByEmail = async (email: string): Promise<RegisteredUser | null> => {
  if (!supabase || !import.meta.env.VITE_ENABLE_USER_MATCHING) {
    // Simulate finding users for demo
    const demoUsers = [
      { id: '1', email: 'demo@example.com', name: 'Demo User', age: 32, gender: 'male' as const },
      { id: '2', email: 'partner@example.com', name: 'Demo Partner', age: 28, gender: 'female' as const },
    ];
    
    const found = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return found ? {
      ...found,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    } : null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      age: data.age,
      gender: data.gender,
      createdAt: new Date(data.created_at),
      lastActive: new Date(data.last_active),
    };
  } catch (error) {
    console.error('User search failed:', error);
    return null;
  }
};

// Create a connection between two users
export const createConnection = async (
  userEmail: string,
  partnerEmail: string,
  inviteMessage?: string
): Promise<{ success: boolean; message: string; connectionId?: string }> => {
  if (!supabase || !import.meta.env.VITE_ENABLE_USER_MATCHING) {
    // console.log('🔗 CONNECTION SIMULATION:', { userEmail, partnerEmail, inviteMessage });
    return {
      success: true,
      message: 'Connection created successfully (simulated)',
      connectionId: 'sim-' + Date.now()
    };
  }

  try {
    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user_email.eq.${userEmail},partner_email.eq.${partnerEmail}),and(user_email.eq.${partnerEmail},partner_email.eq.${userEmail})`)
      .single();

    if (existing) {
      return {
        success: false,
        message: 'Connection already exists between these users'
      };
    }

    // Create new connection
    const { data, error } = await supabase
      .from('connections')
      .insert([
        {
          user_email: userEmail,
          partner_email: partnerEmail,
          status: 'pending',
          invite_message: inviteMessage,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Connection request sent successfully',
      connectionId: data.id
    };
  } catch (error) {
    console.error('Connection creation failed:', error);
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get user's connections
export const getUserConnections = async (userEmail: string): Promise<UserConnection[]> => {
  if (!supabase || !import.meta.env.VITE_ENABLE_USER_MATCHING) {
    // Return demo connections
    return [
      {
        id: 'demo-1',
        userEmail,
        partnerEmail: 'partner@example.com',
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    ];
  }

  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_email.eq.${userEmail},partner_email.eq.${userEmail}`);

    if (error) throw error;

    return data.map(conn => ({
      id: conn.id,
      userEmail: conn.user_email,
      partnerEmail: conn.partner_email,
      status: conn.status,
      createdAt: new Date(conn.created_at),
      acceptedAt: conn.accepted_at ? new Date(conn.accepted_at) : undefined,
    }));
  } catch (error) {
    console.error('Failed to get connections:', error);
    return [];
  }
};

// Accept a connection request
export const acceptConnection = async (connectionId: string): Promise<{ success: boolean; message: string }> => {
  if (!supabase || !import.meta.env.VITE_ENABLE_USER_MATCHING) {
    // console.log('✅ CONNECTION ACCEPTANCE SIMULATION:', connectionId);
    return {
      success: true,
      message: 'Connection accepted successfully (simulated)'
    };
  }

  try {
    const { error } = await supabase
      .from('connections')
      .update({
        status: 'active',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) throw error;

    return {
      success: true,
      message: 'Connection accepted successfully'
    };
  } catch (error) {
    console.error('Connection acceptance failed:', error);
    return {
      success: false,
      message: `Failed to accept connection: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};