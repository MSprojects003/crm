import { createClient, getAccessToken } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

// Get token from localStorage if available (SDK stores it here after login)
const getInitialToken = () => {
  if (typeof window === 'undefined') return null;
  return getAccessToken() || localStorage.getItem('base44_access_token');
};

//Create a client with token from localStorage if available
export const base44 = createClient({
  appId,
  token: getInitialToken(),
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
