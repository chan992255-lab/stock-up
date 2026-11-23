import type { TabId } from '../config/app';
import type { useTrading } from './store';

export type Trading = ReturnType<typeof useTrading>;

export interface AppApi {
  trading: Trading;
  openDetail: (id: string) => void;
  openOrder: (id: string, side: 'buy' | 'sell') => void;
  toast: (text: string, tone?: 'mint' | 'up' | 'down') => void;
  go: (tab: TabId) => void;
}
