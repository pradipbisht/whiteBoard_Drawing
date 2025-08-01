import { create } from "zustand";

const safeJSONParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Error parsing JSON from localStorage:", error); // Use console.error for errors
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  // actions
  login: (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    set({
      user: userData,
      token,
      isLoggedIn: true,
    });
  },
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isLoggedIn: false,
    });
  },

  initializeAuth: () => {
    const storedToken = localStorage.getItem("token"); // Changed order to match my original for consistency
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      const parsedUser = safeJSONParse(storedUser);
      if (parsedUser) {
        // <--- ADDED THIS CHECK
        set({
          user: parsedUser,
          token: storedToken,
          isLoggedIn: true,
        });
      } else {
        // If parsedUser is null (due to parsing error), clear both localStorage items
        console.warn(
          "Corrupted user data in localStorage. Clearing authentication data."
        );
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        set({ user: null, token: null, isLoggedIn: false }); // Ensure state is reset
      }
    } else {
      // If either token or user is missing, ensure both are cleared
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  },
}));

useAuthStore.getState().initializeAuth(); // Call immediately on store creation

export default useAuthStore;
