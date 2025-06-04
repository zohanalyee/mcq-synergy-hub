
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type UserRole = 'admin' | 'user';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAdmin: boolean;
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
    // This is a simple example - in a real app, you'd check against your database
    if (user?.email === 'admin@example.com') {
      setUserRole('admin');
    } else {
      setUserRole('user');
    }
  }, [user]);

  const isAdmin = userRole === 'admin';

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isAdmin }}>
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
