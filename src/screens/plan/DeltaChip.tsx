import { signedGbp, signedPct } from '../../lib/format';

/** "−£7.50 saved · −33%" / "+£3.21 more · +14%". Renders nothing when there is no difference. */
export function DeltaChip({ delta, baseCost, testId }: { delta: number; baseCost: number; testId?: string }) {
  if (Math.abs(delta) < 0.005) return null;
  // With a zero baseline there is no meaningful percentage change, so it is left out.
  const pct = baseCost > 0 ? ` · ${signedPct((delta / baseCost) * 100)}` : '';
  return (
    <span className={'chip ' + (delta < 0 ? 'save' : 'more')} data-testid={testId}>
      {signedGbp(delta)} {delta < 0 ? 'saved' : 'more'}
      {pct}
    </span>
  );
}
