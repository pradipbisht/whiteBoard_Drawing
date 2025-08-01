import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-full">
      <h1 className="text-5xl font-extrabold mb-4 text-blue-400">
        Welcome to Collaborative Whiteboard!
      </h1>
      <p className="text-xl text-gray-300">
        Please register or login to start collaborating.
      </p>
    </div>
  );
};

export default Home;
