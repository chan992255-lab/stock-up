const nf = new Intl.NumberFormat('ko-KR');

/** 1,085,000원 */
export const won = (n: number): string => `${nf.format(Math.round(n))}원`;

/** +1,085,000원 / -42,000원 */
export const signedWon = (n: number): string =>
  `${n > 0 ? '+' : n < 0 ? '-' : ''}${nf.format(Math.abs(Math.round(n)))}원`;

/** +2.52% / -3.06% */
export const pct = (n: number, digits = 2): string =>
  `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;

/** $186.50 */
export const usd = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** 통화에 맞춘 주가 표기 */
export const priceOf = (n: number, currency: 'KRW' | 'USD'): string =>
  currency === 'USD' ? usd(n) : `${nf.format(Math.round(n))}원`;

/** 426.3조 / 4,500억 */
export const bigWon = (n: number): string => {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조`;
  if (n >= 1e8) return `${Math.round(n / 1e8).toLocaleString('ko-KR')}억`;
  return won(n);
};

/** 12,483,920주 → 1,248만주 */
export const volumeKo = (n: number): string => {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억주`;
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString('ko-KR')}만주`;
  return `${nf.format(Math.round(n))}주`;
};

/** 입력 중인 숫자 문자열을 천 단위 콤마로 다듬는다. */
export function formatNumberInput(raw: string, allowDecimal = false): string {
  const cleaned = raw.replace(/,/g, '').replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, '');
  if (!cleaned) return '';
  const [head, ...rest] = cleaned.split('.');
  const dec = rest.join('').slice(0, 2);
  const int = head ? Number(head).toLocaleString('ko-KR') : '0';
  return `${int}${cleaned.includes('.') ? `.${dec}` : ''}`;
}

export type Tone = 'up' | 'down' | 'flat';

export const toneOf = (n: number): Tone => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');

export const toneText = (n: number): string =>
  n > 0 ? 'text-up' : n < 0 ? 'text-down' : 'text-sub';

export const toneBg = (n: number): string =>
  n > 0 ? 'bg-up/10 text-up' : n < 0 ? 'bg-down/10 text-down' : 'bg-chip text-sub';

export const arrow = (n: number): string => (n > 0 ? '▲' : n < 0 ? '▼' : '–');

export const timeKo = (iso: string): string => {
  const d = new Date(iso);
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mi = `${d.getMinutes()}`.padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
};
