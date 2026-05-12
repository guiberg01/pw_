"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationButton({ isUserLoggedIn = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const result = await notificationService.getUnreadCount();
        if (isMounted) {
          setUnreadCount(result?.unreadCount ?? 0);
        }
      } catch (error) {
        console.error("Error loading notification count:", error);
      }
    };

    loadUnreadCount();

    const handleNotificationUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener("notifications:updated", handleNotificationUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications:updated", handleNotificationUpdate);
    };
  }, [isUserLoggedIn]);

  if (!isUserLoggedIn) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-white/90 hover:text-white/40 transition"
        aria-label="Abrir notificações"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} onUnreadCountUpdate={setUnreadCount} />
    </>
  );
}
