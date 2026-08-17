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

        const normalized = (data || []).map((row) => {
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
        });

        if (!isActive) return;
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.read).length);
        console.log("[useNotifications] Loaded notifications:", normalized);
      } catch (error) {
        console.error("[useNotifications] Supabase fetch error:", error);
      }
    };

    loadNotifications();
    return () => { isActive = false; };
  }, [userId]);

  return { notifications, unreadCount };
}
