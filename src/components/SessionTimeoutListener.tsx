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
    const handleLogout = async () => {
      try {
        await logoutAction();
      } catch (err) {
        console.error("Session timeout logout failed:", err);
      } finally {
        window.location.href = "/?reason=timeout";
      }
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
    };

    // User activity events to reset inactivity timer
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    // Initialize timer
    resetTimer();

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup listeners on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  return null;
}
