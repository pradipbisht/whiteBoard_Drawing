import axios from "axios";

// Access Vite environment variables using import.meta.env
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // THIS IS THE CRITICAL FIX: Use optional chaining (?.) for error.response
    // This prevents the TypeError if error.response is undefined (e.g., network error/server down)
    if (error.response?.status === 401) {
      console.error(
        "Unauthorized request. Token might be invalid or expired. Logging out."
      );
      // Clear authentication data from local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // You could also redirect to login here, e.g., window.location.href = '/login';
    } else if (error.request) {
      // The request was made but no response was received (e.g., server down, network error, CORS preflight failed)
      console.error(
        "Network Error: No response received from server. Is backend running?",
        error.message
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Axios Error (request setup issue):", error.message);
    }

    // THIS IS ALSO CRITICAL: Re-throw or reject the promise so the component's catch block can handle it.
    return Promise.reject(error);
  }
);

export default api;
