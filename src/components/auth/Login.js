// src/components/auth/Login.js
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Check system preference for dark mode on component mount
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(darkModeMediaQuery.matches);
    
    // Listen for changes in system preference
    const handleChange = (e) => setDarkMode(e.matches);
    darkModeMediaQuery.addEventListener("change", handleChange);
    
    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/notes"); // Redirect to /notes after successful login
    } catch (err) {
      // Handle Firebase error codes with custom messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format.");
          break;
        default:
          setError("An error occurred. Please try again.");
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Dynamic classes based on dark mode state
  const containerClass = `min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
    darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
  }`;
  
  const formClass = `max-w-md w-full space-y-8 p-8 rounded-lg shadow-md ${
    darkMode ? "bg-gray-800" : "bg-white"
  }`;
  
  const inputClass = `appearance-none relative block w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode 
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" 
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
  }`;
  
  const buttonClass = `group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;
  
  const errorClass = `text-center p-2 rounded-md ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"}`;
  
  const linkClass = `font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"}`;

  return (
    <div className={containerClass}>
      <div className={formClass}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Login</h2>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

        {error && <div className={errorClass}>{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <button type="submit" className={buttonClass}>
              Sign in
            </button>
          </div>

          <div className={`text-sm text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Don't have an account?{" "}
            <Link to="/register" className={linkClass}>
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;