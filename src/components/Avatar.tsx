import type { Stock } from '../lib/stocks';

function readable(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#101014' : '#FFFFFF';
}

export function StockAvatar({
  stock,
  size = 40,
  ring = false,
}: {
  stock: Stock;
  size?: number;
  ring?: boolean;
}) {
  const label = stock.name.slice(0, 1);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-white/10 ${
        ring ? 'ring-white/20' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: stock.color,
        color: readable(stock.color),
        fontSize: size * 0.4,
      }}
      aria-hidden
    >
      {label}
    </div>
  );
}
