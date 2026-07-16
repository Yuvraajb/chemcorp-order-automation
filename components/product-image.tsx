// Deterministic SVG placeholder artwork for a product. Swap for real product
// photography by replacing this component's output with next/image.
interface Props {
  name: string;
  color: string;
  seed: number;
  className?: string;
}

const ICONS = [
  // Erlenmeyer flask
  "M9 3h6M10 3v5.5L4.8 17.6A2 2 0 0 0 6.6 20.5h10.8a2 2 0 0 0 1.8-2.9L14 8.5V3",
  // Drum / barrel
  "M5 5.5C5 4.1 8.1 3 12 3s7 1.1 7 2.5v13c0 1.4-3.1 2.5-7 2.5s-7-1.1-7-2.5v-13M5 9.8c1.6 1 4.1 1.5 7 1.5s5.4-.5 7-1.5M5 14.2c1.6 1 4.1 1.5 7 1.5s5.4-.5 7-1.5",
  // Beaker
  "M6 3h12M8 3v7l-3.4 7.7A2 2 0 0 0 6.4 20.5h11.2a2 2 0 0 0 1.8-2.8L16 10V3M7 14h10",
  // Test tube rack
  "M7 3v14a2.5 2.5 0 0 0 5 0V3M12 3v14a2.5 2.5 0 0 0 5 0V3M5 3h16M7 9h5M12 11h5",
];

export function ProductImage({ name, color, seed, className = "" }: Props) {
  const icon = ICONS[seed % ICONS.length];
  const angle = (seed * 47) % 360;

  return (
    <div
      role="img"
      aria-label={`Placeholder image for ${name}`}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, ${color}14 0%, ${color}2e 55%, ${color}52 100%)`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/2 w-1/2 opacity-80"
        aria-hidden="true"
      >
        <path d={icon} />
      </svg>
      <span
        className="absolute bottom-2 right-3 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color }}
      >
        Sample
      </span>
    </div>
  );
}
