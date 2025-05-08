
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

type Role = 'admin' | 'user' | 'guest';

type UserRoleContextType = {
  userRole: Role;
  setUserRole: (role: Role) => void;
  isAdmin: boolean;
  checkIsAdmin: () => boolean;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

// List of admin emails (typically this would come from a secure backend)
const ADMIN_EMAILS = [
  'zohaibalichanna@gmail.com',
  'zohaib.ibapsl@gmail.com'
  // Add other admin emails as needed
];

export const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role>('guest');

  // This function checks if the current user is an admin
  const checkIsAdmin = () => {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  };

  useEffect(() => {
    // Set role based on authentication status and email check
    if (!user) {
      setUserRole('guest');
      localStorage.setItem('userRole', 'guest');
    } else {
      // Check if the user's email is in the admin list
      const isAdminUser = checkIsAdmin();
      
      if (isAdminUser) {
        setUserRole('admin');
        localStorage.setItem('userRole', 'admin');
      } else {
        setUserRole('user');
        localStorage.setItem('userRole', 'user');
      }
    }
  }, [user]);

  // Computed property for convenience
  const isAdmin = userRole === 'admin';

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isAdmin, checkIsAdmin }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
