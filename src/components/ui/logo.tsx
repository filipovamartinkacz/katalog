export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 28"
      height="22"
      aria-label="žena Blažená"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* gradient pouze na 'á': gold na vrcholu (čárka), primary od středu dolů */}
        <linearGradient
          id="zb-a-grad"
          x1="0" y1="2" x2="0" y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="36%" stopColor="var(--color-accent)" />
          <stop offset="36%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="22"
        fontSize="22"
        fontWeight="600"
        fill="var(--color-primary)"
        style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)" }}
      >
        žena Blažen<tspan fill="url(#zb-a-grad)">á</tspan>
      </text>
    </svg>
  )
}
