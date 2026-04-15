import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut } from "lucide-react";
import React from "react";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Login error:", error);
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleAuth}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-slate-500 hover:text-slate-300 bg-transparent hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loginStatus === "logging-in" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-3 h-3" />
      ) : (
        <LogIn className="w-3 h-3" />
      )}
      {loginStatus === "logging-in"
        ? "Logging in..."
        : isAuthenticated
          ? "Logout"
          : "Admin"}
    </button>
  );
}
