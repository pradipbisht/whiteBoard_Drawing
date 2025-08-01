import React from "react";
import LoginForm from "../auth/LoginForm";

const Login = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-full">
      <h2 className="text-4xl font-bold mb-6 text-blue-400">Login</h2>
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
