import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, Sparkles, Github } from "lucide-react";
import toast from "react-hot-toast";

// Social Google Custom Vector Icon
const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

// Custom Microsoft 4-square vector
const MicrosoftIcon = () => (
  <div className="grid grid-cols-2 gap-0.5 w-4 h-4 mr-2 flex-shrink-0">
    <div className="bg-[#f25022] w-1.5 h-1.5"></div>
    <div className="bg-[#7fba00] w-1.5 h-1.5"></div>
    <div className="bg-[#00a4ef] w-1.5 h-1.5"></div>
    <div className="bg-[#ffb900] w-1.5 h-1.5"></div>
  </div>
);

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFields = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLogin: (data: LoginFields) => Promise<boolean>;
  onSocialLogin: (provider: "google" | "github" | "microsoft") => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgot: () => void;
}

export default function LoginForm({
  onLogin,
  onSocialLogin,
  onNavigateToRegister,
  onNavigateToForgot,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    await onLogin(data);
    setIsSubmitting(false);
  };

  const handleSocialClick = async (provider: "google" | "github" | "microsoft") => {
    setIsSocialLoading(provider);
    await onSocialLogin(provider);
    setIsSocialLoading(null);
  };

  return (
    <div className="w-full space-y-6" id="login-form-container">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
          <span>Welcome Back</span>
        </h2>
        <p className="text-xs text-rose-200/50">Access your tasks and stay productive.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-300/40" />
            <input
              type="text"
              placeholder="you@example.com"
              {...register("email")}
              className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-rose-200/25 outline-none transition-all ${
                errors.email
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-white/10 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/5"
              }`}
              id="login-email-input"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Password</label>
            <button
              type="button"
              onClick={onNavigateToForgot}
              className="text-[11px] text-rose-300/80 hover:text-rose-200 font-medium cursor-pointer"
              id="login-forgot-password-link"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-300/40" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`w-full bg-white/5 border rounded-xl pl-11 pr-11 py-2.5 text-sm text-white placeholder-rose-200/25 outline-none transition-all ${
                errors.password
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-white/10 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/5"
              }`}
              id="login-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300/40 hover:text-rose-200 p-1 rounded-full cursor-pointer transition-colors"
              id="login-toggle-password-btn"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="w-4 h-4 rounded border-white/10 text-rose-500 bg-white/5 focus:ring-rose-500/20 focus:ring-offset-0 cursor-pointer accent-rose-500"
            id="login-remember-checkbox"
          />
          <label htmlFor="login-remember-checkbox" className="ml-2.5 text-xs text-rose-200/70 select-none cursor-pointer">
            Remember me
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 hover:from-rose-500 hover:to-rose-600 border border-rose-400/20 text-white font-semibold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          id="login-submit-btn"
        >
          {isSubmitting ? "Authenticating..." : "Log In"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-[10px] text-rose-200/30 uppercase tracking-widest font-bold">Or Continue With</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Social options */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => handleSocialClick("google")}
          disabled={isSocialLoading !== null}
          className="flex items-center justify-center py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-rose-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          id="social-google-btn"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>

        <button
          onClick={() => handleSocialClick("github")}
          disabled={isSocialLoading !== null}
          className="flex items-center justify-center py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-rose-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          id="social-github-btn"
        >
          <Github className="w-4 h-4 mr-1.5 text-white" />
          <span>GitHub</span>
        </button>

        <button
          onClick={() => handleSocialClick("microsoft")}
          disabled={isSocialLoading !== null}
          className="flex items-center justify-center py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-rose-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          id="social-microsoft-btn"
        >
          <MicrosoftIcon />
          <span>Microsoft</span>
        </button>
      </div>

      {/* Redirection */}
      <p className="text-center text-xs text-rose-200/50 pt-2">
        Don't have an account?{" "}
        <button
          onClick={onNavigateToRegister}
          className="font-semibold text-rose-300 hover:text-rose-200 underline cursor-pointer"
          id="login-register-redirect-btn"
        >
          Register Now
        </button>
      </p>
    </div>
  );
}
