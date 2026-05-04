
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';

interface UserRoleContextType {
  userRole: UserRole;
  isAdmin: boolean;
  checkIsAdmin: () => boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  // setUserRole is intentionally kept private to this provider — exposing it through
  // the context would allow any consumer to call setUserRole('admin') and reveal
  // admin-only UI surfaces (DB access stays RLS-protected, but UI guards would leak).
  const [userRole, setUserRole] = useState<UserRole>('user');
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) {
        setUserRole('user');
        return;
      }

      try {
        // Query user_roles table to check if user has admin role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setUserRole('user');
          return;
        }

        // User has admin role in database
        if (data) {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setUserRole('user');
      }
    };

    checkAdminRole();
  }, [user]);

  const isAdmin = userRole === 'admin';
  
  const checkIsAdmin = (): boolean => {
    return userRole === 'admin';
  };

  return (
    <UserRoleContext.Provider value={{ userRole, isAdmin, checkIsAdmin }}>
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
