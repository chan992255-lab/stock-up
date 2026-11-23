import { useCallback, useEffect, useState } from 'react';
import type { TabId } from './config/app';
import type { AppApi } from './lib/api';
import { useTrading } from './lib/store';
import { PortfolioPage } from './pages/PortfolioPage';
import { MarketPage } from './pages/MarketPage';
import { CalcPage } from './pages/CalcPage';
import { GamePage } from './pages/GamePage';
import { TabBar } from './components/TabBar';
import { StockDetailSheet } from './components/StockDetailSheet';
import { OrderSheet } from './components/OrderSheet';

interface ToastState {
  id: number;
  text: string;
  tone: 'mint' | 'up' | 'down';
}

export default function App() {
  const trading = useTrading();
  const [tab, setTab] = useState<TabId>('portfolio');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [order, setOrder] = useState<{ stockId: string; side: 'buy' | 'sell' } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((text: string, tone: 'mint' | 'up' | 'down' = 'mint') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const api: AppApi = {
    trading,
    openDetail: (id) => setDetailId(id),
    openOrder: (id, side) => setOrder({ stockId: id, side }),
    toast: showToast,
    go: setTab,
  };

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-[480px] bg-bg pb-[calc(72px_+_env(safe-area-inset-bottom))]">
      {tab === 'portfolio' && <PortfolioPage api={api} />}
      {tab === 'market' && <MarketPage api={api} />}
      {tab === 'calc' && <CalcPage api={api} />}
      {tab === 'game' && <GamePage api={api} />}

      <TabBar
        tab={tab}
        onChange={(t) => {
          setDetailId(null);
          setOrder(null);
          setTab(t);
        }}
      />

      <StockDetailSheet
        key={detailId ?? 'none'}
        stockId={detailId}
        onClose={() => setDetailId(null)}
        api={api}
      />

      {order && (
        <OrderSheet
          key={`${order.stockId}-${order.side}`}
          order={order}
          onClose={() => setOrder(null)}
          api={api}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px_+_env(safe-area-inset-bottom))] z-[60] flex justify-center px-6">
          <div className="animate-toast-in max-w-[400px] rounded-xl border border-line bg-[#22242C] px-4 py-2.5 text-center shadow-sheet">
            <p
              className={`text-[12.5px] font-semibold ${
                toast.tone === 'up' ? 'text-up' : toast.tone === 'down' ? 'text-down' : 'text-ink'
              }`}
            >
              {toast.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
