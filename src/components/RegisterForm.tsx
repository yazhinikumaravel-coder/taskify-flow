import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, User, Sparkles } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required").trim(),
    email: z.string().min(1, "Email is required").email("Invalid email format").trim(),
    password: z
      .string()
      .min(8, "Must contain at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms & conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFields = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onRegister: (data: RegisterFields) => Promise<boolean>;
  onNavigateToLogin: () => void;
}

export default function RegisterForm({ onRegister, onNavigateToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    setIsSubmitting(true);
    await onRegister(data);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full space-y-6" id="register-form-container">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
          <span>Create Account</span>
        </h2>
        <p className="text-xs text-rose-200/50">Register to organize tasks and track goals.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-300/40" />
            <input
              type="text"
              placeholder="Jane Doe"
              {...register("name")}
              className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-rose-200/25 outline-none transition-all ${
                errors.name
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-white/10 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/5"
              }`}
              id="register-name-input"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-300/40" />
            <input
              type="text"
              placeholder="jane.doe@example.com"
              {...register("email")}
              className={`w-full bg-white/5 border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-rose-200/25 outline-none transition-all ${
                errors.email
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-white/10 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/5"
              }`}
              id="register-email-input"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Password</label>
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
              id="register-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300/40 hover:text-rose-200 p-1 rounded-full cursor-pointer transition-colors"
              id="register-toggle-password-btn"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-400 font-medium pl-1 leading-normal">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-rose-200/70 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-rose-300/40" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`w-full bg-white/5 border rounded-xl pl-11 pr-11 py-2.5 text-sm text-white placeholder-rose-200/25 outline-none transition-all ${
                errors.confirmPassword
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  : "border-white/10 focus:border-rose-400/50 focus:ring-4 focus:ring-rose-400/5"
              }`}
              id="register-confirm-password-input"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300/40 hover:text-rose-200 p-1 rounded-full cursor-pointer transition-colors"
              id="register-toggle-confirm-password-btn"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-1">
          <div className="flex items-start">
            <input
              type="checkbox"
              {...register("acceptTerms")}
              className="w-4 h-4 mt-0.5 rounded border-white/10 text-rose-500 bg-white/5 focus:ring-rose-500/20 focus:ring-offset-0 cursor-pointer accent-rose-500"
              id="register-terms-checkbox"
            />
            <label htmlFor="register-terms-checkbox" className="ml-2.5 text-xs text-rose-200/70 select-none cursor-pointer leading-tight">
              I agree to the{" "}
              <span className="text-rose-300 hover:text-rose-200 underline">Terms of Service</span> and{" "}
              <span className="text-rose-300 hover:text-rose-200 underline">Privacy Policy</span>.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-rose-400 font-medium pl-1 pt-1">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Register submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 hover:from-rose-500 hover:to-rose-600 border border-rose-400/20 text-white font-semibold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center"
          id="register-submit-btn"
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      {/* Redirection */}
      <p className="text-center text-xs text-rose-200/50 pt-2">
        Already have an account?{" "}
        <button
          onClick={onNavigateToLogin}
          className="font-semibold text-rose-300 hover:text-rose-200 underline cursor-pointer"
          id="register-login-redirect-btn"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
