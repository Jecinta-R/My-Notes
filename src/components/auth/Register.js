// src/components/auth/Register.js
import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Check for user's preferred color scheme on component mount
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check for saved preference in localStorage
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/notes"); // Redirect to /notes after successful registration
    } catch (err) {
      // Handle Firebase error codes with custom messages
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account already exists with this email.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        case "auth/invalid-email":
          setError("Invalid email format.");
          break;
        default:
          setError("An error occurred. Please try again.");
      }
    }
  };

  // Determine classes based on dark mode state
  const containerClasses = darkMode 
    ? "min-h-screen bg-gray-900 flex items-center justify-center p-4" 
    : "min-h-screen bg-gray-100 flex items-center justify-center p-4";
  
  const cardClasses = darkMode
    ? "bg-gray-800 shadow-xl rounded-lg p-6 w-full max-w-md"
    : "bg-white shadow-xl rounded-lg p-6 w-full max-w-md";
  
  const headingClasses = darkMode
    ? "text-2xl font-bold mb-6 text-white text-center"
    : "text-2xl font-bold mb-6 text-gray-800 text-center";
  
  const labelClasses = darkMode
    ? "block text-sm font-medium text-gray-300 mb-1"
    : "block text-sm font-medium text-gray-700 mb-1";
  
  const inputClasses = darkMode
    ? "w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
    : "w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500";
  
  const buttonClasses = "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300";
  
  const linkClasses = darkMode
    ? "text-blue-400 hover:text-blue-300"
    : "text-blue-600 hover:text-blue-800";
  
  const errorClasses = "p-3 mb-4 text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={headingClasses}>Register</h2>
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {error && (
          <div className={errorClasses}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClasses}
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className={labelClasses}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className={buttonClasses}
            >
              Sign Up
            </button>
          </div>
          
          <div className={`text-center mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Already have an account?{" "}
            <Link to="/login" className={linkClasses}>
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;