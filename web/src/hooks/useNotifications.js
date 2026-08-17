import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function normalizeNotification(row) {
  const payload = row.payload || {};
  return {
    id: row.id,
    ...row,
    title: row.title,
    message: row.body, // Map body to message for frontend
    type: payload.type,
    caseId: payload.caseId,
    caseData: payload.caseData,
    recipientUid: row.recipient_uid,
    actorUid: row.actor_uid,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    read: !!row.read,
  };
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Normalize userId - use empty string as falsy check
    const normalizedUserId = String(userId || "").trim();
    
    if (!normalizedUserId) {
      console.log("[useNotifications] No userId provided:", userId);
      return;
    }

    let isActive = true;

    // Initial load
    const loadNotifications = async () => {
      try {
        console.log("[useNotifications] Loading for userId:", normalizedUserId);
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_uid", normalizedUserId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[useNotifications] Query error:", error);
          throw error;
        }

        const normalized = (data || []).map(normalizeNotification);

        if (!isActive) return;
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.read).length);
        console.log("[useNotifications] Initial load:", normalized.length, "notifications");
      } catch (error) {
        console.error("[useNotifications] Initial load error:", error);
        if (!isActive) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`notifications:${normalizedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_uid=eq.${normalizedUserId}`,
        },
        (payload) => {
          if (!isActive) return;

          console.log("[useNotifications] Real-time update:", payload.eventType);

          if (payload.eventType === "INSERT") {
            setNotifications((prev) => {
              const normalized = normalizeNotification(payload.new);
              return [normalized, ...prev];
            });
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? normalizeNotification(payload.new) : n
              )
            );
            const oldWasRead = payload.old.read;
            const newIsRead = payload.new.read;
            if (!oldWasRead && newIsRead) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            } else if (oldWasRead && !newIsRead) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
            if (!payload.old.read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[useNotifications] Subscription status:", status);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe().catch(err => {
        console.warn("[useNotifications] Unsubscribe error:", err);
      });
    };
  }, [userId]);

  return { notifications, unreadCount };
}
