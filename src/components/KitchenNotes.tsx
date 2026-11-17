import { OliveSprig, Ornament, CheckerStrip } from './decor';

const NOTES = [
  'Log as you go — little notes make light work.',
  'Tap any calorie value to nudge the estimate.',
  'The daily cycle resets at the hour you set.',
];

/**
 * A small illustrated "pantry shelf" card. Keeps the sidebar feeling
 * handcrafted and populated even when the day's log is sparse.
 */
export const KitchenNotes = () => (
  <div className="coastal-card p-4 relative overflow-hidden">
    <div className="flex items-start justify-between gap-3 mb-2.5">
      <div>
        <p className="coastal-kicker mb-0.5 flex items-center gap-1.5">
          <Ornament className="w-2 h-2" style={{ color: '#A9C448' }} />
          The pantry shelf
        </p>
        <p className="display-font text-base font-semibold leading-tight" style={{ color: 'var(--onBackground)' }}>
          Kitchen notes
        </p>
      </div>
      <OliveSprig className="w-12 h-6 shrink-0 mt-1" style={{ color: '#25345B' }} />
    </div>
    <ul className="space-y-1.5">
      {NOTES.map(note => (
        <li key={note} className="flex items-start gap-2 text-xs leading-snug" style={{ color: 'var(--onSurfaceVariant)' }}>
          <Ornament className="w-1.5 h-1.5 mt-1 shrink-0" style={{ color: '#78952D' }} />
          <span className="italic">{note}</span>
        </li>
      ))}
    </ul>
    <CheckerStrip className="h-[5px] w-24 mt-3 rounded-full opacity-60" style={{ backgroundSize: '8px 8px' }} />
  </div>
);
