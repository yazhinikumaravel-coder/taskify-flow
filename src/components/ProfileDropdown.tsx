import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { User as UserIcon, Settings, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { User } from "../types";

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: (tab: "profile" | "settings") => void;
}

export default function ProfileDropdown({ user, onLogout, onOpenSettings }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} id="profile-dropdown-container">
      {/* Target button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/50"
        aria-label="User profile menu"
        id="profile-dropdown-btn"
      >
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
          alt={user.name}
          className="w-8 h-8 rounded-full border border-rose-200/20 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="hidden sm:block text-left pr-1 max-w-[120px]">
          <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
          <p className="text-[10px] text-rose-200/60 truncate leading-none mt-0.5">{user.email}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-rose-200/60 mr-1 hidden sm:block" />
      </button>

      {/* Dropdown body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-white/15 backdrop-blur-xl shadow-2xl p-1.5 z-50 overflow-hidden"
            id="profile-dropdown-menu"
          >
            {/* Header info for small screen */}
            <div className="p-3 border-b border-white/5 sm:hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-rose-200/60 truncate mt-0.5">{user.email}</p>
            </div>

            <div className="py-1">
              {/* My Profile */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings("profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left cursor-pointer"
                id="dropdown-profile-btn"
              >
                <UserIcon className="w-4 h-4 text-rose-300" />
                <span>My Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings("settings");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left cursor-pointer"
                id="dropdown-settings-btn"
              >
                <Settings className="w-4 h-4 text-rose-300" />
                <span>Settings</span>
              </button>
            </div>

            <div className="h-px bg-white/5 my-1" />

            <div className="py-1">
              {/* Logout */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 rounded-lg transition-colors text-left cursor-pointer"
                id="dropdown-logout-btn"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
