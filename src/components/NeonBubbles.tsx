import React from "react";

export const NeonBubbles: React.FC = () => {
  const bubbles = [
    { left: "8%", size: 240, delay: "0s", color: "cyan" },
    { left: "22%", size: 140, delay: "2s", color: "primary" },
    { left: "40%", size: 200, delay: "4s", color: "magenta" },
    { left: "60%", size: 180, delay: "1s", color: "lime" },
    { left: "78%", size: 220, delay: "3s", color: "cyan" },
    { left: "90%", size: 160, delay: "5s", color: "magenta" },
  ] as const;

  return (
    <div className="neon-bubbles">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className={`bubble ${b.color}`}
          style={{ left: b.left, width: `${b.size}px`, height: `${b.size}px`, animationDelay: b.delay } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default NeonBubbles;
