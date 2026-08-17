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
    if (!userId) {
      console.log("[useNotifications] No userId provided");
      return;
    }

    let isActive = true;

    // Initial load
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_uid", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map(normalizeNotification);

        if (!isActive) return;
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.read).length);
        console.log("[useNotifications] Initial load:", normalized);
      } catch (error) {
        console.error("[useNotifications] Initial load error:", error);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_uid=eq.${userId}`,
        },
        (payload) => {
          if (!isActive) return;

          console.log("[useNotifications] Real-time update:", payload);

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
      .subscribe();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [userId]);

  return { notifications, unreadCount };
}
