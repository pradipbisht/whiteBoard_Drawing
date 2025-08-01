import React from "react";
import RegisterForm from "../auth/RegisterForm";

const Register = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-full">
      <h2 className="text-4xl font-bold mb-6 text-blue-400">Register</h2>
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
