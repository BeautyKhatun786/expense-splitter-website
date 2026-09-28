const PALETTE = ["#ff6b5b", "#4bdb9e", "#8b7cf6", "#ffb454", "#5bc8ff", "#ff9ecb"];

function colorFor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ name, size = "default" }) {
  return (
    <div
      className={`avatar ${size === "small" ? "small" : ""}`}
      style={{ background: colorFor(name) }}
    >
      {initials(name)}
    </div>
  );
}
