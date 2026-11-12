import { useEffect, useRef, useState, type RefObject } from 'react';
import { StackedBar, type Segment } from '../../components/StackedBar';
import { gbp, kwh } from '../../lib/format';
import { DeltaChip } from './DeltaChip';
import type { PlanView } from './usePlan';

interface Props {
  plan: PlanView;
  /** The whole Revised plan section; the slim bar hides again once it scrolls away. */
  sectionRef: RefObject<HTMLElement | null>;
  onReset: () => void;
}

/** Original vs revised totals, plus a slim copy pinned to the top while the user edits further down. */
export function RevisedSummary({ plan, sectionRef, onReset }: Props) {
  const { heaters, base, revised } = plan;
  const delta = revised.cost - base.cost;
  const scale = Math.max(base.cost, revised.cost);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const update = () => {
      const card = cardRef.current?.getBoundingClientRect();
      const section = sectionRef.current?.getBoundingClientRect();
      setPinned(!!card && !!section && card.bottom < 0 && section.bottom > 120);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sectionRef]);

  const segments = (which: 'baseCost' | 'trialCost'): Segment[] =>
    heaters.map((h) => ({ id: h.base.id, label: h.base.location, cost: h[which], colour: h.colour }));
  const lessTip = (empty: number) => `${gbp(empty)} less than original`;

  return (
    <>
      <div className={'slim' + (pinned ? ' show' : '')} aria-hidden={!pinned} data-testid="slim">
        <div className="slim-in num">
          <span>
            <span className="lab">Original</span> <span className="o">{gbp(base.cost)}</span>
          </span>
          <span aria-hidden="true">→</span>
          <span>
            <span className="lab">Revised</span> <span className="r">{gbp(revised.cost)}</span>
          </span>
          <DeltaChip delta={delta} baseCost={base.cost} />
          <StackedBar segments={segments('trialCost')} scale={scale} gapTip={lessTip} />
          <button type="button" className="btn" tabIndex={pinned ? 0 : -1} disabled={!plan.changed} onClick={onReset}>
            Revert
          </button>
        </div>
      </div>

      <div className="card summary" ref={cardRef}>
        <div aria-live="polite">
          <div className="vs-row num">
            <div>
              <div className="k">Original</div>
              <div className="orig-v">{gbp(base.cost)}</div>
            </div>
            <div className="arrow" aria-hidden="true">
              →
            </div>
            <div>
              <div className="k">Revised 30-day cost</div>
              <div className="rev-v" data-testid="revised-cost">
                {gbp(revised.cost)}
              </div>
            </div>
            <DeltaChip delta={delta} baseCost={base.cost} testId="total-delta" />
          </div>
          <div className="meta num">
            {kwh(base.kwh)} → {kwh(revised.kwh)} over 30 days
          </div>
        </div>
        {scale > 0 && (
          <div className="share">
            <div className="share-row">
              <span>Original</span>
              <StackedBar segments={segments('baseCost')} scale={scale} gapTip={(e) => `Revised adds ${gbp(e)}`} />
            </div>
            <div className="share-row">
              <span>Revised</span>
              <StackedBar segments={segments('trialCost')} scale={scale} gapTip={lessTip} />
            </div>
            <ul className="legend">
              {heaters.map((h) => (
                <li key={h.base.id}>
                  <span className="sw" style={{ background: h.colour }} />
                  {h.base.location}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
