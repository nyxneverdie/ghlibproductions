export const LogoMark = ({ className = "h-8 w-8" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <circle cx="15" cy="15" r="8.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="15" cy="15" r="3.2" fill="currentColor" />
    <circle cx="25" cy="24.5" r="2.4" fill="currentColor" />
  </svg>
);

export const Wordmark = ({ className = "" }) => (
  <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
    <span className="font-display italic text-2xl leading-none">ghlib</span>
    <span className="font-meta text-[10px] text-neutral-400">production</span>
  </span>
);

export const Logo = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className="h-7 w-7" />
    <Wordmark />
  </span>
);
