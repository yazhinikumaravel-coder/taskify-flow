import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User as UserIcon, Settings, MapPin, AlignLeft, Camera, Shield, Bell } from "lucide-react";
import { User } from "../types";
import toast from "react-hot-toast";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateProfile: (updatedData: Partial<User>) => Promise<boolean>;
  initialTab?: "profile" | "settings";
}

export default function ProfileModal({ isOpen, onClose, user, onUpdateProfile, initialTab = "profile" }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "settings">(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "Productivity enthusiast 🎯");
  const [location, setLocation] = useState(user.location || "Earth 🌎");
  const [avatar, setAvatar] = useState(user.avatar || "");

  // Simulated notification toggles
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [secureSession, setSecureSession] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    const success = await onUpdateProfile({
      name,
      bio,
      location,
      avatar,
    });
    setIsSaving(false);

    if (success) {
      toast.success("Profile updated successfully! ✨");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="profile-settings-modal">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Account & Options</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-rose-200/60 hover:text-white cursor-pointer focus:outline-none"
              id="close-profile-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 px-4 pt-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "border-rose-400 text-rose-300"
                  : "border-transparent text-rose-200/50 hover:text-white"
              }`}
              id="modal-profile-tab-btn"
            >
              <UserIcon className="w-4 h-4" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "border-rose-400 text-rose-300"
                  : "border-transparent text-rose-200/50 hover:text-white"
              }`}
              id="modal-settings-tab-btn"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {activeTab === "profile" ? (
              <form onSubmit={handleSave} className="space-y-5">
                {/* Avatar Preview & URL */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="relative group">
                    <img
                      src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fda4af&color=4c0519&bold=true`}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full border-2 border-rose-400/50 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 rounded-full bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-xs font-semibold text-rose-200/70 uppercase">Avatar Image URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/your-custom-photo"
                      className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400/50 transition-colors"
                      id="avatar-input"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-rose-200/70 uppercase">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/60" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50 transition-colors"
                      id="name-input"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5 opacity-60">
                  <label className="block text-xs font-semibold text-rose-200/70 uppercase">Email Address (Primary)</label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={user.email}
                    className="w-full bg-slate-950/20 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white cursor-not-allowed"
                  />
                  <p className="text-[10px] text-rose-200/50 italic">Primary contact email cannot be modified directly.</p>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-rose-200/70 uppercase">Bio</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3.5 top-3 w-4 h-4 text-rose-300/60" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      maxLength={120}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50 transition-colors resize-none"
                      id="bio-input"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-rose-200/70 uppercase">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/60" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400/50 transition-colors"
                      id="location-input"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 hover:from-rose-500 hover:to-rose-600 border border-rose-400/20 text-white font-medium text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    id="save-profile-btn"
                  >
                    {isSaving ? "Saving changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-rose-300 border-b border-white/5 pb-2 uppercase tracking-wider">Preferences</h3>
                  
                  {/* Notify toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-rose-300" />
                      <div>
                        <p className="text-xs font-semibold text-white">Daily Sparkle Reminders</p>
                        <p className="text-[10px] text-rose-200/60">Motivate completions via task highlights.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyTasks}
                        onChange={() => setNotifyTasks(!notifyTasks)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-950/60 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500/80"></div>
                    </label>
                  </div>

                  {/* Secure login toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-rose-300" />
                      <div>
                        <p className="text-xs font-semibold text-white">Enforce Secure Sessions</p>
                        <p className="text-[10px] text-rose-200/60">Validate credentials on state transition.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={secureSession}
                        onChange={() => setSecureSession(!secureSession)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-950/60 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500/80"></div>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-rose-300 border-b border-white/5 pb-2 uppercase tracking-wider">System Information</h3>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-rose-200/50">Applet Status</span>
                      <span className="text-emerald-400 font-semibold uppercase">ONLINE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-200/50">Database Connector</span>
                      <span className="text-rose-200 font-medium">Local JSON Isolator</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-200/50">Authorization Method</span>
                      <span className="text-rose-200 font-medium">HMAC signed JWT</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
