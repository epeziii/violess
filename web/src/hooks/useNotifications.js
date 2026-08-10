import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      console.log("[useNotifications] No userId provided");
      return;
    }

    console.log("[useNotifications] Setting up listener for userId:", userId);

    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientUid", "==", userId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        console.log("[useNotifications] Received notifications:", notifs.length, notifs);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }, (error) => {
        console.error("[useNotifications] Firestore listener error:", error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("[useNotifications] Error setting up listener:", error);
    }
  }, [userId]);

  return { notifications, unreadCount };
}
