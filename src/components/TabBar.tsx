import { TABS, type TabId } from '../config/app';
import { CalcIcon, ChartIcon, GameIcon, WalletIcon } from './Icons';

const ICONS = {
  wallet: WalletIcon,
  chart: ChartIcon,
  calc: CalcIcon,
  game: GameIcon,
};

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#101014]/95 backdrop-blur-md">
      <div className="safe-b mx-auto flex w-full max-w-[480px] items-stretch justify-between px-2">
        {TABS.map((t) => {
          const Icon = ICONS[t.icon];
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className="relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5"
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={21} className={active ? 'text-ink' : 'text-[#5A626E]'} />
              <span
                className={`text-[10.5px] font-medium tracking-tight ${
                  active ? 'text-ink' : 'text-[#5A626E]'
                }`}
              >
                {t.label}
              </span>
              {active && (
                <span className="absolute left-1/2 top-0 h-[2px] w-5 -translate-x-1/2 rounded-full bg-ink" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
