import { useState } from 'react';
import type { AppApi } from '../lib/api';
import { useSummary } from '../lib/store';
import { priceOf, pct, signedWon, timeKo, toneText, won } from '../lib/format';
import { IndexBar } from '../components/IndexBar';
import { StockAvatar } from '../components/Avatar';
import { SearchIcon, InfoIcon, TrendIcon } from '../components/Icons';

export function PortfolioPage({ api }: { api: AppApi }) {
  const { trading, go, openDetail } = api;
  const { state, shiftAllPrices, reset, loadSamples } = trading;
  const s = useSummary(state);
  const [confirmReset, setConfirmReset] = useState(false);
  const [simulatedPct, setSimulatedPct] = useState<number | null>(null);

  const stockShare = s.total === 0 ? 0 : (s.stockValue / s.total) * 100;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 bg-bg backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pb-2.5 pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[9px] bg-mint text-[14px] font-black text-[#101014]">
              S
            </span>
            <h1 className="text-[17px] font-bold tracking-tight">스톡업</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go('market')}
              aria-label="종목 검색"
              className="rounded-full p-2 text-ink active:bg-chip"
            >
              <SearchIcon size={21} />
            </button>
          </div>
        </div>
        <IndexBar />
      </header>

      <section className="px-4 pt-6">
        <p className="text-[13px] font-medium text-sub">총 자산</p>
        <div className="mt-1.5 flex items-end gap-1.5">
          <span className="num text-[34px] font-bold leading-[1.1] tracking-[-0.03em]">
            {won(s.total)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
          <span className={`num font-semibold ${toneText(s.dayPnl)}`}>
            {s.dayPnl >= 0 ? '▲' : '▼'} {won(Math.abs(s.dayPnl))}
          </span>
          <span className={`num font-semibold ${toneText(s.dayPnl)}`}>({pct(s.dayPct)})</span>
          <span className="text-sub">오늘</span>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-sub">평가금액</p>
              <p className="num mt-1 text-[21px] font-bold tracking-tight">{won(s.stockValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-sub">총 수익</p>
              <p className={`num mt-1 text-[16px] font-bold ${toneText(s.pnl)}`}>
                {signedWon(s.pnl)}
              </p>
              <p className={`num text-[12px] ${toneText(s.pnl)}`}>{pct(s.pnlPct)}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-[#2A2D36]">
              <div
                className="h-full rounded-full bg-mint"
                style={{ width: `${Math.max(stockShare, stockShare > 0 ? 2 : 0)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] text-sub">
                <i className="h-1.5 w-1.5 rounded-full bg-mint" /> 주식 {stockShare.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-sub">
                <i className="h-1.5 w-1.5 rounded-full bg-[#3A3F4B]" /> 현금{' '}
                {(100 - stockShare).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 border-t border-line pt-3.5">
            <div>
              <p className="text-[11.5px] text-sub">투자 원금</p>
              <p className="num mt-1 text-[13.5px] font-semibold">{won(s.cost)}</p>
            </div>
            <div className="pl-3">
              <p className="text-[11.5px] text-sub">평가 손익</p>
              <p className={`num mt-1 text-[13.5px] font-semibold ${toneText(s.pnl)}`}>
                {signedWon(s.pnl)}
              </p>
            </div>
            <div className="pl-3">
              <p className="text-[11.5px] text-sub">보유 현금</p>
              <p className="num mt-1 text-[13.5px] font-semibold">{won(s.cash)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">
            보유 종목 <span className="text-[13px] font-semibold text-sub">{s.positions.length}</span>
          </h2>
          <button type="button" onClick={() => go('market')} className="text-[12px] text-sub">
            시세 둘러보기 ›
          </button>
        </div>

        {s.positions.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2C2C35] px-5 py-8 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-chip text-sub">
              <TrendIcon size={22} />
            </div>
            <p className="mt-3 text-[14px] font-semibold">아직 보유한 종목이 없어요</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
              1,000만 원의 모의 자금으로
              <br />
              첫 매수를 시작해 보세요.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => go('market')}
                className="flex-1 rounded-xl bg-ink py-2.5 text-[13px] font-bold text-[#101014] active:opacity-90"
              >
                종목 둘러보기
              </button>
              <button
                type="button"
                onClick={() => loadSamples()}
                className="flex-1 rounded-xl border border-line bg-raised py-2.5 text-[13px] font-semibold text-ink active:opacity-90"
              >
                샘플로 채우기
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            {s.positions.map((p, i) => (
              <button
                key={p.stock.id}
                type="button"
                onClick={() => openDetail(p.stock.id)}
                className={`flex w-full items-center gap-3 py-3 text-left ${
                  i === 0 ? '' : 'border-t border-line/70'
                }`}
              >
                <StockAvatar stock={p.stock} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{p.stock.name}</p>
                  <p className="num mt-0.5 truncate text-[12px] text-sub">
                    {p.qty.toLocaleString('ko-KR')}주 · 평균 {priceOf(p.avg, p.stock.currency)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[14.5px] font-semibold">{won(p.value)}</p>
                  <p className={`num mt-0.5 text-[12px] font-semibold ${toneText(p.pnl)}`}>
                    {pct(p.pnlPct)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="card p-4">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold">시세 시뮬레이션</p>
            <span className="rounded-md bg-chip px-1.5 py-[3px] text-[10px] font-medium text-sub">
              테스트용
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-sub">
            시장이 움직인 상황을 만들고 수익률을 미리 확인해 보세요.
          </p>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {[-5, -3, -1, 1, 3, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  shiftAllPrices(v);
                  setSimulatedPct(v);
                  api.toast(
                    `전 종목을 ${v > 0 ? '+' : ''}${v}% 움직였어요.`,
                    v > 0 ? 'up' : 'down',
                  );
                }}
                className={`num rounded-lg py-2 text-[12.5px] font-semibold active:opacity-80 ${
                  simulatedPct === v
                    ? 'bg-chip text-ink'
                    : v > 0
                      ? 'bg-up/10 text-up'
                      : 'bg-down/10 text-down'
                }`}
              >
                {v > 0 ? `+${v}` : v}%
              </button>
            ))}
          </div>
        </div>
      </section>

      {state.trades.length > 0 && (
        <section className="px-4 pt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">최근 매매</h2>
            <button type="button" onClick={() => go('calc')} className="text-[12px] text-sub">
              전체 기록 ›
            </button>
          </div>
          <div className="mt-1">
            {state.trades.slice(0, 3).map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 py-2.5 ${i === 0 ? '' : 'border-t border-line/70'}`}
              >
                <span
                  className={`rounded-md px-1.5 py-[3px] text-[10.5px] font-bold ${
                    t.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                  }`}
                >
                  {t.side === 'buy' ? '매수' : '매도'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{t.name}</p>
                  <p className="num text-[11.5px] text-sub">
                    {t.qty.toLocaleString('ko-KR')}주 · {won(t.amount)}
                  </p>
                </div>
                <span className="num text-[11.5px] text-sub">{timeKo(t.at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-7">
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-sub">
            <InfoIcon size={15} />
            <span>실제 주문이 아닌 모의투자예요</span>
          </div>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-[12px] font-semibold text-sub underline underline-offset-2"
            >
              초기화
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-[12px] text-sub"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  setSimulatedPct(null);
                  api.toast('1,000만 원으로 다시 시작했어요.', 'mint');
                }}
                className="rounded-md bg-up/10 px-2 py-1 text-[12px] font-bold text-up"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
