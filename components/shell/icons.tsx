/**
 * Desktop icon art. Original drawings, not traced from any reference.
 *
 * WHY THESE LOOK THE WAY THEY DO
 *
 * The first version drew every icon as a thin 20px stroke glyph inside an
 * identical bordered box. The result was unusable: "Products", "Pricing" and
 * "Terminal" were three near-identical squares, so the desktop had no
 * scannability at all. An icon's job is to be recognised before it is read.
 *
 * So each icon here is built for distinctness at a glance:
 *
 *  1. A DIFFERENT SILHOUETTE. Outline shape alone should identify it, which is
 *     what survives at small sizes and in peripheral vision.
 *  2. FILLS, not just strokes, so there is real mass to recognise.
 *  3. Its own HUE from the project palette, as a secondary cue only. Colour is
 *     never the sole differentiator, because roughly 1 in 12 men cannot rely on
 *     it, and the labels below carry the text anyway.
 *  4. No uniform container. A shared bordered box flattens every silhouette into
 *     the same square, which is precisely what went wrong the first time.
 *
 * Colours are literal hex rather than tokens: this is artwork, and it must stay
 * legible against a wallpaper in both light and dark mode rather than inverting
 * with the surface it happens to sit on.
 */

export type IconName =
    | 'home'
    | 'products'
    | 'pricing'
    | 'about'
    | 'notes'
    | 'terminal'
    | 'update'
    | 'trash'

const SIZE = 44

function Frame({ children }: { children: React.ReactNode }) {
    return (
        <svg
            width={SIZE}
            height={SIZE}
            viewBox="0 0 44 44"
            aria-hidden
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
        >
            {children}
        </svg>
    )
}

/** A house: pitched roof over a body, with a door. Unmistakable outline. */
function Home() {
    return (
        <Frame>
            <path d="M22 6 L40 21 H35 V37 H9 V21 H4 Z" fill="#5B5BD6" />
            <path d="M22 6 L40 21 H35 L22 10.5 L9 21 H4 Z" fill="#3E3EA8" />
            <rect x="18" y="25" width="8" height="12" rx="1" fill="#EEF0FF" />
            <rect x="12" y="24" width="4" height="4" rx="0.6" fill="#B9BDF5" />
            <rect x="28" y="24" width="4" height="4" rx="0.6" fill="#B9BDF5" />
        </Frame>
    )
}

/** Stacked crates: three offset boxes read as "many things". */
function Products() {
    return (
        <Frame>
            <rect x="6" y="20" width="16" height="16" rx="2" fill="#12A594" />
            <rect x="22" y="20" width="16" height="16" rx="2" fill="#0D7A6D" />
            <rect x="14" y="7" width="16" height="16" rx="2" fill="#2ED3BE" />
            <path d="M14 15h16" stroke="#0B5F55" strokeWidth="1.6" />
            <path d="M6 28h16M22 28h16" stroke="#0B5F55" strokeWidth="1.4" opacity="0.7" />
        </Frame>
    )
}

/** A price tag: angled body with a punch hole. Nothing else looks like it. */
function Pricing() {
    return (
        <Frame>
            <path d="M20 5 H36 a3 3 0 0 1 3 3 V24 L22 41 L4 23 Z" fill="#FFB224" />
            <path d="M20 5 H36 a3 3 0 0 1 3 3 V24 L30 33 L11 14 Z" fill="#E39A0C" opacity="0.5" />
            <circle cx="31" cy="13" r="3.4" fill="#FFF7E6" />
            <path
                d="M17 22 v9 M14 24.5 h5.5 a2 2 0 0 1 0 4 H15 a2 2 0 0 0 0 4 h5.5"
                stroke="#7A4A00"
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
            />
        </Frame>
    )
}

/** An open book: two facing pages with a spine. */
function About() {
    return (
        <Frame>
            <path d="M22 12 C17 8 10 8 5 10 V34 C10 32 17 32 22 36 Z" fill="#E5484D" />
            <path d="M22 12 C27 8 34 8 39 10 V34 C34 32 27 32 22 36 Z" fill="#B02B30" />
            <path d="M22 12 V36" stroke="#7A1418" strokeWidth="1.6" />
            <path
                d="M9 16 h9 M9 21 h9 M9 26 h7 M26 16 h9 M26 21 h9 M26 26 h7"
                stroke="#FFE9EA"
                strokeWidth="1.3"
                opacity="0.85"
            />
        </Frame>
    )
}

/** A sheet of paper with a folded corner and ruled lines. */
function Notes() {
    return (
        <Frame>
            <path d="M9 5 H27 L35 13 V39 H9 Z" fill="#FBFBFD" stroke="#8B91A4" strokeWidth="1.3" />
            <path d="M27 5 V13 H35 Z" fill="#D8DBE4" stroke="#8B91A4" strokeWidth="1.3" />
            <path
                d="M14 19 h16 M14 24 h16 M14 29 h11"
                stroke="#5B5BD6"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </Frame>
    )
}

/** A CRT screen on a stand, with a prompt. Wide and squat, unlike the others. */
function Terminal() {
    return (
        <Frame>
            <rect x="4" y="8" width="36" height="24" rx="3" fill="#2E3138" />
            <rect x="6.5" y="10.5" width="31" height="19" rx="2" fill="#0E1116" />
            <path d="M11 17 l4 3.5 l-4 3.5" stroke="#2ED3BE" strokeWidth="1.9" fill="none" strokeLinecap="round" />
            <path d="M18 24 h9" stroke="#2ED3BE" strokeWidth="1.9" strokeLinecap="round" />
            <rect x="17" y="32" width="10" height="4" fill="#414551" />
            <rect x="12" y="36" width="20" height="3" rx="1.5" fill="#2E3138" />
        </Frame>
    )
}

/** A circular refresh arrow around a core: rotational, unlike every other shape. */
function Update() {
    return (
        <Frame>
            <circle cx="22" cy="22" r="15" fill="#5B5BD6" opacity="0.18" />
            <path
                d="M34 22 a12 12 0 1 1 -4.6 -9.5"
                stroke="#5B5BD6"
                strokeWidth="3.4"
                fill="none"
                strokeLinecap="round"
            />
            <path d="M31 5.5 L35.5 13.5 L26.5 13.8 Z" fill="#5B5BD6" />
            <path d="M17 22.5 l4 4 l7.5 -8" stroke="#12A594" strokeWidth="3" fill="none" strokeLinecap="round" />
        </Frame>
    )
}

/** A bin: tapered body, lid, and a handle. The classic trash silhouette. */
function Trash() {
    return (
        <Frame>
            <rect x="17" y="5" width="10" height="3" rx="1.5" fill="#6E7486" />
            <rect x="8" y="9" width="28" height="4.5" rx="2" fill="#8B91A4" />
            <path d="M11 14 H33 L30.5 39 H13.5 Z" fill="#A8ADBE" />
            <path
                d="M18 19 v15 M22 19 v15 M26 19 v15"
                stroke="#5B6070"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </Frame>
    )
}

const ART: Record<IconName, () => React.ReactElement> = {
    home: Home,
    products: Products,
    pricing: Pricing,
    about: About,
    notes: Notes,
    terminal: Terminal,
    update: Update,
    trash: Trash,
}

export function DesktopArt({ name }: { name: IconName }) {
    const Art = ART[name] ?? Notes
    return <Art />
}

/** Exported so a test can assert every icon really is a different drawing. */
export const ICON_NAMES = Object.keys(ART) as IconName[]
