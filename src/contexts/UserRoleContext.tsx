
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type UserRole = 'admin' | 'user';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAdmin: boolean;
  checkIsAdmin: () => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is admin based on their email or other criteria
    // More flexible admin detection - check for common admin email patterns
    if (user?.email) {
      const email = user.email.toLowerCase();
      // Check for admin email patterns or specific admin emails
      if (email.includes('admin') || 
          email === 'admin@example.com' || 
          email === 'zohaib.ibapsl@gmail.com' || // Add the actual admin email
          email === 'zohaibalichanna@gmail.com' || // Add another admin email
          email.endsWith('@admin.com') ||
          email.startsWith('admin@')) {
        setUserRole('admin');
      } else {
        setUserRole('user');
      }
    } else {
      setUserRole('user');
    }
  }, [user]);

  const isAdmin = userRole === 'admin';
  
  const checkIsAdmin = (): boolean => {
    return userRole === 'admin';
  };

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isAdmin, checkIsAdmin }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
