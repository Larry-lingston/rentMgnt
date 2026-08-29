import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Set your computer's LAN IP here when testing on a physical device
const DEV_HOST = '192.168.1.21';

function getDevServerHost() {
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost && debuggerHost !== 'localhost') {
    return debuggerHost;
  }
  return Platform.OS === 'android' ? DEV_HOST : 'localhost';
}

export const API_BASE_URL = `http://${getDevServerHost()}:3000/api`;

export const COLORS = {
  primary: '#1a365d',
  primaryLight: '#2b6cb0',
  secondary: '#38a169',
  accent: '#ed8936',
  danger: '#e53e3e',
  warning: '#d69e2e',
  background: '#f7fafc',
  card: '#ffffff',
  text: '#1a202c',
  textLight: '#718096',
  border: '#e2e8f0',
  white: '#ffffff',
};

export const STATUS_COLORS = {
  pending: '#d69e2e',
  in_progress: '#3182ce',
  completed: '#38a169',
  cancelled: '#e53e3e',
  occupied: '#38a169',
  vacant: '#718096',
};

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20 };

export const SHADOW = {
  sm: {
    shadowColor: '#1a202c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1a202c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
