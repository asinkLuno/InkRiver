/**
 * 经纬母题:三条经线(虚点)与两条穿行的染线(纬),
 * 呼应 WEFT 标志中穿过经线的纬线。
 */
export function ThreadMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 80"
      fill="none"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {[16, 40, 64].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="280"
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="1.5 6"
          strokeLinecap="round"
          opacity="0.3"
        />
      ))}
      <path
        d="M6 66 C 46 10, 76 10, 106 40 S 166 72, 196 42 S 252 12, 274 24"
        stroke="var(--dye-1)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M6 14 C 52 66, 88 66, 122 38 S 186 8, 216 40 S 262 68, 274 56"
        stroke="var(--dye-2)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="106" cy="40" r="3.5" fill="var(--dye-1)" />
      <circle cx="196" cy="42" r="3.5" fill="var(--dye-1)" />
      <circle cx="122" cy="38" r="3.5" fill="var(--dye-2)" />
      <circle cx="216" cy="40" r="3.5" fill="var(--dye-2)" />
    </svg>
  );
}
