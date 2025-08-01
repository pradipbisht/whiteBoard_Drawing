import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Navbar = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const logout = useAuthStore((state) => state.logout);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg">
      <Link
        to="/"
        className="text-2xl font-bold hover:text-blue-400 transition-colors duration-200">
        Whiteboard App
      </Link>
      <div className="flex items-center space-x-4">
        {" "}
        {/* Added flex container for spacing */}
        {isLoggedIn ? (
          <>
            {/* Links visible when logged in */}
            <Link
              to="/dashboard"
              className="text-lg hover:text-blue-400 transition-colors duration-200">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-4 bg-red-600 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Links visible when NOT logged in */}
            <Link
              to="/register"
              className="text-lg hover:text-blue-400 transition-colors duration-200">
              Register
            </Link>
            <Link
              to="/login"
              className="text-lg hover:text-blue-400 transition-colors duration-200">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
