import { useEffect, useRef, useState } from 'react';
import type { AppApi } from '../lib/api';
import { AreaChart, CandleChart } from '../components/charts';
import { BoltIcon, CandleIcon, TrophyIcon } from '../components/Icons';
import { buildCandles, type Candle } from '../lib/stocks';
import { pct, signedWon, toneText, won } from '../lib/format';

const START_CASH = 1_000_000;
const TOTAL_DAYS = 20;

export function GamePage({ api }: { api: AppApi }) {
  const [mode, setMode] = useState<'candle' | 'scalp'>('candle');
  const { state } = api.trading;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 bg-bg px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight">게임</h1>
            <p className="mt-0.5 text-[12px] text-sub">차트를 읽고 수익률로 실력을 겨뤄요</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#00C471]/10 text-mint">
            <TrophyIcon size={19} />
          </span>
        </div>
      </header>

      <section className="px-4">
        <div className="grid grid-cols-3 gap-2">
          <Record label="차트 챌린지" value={state.bestChallenge === null ? '—' : pct(state.bestChallenge)} />
          <Record label="30초 단타" value={state.bestScalp === null ? '—' : pct(state.bestScalp)} />
          <Record label="연속 수익" value={state.bestStreak > 0 ? `${state.bestStreak}판` : '—'} />
        </div>
      </section>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-raised p-1">
          <button
            type="button"
            onClick={() => setMode('candle')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold ${
              mode === 'candle' ? 'bg-[#2C2C35] text-ink' : 'text-sub'
            }`}
          >
            <CandleIcon size={15} /> 봉차트 20일
          </button>
          <button
            type="button"
            onClick={() => setMode('scalp')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold ${
              mode === 'scalp' ? 'bg-[#2C2C35] text-ink' : 'text-sub'
            }`}
          >
            <BoltIcon size={15} /> 30초 단타
          </button>
        </div>
      </div>

      {mode === 'candle' ? <CandleGame api={api} /> : <ScalpGame api={api} />}
    </div>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-2.5 py-2">
      <p className="truncate text-[10.5px] text-sub">{label}</p>
      <p className="num mt-0.5 truncate text-[13.5px] font-bold">{value}</p>
    </div>
  );
}

function scalpGradeOf(ret: number): { emoji: string; title: string; desc: string } {
  if (ret >= 8) return { emoji: '⚡', title: '단타의 신', desc: '30초 만에 8%! 이건 거의 예술이에요.' };
  if (ret >= 3) return { emoji: '🔥', title: '스캘퍼', desc: '파동을 정확히 타고 수익을 확정했어요.' };
  if (ret > 0) return { emoji: '🙂', title: '보합 탈출', desc: '작은 수익도 수익이에요. 감각이 좋아요.' };
  if (ret > -5) return { emoji: '😌', title: '손실 방어', desc: '크게 물리지 않았어요. 다음 판에 노려봐요.' };
  return { emoji: '💸', title: '물린 개미', desc: '파동에 휩쓸렸어요. 이번엔 손절이 늦었네요.' };
}

function gradeOf(ret: number): { emoji: string; title: string; desc: string } {
  if (ret >= 30) return { emoji: '💎', title: '여의도 전설', desc: '20일 만에 30% 이상! 이 정도면 전업 투자자 감이에요.' };
  if (ret >= 15) return { emoji: '🔥', title: '단타 고수', desc: '흐름을 제대로 읽었어요. 손익비 감각이 살아 있어요.' };
  if (ret >= 5) return { emoji: '📈', title: '우량 투자자', desc: '차분하게 수익을 쌓았어요. 이 페이스면 충분해요.' };
  if (ret > -5) return { emoji: '🙂', title: '본전 지킴이', desc: '크게 잃지 않은 것도 실력이에요. 다음 판을 노려봐요.' };
  return { emoji: '🐜', title: '존버 개미', desc: '이번엔 손절 타이밍을 놓쳤어요. 다시 도전해 봐요!' };
}

interface Round {
  candles: Candle[];
  day: number;
  cash: number;
  qty: number;
  avg: number;
  finished: boolean;
  result: number | null;
}

const freshRound = (): Round => {
  const seed = Math.floor(Math.random() * 1_000_000_000);
  return {
    candles: buildCandles(seed, TOTAL_DAYS),
    day: 4,
    cash: START_CASH,
    qty: 0,
    avg: 0,
    finished: false,
    result: null,
  };
};

function CandleGame({ api }: { api: AppApi }) {
  const [round, setRound] = useState<Round>(freshRound);
  const close = round.candles[round.day].c;
  const value = round.cash + round.qty * close;
  const ret = ((value - START_CASH) / START_CASH) * 100;

  const trade = (side: 'buy' | 'sell', ratio: number) => {
    if (round.finished) return;
    const price = close;
    if (side === 'buy') {
      const invest = round.cash * ratio;
      const q = Math.floor(invest / price);
      if (q < 1) {
        api.toast('매수할 수 있는 금액이 부족해요.', 'up');
        return;
      }
      setRound((r) => {
        const qty = r.qty + q;
        const avg = (r.avg * r.qty + price * q) / qty;
        return { ...r, cash: r.cash - price * q, qty, avg };
      });
      api.toast(`${q}주 매수 · ${won(price * q)}`, 'up');
    } else {
      if (round.qty <= 0) {
        api.toast('보유한 주가 없어요.', 'down');
        return;
      }
      const q = ratio >= 1 ? round.qty : Math.max(1, Math.floor(round.qty * ratio));
      setRound((r) => ({ ...r, cash: r.cash + price * q, qty: r.qty - q }));
      api.toast(`${q}주 매도 · ${won(price * q)}`, 'down');
    }
  };

  const nextDay = () => {
    if (round.finished) return;
    if (round.day >= TOTAL_DAYS - 1) {
      const finalValue = round.cash + round.qty * close;
      const finalRet = ((finalValue - START_CASH) / START_CASH) * 100;
      setRound((r) => ({ ...r, finished: true, result: finalRet }));
      api.trading.recordChallenge(finalRet);
      return;
    }
    setRound((r) => ({ ...r, day: r.day + 1 }));
  };

  const grade = round.result !== null ? gradeOf(round.result) : null;
  const visible = round.candles.slice(0, round.day + 1);

  return (
    <section className="px-4 pt-4">
      <div className="card overflow-hidden">
        <div className="px-4 pt-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-mint/10 px-1.5 py-[3px] text-[10px] font-bold text-mint">
                DAY {round.day + 1}
              </span>
              <span className="text-[11px] text-sub">/ {TOTAL_DAYS}일</span>
            </div>
            <span className="num text-[11px] text-sub">
              평가 {won(value)}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-sub">내 수익률</p>
              <p className={`num text-[26px] font-bold leading-tight ${toneText(ret)}`}>
                {pct(ret)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-sub">
                {round.qty > 0 ? `보유 ${round.qty}주` : '전량 현금'}
              </p>
              <p className="num mt-0.5 text-[12px] text-ink">
                {round.qty > 0 ? `평단 ${won(round.avg)}` : `현금 ${won(round.cash)}`}
              </p>
            </div>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#2A2D36]">
            <div
              className="h-full rounded-full bg-mint transition-all duration-300"
              style={{ width: `${((round.day + 1) / TOTAL_DAYS) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-2 px-2">
          <CandleChart
            candles={visible}
            avgPrice={round.qty > 0 ? round.avg : undefined}
            height={188}
          />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-2 text-[10.5px] text-sub">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <i className="h-1.5 w-1.5 rounded-full bg-[#F04452]" /> 양봉
            </span>
            <span className="flex items-center gap-1">
              <i className="h-1.5 w-1.5 rounded-full bg-[#3182F6]" /> 음봉
            </span>
            <span className="flex items-center gap-1">
              <i className="h-1.5 w-3 rounded-full bg-[#F2C94C]" /> 5일선
            </span>
          </span>
          <span className="num">종가 {won(close)}</span>
        </div>
      </div>

      {round.finished && grade && round.result !== null ? (
        <div className="mt-4 animate-pop-in rounded-2xl border border-mint/30 bg-gradient-to-b from-[#15221C] to-surface p-5 text-center">
          <p className="text-[34px] leading-none">{grade.emoji}</p>
          <p className="mt-2 text-[16px] font-bold">{grade.title}</p>
          <p className="num mt-1 text-[28px] font-bold text-mint">{pct(round.result)}</p>
          <p className="num text-[12px] text-sub">
            최종 자산 {won(round.cash + round.qty * close)} · 수익{' '}
            {signedWon(round.cash + round.qty * close - START_CASH)}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-sub">{grade.desc}</p>
          <button
            type="button"
            onClick={() => setRound(freshRound())}
            className="mt-4 w-full rounded-xl bg-ink py-3 text-[14px] font-bold text-[#101014] active:opacity-90"
          >
            다시 도전하기
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {[
              { label: '25%', ratio: 0.25 },
              { label: '50%', ratio: 0.5 },
              { label: '풀매수', ratio: 1 },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => trade('buy', b.ratio)}
                className="rounded-xl bg-up/10 py-2.5 text-[12.5px] font-bold text-up active:bg-up/20"
              >
                매수 {b.label}
              </button>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => trade('sell', 0.5)}
              className="rounded-xl bg-down/10 py-2.5 text-[12.5px] font-bold text-down active:bg-down/20"
            >
              매도 50%
            </button>
            <button
              type="button"
              onClick={() => trade('sell', 1)}
              className="rounded-xl bg-down/10 py-2.5 text-[12.5px] font-bold text-down active:bg-down/20"
            >
              전량 매도
            </button>
          </div>
          <button
            type="button"
            onClick={nextDay}
            className="mt-2 w-full rounded-xl bg-ink py-3.5 text-[14.5px] font-bold text-[#101014] active:opacity-90"
          >
            {round.day >= TOTAL_DAYS - 1 ? '결과 보기' : '다음 날 ▶'}
          </button>
          <p className="mt-2.5 text-[11px] leading-relaxed text-sub">
            종가에 주문하고 다음 날 봉을 확인하세요. 20일 뒤 최종 수익률로 등급이 정해져요.
          </p>
        </>
      )}
    </section>
  );
}

interface Scalp {
  running: boolean;
  finished: boolean;
  tick: number;
  price: number;
  series: number[];
  cash: number;
  qty: number;
  avg: number;
}

const START_PRICE = 100_000;

const freshScalp = (): Scalp => ({
  running: false,
  finished: false,
  tick: 0,
  price: START_PRICE,
  series: [START_PRICE],
  cash: START_CASH,
  qty: 0,
  avg: 0,
});

function ScalpGame({ api }: { api: AppApi }) {
  const [s, setS] = useState<Scalp>(freshScalp);
  const recorded = useRef(false);

  useEffect(() => {
    if (!s.running) return;
    const id = window.setInterval(() => {
      setS((prev) => {
        if (!prev.running) return prev;
        const tick = prev.tick + 1;
        const last = prev.series[prev.series.length - 1];
        const drift = (Math.random() - 0.5) * 0.016 + Math.sin(tick / 7) * 0.0016;
        const price = Math.max(1000, last * (1 + drift));
        const done = tick >= 86;
        return {
          ...prev,
          tick,
          price,
          series: [...prev.series, price].slice(-90),
          running: !done,
          finished: done,
        };
      });
    }, 350);
    return () => window.clearInterval(id);
  }, [s.running]);

  const value = s.cash + s.qty * s.price;
  const ret = ((value - START_CASH) / START_CASH) * 100;

  useEffect(() => {
    if (s.finished && !recorded.current) {
      recorded.current = true;
      api.trading.recordScalp(ret);
    }
  }, [s.finished, ret, api.trading]);

  const start = () => {
    recorded.current = false;
    setS({ ...freshScalp(), running: true });
  };

  const trade = (side: 'buy' | 'sell', ratio: number) => {
    if (!s.running) return;
    if (side === 'buy') {
      const invest = s.cash * ratio;
      const q = Math.floor(invest / s.price);
      if (q < 1) {
        api.toast('매수할 금액이 부족해요.', 'up');
        return;
      }
      setS((prev) => {
        const qty = prev.qty + q;
        return {
          ...prev,
          cash: prev.cash - prev.price * q,
          qty,
          avg: (prev.avg * prev.qty + prev.price * q) / qty,
        };
      });
    } else {
      if (s.qty <= 0) {
        api.toast('보유한 주가 없어요.', 'down');
        return;
      }
      const q = ratio >= 1 ? s.qty : Math.max(1, Math.floor(s.qty * ratio));
      setS((prev) => ({ ...prev, cash: prev.cash + prev.price * q, qty: prev.qty - q }));
    }
  };

  const left = Math.max(0, 30 - s.tick * 0.35);
  const grade = s.finished ? scalpGradeOf(ret) : null;

  return (
    <section className="px-4 pt-4">
      <div className="card overflow-hidden">
        <div className="px-4 pt-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-sub">
              <i className={`h-1.5 w-1.5 rounded-full ${s.running ? 'animate-pulse-soft bg-up' : 'bg-[#4A505B]'}`} />
              {s.running ? '실시간 체결 중' : s.finished ? '라운드 종료' : '대기 중'}
            </span>
            <span className="num text-[12px] font-semibold text-sub">
              <span className={s.running ? 'text-ink' : 'text-sub'}>{left.toFixed(1)}</span>초
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="num text-[27px] font-bold leading-none tracking-tight">{won(s.price)}</p>
              <p className={`num mt-1.5 text-[12.5px] font-semibold ${toneText(ret)}`}>
                수익률 {pct(ret)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-sub">
                {s.qty > 0 ? `보유 ${s.qty}주 · 평단 ${won(s.avg)}` : '전량 현금'}
              </p>
              <p className="num mt-0.5 text-[12px] text-ink">평가 {won(value)}</p>
            </div>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#2A2D36]">
            <div
              className="h-full rounded-full bg-mint transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, (s.tick / 86) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-1 px-2 pb-1">
          <AreaChart data={s.series} baseline={START_PRICE} up={s.price >= START_PRICE} height={172} />
        </div>
      </div>

      {s.finished && grade ? (
        <div className="mt-4 animate-pop-in rounded-2xl border border-mint/30 bg-gradient-to-b from-[#15221C] to-surface p-5 text-center">
          <p className="text-[30px] leading-none">{grade.emoji}</p>
          <p className="mt-2 text-[15px] font-bold">{grade.title}</p>
          <p className={`num mt-1 text-[26px] font-bold ${toneText(ret)}`}>{pct(ret)}</p>
          <p className="num text-[12px] text-sub">최종 자산 {won(value)}</p>
          <button
            type="button"
            onClick={start}
            className="mt-4 w-full rounded-xl bg-ink py-3 text-[14px] font-bold text-[#101014] active:opacity-90"
          >
            한 판 더
          </button>
        </div>
      ) : !s.running ? (
        <button
          type="button"
          onClick={start}
          className="mt-4 w-full rounded-xl bg-mint py-3.5 text-[14.5px] font-bold text-[#101014] active:opacity-90"
        >
          30초 단타 시작하기
        </button>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => trade('buy', 1)}
              className="rounded-xl bg-up py-3 text-[14px] font-bold text-white active:opacity-90"
            >
              매수
            </button>
            <button
              type="button"
              onClick={() => trade('sell', 1)}
              className="rounded-xl bg-down py-3 text-[14px] font-bold text-white active:opacity-90"
            >
              매도
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => trade('buy', 0.5)}
              className="rounded-xl bg-up/10 py-2 text-[11.5px] font-bold text-up active:bg-up/20"
            >
              반만 매수
            </button>
            <button
              type="button"
              onClick={() => trade('sell', 0.5)}
              className="rounded-xl bg-down/10 py-2 text-[11.5px] font-bold text-down active:bg-down/20"
            >
              반만 매도
            </button>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-sub">
            350ms마다 가격이 움직여요. 파동을 타고 수익을 확정해 보세요.
          </p>
        </>
      )}
    </section>
  );
}
