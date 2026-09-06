const WARPS = [24, 48, 72, 96, 120, 144, 168, 192, 216];

/**
 * The landing moment: warp threads fade in, then one indigo weft is drawn
 * across them — the app's name, enacted once on load. Static (the finished
 * weave) when reduced motion is requested.
 */
export function LandingLoom() {
  return (
    <svg
      viewBox="0 0 240 88"
      className="mx-auto h-20 w-60"
      aria-hidden="true"
    >
      <g
        stroke="var(--border)"
        strokeWidth="1"
        className="animate-[warp-in_0.7s_ease-out_both] motion-reduce:animate-none"
      >
        {WARPS.map((x) => (
          <line key={x} x1={x} y1={10} x2={x} y2={78} />
        ))}
      </g>
      <path
        d="M8 24 L64 64 L120 24 L176 64 L232 24"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
        className="animate-[weft-draw_1.5s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] motion-reduce:animate-none"
      />
      <g
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="3"
        className="animate-[warp-in_0.4s_ease-out_1.5s_both] motion-reduce:animate-none"
      >
        <circle cx={64} cy={64} r={4.5} />
        <circle cx={176} cy={64} r={4.5} />
      </g>
      <g fill="var(--primary)" stroke="none">
        <circle cx={8} cy={24} r={3.5} />
        <circle cx={232} cy={24} r={3.5} />
      </g>
    </svg>
  );
}
