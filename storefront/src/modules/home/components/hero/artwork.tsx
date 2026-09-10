import type { Banner } from "@/modules/home/data/banners"

// Category illustrations stay crisp at every size without loading banner images.
export default function HeroArtwork({ kind }: { kind: Banner["artwork"] }) {
  const id = `hero-${kind}`
  return (
    <svg
      viewBox="0 0 600 500"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fafbff" />
          <stop offset=".48" stopColor="#c3cad8" />
          <stop offset="1" stopColor="#939daf" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dde8f6" />
          <stop offset=".55" stopColor="#a9bfde" />
          <stop offset="1" stopColor="#7d91bd" />
        </linearGradient>
        <linearGradient id={`${id}-ear`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f7f5fc" />
          <stop offset="1" stopColor="#b4adc9" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#687083" stopOpacity=".2" />
          <stop offset="1" stopColor="#687083" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="310" cy="446" rx="245" ry="32" fill={`url(#${id}-shadow)`} />
      {kind !== "accessories" && (
        <g
          transform={
            kind === "phones" ? "translate(22 -3)" : "translate(-42 -8)"
          }
        >
          <g transform="rotate(-13 265 235)">
            <rect
              x="158"
              y="65"
              width="174"
              height="337"
              rx="30"
              fill={`url(#${id}-metal)`}
              stroke="#aab4c4"
              strokeWidth="2"
            />
            <rect
              x="164"
              y="71"
              width="162"
              height="325"
              rx="25"
              fill="#d2dbe8"
            />
            <rect
              x="175"
              y="82"
              width="66"
              height="68"
              rx="18"
              fill="#c5d0df"
              stroke="#b1bdcd"
            />
            <circle
              cx="193"
              cy="100"
              r="11"
              fill="#343c4b"
              stroke="#e4eaf3"
              strokeWidth="3"
            />
            <circle
              cx="222"
              cy="129"
              r="11"
              fill="#343c4b"
              stroke="#e4eaf3"
              strokeWidth="3"
            />
            <circle cx="222" cy="100" r="5" fill="#f7f4e8" />
            <circle cx="246" cy="238" r="19" stroke="#b2c0d3" strokeWidth="2" />
          </g>
          <g transform="rotate(10 346 266)">
            <rect
              x="264"
              y="108"
              width="178"
              height="338"
              rx="31"
              fill="#424a58"
              stroke="#9aa7ba"
              strokeWidth="3"
            />
            <rect
              x="271"
              y="115"
              width="164"
              height="324"
              rx="25"
              fill={`url(#${id}-screen)`}
            />
            <path
              d="M274 351c49-111 154-192 157-137v126c-51-48-102 29-157 71z"
              fill="#dae6f5"
              fillOpacity=".65"
            />
            <path
              d="M274 398c65-99 91-52 157-119v133c0 15-10 24-24 24H298c-14 0-24-12-24-24z"
              fill="#829ac0"
              fillOpacity=".55"
            />
            <rect
              x="327"
              y="124"
              width="53"
              height="14"
              rx="7"
              fill="#424a58"
            />
            <rect
              x="326"
              y="424"
              width="54"
              height="3"
              rx="1.5"
              fill="#f5f7fc"
            />
          </g>
        </g>
      )}
      {kind !== "phones" && (
        <g
          transform={
            kind === "collection"
              ? "translate(240 174) scale(.67) rotate(13 160 190)"
              : "translate(80 20) rotate(-12 160 190)"
          }
        >
          <path
            d="M55 247v-80a116 116 0 0 1 232 0v80"
            stroke="#a29ab8"
            strokeWidth="28"
          />
          <path
            d="M55 196v-30a116 116 0 0 1 232 0v30"
            stroke={`url(#${id}-ear)`}
            strokeWidth="19"
          />
          <rect
            x="24"
            y="202"
            width="77"
            height="137"
            rx="36"
            fill={`url(#${id}-ear)`}
            stroke="#aaa2bd"
            strokeWidth="2"
          />
          <rect x="79" y="215" width="24" height="111" rx="12" fill="#9f96b5" />
          <rect
            x="240"
            y="202"
            width="77"
            height="137"
            rx="36"
            fill={`url(#${id}-ear)`}
            stroke="#aaa2bd"
            strokeWidth="2"
          />
          <rect
            x="237"
            y="215"
            width="24"
            height="111"
            rx="12"
            fill="#9f96b5"
          />
          <path
            d="M47 223v91m247-91v91"
            stroke="white"
            strokeOpacity=".5"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
      {kind === "accessories" && (
        <g transform="translate(365 296) rotate(12)">
          <path
            d="M32 20V-9m48 29V-9"
            stroke="#b4b8c2"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <rect
            x="0"
            y="16"
            width="114"
            height="114"
            rx="26"
            fill={`url(#${id}-metal)`}
            stroke="#c6c9d0"
          />
          <rect x="8" y="19" width="98" height="98" rx="23" fill="#fafafb" />
          <path d="m63 39-22 34h20l-9 26 25-36H57z" fill="#b2a8c8" />
        </g>
      )}
    </svg>
  )
}
