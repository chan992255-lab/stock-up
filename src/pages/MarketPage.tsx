import { useMemo, useState } from 'react';
import type { AppApi } from '../lib/api';
import { Sparkline } from '../components/charts';
import { StockAvatar } from '../components/Avatar';
import { StarIcon, SearchIcon, PlusIcon } from '../components/Icons';
import { IndexBar } from '../components/IndexBar';
import { STOCKS, sparkFor, type Stock } from '../lib/stocks';
import { pct, priceOf, toneText } from '../lib/format';

type Filter = 'all' | 'kr' | 'us' | 'fav';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'kr', label: '국내' },
  { id: 'us', label: '미국' },
  { id: 'fav', label: '관심' },
];

export function MarketPage({ api }: { api: AppApi }) {
  const { trading, openDetail, openOrder } = api;
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const priceOfId = (id: string) => trading.priceOf(id);

  const list = useMemo(() => {
    const base = STOCKS.slice().sort((a, b) => b.marketCap - a.marketCap);
    const keyword = q.trim().toLowerCase();
    return base.filter((s) => {
      if (filter === 'kr' && s.market !== 'KR') return false;
      if (filter === 'us' && s.market !== 'US') return false;
      if (filter === 'fav' && !trading.state.favorites.includes(s.id)) return false;
      if (!keyword) return true;
      return (
        s.name.toLowerCase().includes(keyword) ||
        s.id.toLowerCase().includes(keyword) ||
        s.sector.toLowerCase().includes(keyword)
      );
    });
  }, [filter, q, trading.state.favorites]);

  const favCount = trading.state.favorites.length;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 bg-bg backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <h1 className="text-[20px] font-bold tracking-tight">시세</h1>
          <span className="flex items-center gap-1.5 rounded-full bg-up/10 px-2 py-1 text-[10.5px] font-bold text-up">
            <i className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-up" />
            LIVE
          </span>
        </div>
        <div className="-mt-1 pb-2.5">
          <IndexBar />
        </div>
        <div className="px-4 pb-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2.5">
            <SearchIcon size={17} className="text-sub" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="종목명, 종목코드, 업종 검색"
              className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-[#5A626E]"
              inputMode="search"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="text-[11px] text-sub"
                aria-label="검색어 지우기"
              >
                지우기
              </button>
            )}
          </div>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  active ? 'bg-ink text-[#101014]' : 'bg-raised text-sub'
                }`}
              >
                {f.id === 'fav' ? `관심 ${favCount}` : f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <h2 className="flex items-center gap-1.5 text-[14px] font-bold">
          {filter === 'fav' ? '내 관심 종목' : q ? '검색 결과' : '실시간 인기 종목'}
        </h2>
        <span className="text-[11.5px] text-sub">
          {filter === 'us' ? '달러 기준' : `${list.length}종목`}
        </span>
      </div>

      <div className="px-4">
        {list.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#2C2C35] px-5 py-10 text-center">
            <p className="text-[14px] font-semibold">
              {filter === 'fav' ? '관심 종목이 없어요' : '검색 결과가 없어요'}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
              {filter === 'fav'
                ? '종목 옆 별을 눌러 관심 목록에 담아 보세요.'
                : '다른 종목명이나 코드로 검색해 보세요.'}
            </p>
          </div>
        ) : (
          <ul>
            {list.map((s, i) => (
              <MarketRow
                key={s.id}
                stock={s}
                price={priceOfId(s.id)}
                rank={i + 1}
                fav={trading.state.favorites.includes(s.id)}
                onFav={(e) => {
                  e.stopPropagation();
                  trading.toggleFavorite(s.id);
                }}
                onBuy={(e) => {
                  e.stopPropagation();
                  openOrder(s.id, 'buy');
                }}
                onOpen={() => openDetail(s.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="px-4 pt-5 text-[11px] leading-relaxed text-sub">
        표시된 시세는 학습용 예시 데이터예요. 실제 시장 가격과 다를 수 있어요.
      </p>
    </div>
  );
}

function MarketRow({
  stock,
  price,
  rank,
  fav,
  onFav,
  onBuy,
  onOpen,
}: {
  stock: Stock;
  price: number;
  rank: number;
  fav: boolean;
  onFav: (e: React.MouseEvent) => void;
  onBuy: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const up = stock.changePct >= 0;
  const spark = sparkFor(stock, price);
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      className="flex cursor-pointer items-center gap-2 border-b border-line/70 py-2.5 last:border-0 active:bg-surface/60"
    >
      <span className="num w-3.5 shrink-0 text-center text-[11px] font-semibold text-[#5A626E]">
        {rank}
      </span>
      <StockAvatar stock={stock} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-[14px] font-semibold leading-tight">{stock.name}</p>
          <button
            type="button"
            onClick={onFav}
            aria-label={fav ? '관심 해제' : '관심 추가'}
            className="shrink-0 p-0.5"
          >
            <StarIcon
              size={13}
              filled={fav}
              className={fav ? 'text-[#F5C518]' : 'text-[#414651]'}
            />
          </button>
        </div>
        <p className="num mt-0.5 truncate text-[11px] text-sub">
          {stock.id} · {stock.marketLabel}
        </p>
      </div>
      <Sparkline data={spark} up={up} width={44} height={22} />
      <div className="w-[74px] shrink-0 text-right">
        <p className="num text-[13px] font-semibold leading-tight">
          {priceOf(price, stock.currency)}
        </p>
        <p className={`num mt-0.5 text-[11.5px] font-semibold ${toneText(stock.changePct)}`}>
          {pct(stock.changePct)}
        </p>
      </div>
      <button
        type="button"
        onClick={onBuy}
        aria-label={`${stock.name} 모의매수`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-up/10 text-up active:bg-up/20"
      >
        <PlusIcon size={15} />
      </button>
    </li>
  );
}
