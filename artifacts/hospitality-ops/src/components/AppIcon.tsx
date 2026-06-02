export function AppIcon({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", background: "#0B54BD", borderRadius: "22%", overflow: "hidden", flexShrink: 0 }}
    >
      <img src="/logo.png" alt="Kitchen Command" style={{ width: "100%", height: "100%", display: "block" }} />
    </span>
  );
}
