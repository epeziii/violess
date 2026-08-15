const FALLBACK_API_BASE_URL = "https://violess-backend.vercel.app";

const getApiBaseUrl = () => {
  const configured = (process.env.REACT_APP_API_BASE_URL || "").trim();

  if (!configured) return FALLBACK_API_BASE_URL;

  try {
    const parsed = new URL(configured);
    return parsed.origin.replace(/\/+$/, "");
  } catch (error) {
    console.warn("[api] Invalid REACT_APP_API_BASE_URL detected. Falling back to the default backend URL.", configured);
    return FALLBACK_API_BASE_URL;
  }
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
