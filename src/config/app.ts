export const APP = {
  nameKo: '스톡업',
  nameEn: 'StockUp',
  slug: 'stock-up',
  tagline: '모의투자부터 차트 게임까지',
  seedCash: 10_000_000,
  storageKey: 'stockup:v1',
  fx: 1_385.4,
} as const;

export type TabId = 'portfolio' | 'market' | 'calc' | 'game';

export const TABS: { id: TabId; label: string; icon: 'wallet' | 'chart' | 'calc' | 'game' }[] = [
  { id: 'portfolio', label: '모의투자', icon: 'wallet' },
  { id: 'market', label: '시세', icon: 'chart' },
  { id: 'calc', label: '계산기', icon: 'calc' },
  { id: 'game', label: '게임', icon: 'game' },
];
