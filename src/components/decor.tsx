/**
 * Shared decorative elements for the Mediterranean coastal theme.
 * Hand-printed, stroke-based SVGs — no emoji, no stock icons.
 * All are aria-hidden and purely ornamental.
 */

interface DecorProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A hand-printed citrus wedge — the signature motif of the palette. */
export const CitrusIcon = ({ className = '', style }: DecorProps) => (
  <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
    <circle cx="12" cy="12" r="9.6" fill="#F2E8CF" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="6.9" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
    <g stroke="currentColor" strokeWidth="1" opacity=".55">
      <line x1="12" y1="5.1" x2="12" y2="18.9" />
      <line x1="5.1" y1="12" x2="18.9" y2="12" />
      <line x1="7.1" y1="7.1" x2="16.9" y2="16.9" />
      <line x1="16.9" y1="7.1" x2="7.1" y2="16.9" />
    </g>
  </svg>
);

/** A small four-point star ornament for kickers and flourishes. */
export const Ornament = ({ className = '', style }: DecorProps) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
    <path d="M12 1.5 L14.4 9.6 L22.5 12 L14.4 14.4 L12 22.5 L9.6 14.4 L1.5 12 L9.6 9.6 Z" />
  </svg>
);

/** An olive sprig with hand-printed leaves and cobalt olives. */
export const OliveSprig = ({ className = '', style }: DecorProps) => (
  <svg viewBox="0 0 48 24" className={className} style={style} aria-hidden="true">
    <path d="M2 21 C 14 10, 30 6, 46 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".65" />
    <ellipse cx="13" cy="13.5" rx="5.2" ry="2" transform="rotate(-28 13 13.5)" fill="#78952D" opacity=".85" />
    <ellipse cx="24" cy="9.5" rx="5.2" ry="2" transform="rotate(-14 24 9.5)" fill="#A9C448" opacity=".9" />
    <ellipse cx="35" cy="6.5" rx="5" ry="1.9" transform="rotate(-7 35 6.5)" fill="#78952D" opacity=".8" />
    <circle cx="19" cy="18" r="2.6" fill="#243F83" opacity=".8" />
    <circle cx="29.5" cy="14.5" r="2.1" fill="#243F83" opacity=".65" />
  </svg>
);

/** A thin cobalt checkerboard band — the azulejo separator. */
export const CheckerStrip = ({ className = '', style }: DecorProps) => (
  <div
    className={className}
    aria-hidden="true"
    style={{
      backgroundImage: 'repeating-conic-gradient(#243F83 0% 25%, transparent 0% 50%)',
      backgroundSize: '12px 12px',
      ...style,
    }}
  />
);

/** Hand-printed corner ticks for card treatments. Parent must be `relative`. */
export const CornerTicks = ({ className = '', style }: DecorProps) => (
  <>
    {[
      'top-1.5 left-1.5 border-t border-l',
      'top-1.5 right-1.5 border-t border-r',
      'bottom-1.5 left-1.5 border-b border-l',
      'bottom-1.5 right-1.5 border-b border-r',
    ].map(pos => (
      <span
        key={pos}
        aria-hidden="true"
        className={`pointer-events-none absolute ${pos} w-2.5 h-2.5 ${className}`}
        style={{ borderColor: '#243F83', opacity: .3, ...style }}
      />
    ))}
  </>
);

/** Illustration for the empty log: a set table with plate, cutlery and citrus. */
export const EmptyPlate = ({ className = '', style }: DecorProps) => (
  <svg viewBox="0 0 168 96" className={className} style={style} aria-hidden="true">
    <g stroke="#243F83" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity=".85">
      {/* fork */}
      <path d="M22 34 v13 M17.5 34 v8 M26.5 34 v8 M17.5 42.5 q4.5 3.5 9 0 M22 43 v22" />
      {/* knife */}
      <path d="M146 34 q6 9 0 20 v11" />
    </g>
    {/* plate */}
    <ellipse cx="84" cy="60" rx="46" ry="27" fill="#FFFDF7" stroke="#243F83" strokeWidth="1.7" opacity=".95" />
    <ellipse cx="84" cy="60" rx="32" ry="17.5" fill="none" stroke="#243F83" strokeWidth="1" strokeDasharray="3 4" opacity=".45" />
    {/* citrus slice resting on the plate */}
    <g>
      <circle cx="78" cy="52" r="11.5" fill="#F2E8CF" stroke="#A9C448" strokeWidth="1.6" />
      <circle cx="78" cy="52" r="7.8" fill="none" stroke="#A9C448" strokeWidth=".9" opacity=".6" />
      <g stroke="#A9C448" strokeWidth=".9" opacity=".65">
        <line x1="78" y1="44.2" x2="78" y2="59.8" />
        <line x1="70.2" y1="52" x2="85.8" y2="52" />
        <line x1="72.5" y1="46.5" x2="83.5" y2="57.5" />
        <line x1="83.5" y1="46.5" x2="72.5" y2="57.5" />
      </g>
    </g>
    {/* steam */}
    <g stroke="#243F83" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".35">
      <path d="M70 22 q3 -4 0 -8 q-3 -4 0 -8" />
      <path d="M86 20 q3 -4 0 -8 q-3 -4 0 -8" />
    </g>
  </svg>
);

interface SectionTitleProps {
  kicker: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  aside?: string;
}

/** Shared section heading: ornamented kicker, title, optional badge. */
export const SectionTitle = ({ kicker, title, badge, badgeColor = '#243F83', badgeBg = '#E8EEDB', aside }: SectionTitleProps) => (
  <div className="flex items-end justify-between mb-2 px-0.5 gap-3">
    <div className="min-w-0">
      <p className="coastal-kicker mb-0.5 flex items-center gap-1.5">
        <Ornament className="w-2 h-2 shrink-0" style={{ color: '#A9C448' }} />
        {kicker}
      </p>
      <h2 className="text-lg sm:text-xl font-semibold leading-tight">{title}</h2>
    </div>
    {badge && (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap" style={{ color: badgeColor, background: badgeBg }}>
        {badge}
      </span>
    )}
    {aside && <span className="hidden sm:block text-[11px] whitespace-nowrap" style={{ color: 'var(--onSurfaceVariant)' }}>{aside}</span>}
  </div>
);
