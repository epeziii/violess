// Badge.jsx
const STATUS_LABELS = {
  closed: "Case Closed",
  pending_admin_review: "Pending Admin Review",
  reviewing: "Under Review",
  referred: "Referred",
};

export default function Badge({ status }) {
  const label = STATUS_LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown");
  return <span className={`badge badge-${status}`}>{label}</span>;
}