import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

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

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [userId]);

  return { notifications, unreadCount };
}
