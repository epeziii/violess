import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      console.log("[useNotifications] No userId provided");
      return;
    }

    let isActive = true;
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_uid", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map((row) => ({
          id: row.id,
          ...row,
          recipientUid: row.recipient_uid,
          actorUid: row.actor_uid,
          createdAt: row.created_at ? new Date(row.created_at) : null,
          read: !!row.read,
        }));

        if (!isActive) return;
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.read).length);
      } catch (error) {
        console.error("[useNotifications] Supabase listener error:", error);
      }
    };

    loadNotifications();
    return () => { isActive = false; };
  }, [userId]);

  return { notifications, unreadCount };
}
