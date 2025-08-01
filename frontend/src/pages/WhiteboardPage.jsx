import React, { useEffect, useState, useRef } from "react"; // Import useRef
import { useParams, useNavigate } from "react-router-dom";

import WhiteboardCanvas from "../components/whiteboard/WhiteboardCanvas";
import io from "socket.io-client"; // <<<--- IMPORT SOCKET.IO CLIENT
import useAuthStore from "../store/authStore";
import api from "../services/api";

// const SOCKET_SERVER_URL = "http://localhost:3000/api".replace("/api", "");

// const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL.replace("/api", "");
// console.log("Socket URL:", SOCKET_SERVER_URL);

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const WhiteboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const logout = useAuthStore((state) => state.logout);

  const [whiteboardData, setWhiteboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socketRef = useRef(null); // <<<--- Ref to store the socket instance

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // --- Socket.IO Connection Setup ---
    // Connect to the Socket.IO server
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket"], // Prefer WebSocket
      // Optionally send auth token with connection if needed by Socket.IO middleware (not yet implemented on backend)
      // auth: { token: localStorage.getItem('token') }
    });

    // Event listener for successful connection
    socketRef.current.on("connect", () => {
      console.log("Socket.IO Connected:", socketRef.current.id);
      // Immediately join the specific whiteboard room
      socketRef.current.emit("joinWhiteboard", id);
    });

    // Event listener for disconnection
    socketRef.current.on("disconnect", () => {
      console.log("Socket.IO Disconnected");
    });

    // Event listener for connection errors
    socketRef.current.on("connect_error", (err) => {
      console.error("Socket.IO Connection Error:", err.message);
      // Handle connection errors (e.g., show message to user)
    });
    // --- End Socket.IO Connection Setup ---

    const fetchWhiteboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/whiteboards/${id}`);
        if (response.data.success) {
          setWhiteboardData(response.data.whiteboard);
        } else {
          setError(response.data.message || "Failed to load whiteboard.");
        }
      } catch (err) {
        console.error("Error fetching whiteboard:", err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          logout();
          navigate("/login");
        } else if (err.response && err.response.status === 404) {
          setError("Whiteboard not found.");
        } else {
          setError(
            err.response?.data?.message || "An unexpected error occurred."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWhiteboard();

    // Clean up Socket.IO connection on component unmount
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting Socket.IO...");
        socketRef.current.disconnect();
      }
    };
  }, [id, isLoggedIn, navigate, logout]); // Dependencies for useEffect

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-full">
        <p className="text-xl text-gray-400">Loading whiteboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-full">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-lg text-gray-400">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-700">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-full w-full">
      <h1 className="text-4xl font-extrabold mb-4 text-purple-400">
        Whiteboard: {whiteboardData?.name}
      </h1>
      <p className="text-md text-gray-400 mb-6">
        Owner: {whiteboardData?.owner?.username || "Loading..."}
        {whiteboardData?.collaborators &&
          whiteboardData.collaborators.length > 1 &&
          ` | Collaborators: ${whiteboardData.collaborators
            .filter((c) => c._id !== whiteboardData.owner._id)
            .map((c) => c.username)
            .join(", ")}`}
      </p>

      {/* Pass socketRef and whiteboardId to WhiteboardCanvas */}
      <div className="w-full flex-grow max-w-4xl h-[600px] mb-4">
        <WhiteboardCanvas socket={socketRef.current} whiteboardId={id} />{" "}
        {/* <<<--- PASS PROPS */}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg w-full max-w-4xl text-center text-gray-400">
        Drawing tools and real-time features coming soon!
      </div>
    </div>
  );
};

export default WhiteboardPage;
