import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

// Role-based permissions (moved from auth.jsx)
const PERMISSIONS = {
  VIEW_ALL_LEADS: (user) => isAdmin(user),
  VIEW_ASSIGNED_LEADS: (user) => true,
  ASSIGN_LEADS: (user) => isAdmin(user),
  DELETE_LEADS: (user) => isAdmin(user),
  VIEW_ALL_ACTIVITIES: (user) => isAdmin(user),
  ADD_ACTIVITY: (user) => true,
  SCHEDULE_REMINDER: (user) => true,
  VIEW_ALL_REPORTS: (user) => isAdmin(user),
  VIEW_OWN_PERFORMANCE: (user) => true,
  MANAGE_SETTINGS: (user) => isAdmin(user),
  MANAGE_ACCESS_CONTROL: (user) => isAdmin(user),
  VIEW_DEPOSITS: (user) => true,
  ADD_DEPOSIT: (user) => true,
};

const isAdmin = (user) => user?.role?.toLowerCase() === "admin";

function can(user, permission) {
  const check = PERMISSIONS[permission];
  return check ? check(user) : false;
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      
      // First, try to check if user is authenticated
      // This will automatically use the token from localStorage if available
      await checkUserAuth();
      
      // If user auth succeeded, also load public settings
      setIsLoadingPublicSettings(true);
      try {
        const appClient = createAxiosClient({
          baseURL: `/api/apps/public`,
          headers: {
            'X-App-Id': appParams.appId
          },
          interceptResponses: true
        });
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
      } catch (settingsError) {
        console.warn('Failed to load public settings:', settingsError);
        // Don't treat this as a critical error, user can still proceed
      } finally {
        setIsLoadingPublicSettings(false);
      }
    } catch (error) {
      console.error('Unexpected error in checkAppState:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      console.log('Checking user auth with base44.auth.me()');
      const currentUser = await base44.auth.me();
      console.log('User authenticated:', currentUser);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      // If user auth fails, it's an authentication required error
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      } else {
        // Log any other auth errors but still treat as auth_required
        console.warn('Auth error, redirecting to login:', error);
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.origin);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(appParams.fromUrl || window.location.origin);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      isAdmin: isAdmin(user),
      can: (permission) => can(user, permission),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
