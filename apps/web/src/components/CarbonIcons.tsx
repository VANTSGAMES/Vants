import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function BaseSvg({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z" />
    </BaseSvg>
  );
}

export function IconCrosshair(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </BaseSvg>
  );
}

export function IconFilm(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </BaseSvg>
  );
}

export function IconBroadcast(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
      <path d="M8.1 15.9a5.5 5.5 0 0 1 0-7.8" />
      <path d="M15.9 8.1a5.5 5.5 0 0 1 0 7.8" />
      <path d="M5.2 18.8a9.6 9.6 0 0 1 0-13.6" />
      <path d="M18.8 5.2a9.6 9.6 0 0 1 0 13.6" />
    </BaseSvg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3" />
      <path d="M17 6h3v2a3 3 0 0 1-3 3" />
      <line x1="12" y1="14" x2="12" y2="19" />
      <line x1="8" y1="19" x2="16" y2="19" />
    </BaseSvg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </BaseSvg>
  );
}

export function IconCrown(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 18h18l-1.6-11-4.9 4.2L12 5 9.5 11.2 4.6 7 3 18z" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </BaseSvg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M12 3l8 3.5v5.5c0 5-3.4 8.3-8 9.8-4.6-1.5-8-4.8-8-9.8V6.5L12 3z" />
      <path d="M9 12.2l2 2 4.2-4.2" />
    </BaseSvg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <polygon points="7,5 19,12 7,19" fill="currentColor" stroke="none" />
    </BaseSvg>
  );
}

export function IconFolder(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2H19.5A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12z" />
    </BaseSvg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M20 11a8 8 0 1 0 2 5.3" />
      <polyline points="20 4 20 11 13 11" />
    </BaseSvg>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M14 4h6v6" />
      <path d="M10 14L20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </BaseSvg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="11" cy="11" r="6.8" />
      <line x1="16.2" y1="16.2" x2="21" y2="21" />
    </BaseSvg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <polyline points="4.5 12.5 9.5 17.5 19.5 6.5" />
    </BaseSvg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </BaseSvg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 19a4.8 4.8 0 0 1 5.5 0" />
    </BaseSvg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <polyline points="3.5 6 12 12.5 20.5 6" />
    </BaseSvg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M9 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </BaseSvg>
  );
}

export function IconWinMin(props: IconProps) {
  return (
    <BaseSvg size={14} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </BaseSvg>
  );
}

export function IconWinMax({ maximized, ...props }: IconProps & { maximized?: boolean }) {
  return maximized ? (
    <BaseSvg size={14} {...props}>
      <rect x="5" y="7" width="11" height="11" />
      <polyline points="8 7 8 4 20 4 20 16 17 16" />
    </BaseSvg>
  ) : (
    <BaseSvg size={14} {...props}>
      <rect x="5" y="5" width="14" height="14" />
    </BaseSvg>
  );
}

export function IconWinClose(props: IconProps) {
  return (
    <BaseSvg size={14} {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </BaseSvg>
  );
}

export function BadgeEmblem({
  forma,
  color,
  code,
  unlocked,
}: {
  forma: string;
  color: string;
  code: string;
  unlocked: boolean;
}) {
  const gradId = `bg_${code.replace(/[^a-zA-Z0-9]/g, "")}`;
  const strokeColor = unlocked ? color : "#3a3a45";
  const fillAccent = unlocked ? color : "#52525e";

  const shapePath = (() => {
    switch (forma) {
      case "crown":
        return "M24 5L41 13V28C41 37 33.5 42.2 24 45C14.5 42.2 7 37 7 28V13L24 5Z";
      case "diamond":
        return "M24 4L44 24L24 44L4 24L24 4Z";
      case "octagon":
        return "M16 5H32L43 16V32L32 43H16L5 32V16L16 5Z";
      case "hexagon":
        return "M24 4L42 14V34L24 44L6 34V14L24 4Z";
      default:
        return "M24 5L40 11.5V24.5C40 34.5 33.2 40.8 24 44C14.8 40.8 8 34.5 8 24.5V11.5L24 5Z";
    }
  })();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="carbon-emblem-svg">
      <defs>
        <linearGradient id={gradId} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={fillAccent} stopOpacity={unlocked ? "0.42" : "0.14"} />
          <stop offset="55%" stopColor="#141419" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#09090c" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={shapePath} fill={`url(#${gradId})`} stroke={strokeColor} strokeWidth="1.8" />
      <path
        d={shapePath}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="0.75"
        transform="scale(0.86) translate(3.9, 3.9)"
      />
      <text
        x="24"
        y="27.5"
        textAnchor="middle"
        fill={unlocked ? "#f4f4f6" : "#7b7b88"}
        fontFamily="Saira Condensed, Arial Narrow, sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="0.08em"
      >
        {code.slice(0, 3)}
      </text>
    </svg>
  );
}
