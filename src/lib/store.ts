import { useCallback, useEffect, useMemo, useState } from 'react';
import { APP } from '../config/app';
import { getStock, STOCKS, type Stock } from './stocks';

export interface Holding {
  qty: number;
  avg: number; // 종목 통화 기준 평균 단가
}

export interface Trade {
  id: string;
  stockId: string;
  name: string;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  amount: number; // 원화 환산 금액
  realized?: number; // 매도 실현 손익(원)
  at: string;
}

export interface State {
  cash: number;
  holdings: Record<string, Holding>;
  favorites: string[];
  trades: Trade[];
  prices: Record<string, number>;
  bestChallenge: number | null;
  bestScalp: number | null;
  bestStreak: number;
  samples: boolean;
}

const initialState = (): State => ({
  cash: APP.seedCash,
  holdings: {},
  favorites: ['005930', 'NVDA', 'TSLA'],
  trades: [],
  prices: {},
  bestChallenge: null,
  bestScalp: null,
  bestStreak: 0,
  samples: false,
});

function load(): State {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<State>;
    const base = initialState();
    return {
      ...base,
      ...parsed,
      holdings: parsed.holdings ?? {},
      favorites: parsed.favorites ?? base.favorites,
      trades: parsed.trades ?? [],
      prices: parsed.prices ?? {},
    };
  } catch {
    return initialState();
  }
}

export const fxOf = (stock: Stock): number => (stock.currency === 'USD' ? APP.fx : 1);

export function useTrading() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(APP.storageKey, JSON.stringify(state));
    } catch {
      // 저장 공간이 막힌 브라우저에서는 조용히 넘어간다.
    }
  }, [state]);

  const priceOf = useCallback(
    (id: string): number => state.prices[id] ?? getStock(id).price,
    [state.prices],
  );

  const buy = useCallback(
    (stockId: string, price: number, qty: number): { ok: boolean; message: string } => {
      const stock = getStock(stockId);
      const amount = price * qty * fxOf(stock);
      if (!Number.isFinite(qty) || qty <= 0) return { ok: false, message: '수량을 입력해 주세요.' };
      if (amount > state.cash + 0.5) return { ok: false, message: '보유 현금이 부족해요.' };
      setState((prev) => {
        const held = prev.holdings[stockId] ?? { qty: 0, avg: 0 };
        const nextQty = held.qty + qty;
        const nextAvg = (held.avg * held.qty + price * qty) / nextQty;
        return {
          ...prev,
          cash: prev.cash - amount,
          holdings: { ...prev.holdings, [stockId]: { qty: nextQty, avg: nextAvg } },
          prices: { ...prev.prices, [stockId]: price },
          trades: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              stockId,
              name: stock.name,
              side: 'buy' as const,
              price,
              qty,
              amount,
              at: new Date().toISOString(),
            },
            ...prev.trades,
          ].slice(0, 200),
        };
      });
      return { ok: true, message: `${stock.name} ${qty.toLocaleString('ko-KR')}주를 매수했어요.` };
    },
    [state.cash],
  );

  const sell = useCallback(
    (stockId: string, price: number, qty: number): { ok: boolean; message: string } => {
      const stock = getStock(stockId);
      const held = state.holdings[stockId];
      if (!Number.isFinite(qty) || qty <= 0) return { ok: false, message: '수량을 입력해 주세요.' };
      if (!held || qty > held.qty) return { ok: false, message: '보유 수량보다 많이 팔 수 없어요.' };
      const amount = price * qty * fxOf(stock);
      const realized = (price - held.avg) * qty * fxOf(stock);
      setState((prev) => {
        const cur = prev.holdings[stockId];
        if (!cur) return prev;
        const left = cur.qty - qty;
        const holdings = { ...prev.holdings };
        if (left <= 0) delete holdings[stockId];
        else holdings[stockId] = { qty: left, avg: cur.avg };
        return {
          ...prev,
          cash: prev.cash + amount,
          holdings,
          prices: { ...prev.prices, [stockId]: price },
          trades: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              stockId,
              name: stock.name,
              side: 'sell' as const,
              price,
              qty,
              amount,
              realized,
              at: new Date().toISOString(),
            },
            ...prev.trades,
          ].slice(0, 200),
        };
      });
      return { ok: true, message: `${stock.name} ${qty.toLocaleString('ko-KR')}주를 매도했어요.` };
    },
    [state.cash, state.holdings],
  );

  const toggleFavorite = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(id)
        ? prev.favorites.filter((x) => x !== id)
        : [...prev.favorites, id],
    }));
  }, []);

  const shiftAllPrices = useCallback((pct: number) => {
    setState((prev) => {
      const prices = { ...prev.prices };
      STOCKS.forEach((s) => {
        const base = prices[s.id] ?? s.price;
        const next = base * (1 + pct / 100);
        prices[s.id] =
          s.currency === 'USD'
            ? Math.max(0.01, Math.round(next * 100) / 100)
            : Math.max(1, Math.round(next));
      });
      return { ...prev, prices };
    });
  }, []);

  const setPrice = useCallback((id: string, price: number) => {
    if (!Number.isFinite(price) || price <= 0) return;
    setState((prev) => ({ ...prev, prices: { ...prev.prices, [id]: price } }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...initialState(),
      favorites: prev.favorites,
      bestChallenge: prev.bestChallenge,
      bestScalp: prev.bestScalp,
      bestStreak: prev.bestStreak,
    }));
  }, []);

  const loadSamples = useCallback(() => {
    setState((prev) => {
      const sampleHoldings: Record<string, Holding> = {
        '005930': { qty: 20, avg: 68500 },
        '000660': { qty: 8, avg: 172000 },
        '005380': { qty: 5, avg: 245000 },
        '035420': { qty: 10, avg: 225000 },
        NKE: { qty: 30, avg: 59.8 },
      };
      const spent = Object.entries(sampleHoldings).reduce((sum, [id, h]) => {
        return sum + h.avg * h.qty * fxOf(getStock(id));
      }, 0);
      return {
        ...prev,
        cash: Math.max(0, APP.seedCash - spent),
        holdings: sampleHoldings,
        samples: true,
      };
    });
  }, []);

  const recordChallenge = useCallback((ret: number) => {
    setState((prev) => ({
      ...prev,
      bestChallenge: prev.bestChallenge === null ? ret : Math.max(prev.bestChallenge, ret),
      bestStreak: ret > 0 ? prev.bestStreak + 1 : 0,
    }));
  }, []);

  const recordScalp = useCallback((ret: number) => {
    setState((prev) => ({
      ...prev,
      bestScalp: prev.bestScalp === null ? ret : Math.max(prev.bestScalp, ret),
      bestStreak: ret > 0 ? prev.bestStreak + 1 : 0,
    }));
  }, []);

  return {
    state,
    priceOf,
    buy,
    sell,
    toggleFavorite,
    shiftAllPrices,
    setPrice,
    reset,
    loadSamples,
    recordChallenge,
    recordScalp,
  };
}

export interface Position {
  stock: Stock;
  qty: number;
  avg: number;
  price: number;
  value: number; // 원
  cost: number; // 원
  pnl: number;
  pnlPct: number;
  dayPnl: number;
}

export function positionsOf(state: State): Position[] {
  return Object.entries(state.holdings)
    .map(([id, h]) => {
      const stock = getStock(id);
      const price = state.prices[id] ?? stock.price;
      const fx = fxOf(stock);
      const value = price * h.qty * fx;
      const cost = h.avg * h.qty * fx;
      return {
        stock,
        qty: h.qty,
        avg: h.avg,
        price,
        value,
        cost,
        pnl: value - cost,
        pnlPct: cost === 0 ? 0 : ((value - cost) / cost) * 100,
        dayPnl: (price - stock.prevClose) * h.qty * fx,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function summaryOf(state: State) {
  const positions = positionsOf(state);
  const stockValue = positions.reduce((s, p) => s + p.value, 0);
  const cost = positions.reduce((s, p) => s + p.cost, 0);
  const total = stockValue + state.cash;
  const pnl = stockValue - cost;
  const dayPnl = positions.reduce((s, p) => s + p.dayPnl, 0);
  return {
    positions,
    stockValue,
    cost,
    cash: state.cash,
    total,
    pnl,
    pnlPct: cost === 0 ? 0 : (pnl / cost) * 100,
    dayPnl,
    dayPct: total === 0 ? 0 : (dayPnl / total) * 100,
  };
}

export function useSummary(state: State) {
  return useMemo(() => summaryOf(state), [state]);
}
