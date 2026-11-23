import { useMemo, useState } from 'react';
import type { AppApi } from '../lib/api';
import { Sheet } from './Sheet';
import { AreaChart } from './charts';
import { StockAvatar } from './Avatar';
import { StarIcon } from './Icons';
import { getStock, PERIODS, periodReturn, seriesFor, type Period } from '../lib/stocks';
import { arrow, bigWon, pct, priceOf, signedWon, toneText, volumeKo, won } from '../lib/format';
import { APP } from '../config/app';
import { fxOf } from '../lib/store';

export function StockDetailSheet({
  stockId,
  onClose,
  api,
}: {
  stockId: string | null;
  onClose: () => void;
  api: AppApi;
}) {
  const [period, setPeriod] = useState<Period>('1d');
  const stock = stockId ? getStock(stockId) : null;
  const price = stockId ? api.trading.priceOf(stockId) : 0;
  const holding = stockId ? api.trading.state.holdings[stockId] : undefined;

  const series = useMemo(
    () => (stock ? seriesFor(stock, period, price) : []),
    [stock, period, price],
  );
  const ret = stock ? periodReturn(stock, period, price) : 0;
  const dayChange = stock ? price - stock.prevClose : 0;
  const dayPct = stock ? (dayChange / stock.prevClose) * 100 : 0;

  if (!stock) return null;

  const fav = api.trading.state.favorites.includes(stock.id);

  return (
    <Sheet
      open={stockId !== null}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => api.openOrder(stock.id, 'sell')}
            className="flex-1 rounded-xl bg-down py-3.5 text-[15px] font-bold text-white active:opacity-90"
          >
            매도
          </button>
          <button
            type="button"
            onClick={() => api.openOrder(stock.id, 'buy')}
            className="flex-1 rounded-xl bg-up py-3.5 text-[15px] font-bold text-white active:opacity-90"
          >
            매수
          </button>
        </div>
      }
    >
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5">
          <StockAvatar stock={stock} size={30} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[15px] font-bold">{stock.name}</p>
              <span className="shrink-0 rounded-md bg-chip px-1.5 py-[2px] text-[10px] font-medium text-sub">
                {stock.marketLabel}
              </span>
            </div>
            <p className="num text-[11.5px] text-sub">
              {stock.id} · {stock.sector}
            </p>
          </div>
          <button
            type="button"
            onClick={() => api.trading.toggleFavorite(stock.id)}
            aria-label="관심 종목"
            className="rounded-full p-1.5 active:bg-chip"
          >
            <StarIcon
              size={19}
              filled={fav}
              className={fav ? 'text-[#F5C518]' : 'text-[#4A505B]'}
            />
          </button>
        </div>

        <div className="mt-5">
          <p className="num text-[31px] font-bold leading-none tracking-tight">
            {priceOf(price, stock.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[13px]">
            <span className={`num font-semibold ${toneText(dayChange)}`}>
              {arrow(dayChange)} {priceOf(Math.abs(dayChange), stock.currency)}
            </span>
            <span className={`num font-semibold ${toneText(dayChange)}`}>({pct(dayPct)})</span>
            <span className="text-sub">오늘</span>
          </div>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-raised p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition-colors ${
                period === p.id ? 'bg-[#2C2C35] text-ink' : 'text-sub'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <AreaChart data={series} baseline={series[0]} up={ret >= 0} height={172} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <span className="text-sub">
            {PERIODS.find((p) => p.id === period)?.label} 수익률
          </span>
          <span className={`num font-semibold ${toneText(ret)}`}>{pct(ret)}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-line bg-surface p-3.5">
          <Stat label="시가총액" value={bigWon(stock.marketCap)} />
          <Stat label="거래량" value={volumeKo(stock.volume)} />
          <Stat label="52주 최고" value={priceOf(stock.high52, stock.currency)} />
          <Stat label="52주 최저" value={priceOf(stock.low52, stock.currency)} />
        </div>

        {stock.currency === 'USD' && (
          <p className="mt-2.5 text-[11px] text-sub">
            환율 1달러 = {won(APP.fx)} 적용 · 원화 환산 금액으로 모의투자돼요.
          </p>
        )}

        <div className="mt-4 rounded-2xl border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold">시세 조정</p>
            <button
              type="button"
              onClick={() => api.trading.setPrice(stock.id, stock.price)}
              className="text-[11px] text-sub underline underline-offset-2"
            >
              현재가로
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {[-3, -1, 1, 3].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  const next = Math.max(1, price * (1 + v / 100));
                  api.trading.setPrice(stock.id, stock.currency === 'USD' ? Number(next.toFixed(2)) : Math.round(next));
                  api.toast(`${v > 0 ? '+' : ''}${v}% 조정했어요.`, v > 0 ? 'up' : 'down');
                }}
                className={`num rounded-lg py-2 text-[12px] font-semibold active:opacity-80 ${
                  v > 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                }`}
              >
                {v > 0 ? `+${v}` : v}%
              </button>
            ))}
          </div>
        </div>

        {holding && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface px-3.5 py-3">
            <div>
              <p className="text-[11.5px] text-sub">내 보유</p>
              <p className="num mt-0.5 text-[13px] font-semibold">
                {holding.qty.toLocaleString('ko-KR')}주 · 평균 {priceOf(holding.avg, stock.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] text-sub">평가 손익</p>
              <p
                className={`num mt-0.5 text-[13px] font-semibold ${toneText(price - holding.avg)}`}
              >
                {signedWon((price - holding.avg) * holding.qty * fxOf(stock))}
              </p>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-sub">{label}</p>
      <p className="num mt-0.5 text-[12.5px] font-semibold">{value}</p>
    </div>
  );
}
