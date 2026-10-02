"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

// Industry standard idle timeout duration: 15 minutes
const TIMEOUT_MS = 15 * 60 * 1000;

export function SessionTimeoutListener() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if we are on the login page, don't run timeout logic there
    if (window.location.pathname === "/") return;

    // Initialize last activity
    localStorage.setItem("mess_last_activity", Date.now().toString());

    const handleLogout = async () => {
      try {
        await logoutAction();
      } catch (err) {
        console.error("Session timeout logout failed:", err);
      } finally {
        window.location.href = "/?reason=timeout";
      }
    };

    const updateActivity = () => {
      localStorage.setItem("mess_last_activity", Date.now().toString());
    };

    const checkTimeout = () => {
      const lastActivityStr = localStorage.getItem("mess_last_activity");
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (Date.now() - lastActivity > TIMEOUT_MS) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleLogout();
        }
      }
    };

    // User activity events to reset inactivity timer
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for timeout periodically (every 10 seconds)
    timerRef.current = setInterval(checkTimeout, 10000);

    // Storage event listener to sync state immediately if another tab logs out
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mess_last_activity") {
         checkTimeout();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Cleanup listeners on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener("storage", handleStorage);
    };
  }, [router]);

  return null;
}
