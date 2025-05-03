import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../utils/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Settings,
  User,
  Trash2,
} from "lucide-react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");

  const menuRef = useRef();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUserEmail(parsedUser.email || "");
        setUserName(parsedUser.name || parsedUser.email?.split("@")[0] || "User");
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left side: Logo + Trash Link */}
      <div className="flex items-center gap-4">
        <Link
          to="/notes"
          className="text-lg font-semibold text-gray-800 dark:text-white"
        >
          Notes
        </Link>

        {userEmail && (
          <Link
            to="/trash"
            className="flex items-center px-3 py-1 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition"
            title="Trash Bin"
          >
            <Trash2 size={16} className="mr-2" />
            Trash Bin
          </Link>
        )}
      </div>

      {/* Right side: Theme toggle + User menu */}
      <div className="flex items-center gap-2 relative" ref={menuRef}>
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {theme === "dark" ? (
            <Moon size={18} className="text-blue-400" />
          ) : (
            <Sun size={18} className="text-yellow-500" />
          )}
        </button>

        {/* User Dropdown */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="User Menu"
        >
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center font-semibold text-sm text-white uppercase">
            {userName?.charAt(0) || "U"}
          </div>
          <ChevronDown size={16} className="ml-1" />
        </button>

        {showUserMenu && (
          <div
            id="user-menu"
            className="absolute right-0 mt-6 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transition-all duration-200"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userEmail}
              </p>
            </div>

            <div className="py-1">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <User size={16} className="mr-2" />
                Profile
              </Link>

              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
