import { INDICES } from '../lib/stocks';
import { pct } from '../lib/format';

export function IndexBar() {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
      {INDICES.map((ix) => {
        const up = ix.changePct >= 0;
        return (
          <div
            key={ix.id}
            className="shrink-0 rounded-xl border border-line bg-surface px-3 py-2"
          >
            <p className="text-[11px] font-medium text-sub">{ix.label}</p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="num text-[13px] font-semibold text-ink">
                {ix.value.toLocaleString('ko-KR', {
                  minimumFractionDigits: ix.digits,
                  maximumFractionDigits: ix.digits,
                })}
              </span>
              <span className={`num text-[11px] font-semibold ${up ? 'text-up' : 'text-down'}`}>
                {pct(ix.changePct, 2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
