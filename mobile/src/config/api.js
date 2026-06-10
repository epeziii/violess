import { Platform } from 'react-native';

// ── Network Configuration ──
// For local development:
// Android Emulator: http://10.0.2.2:5000
// iOS Simulator: http://localhost:5000  
// Physical Device: http://YOUR_MACHINE_IP:5000 (run `ip addr show` on host)

// Production: Replace with deployed URL (e.g. https://your-app.onrender.com)

const getApiBaseUrl = () => {
  // Use the deployed Vercel backend by default.
  // For local development, replace this with your machine IP if you want a local backend.
  return 'https://violess-backend-n3jlj1fl6-202310785-1931s-projects.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

console.warn('🔗 API_BASE_URL:', API_BASE_URL);

// For physical device: 
// 1. Run `ip addr show` (Linux/Mac) or `ipconfig` (Windows) on host machine
// 2. Find wireless IP (e.g. 192.168.1.100)
// 3. Replace the android fallback above or set a custom URL here.
// Backend must bind to 0.0.0.0:5000 (check server.js)
