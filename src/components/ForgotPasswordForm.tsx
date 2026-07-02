import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format").trim(),
});

type ForgotFields = z.infer<typeof forgotSchema>;

interface ForgotPasswordFormProps {
  onForgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordForm({ onForgotPassword, onNavigateToLogin }: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ status: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFields>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFields) => {
    setIsSubmitting(true);
    setResultMessage(null);
    const res = await onForgotPassword(data.email);
    setIsSubmitting(false);

    if (res.success) {
      setResultMessage({
        status: "success",
        text: res.message || "A simulated password reset link has been sent to your email! ✨",
      });
    } else {
      setResultMessage({
        status: "error",
        text: res.error || "Failed to process request. Please try again.",
      });
    }
  };

  return (
    <div className="w-full space-y-6" id="forgot-password-form-container">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
          <span>Reset Password</span>
        </h2>
        <p className="text-xs text-rose-200/50">Enter your email to receive a password reset link.</p>
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border text-xs leading-normal ${
            resultMessage.status === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
              : "bg-rose-500/10 border-rose-500/25 text-rose-200"
          }`}
          id="recovery-result-alert"
        >
          {resultMessage.status === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{resultMessage.text}</span>
        </div>
      )}

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
              id="forgot-email-input"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-400 font-medium pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 hover:from-rose-500 hover:to-rose-600 border border-rose-400/20 text-white font-semibold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center"
          id="forgot-submit-btn"
        >
          {isSubmitting ? "Processing..." : "Send Reset Link"}
        </button>
      </form>

      {/* Redirection */}
      <p className="text-center text-xs text-rose-200/50 pt-2">
        Remember your password?{" "}
        <button
          onClick={onNavigateToLogin}
          className="font-semibold text-rose-300 hover:text-rose-200 underline cursor-pointer"
          id="forgot-login-redirect-btn"
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}
