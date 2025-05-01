
import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'admin' | 'user' | 'guest';

type UserRoleContextType = {
  userRole: Role;
  setUserRole: (role: Role) => void;
  isAdmin: boolean;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  // In a real app, you'd check auth status from a backend or localStorage
  const [userRole, setUserRole] = useState<Role>('guest');

  useEffect(() => {
    // Check if we have a saved role in localStorage
    const savedRole = localStorage.getItem('userRole') as Role | null;
    if (savedRole && ['admin', 'user', 'guest'].includes(savedRole)) {
      setUserRole(savedRole);
    }
  }, []);

  // Update localStorage when role changes
  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  // Computed property for convenience
  const isAdmin = userRole === 'admin';

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isAdmin }}>
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
