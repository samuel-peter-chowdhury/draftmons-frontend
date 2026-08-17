/**
 * Fixed, purely decorative background layer shared by the public and
 * protected layouts: a soft amber radial glow plus a faint noise overlay,
 * giving the app its atmospheric "premium dark tool" feel.
 *
 * It sits behind all content (`-z-10`, `pointer-events-none`, `fixed`) and
 * must never affect scroll or layout — it composes independently of the
 * per-page spacious/compact density convention.
 */

// Inline SVG fractal-noise data URI (latin-only, tiny) used as a texture.
const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Amber radial glow anchored to the top of the viewport */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.03) 0%, transparent 50%)',
        }}
      />
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: NOISE_SVG, opacity: 0.02 }}
      />
    </div>
  );
}
