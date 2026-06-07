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

// Production backend on Vercel
export const API_BASE_URL = 'https://violess-backend-j33t5zheb-202310785-1931s-projects.vercel.app';

console.warn('🔗 API_BASE_URL:', API_BASE_URL);

// For physical device: 
// 1. Run `ip addr show` (Linux/Mac) or `ipconfig` (Windows) on host machine
// 2. Find wireless IP (e.g. 192.168.1.100)
// 3. Update: export const API_BASE_URL = 'http://192.168.1.100:5000';
// Backend must bind to 0.0.0.0:5000 (check server.js)
