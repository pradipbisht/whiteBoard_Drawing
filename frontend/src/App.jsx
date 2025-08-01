import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ProtectedRoutes from "./auth/ProtectedRoutes";
import WhiteboardPage from "./pages/WhiteboardPage";

function App() {
  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Add more routes as needed */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <Dashboard />
              </ProtectedRoutes>
            }
          />

          {/* NEW PROTECTED ROUTE FOR WHITEBOARD */}
          <Route
            path="/whiteboard/:id"
            element={
              <ProtectedRoutes>
                <WhiteboardPage />
              </ProtectedRoutes>
            }
          />

          {/* Fallback route for 404 - Optional */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center p-8 min-h-full">
                <h2 className="text-4xl font-bold mb-6 text-red-500">
                  404 - Page Not Found
                </h2>
                <p className="text-lg text-gray-400">
                  The page you are looking for does not exist.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
