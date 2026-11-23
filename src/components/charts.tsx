import { useId } from 'react';

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export function Sparkline({
  data,
  up,
  width = 56,
  height = 24,
}: {
  data: number[];
  up: boolean;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts: [number, number][] = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - 2 - ((v - min) / span) * (height - 4),
  ]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path
        d={smoothPath(pts)}
        fill="none"
        stroke={up ? '#F04452' : '#3182F6'}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AreaChart({
  data,
  baseline,
  up,
  height = 168,
  showGrid = true,
}: {
  data: number[];
  baseline?: number;
  up: boolean;
  height?: number;
  showGrid?: boolean;
}) {
  const gid = useId().replace(/[:]/g, '');
  const W = 360;
  const H = height;
  const ref = baseline ?? data[0];
  const min = Math.min(...data, ref);
  const max = Math.max(...data, ref);
  const pad = (max - min) * 0.18 || Math.max(1, max * 0.01);
  const lo = min - pad;
  const hi = max + pad;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const pts: [number, number][] = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * W,
    y(v),
  ]);
  const line = smoothPath(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = up ? '#F04452' : '#3182F6';
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.26" />
          <stop offset="70%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showGrid &&
        [0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={0}
            x2={W}
            y1={H * r}
            y2={H * r}
            stroke="#F2F4F6"
            strokeOpacity={0.05}
            strokeDasharray="3 5"
          />
        ))}
      {baseline !== undefined && (
        <line
          x1={0}
          x2={W}
          y1={y(baseline)}
          y2={y(baseline)}
          stroke="#8B95A1"
          strokeOpacity={0.45}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
      <path d={area} fill={`url(#fill-${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0] - 3} cy={last[1]} r={3.4} fill={color} />
      <circle cx={last[0] - 3} cy={last[1]} r={7} fill={color} opacity={0.22} />
    </svg>
  );
}

export interface CandleLike {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export function CandleChart({
  candles,
  avgPrice,
  height = 210,
  showVolume = true,
}: {
  candles: CandleLike[];
  avgPrice?: number;
  height?: number;
  showVolume?: boolean;
}) {
  const W = 360;
  const H = height;
  const volH = showVolume ? 42 : 0;
  const chartH = H - volH - 6;
  if (candles.length === 0) return null;

  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  if (avgPrice) {
    lows.push(avgPrice);
    highs.push(avgPrice);
  }
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.08 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const y = (v: number) => chartH - ((v - lo) / (hi - lo)) * chartH;

  const slot = W / Math.max(candles.length, 1);
  const bodyW = Math.max(4, Math.min(15, slot * 0.52));
  const volMax = Math.max(...candles.map((c) => c.v)) || 1;

  const ma: [number, number][] = [];
  candles.forEach((_, i) => {
    if (i < 4) return;
    const win = candles.slice(i - 4, i + 1);
    const avg = win.reduce((s, c) => s + c.c, 0) / win.length;
    ma.push([slot * i + slot / 2, y(avg)]);
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      {[0.25, 0.5, 0.75].map((r) => (
        <line
          key={r}
          x1={0}
          x2={W}
          y1={chartH * r}
          y2={chartH * r}
          stroke="#F2F4F6"
          strokeOpacity={0.05}
          strokeDasharray="3 5"
        />
      ))}
      {candles.map((c, i) => {
        const cx = slot * i + slot / 2;
        const rising = c.c >= c.o;
        const color = rising ? '#F04452' : '#3182F6';
        const top = y(Math.max(c.o, c.c));
        const bottom = y(Math.min(c.o, c.c));
        const bodyH = Math.max(1.4, bottom - top);
        const volBarH = (c.v / volMax) * (volH - 8);
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1} opacity={0.9} />
            <rect
              x={cx - bodyW / 2}
              y={top}
              width={bodyW}
              height={bodyH}
              rx={1}
              fill={rising ? '#F04452' : '#3182F6'}
              opacity={rising ? 1 : 0.92}
            />
            {showVolume && (
              <rect
                x={cx - bodyW / 2}
                y={H - volBarH}
                width={bodyW}
                height={volBarH}
                rx={1}
                fill={color}
                opacity={0.22}
              />
            )}
          </g>
        );
      })}
      {ma.length > 1 && (
        <path
          d={smoothPath(ma)}
          fill="none"
          stroke="#F2C94C"
          strokeWidth={1.4}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />
      )}
      {avgPrice !== undefined && (
        <>
          <line
            x1={0}
            x2={W}
            y1={y(avgPrice)}
            y2={y(avgPrice)}
            stroke="#00C471"
            strokeWidth={1}
            strokeDasharray="5 4"
            strokeOpacity={0.9}
          />
          <rect x={W - 44} y={y(avgPrice) - 9} width={44} height={18} rx={4} fill="#00C471" />
          <text
            x={W - 22}
            y={y(avgPrice) + 3.5}
            fill="#101014"
            fontSize={9.5}
            fontWeight={700}
            textAnchor="middle"
          >
            평단
          </text>
        </>
      )}
    </svg>
  );
}
