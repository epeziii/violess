export default function Icon({ icon, size = "1em", color = "currentColor", className = "" }) {
  return (
    <i
      className={`fas fa-${icon} ${className}`}
      style={{
        fontSize: size,
        color,
        display: "inline-block"
      }}
    />
  );
}
