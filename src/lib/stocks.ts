export type Currency = 'KRW' | 'USD';
export type Market = 'KR' | 'US';

export interface Stock {
  id: string;
  code: string;
  name: string;
  market: Market;
  marketLabel: string;
  sector: string;
  color: string;
  currency: Currency;
  price: number;
  prevClose: number;
  changePct: number;
  changeAbs: number;
  series: number[]; // 1년 일봉 (252)
  intraday: number[]; // 1일 5분봉 (78)
  marketCap: number; // 원
  high52: number;
  low52: number;
  volume: number;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeries(seed: number, price: number, vol: number): number[] {
  const rnd = mulberry32(seed);
  const n = 252;
  let v = 1;
  const raw: number[] = [];
  for (let i = 0; i < n; i += 1) {
    v *= 1 + (rnd() - 0.5) * 2 * vol + 0.0009;
    raw.push(v);
  }
  const scale = price / raw[n - 1];
  return raw.map((x) => x * scale);
}

function buildIntraday(seed: number, prevClose: number, price: number): number[] {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const n = 78;
  const points: number[] = [];
  let v = prevClose;
  for (let i = 0; i < n; i += 1) {
    v *= 1 + (rnd() - 0.5) * 0.0034;
    points.push(v);
  }
  // 마지막 봉이 현재가가 되도록 완만하게 보정한다.
  return points.map((p, i) => {
    const t = i / (n - 1);
    return p + (price - points[n - 1]) * t;
  });
}

interface Seed {
  id: string;
  name: string;
  market: Market;
  marketLabel: string;
  sector: string;
  color: string;
  currency: Currency;
  price: number;
  cap: number; // 조 원 단위
  vol: number;
}

const SEEDS: Seed[] = [
  { id: '005930', name: '삼성전자', market: 'KR', marketLabel: '코스피', sector: '반도체', color: '#1428A0', currency: 'KRW', price: 71400, cap: 426.3, vol: 0.016 },
  { id: '000660', name: 'SK하이닉스', market: 'KR', marketLabel: '코스피', sector: '반도체', color: '#EA002C', currency: 'KRW', price: 185300, cap: 134.9, vol: 0.021 },
  { id: '005380', name: '현대차', market: 'KR', marketLabel: '코스피', sector: '자동차', color: '#002C5F', currency: 'KRW', price: 252000, cap: 52.8, vol: 0.015 },
  { id: '035420', name: 'NAVER', market: 'KR', marketLabel: '코스피', sector: '인터넷', color: '#03C75A', currency: 'KRW', price: 218500, cap: 34.2, vol: 0.018 },
  { id: '035720', name: '카카오', market: 'KR', marketLabel: '코스피', sector: '인터넷', color: '#FEE500', currency: 'KRW', price: 46850, cap: 20.7, vol: 0.022 },
  { id: '373220', name: 'LG에너지솔루션', market: 'KR', marketLabel: '코스피', sector: '2차전지', color: '#A50034', currency: 'KRW', price: 388000, cap: 90.8, vol: 0.019 },
  { id: '207940', name: '삼성바이오로직스', market: 'KR', marketLabel: '코스피', sector: '바이오', color: '#0B5CAD', currency: 'KRW', price: 1043000, cap: 74.2, vol: 0.014 },
  { id: '068270', name: '셀트리온', market: 'KR', marketLabel: '코스피', sector: '바이오', color: '#E4002B', currency: 'KRW', price: 178400, cap: 38.8, vol: 0.02 },
  { id: '005490', name: 'POSCO홀딩스', market: 'KR', marketLabel: '코스피', sector: '철강', color: '#0073A8', currency: 'KRW', price: 372500, cap: 31.5, vol: 0.018 },
  { id: '000270', name: '기아', market: 'KR', marketLabel: '코스피', sector: '자동차', color: '#05141F', currency: 'KRW', price: 118700, cap: 47.5, vol: 0.016 },
  { id: '105560', name: 'KB금융', market: 'KR', marketLabel: '코스피', sector: '금융', color: '#FFB800', currency: 'KRW', price: 88900, cap: 34.1, vol: 0.013 },
  { id: '012450', name: '한화에어로스페이스', market: 'KR', marketLabel: '코스피', sector: '방산', color: '#F37321', currency: 'KRW', price: 402000, cap: 20.4, vol: 0.026 },
  { id: '247540', name: '에코프로비엠', market: 'KR', marketLabel: '코스닥', sector: '2차전지', color: '#00A0E9', currency: 'KRW', price: 168300, cap: 16.4, vol: 0.03 },
  { id: '196170', name: '알테오젠', market: 'KR', marketLabel: '코스닥', sector: '바이오', color: '#0E4C92', currency: 'KRW', price: 312500, cap: 33.2, vol: 0.028 },
  { id: '028300', name: 'HLB', market: 'KR', marketLabel: '코스닥', sector: '바이오', color: '#00B140', currency: 'KRW', price: 78900, cap: 10.3, vol: 0.032 },
  { id: 'NVDA', name: '엔비디아', market: 'US', marketLabel: '나스닥', sector: '반도체', color: '#76B900', currency: 'USD', price: 186.5, cap: 4520, vol: 0.028 },
  { id: 'TSLA', name: '테슬라', market: 'US', marketLabel: '나스닥', sector: '자동차', color: '#E82127', currency: 'USD', price: 421.06, cap: 1350, vol: 0.036 },
  { id: 'AAPL', name: '애플', market: 'US', marketLabel: '나스닥', sector: 'IT', color: '#A2AAAD', currency: 'USD', price: 268.3, cap: 5620, vol: 0.017 },
  { id: 'MSFT', name: '마이크로소프트', market: 'US', marketLabel: '나스닥', sector: 'IT', color: '#00A4EF', currency: 'USD', price: 512.4, cap: 5310, vol: 0.016 },
  { id: 'NKE', name: '나이키', market: 'US', marketLabel: '뉴욕', sector: '소비재', color: '#111111', currency: 'USD', price: 64.2, cap: 133, vol: 0.021 },
  { id: 'AMZN', name: '아마존', market: 'US', marketLabel: '나스닥', sector: '소비재', color: '#FF9900', currency: 'USD', price: 233.1, cap: 3400, vol: 0.02 },
  { id: 'GOOGL', name: '알파벳', market: 'US', marketLabel: '나스닥', sector: '인터넷', color: '#4285F4', currency: 'USD', price: 318.7, cap: 5410, vol: 0.018 },
  { id: 'PLTR', name: '팔란티어', market: 'US', marketLabel: '나스닥', sector: 'IT', color: '#101113', currency: 'USD', price: 174.2, cap: 580, vol: 0.04 },
  { id: 'AVGO', name: '브로드컴', market: 'US', marketLabel: '나스닥', sector: '반도체', color: '#CC092F', currency: 'USD', price: 402.8, cap: 2600, vol: 0.024 },
  { id: 'COIN', name: '코인베이스', market: 'US', marketLabel: '나스닥', sector: '금융', color: '#0052FF', currency: 'USD', price: 318.4, cap: 120, vol: 0.045 },
];

function build(seed: Seed): Stock {
  const series = buildSeries(hash(seed.id), seed.price, seed.vol);
  const prevClose = series[series.length - 2];
  const changeAbs = seed.price - prevClose;
  const changePct = (changeAbs / prevClose) * 100;
  const recent = series.slice(-252);
  return {
    id: seed.id,
    code: seed.market === 'KR' ? seed.id : seed.id,
    name: seed.name,
    market: seed.market,
    marketLabel: seed.marketLabel,
    sector: seed.sector,
    color: seed.color,
    currency: seed.currency,
    price: seed.price,
    prevClose,
    changePct,
    changeAbs,
    series,
    intraday: buildIntraday(hash(seed.name), prevClose, seed.price),
    marketCap: seed.cap * 1e12,
    high52: Math.max(...recent) * 1.06,
    low52: Math.min(...recent) * 0.94,
    volume: Math.round(1_200_000 + (hash(`${seed.id}v`) % 8_000_000)),
  };
}

export const STOCKS: Stock[] = SEEDS.map(build);
export const STOCK_BY_ID: Record<string, Stock> = Object.fromEntries(
  STOCKS.map((s) => [s.id, s]),
);

export const getStock = (id: string): Stock => STOCK_BY_ID[id] ?? STOCKS[0];

export interface IndexQuote {
  id: string;
  label: string;
  value: number;
  changePct: number;
  digits: number;
}

export const INDICES: IndexQuote[] = [
  { id: 'kospi', label: '코스피', value: 2684.32, changePct: 0.62, digits: 2 },
  { id: 'kosdaq', label: '코스닥', value: 782.14, changePct: -0.48, digits: 2 },
  { id: 'nasdaq', label: '나스닥', value: 24182.6, changePct: 1.12, digits: 2 },
  { id: 'usdkrw', label: '원/달러', value: 1385.4, changePct: 0.21, digits: 1 },
];

export type Period = '1d' | '1w' | '1m' | '3m' | '1y';

export const PERIODS: { id: Period; label: string }[] = [
  { id: '1d', label: '1일' },
  { id: '1w', label: '1주' },
  { id: '1m', label: '1달' },
  { id: '3m', label: '3달' },
  { id: '1y', label: '1년' },
];

/** 해당 기간의 가격 흐름 (현재가로 끝난다) */
export function seriesFor(stock: Stock, period: Period, current: number): number[] {
  const scale = current / stock.price;
  const base =
    period === '1d'
      ? stock.intraday
      : period === '1w'
        ? stock.series.slice(-7)
        : period === '1m'
          ? stock.series.slice(-21)
          : period === '3m'
            ? stock.series.slice(-63)
            : stock.series;
  const scaled = base.map((p) => p * scale);
  scaled[scaled.length - 1] = current;
  return scaled;
}

export function periodReturn(stock: Stock, period: Period, current: number): number {
  const s = seriesFor(stock, period, current);
  return ((s[s.length - 1] - s[0]) / s[0]) * 100;
}

/** 스파크라인용 최근 30일 흐름 */
export function sparkFor(stock: Stock, current: number): number[] {
  const scale = current / stock.price;
  const s = stock.series.slice(-30).map((p) => p * scale);
  s[s.length - 1] = current;
  return s;
}

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/** 게임용 20일봉 생성 */
export function buildCandles(seed: number, n = 20, start = 68000): Candle[] {
  const rnd = mulberry32(seed);
  const candles: Candle[] = [];
  let price = start;
  let trend = 0;
  for (let i = 0; i < n; i += 1) {
    trend = trend * 0.7 + (rnd() - 0.48) * 0.012;
    const o = price;
    const drift = trend + (rnd() - 0.5) * 0.026;
    const c = Math.max(1000, o * (1 + drift));
    const h = Math.max(o, c) * (1 + rnd() * 0.012);
    const l = Math.min(o, c) * (1 - rnd() * 0.012);
    candles.push({ o, h, l, c, v: Math.round(400_000 + rnd() * 2_600_000) });
    price = c;
  }
  return candles;
}
