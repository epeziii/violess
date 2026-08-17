const DEFAULT_PROD = "https://violess-backend-18dr94n1p-202310785-1931s-projects.vercel.app";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || ((typeof window !== "undefined" && window.location && window.location.hostname === "localhost") ? "http://localhost:5000" : DEFAULT_PROD);

export default API_BASE_URL;
