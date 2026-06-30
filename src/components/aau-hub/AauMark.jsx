// The Aster constellation mark, rendered INLINE (not <img src>) so it can never
// hit the broken-image path a separate asset fetch can, and so it carries the
// gold→flame gradient for pop. Geometry mirrors public/brand/aster-mark-gold.svg.
// Gradient stops use --as-* tokens via inline style (reliably resolved on inline
// SVG); no hardcoded hex.
export default function AauMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 104" role="img" aria-label="Aster Sports" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id="aauMarkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--as-flame-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--as-accent)' }} />
        </linearGradient>
      </defs>
      <g stroke="url(#aauMarkGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M50,12 L16,62" />
        <path d="M50,12 L84,62" />
        <path d="M50,12 L50,92" />
        <path d="M50,52 L34,66" />
        <path d="M50,52 L66,66" />
        <path d="M34,66 L50,92" />
        <path d="M66,66 L50,92" />
        <path d="M16,62 L34,66" />
        <path d="M84,62 L66,66" />
      </g>
      <g fill="url(#aauMarkGrad)">
        <circle cx="50" cy="52" r="4" />
        <circle cx="34" cy="66" r="3.4" />
        <circle cx="66" cy="66" r="3.4" />
        <circle cx="50" cy="92" r="4" />
        <path d="M50,1 L53,9 L61,12 L53,15 L50,23 L47,15 L39,12 L47,9 Z" />
        <path d="M16,55 L18,60 L23,62 L18,64 L16,69 L14,64 L9,62 L14,60 Z" />
        <path d="M84,55 L86,60 L91,62 L86,64 L84,69 L82,64 L77,62 L82,60 Z" />
      </g>
    </svg>
  );
}
