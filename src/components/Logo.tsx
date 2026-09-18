export function LogoMark({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 160"
      className={className}
      role="img"
      aria-label="MCARS PH"
    >
      <rect x="8" y="38" width="430" height="84" rx="8" fill="#0b0b0d" stroke="#e10600" strokeWidth="8" />
      <text
        x="28"
        y="102"
        fill="#f4f4f5"
        fontFamily="Barlow Condensed, Arial Black, sans-serif"
        fontWeight="700"
        fontSize="72"
        letterSpacing="-1.5"
      >
        MCARS
      </text>
      <text
        x="268"
        y="102"
        fill="#e10600"
        fontFamily="Barlow Condensed, Arial Black, sans-serif"
        fontWeight="700"
        fontSize="72"
        letterSpacing="-1"
      >
        PH
      </text>
      <circle cx="520" cy="80" r="68" fill="#0b0b0d" stroke="#e10600" strokeWidth="10" />
      <path
        d="M560 28c38 10 72 28 92 52-28 8-58 10-86 4 8-18 6-38-6-56z"
        fill="#e10600"
      />
      <path
        d="M572 22c22 18 36 40 40 64"
        fill="none"
        stroke="#e10600"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M586 18c18 22 28 46 30 70"
        fill="none"
        stroke="#c01410"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="520" cy="80" r="26" fill="none" stroke="#f4f4f5" strokeWidth="7" />
      <circle cx="520" cy="80" r="12" fill="#0b0b0d" />
    </svg>
  );
}

export function LogoBadge({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="10" fill="#0b0b0d" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#e10600" strokeWidth="5" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="#f4f4f5" strokeWidth="3" />
      <path d="M48 18c8 4 14 10 18 18-6 2-12 2-18 0 2-6 2-12 0-18z" fill="#e10600" />
    </svg>
  );
}
