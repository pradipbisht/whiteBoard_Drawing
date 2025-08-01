import React, { useState } from "react";
import { useForm } from "react-hook-form"; // Import useForm from React Hook Form
import { useNavigate } from "react-router-dom"; // For redirection
import useAuthStore from "../store/authStore";
import api from "../services/api";

const LoginForm = () => {
  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // React Router hook for navigation
  const navigate = useNavigate();

  // Get the 'login' action from our Zustand store
  const login = useAuthStore((state) => state.login);

  // Local state for loading and error feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle form submission
  const onSubmit = async (data) => {
    setLoading(true); // Set loading state to true
    setError(null); // Clear any previous errors

    try {
      // Send login data to the backend API
      const response = await api.post("/auth/login", data);

      // Check if login was successful based on backend response
      if (response.data.success) {
        // Extract necessary user data and token from the response
        const { _id, username, email, token } = response.data;

        // Use Zustand's login action to update the global authentication state
        // This also handles saving user and token to localStorage internally
        login({ _id, username, email }, token);

        // Redirect the user to the dashboard or home page after successful login
        navigate("/dashboard"); // Redirect to DashboardPage
      } else {
        // If backend indicates failure, set the error message
        setError(response.data.message || "Login failed.");
      }
    } catch (err) {
      // Catch network errors or errors from the backend response (e.g., 401, 500)
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred during login."
      );
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
              message: "Invalid email address",
            },
          })}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          type="password"
          id="password"
          {...register("password", {
            required: "Password is required",
          })}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading} // Disable button when loading
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          loading
            ? "bg-blue-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        }`}>
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* Error Message Display */}
      {error && (
        <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
      )}
    </form>
  );
};

export default LoginForm;
