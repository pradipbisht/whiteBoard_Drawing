import React, { useState, useEffect } from "react";
// import useAuthStore from '../stores/authStore';
// import api from '../services/api';
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form"; // Import useForm for new whiteboard form
import api from "../services/api";
import useAuthStore from "../store/authStore";

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm(); // For new whiteboard form

  // Function to fetch whiteboards
  const fetchWhiteboards = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure token is attached by api.js interceptor
      const response = await api.get("/whiteboards");
      if (response.data.success) {
        setWhiteboards(response.data.whiteboards);
      } else {
        setError(response.data.message || "Failed to fetch whiteboards.");
      }
    } catch (err) {
      console.error("Error fetching whiteboards:", err);
      // Handle 401 specifically, though api.js interceptor could handle logout
      if (err.response && err.response.status === 401) {
        setError("Authentication required. Please login again.");
        useAuthStore.getState().logout(); // Log out if token is invalid/expired
        navigate("/login");
      } else {
        setError(
          err.response?.data?.message ||
            "An unexpected error occurred while fetching whiteboards."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new whiteboard
  const onCreateWhiteboard = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/whiteboards", {
        name: data.whiteboardName,
      });
      if (response.data.success) {
        // Add the new whiteboard to our list
        setWhiteboards((prev) => [...prev, response.data.whiteboard]);
        reset(); // Clear the form field
        // Optionally redirect to the new whiteboard
        navigate(`/whiteboard/${response.data.whiteboard._id}`);
      } else {
        setError(response.data.message || "Failed to create whiteboard.");
      }
    } catch (err) {
      console.error("Error creating whiteboard:", err);
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred while creating whiteboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch whiteboards only if user is logged in
    if (user && token) {
      fetchWhiteboards();
    }
  }, [user, token]); // Re-fetch if user or token changes (e.g., after login/logout)

  if (!user) {
    // This case should ideally be handled by ProtectedRoute, but good fallback
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-full text-center">
        <p className="text-xl text-red-400">
          You must be logged in to view the dashboard.
        </p>
        <Link to="/login" className="mt-4 text-blue-400 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 min-h-full w-full">
      <h1 className="text-5xl font-extrabold mb-8 text-green-400">
        Welcome, {user.username}!
      </h1>

      {/* Create New Whiteboard Form */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mb-8">
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">
          Create New Whiteboard
        </h2>
        <form onSubmit={handleSubmit(onCreateWhiteboard)} className="space-y-4">
          <div>
            <label
              htmlFor="whiteboardName"
              className="block text-sm font-medium text-gray-300">
              Whiteboard Name
            </label>
            <input
              type="text"
              id="whiteboardName"
              {...register("whiteboardName", {
                required: "Whiteboard name is required",
              })}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Brainstorming Session"
            />
            {errors.whiteboardName && (
              <p className="mt-1 text-sm text-red-400">
                {errors.whiteboardName.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? "bg-blue-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}>
            {loading ? "Creating..." : "Create Whiteboard"}
          </button>
          {error && (
            <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
          )}
        </form>
      </div>

      {/* Existing Whiteboards List */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">
          Your Whiteboards
        </h2>
        {loading && (
          <p className="text-center text-gray-400">Loading whiteboards...</p>
        )}
        {error && !loading && (
          <p className="text-center text-red-400">{error}</p>
        )}
        {!loading && !error && whiteboards.length === 0 && (
          <p className="text-center text-gray-400">
            No whiteboards found. Create one above!
          </p>
        )}
        <ul className="space-y-4">
          {whiteboards.map((board) => (
            <li
              key={board._id}
              className="bg-gray-700 p-4 rounded-md shadow flex justify-between items-center">
              <div>
                <Link
                  to={`/whiteboard/${board._id}`}
                  className="text-xl font-semibold text-blue-300 hover:underline">
                  {board.name}
                </Link>
                <p className="text-sm text-gray-400">
                  Owned by: {board.owner.username} | Created:{" "}
                  {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
              {/* Optional: Add buttons for Delete/Share */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
