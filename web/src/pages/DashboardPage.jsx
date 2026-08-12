// DashboardPage.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    active: 0,
    resolved: 0
  });

  // Fetch statistics from all reports
  useEffect(() => {
    try {
      const q = query(collection(db, "reports"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalCount = 0;
        let urgentCount = 0;
        let activeCount = 0;
        let resolvedCount = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const status = data.status;
          const priorityLevel = data.priorityLevel;

          totalCount++;

          if (status === "resolved") {
            resolvedCount++;
          } else if (priorityLevel === "urgent") {
            urgentCount++;
          } else if (status === "pending" || status === "reviewing") {
            activeCount++;
          }
        });

        setStats({
          total: totalCount,
          urgent: urgentCount,
          active: activeCount,
          resolved: resolvedCount
        });
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Dashboard (Removed)</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Content moved to Case Management and Dashboard Analytics.</p>
      </div>
    </div>
  );
}
