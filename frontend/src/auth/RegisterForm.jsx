import React, { useState } from "react";
import { useForm } from "react-hook-form"; // Import useForm from React Hook Form
import { useNavigate } from "react-router-dom"; // For redirection after successful action
import useAuthStore from "../store/authStore";
import api from "../services/api";

const RegisterForm = () => {
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
      // Send registration data to the backend API
      const response = await api.post("/auth/register", data);

      // Check if registration was successful based on backend response
      if (response.data.success) {
        // Extract necessary user data and token from the response
        const { _id, username, email, token } = response.data;

        // Use Zustand's login action to update the global authentication state
        // This also handles saving user and token to localStorage internally
        login({ _id, username, email }, token);

        // Redirect the user to the dashboard or home page after successful registration
        navigate("/dashboard"); // We will create this DashboardPage later
      } else {
        // If backend indicates failure, set the error message
        setError(response.data.message || "Registration failed.");
      }
    } catch (err) {
      // Catch network errors or errors from the backend response (e.g., 400, 500)
      console.error("Registration error:", err);
      // Display specific error message from backend or a generic one
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred during registration."
      );
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-300">
          Username
        </label>
        <input
          type="text"
          id="username"
          {...register("username", { required: "Username is required" })}
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
        )}
      </div>

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
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
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
        {loading ? "Registering..." : "Register"}
      </button>

      {/* Error Message Display */}
      {error && (
        <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
      )}
    </form>
  );
};

export default RegisterForm;
