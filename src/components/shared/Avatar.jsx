// Circular avatar. Renders an image when `src` is provided, otherwise falls
// back to the first letter of `name` on a colored background (defaults to
// --sf-accent, or use `color` to pass a team_color straight from the DB —
// the one legitimate case for inline hex in the app).

const SIZES = { 24: 24, 32: 32, 40: 40, 56: 56 };
const FONT_FOR = { 24: 10, 32: 13, 40: 15, 56: 20 };

export default function Avatar({ src, name = '', size = 32, color, alt, className = '' }) {
  const px = SIZES[size] || 32;
  const initial = (name.trim() || '?').charAt(0).toUpperCase();
  const bg = color || 'var(--sf-accent)';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`object-cover ${className}`}
        style={{ width: px, height: px, borderRadius: '50%' }}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center font-semibold ${className}`}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        backgroundColor: bg,
        color: 'var(--sf-text-inverse)',
        fontSize: FONT_FOR[px] || 13,
      }}
      aria-label={alt || name}
    >
      {initial}
    </div>
  );
}
