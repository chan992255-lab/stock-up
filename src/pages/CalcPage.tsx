import { useMemo, useState } from 'react';
import type { AppApi } from '../lib/api';
import { useSummary } from '../lib/store';
import { formatNumberInput, pct, priceOf, signedWon, timeKo, toneText, won } from '../lib/format';
import { InfoIcon } from '../components/Icons';
import { StockAvatar } from '../components/Avatar';
import { getStock } from '../lib/stocks';

const parse = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0;

function NumField({
  label,
  value,
  onChange,
  suffix,
  placeholder = '0',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11.5px] text-sub">{label}</span>
      <div className="mt-1 flex items-center gap-1.5 rounded-xl border border-line bg-raised px-3 py-2.5">
        <input
          value={value}
          onChange={(e) => onChange(formatNumberInput(e.target.value))}
          inputMode="decimal"
          placeholder={placeholder}
          className="num w-full bg-transparent text-right text-[14.5px] font-semibold text-ink placeholder:text-[#4C525D]"
        />
        <span className="shrink-0 text-[11.5px] font-medium text-sub">{suffix}</span>
      </div>
    </label>
  );
}

export function CalcPage({ api }: { api: AppApi }) {
  const s = useSummary(api.trading.state);
  const [avg, setAvg] = useState('72,000');
  const [qty, setQty] = useState('20');
  const [addPrice, setAddPrice] = useState('65,000');
  const [addQty, setAddQty] = useState('20');

  const [buyPrice, setBuyPrice] = useState('68,000');
  const [buyQty, setBuyQty] = useState('10');
  const [mode, setMode] = useState<'price' | 'pct'>('price');
  const [sellPrice, setSellPrice] = useState('82,000');
  const [targetPct, setTargetPct] = useState('20');

  const m = useMemo(() => {
    const a = parse(avg);
    const q = parse(qty);
    const ap = parse(addPrice);
    const aq = parse(addQty);
    const totalQty = q + aq;
    const totalInvested = a * q + ap * aq;
    const newAvg = totalQty > 0 ? totalInvested / totalQty : 0;
    const gapToBreakEven = ap > 0 ? ((newAvg - ap) / ap) * 100 : 0;
    const avgChange = a > 0 ? ((newAvg - a) / a) * 100 : 0;
    return { a, q, ap, aq, totalQty, totalInvested, newAvg, gapToBreakEven, avgChange };
  }, [avg, qty, addPrice, addQty]);

  const target = useMemo(() => {
    const p = parse(buyPrice);
    const q = parse(buyQty);
    const sell =
      mode === 'price' ? parse(sellPrice) : p * (1 + parse(targetPct) / 100);
    const invested = p * q;
    const value = sell * q;
    const profit = value - invested;
    const ret = invested > 0 ? (profit / invested) * 100 : 0;
    return { p, q, sell, invested, value, profit, ret };
  }, [buyPrice, buyQty, sellPrice, targetPct, mode]);

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 bg-bg px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-[20px] font-bold tracking-tight">계산기</h1>
        <p className="mt-0.5 text-[12px] text-sub">물타기와 목표 수익률을 바로 계산해 보세요</p>
      </header>

      <section className="px-4 pt-1">
        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">물타기 계산기</h2>
            <span className="text-[11px] text-sub">추가 매수 후 평단</span>
          </div>

          {s.positions.length > 0 && (
            <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {s.positions.map((p) => (
                <button
                  key={p.stock.id}
                  type="button"
                  onClick={() => {
                    setAvg(String(Math.round(p.avg * 100) / 100));
                    setQty(String(p.qty));
                    setAddPrice(
                      String(
                        p.stock.currency === 'USD'
                          ? Number(p.price.toFixed(2))
                          : Math.round(p.price),
                      ),
                    );
                    api.toast(`${p.stock.name} 보유 정보를 채웠어요.`, 'mint');
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-raised py-1 pl-1 pr-2.5 active:opacity-80"
                >
                  <StockAvatar stock={p.stock} size={18} />
                  <span className="text-[11.5px] font-medium">{p.stock.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <NumField label="현재 평균 단가" value={avg} onChange={setAvg} suffix="원" />
            <NumField label="보유 수량" value={qty} onChange={setQty} suffix="주" />
            <NumField label="추가 매수 단가" value={addPrice} onChange={setAddPrice} suffix="원" />
            <NumField label="추가 매수 수량" value={addQty} onChange={setAddQty} suffix="주" />
          </div>

          <div className="mt-3 rounded-xl bg-raised p-3.5">
            <p className="text-[11.5px] text-sub">새 평균 단가</p>
            <p className="num mt-0.5 text-[24px] font-bold tracking-tight">
              {m.totalQty > 0 ? won(m.newAvg) : '—'}
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
              <div>
                <p className="text-[10.5px] text-sub">총 수량</p>
                <p className="num mt-0.5 text-[12.5px] font-semibold">
                  {m.totalQty.toLocaleString('ko-KR')}주
                </p>
              </div>
              <div>
                <p className="text-[10.5px] text-sub">총 투자금</p>
                <p className="num mt-0.5 text-[12.5px] font-semibold">{won(m.totalInvested)}</p>
              </div>
              <div>
                <p className="text-[10.5px] text-sub">평단 변동</p>
                <p className={`num mt-0.5 text-[12.5px] font-semibold ${toneText(m.avgChange)}`}>
                  {pct(m.avgChange)}
                </p>
              </div>
            </div>
            {m.totalQty > 0 && (
              <p className="mt-2.5 text-[11px] leading-relaxed text-sub">
                추가 매수 단가에서{' '}
                <span className="font-semibold text-ink">{pct(m.gapToBreakEven)}</span> 오르면
                본전이에요.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="card p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">목표 수익률 계산기</h2>
            <div className="flex rounded-lg bg-raised p-0.5">
              {(['price', 'pct'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMode(v)}
                  className={`rounded-md px-2 py-1 text-[10.5px] font-semibold ${
                    mode === v ? 'bg-[#2C2C35] text-ink' : 'text-sub'
                  }`}
                >
                  {v === 'price' ? '매도가' : '수익률'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <NumField label="매수 단가" value={buyPrice} onChange={setBuyPrice} suffix="원" />
            <NumField label="수량" value={buyQty} onChange={setBuyQty} suffix="주" />
            {mode === 'price' ? (
              <div className="col-span-2">
                <NumField
                  label="목표 매도가"
                  value={sellPrice}
                  onChange={setSellPrice}
                  suffix="원"
                />
              </div>
            ) : (
              <div className="col-span-2">
                <NumField
                  label="목표 수익률"
                  value={targetPct}
                  onChange={setTargetPct}
                  suffix="%"
                />
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl bg-raised p-3.5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11.5px] text-sub">예상 수익</p>
                <p className={`num mt-0.5 text-[24px] font-bold tracking-tight ${toneText(target.profit)}`}>
                  {signedWon(target.profit)}
                </p>
              </div>
              <span
                className={`num rounded-lg px-2 py-1 text-[12.5px] font-bold ${
                  target.profit >= 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                }`}
              >
                {pct(target.ret)}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line pt-2.5">
              <div>
                <p className="text-[10.5px] text-sub">목표 매도가</p>
                <p className="num mt-0.5 text-[12.5px] font-semibold">{won(target.sell)}</p>
              </div>
              <div>
                <p className="text-[10.5px] text-sub">평가 금액</p>
                <p className="num mt-0.5 text-[12.5px] font-semibold">{won(target.value)}</p>
              </div>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10.5px] text-sub">
            <InfoIcon size={12} /> 수수료·세금은 반영하지 않았어요.
          </p>
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">매매 기록</h2>
          <span className="text-[11.5px] text-sub">최근 {Math.min(50, api.trading.state.trades.length)}건</span>
        </div>
        {api.trading.state.trades.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2C2C35] px-5 py-9 text-center">
            <p className="text-[13.5px] font-semibold">아직 매매 기록이 없어요</p>
            <p className="mt-1 text-[12px] text-sub">첫 모의매수를 하면 여기에 쌓여요.</p>
          </div>
        ) : (
          <ul className="mt-1">
            {api.trading.state.trades.slice(0, 50).map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 border-b border-line/70 py-2.5 last:border-0">
                <span
                  className={`shrink-0 rounded-md px-1.5 py-[3px] text-[10.5px] font-bold ${
                    t.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                  }`}
                >
                  {t.side === 'buy' ? '매수' : '매도'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{t.name}</p>
                  <p className="num text-[11px] text-sub">
                    {t.qty.toLocaleString('ko-KR')}주 · {priceOf(t.price, getStock(t.stockId).currency)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[12.5px] font-semibold">{won(t.amount)}</p>
                  <p className="num text-[10.5px] text-sub">{timeKo(t.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
