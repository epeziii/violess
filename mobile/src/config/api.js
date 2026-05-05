import { Platform } from 'react-native';

// ── Network Configuration ──
// For local development:
// Android Emulator: http://10.0.2.2:5000
// iOS Simulator: http://localhost:5000  
// Physical Device: http://YOUR_MACHINE_IP:5000 (run `ip addr show` on host)

// Production: Replace with deployed URL (e.g. https://your-app.onrender.com)

const getApiBaseUrl = () => {
  // Development auto-detection
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Try emulator first, fallback to physical device IP
      return 'http://10.0.2.2:5000';
    } else {
      return 'http://localhost:5000';
    }
  }
  
  // Production - replace with deployed URL
  return 'https://your-app.onrender.com';
};

// For physical device development:
// Replace with your host IP (from `ip addr show` -> wlan0)
export const PHYSICAL_DEVICE_URL = 'http://192.168.68.128:5000'; 

// Use this in screens for now (override emulator URL on physical device)
export const API_BASE_URL = PHYSICAL_DEVICE_URL;

console.warn('🔗 API_BASE_URL:', API_BASE_URL);

// For physical device: 
// 1. Run `ip addr show` (Linux/Mac) or `ipconfig` (Windows) on host machine
// 2. Find wireless IP (e.g. 192.168.1.100)
// 3. Update: export const API_BASE_URL = 'http://192.168.1.100:5000';
// Backend must bind to 0.0.0.0:5000 (check server.js)
