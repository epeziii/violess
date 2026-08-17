const DEFAULT_PROD = "https://violess-backend.vercel.app";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ((typeof window !== "undefined" && window.location && window.location.hostname === "localhost") ? "http://localhost:5000" : DEFAULT_PROD);

export default API_BASE_URL;
