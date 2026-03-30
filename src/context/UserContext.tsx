import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the valid roles and standards for the platform
export type Role = 'Student' | 'Mentor' | 'NGO' | null;
export type Standard = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'UG' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  standard?: Standard; // Applicable primarily for Students
  isVerified?: boolean; // Applicable primarily for Mentors
  token?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize state from localStorage securely on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sahaayak_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem('sahaayak_user'); // Clear corrupted data
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sahaayak_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('sahaayak_token', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sahaayak_user');
    localStorage.removeItem('sahaayak_token');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem('sahaayak_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to consume the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
