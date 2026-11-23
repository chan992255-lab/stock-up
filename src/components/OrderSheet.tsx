import { useMemo, useState } from 'react';
import type { AppApi } from '../lib/api';
import { Sheet } from './Sheet';
import { StockAvatar } from './Avatar';
import { MinusIcon, PlusIcon } from './Icons';
import { getStock } from '../lib/stocks';
import { pct, priceOf, signedWon, toneText, won } from '../lib/format';
import { fxOf } from '../lib/store';

const SOON = new Intl.NumberFormat('ko-KR');

/** 71400 → 71,400 / 186.5 → 186.50 */
function fmtPrice(v: number, usd: boolean): string {
  if (usd) {
    return v.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return SOON.format(Math.round(v));
}

/** 입력 중인 문자열을 천 단위 콤마로만 다듬는다. */
function fmtPriceText(raw: string, usd: boolean): string {
  const cleaned = raw.replace(/,/g, '').replace(usd ? /[^\d.]/g : /[^\d]/g, '');
  if (!cleaned) return '';
  if (usd) {
    const [head, ...rest] = cleaned.split('.');
    const dec = rest.join('').slice(0, 2);
    const int = Number(head || '0');
    return `${SOON.format(int)}${cleaned.includes('.') ? `.${dec}` : ''}`;
  }
  return SOON.format(Number(cleaned));
}

export function OrderSheet({
  order,
  onClose,
  api,
}: {
  order: { stockId: string; side: 'buy' | 'sell' } | null;
  onClose: () => void;
  api: AppApi;
}) {
  const stock = order ? getStock(order.stockId) : null;
  const [side, setSide] = useState<'buy' | 'sell'>(order?.side ?? 'buy');
  const [priceText, setPriceText] = useState(
    order
      ? fmtPrice(api.trading.priceOf(order.stockId), getStock(order.stockId).currency === 'USD')
      : '',
  );
  const [qtyText, setQtyText] = useState('');

  const price = Number(priceText.replace(/,/g, '')) || 0;
  const qty = Math.floor(Number(qtyText.replace(/,/g, '')) || 0);
  const fx = stock ? fxOf(stock) : 1;
  const amount = price * qty * fx;
  const held = order ? api.trading.state.holdings[order.stockId] : undefined;
  const cash = api.trading.state.cash;
  const maxQty =
    side === 'buy'
      ? price > 0
        ? Math.floor(cash / (price * fx))
        : 0
      : (held?.qty ?? 0);
  const shortfall = side === 'buy' ? Math.max(0, amount - cash) : 0;
  const valid =
    !!stock &&
    price > 0 &&
    qty > 0 &&
    (side === 'buy' ? amount <= cash + 0.5 : qty <= maxQty);
  const realized =
    side === 'sell' && held ? (price - held.avg) * qty * fx : 0;

  const message = useMemo(() => {
    if (!stock) return '';
    if (qty > maxQty) {
      return side === 'buy'
        ? `보유 현금으로는 최대 ${SOON.format(maxQty)}주까지 매수할 수 있어요.`
        : `보유 수량은 ${SOON.format(maxQty)}주예요.`;
    }
    if (side === 'buy' && shortfall > 0) return `${won(shortfall)}이 부족해요.`;
    return '';
  }, [stock, qty, maxQty, side, shortfall]);

  if (!stock || !order) return null;

  const applyPct = (p: number) => {
    if (maxQty <= 0) return;
    const next = p >= 100 ? maxQty : Math.max(1, Math.floor((maxQty * p) / 100));
    setQtyText(String(next));
  };

  const step = (delta: number) => {
    const next = Math.max(0, Math.min(maxQty, qty + delta));
    setQtyText(next ? String(next) : '');
  };

  const submit = () => {
    if (!valid) {
      api.toast(message || '주문 내용을 확인해 주세요.', 'up');
      return;
    }
    const res =
      side === 'buy'
        ? api.trading.buy(stock.id, price, qty)
        : api.trading.sell(stock.id, price, qty);
    api.toast(res.message, res.ok ? (side === 'buy' ? 'up' : 'down') : 'up');
    if (res.ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className={`w-full rounded-xl py-3.5 text-[15px] font-bold transition-opacity ${
              valid ? 'text-white active:opacity-90' : 'cursor-not-allowed bg-[#2A2D36] text-[#5A626E]'
            } ${valid ? (side === 'buy' ? 'bg-up' : 'bg-down') : ''}`}
          >
            {side === 'buy' ? '매수하기' : '매도하기'}
          </button>
          <p className="mt-2 text-center text-[10.5px] text-sub">
            모의투자 주문이에요. 실제로 체결되지 않아요.
          </p>
        </>
      }
    >
      <div className="px-4 pb-5">
        <div className="flex items-center gap-2.5">
          <StockAvatar stock={stock} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold">{stock.name}</p>
            <p className="num text-[11px] text-sub">
              {stock.id} · {stock.marketLabel}
            </p>
          </div>
          <span className={`ml-auto num text-[12px] ${toneText(stock.changePct)}`}>
            {pct(stock.changePct)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-raised p-1">
          <button
            type="button"
            onClick={() => {
              setSide('buy');
              setQtyText('');
            }}
            className={`rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${
              side === 'buy' ? 'bg-up text-white' : 'text-sub'
            }`}
          >
            매수
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('sell');
              setQtyText('');
            }}
            className={`rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${
              side === 'sell' ? 'bg-down text-white' : 'text-sub'
            }`}
          >
            매도
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label className="text-[12.5px] text-sub" htmlFor="order-price">
              주문 가격
            </label>
            <span className="num text-[11.5px] text-sub">
              현재가 {priceOf(api.trading.priceOf(stock.id), stock.currency)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-raised px-3.5 py-3">
            <input
              id="order-price"
              value={priceText}
              onChange={(e) =>
                setPriceText(fmtPriceText(e.target.value, stock.currency === 'USD'))
              }
              inputMode="decimal"
              className="num w-full bg-transparent text-right text-[17px] font-bold text-ink"
            />
            <span className="shrink-0 text-[13px] font-medium text-sub">
              {stock.currency === 'USD' ? 'USD' : '원'}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {[-1, 0, 1].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  const cur = api.trading.priceOf(stock.id);
                  const next = v === 0 ? cur : cur * (1 + v / 100);
                  setPriceText(fmtPrice(next, stock.currency === 'USD'));
                }}
                className="rounded-lg bg-raised py-1.5 text-[11.5px] font-medium text-sub active:bg-chip"
              >
                {v === 0 ? '현재가' : v > 0 ? '+1%' : '-1%'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label className="text-[12.5px] text-sub" htmlFor="order-qty">
              수량
            </label>
            <span className="num text-[11.5px] text-sub">
              {side === 'buy'
                ? `최대 ${SOON.format(maxQty)}주`
                : `보유 ${SOON.format(held?.qty ?? 0)}주`}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-raised px-2 py-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="수량 줄이기"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sub active:bg-chip"
            >
              <MinusIcon size={17} />
            </button>
            <input
              id="order-qty"
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="0"
              className="num w-full bg-transparent text-center text-[17px] font-bold text-ink placeholder:text-[#5A626E]"
            />
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="수량 늘리기"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sub active:bg-chip"
            >
              <PlusIcon size={17} />
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {[10, 25, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPct(p)}
                className="rounded-lg bg-raised py-1.5 text-[11.5px] font-semibold text-sub active:bg-chip"
              >
                {p === 100 ? '최대' : `${p}%`}
              </button>
            ))}
          </div>
          {message && <p className="mt-2 text-[11.5px] font-medium text-up">{message}</p>}
        </div>

        <div className="mt-5 space-y-2 rounded-2xl border border-line bg-surface p-3.5">
          <Row
            label={side === 'buy' ? '주문 가능 금액' : '매도 가능 수량'}
            value={side === 'buy' ? won(cash) : `${SOON.format(held?.qty ?? 0)}주`}
          />
          <Row label="주문 금액" value={won(amount)} strong />
          {stock.currency === 'USD' && (
            <Row label="환율" value={`1달러 = ${won(fx)}`} />
          )}
          <Row label="수수료" value="0원" />
          {side === 'sell' && (
            <Row
              label="예상 실현 손익"
              value={signedWon(realized)}
              tone={realized}
              strong
            />
          )}
          <div className="border-t border-line pt-2">
            <Row
              label={side === 'buy' ? '매수 후 현금' : '매도 후 현금'}
              value={won(side === 'buy' ? Math.max(0, cash - amount) : cash + amount)}
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: number;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12px] text-sub">{label}</span>
      <span
        className={`num ${strong ? 'text-[13.5px] font-bold' : 'text-[12.5px] font-medium'} ${
          tone === undefined ? 'text-ink' : toneText(tone)
        }`}
      >
        {value}
      </span>
    </div>
  );
}
