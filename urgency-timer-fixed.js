// =============================================================================
// FILE 1: WIDGET CODE (widget.js)
// =============================================================================

import { getProductsByIds } from 'backend/urgencyTimer.web';

$w.onReady(async function () {
    await loadProducts();
});

$widget.onPropsChanged((oldProps, newProps) => {
    const productPropsChanged = [
        'productId1', 'productId2', 'productId3', 'productId4', 'productId5',
        'productId6', 'productId7', 'productId8', 'productId9', 'productId10'
    ].some(key => oldProps[key] !== newProps[key]);

    if (productPropsChanged) {
        loadProducts();
    } else {
        refreshSettings();
    }
});

async function loadProducts() {
    const productIds = [
        $widget.props.productId1,
        $widget.props.productId2,
        $widget.props.productId3,
        $widget.props.productId4,
        $widget.props.productId5,
        $widget.props.productId6,
        $widget.props.productId7,
        $widget.props.productId8,
        $widget.props.productId9,
        $widget.props.productId10
    ].filter(id => id && id !== '');

    if (productIds.length === 0) {
        $w('#urgencyTimer').setAttribute('products-data', JSON.stringify([]));
        refreshSettings();
        return;
    }

    try {
        const products = await getProductsByIds(productIds);
        $w('#urgencyTimer').setAttribute('products-data', JSON.stringify(products));
        refreshSettings();
    } catch (error) {
        console.error('Error loading products:', error);
        $w('#urgencyTimer').setAttribute('products-data', JSON.stringify([]));
    }
}

function refreshSettings() {
    const settings = {
        color1: $widget.props.color1 || '#ff4757',
        color2: $widget.props.color2 || '#ffffff',
        color3: $widget.props.color3 || '#2f3542',
        color4: $widget.props.color4 || '#ffa502',
        color5: $widget.props.color5 || '#ff6348',
        color6: $widget.props.color6 || '#ff3838',
        color7: $widget.props.color7 || '#1e90ff',
        color8: $widget.props.color8 || '#000000',
        borderWidth: $widget.props.borderWidth || 0,
        cornerRadius: $widget.props.cornerRadius || 16,
        mainText: $widget.props.mainText || '🔥 HOT DEAL ENDING SOON',
        urgencyText: $widget.props.urgencyText || 'Limited Time Offer!',
        ctaText: $widget.props.ctaText || 'Claim Deal',
        // FIX: countdownMode determines whether timer is hours-based or end-of-day
        countdownMode: $widget.props.countdownMode || 'hours',
        timerDuration: $widget.props.timerDuration !== undefined ? Number($widget.props.timerDuration) : 24,
        // FIX: showViewers kept, showSold removed
        showViewers: $widget.props.showViewers !== undefined ? $widget.props.showViewers : true,
        autoRotate: $widget.props.autoRotate !== undefined ? $widget.props.autoRotate : true,
        rotationSpeed: $widget.props.rotationSpeed || 8,
        titleFontFamily: $widget.props.titleFontFamily || 'Archivo Black',
        titleFontSize: $widget.props.titleFontSize || 20,
        urgencyFontFamily: $widget.props.urgencyFontFamily || 'Poppins',
        urgencyFontSize: $widget.props.urgencyFontSize || 13,
        priceFontFamily: $widget.props.priceFontFamily || 'Montserrat',
        priceFontSize: $widget.props.priceFontSize || 28,
        timerFontFamily: $widget.props.timerFontFamily || 'Orbitron',
        timerFontSize: $widget.props.timerFontSize || 24,
        ctaFontFamily: $widget.props.ctaFontFamily || 'Poppins',
        ctaFontSize: $widget.props.ctaFontSize || 15,
        titleTag: $widget.props.titleTag || 'H2'
    };

    $w('#urgencyTimer').setAttribute('settings', JSON.stringify(settings));
}


// =============================================================================
// FILE 2: PANEL CODE (panel.js)
// =============================================================================

import wixWidget from 'wix-widget';
import { getAllProducts } from 'backend/urgencyTimer.web';

// ── Color roles for the Urgency Timer widget ──────────────────────────────────
// color1 → Primary urgency accent: header bg, CTA button start, time-box bg, glows, dot active
// color2 → Reversed surface text: card text, CTA text, badge text, nav arrow bg
// color3 → Dark card background: urgency-card main gradient, product title color
// color4 → Warm accent: price text, stat numbers, countdown label, separator, discount badge start
// color5 → Secondary accent: discount badge gradient end, urgency badge gradient end
// color6 → Deep urgency: header gradient end, CTA gradient end, time-box gradient end
// color7 → Tertiary accent / highlight (nav, secondary UI elements)
// color8 → Deep shadow / max contrast background

const URGENCY_TIMER_PRESETS = {
    custom: { name: 'Custom' },

    // ── 1. Inferno (default — red/orange on dark) ─────────────────────────────
    inferno: {
        name: 'Inferno',
        color1: '#ff4757',   // Vivid red — primary urgency, header, CTA
        color2: '#ffffff',   // White — text on colored surfaces
        color3: '#2f3542',   // Dark charcoal — card background
        color4: '#ffa502',   // Hot amber — price, stats, countdown label
        color5: '#ff6348',   // Coral-red — badge gradient end
        color6: '#ff3838',   // Pure red — gradient deep end
        color7: '#1e90ff',   // Dodger blue — accent highlight
        color8: '#000000',   // Black — deepest shadow
    },

    // ── 2. Midnight Blaze ────────────────────────────────────────────────────
    midnightBlaze: {
        name: 'Midnight Blaze',
        color1: '#ff6b35',   // Vivid orange — primary
        color2: '#ffffff',   // White text
        color3: '#1a1a2e',   // Deep navy card bg
        color4: '#ffd700',   // Gold — price, stats
        color5: '#ff8c42',   // Light orange — badge end
        color6: '#e84118',   // Deep red-orange — gradient end
        color7: '#00d2ff',   // Cyan accent
        color8: '#0a0a1a',   // Near-black shadow
    },

    // ── 3. Neon Pulse ────────────────────────────────────────────────────────
    neonPulse: {
        name: 'Neon Pulse',
        color1: '#ff0080',   // Hot magenta — primary
        color2: '#ffffff',   // White text
        color3: '#0d0d1a',   // Very dark bg
        color4: '#ffff00',   // Electric yellow — price, stats
        color5: '#cc0066',   // Deep magenta — badge end
        color6: '#990055',   // Dark magenta — gradient end
        color7: '#00ffcc',   // Neon teal accent
        color8: '#000000',   // Black shadow
    },

    // ── 4. Cobalt Storm ──────────────────────────────────────────────────────
    cobaltStorm: {
        name: 'Cobalt Storm',
        color1: '#0070f3',   // Electric cobalt — primary
        color2: '#ffffff',   // White text
        color3: '#0a1628',   // Deep navy card bg
        color4: '#00d4ff',   // Sky cyan — price, stats
        color5: '#0052cc',   // Deep cobalt — badge end
        color6: '#003d99',   // Dark navy — gradient end
        color7: '#7c3aed',   // Violet accent
        color8: '#000814',   // Deepest navy shadow
    },

    // ── 5. Emerald Rush ──────────────────────────────────────────────────────
    emeraldRush: {
        name: 'Emerald Rush',
        color1: '#00c851',   // Vivid green — primary
        color2: '#ffffff',   // White text
        color3: '#0d1f14',   // Deep dark green bg
        color4: '#ffd700',   // Gold — price, stats
        color5: '#00a040',   // Mid green — badge end
        color6: '#007a30',   // Deep forest — gradient end
        color7: '#00e5ff',   // Cyan accent
        color8: '#000d08',   // Near-black shadow
    },

    // ── 6. Volcanic Ash ──────────────────────────────────────────────────────
    volcanicAsh: {
        name: 'Volcanic Ash',
        color1: '#e63946',   // Crimson — primary
        color2: '#f1faee',   // Off-white text
        color3: '#1d1d1d',   // Charcoal card bg
        color4: '#f4a261',   // Warm peach — price, stats
        color5: '#c1121f',   // Dark red — badge end
        color6: '#8b0000',   // Deep crimson — gradient end
        color7: '#457b9d',   // Slate blue accent
        color8: '#0a0a0a',   // Near-black shadow
    },

    // ── 7. Purple Haze ───────────────────────────────────────────────────────
    purpleHaze: {
        name: 'Purple Haze',
        color1: '#9333ea',   // Rich violet — primary
        color2: '#ffffff',   // White text
        color3: '#1a0a2e',   // Deep purple card bg
        color4: '#f59e0b',   // Amber — price, stats
        color5: '#7c22d4',   // Mid violet — badge end
        color6: '#5b1fa8',   // Deep violet — gradient end
        color7: '#ec4899',   // Pink accent
        color8: '#0d0017',   // Near-black shadow
    },

    // ── 8. Golden Hour Deal ──────────────────────────────────────────────────
    goldenHourDeal: {
        name: 'Golden Hour Deal',
        color1: '#e8a000',   // Rich gold — primary
        color2: '#ffffff',   // White text
        color3: '#1a1200',   // Dark warm bg
        color4: '#fff3b0',   // Pale gold — price, stats
        color5: '#c47f00',   // Deep gold — badge end
        color6: '#9a5e00',   // Dark amber — gradient end
        color7: '#ff6b35',   // Orange accent
        color8: '#0d0900',   // Near-black warm shadow
    },

    // ── 9. Arctic Flash ──────────────────────────────────────────────────────
    arcticFlash: {
        name: 'Arctic Flash',
        color1: '#00b4d8',   // Arctic cyan — primary
        color2: '#ffffff',   // White text
        color3: '#03045e',   // Deep ocean bg
        color4: '#caf0f8',   // Ice blue — price, stats
        color5: '#0096c7',   // Mid cyan — badge end
        color6: '#0077b6',   // Deep ocean blue — gradient end
        color7: '#90e0ef',   // Light cyan accent
        color8: '#010b26',   // Deepest navy shadow
    },

    // ── 10. Crimson Tide ─────────────────────────────────────────────────────
    crimsonTide: {
        name: 'Crimson Tide',
        color1: '#dc143c',   // Crimson — primary
        color2: '#fff5f5',   // Warm white text
        color3: '#2d0010',   // Deep dark-red bg
        color4: '#ff8c69',   // Salmon — price, stats
        color5: '#a50029',   // Mid crimson — badge end
        color6: '#780020',   // Deep crimson — gradient end
        color7: '#ff6b9d',   // Pink accent
        color8: '#150008',   // Near-black shadow
    },

    // ── 11. Obsidian Fire ────────────────────────────────────────────────────
    obsidianFire: {
        name: 'Obsidian Fire',
        color1: '#ff5500',   // Vivid orange — primary
        color2: '#ffffff',   // White text
        color3: '#0f0f0f',   // True black bg
        color4: '#ffcc00',   // Yellow — price, stats
        color5: '#cc3300',   // Deep orange — badge end
        color6: '#991100',   // Dark red — gradient end
        color7: '#ff9900',   // Amber accent
        color8: '#000000',   // Pure black shadow
    },

    // ── 12. Teal Thunder ─────────────────────────────────────────────────────
    tealThunder: {
        name: 'Teal Thunder',
        color1: '#0d9488',   // Teal — primary
        color2: '#ffffff',   // White text
        color3: '#042f2e',   // Very dark teal bg
        color4: '#fbbf24',   // Amber — price, stats
        color5: '#0f766e',   // Mid teal — badge end
        color6: '#115e59',   // Deep teal — gradient end
        color7: '#34d399',   // Mint accent
        color8: '#021a1a',   // Near-black shadow
    },

    // ── 13. Rose Gold Rush ───────────────────────────────────────────────────
    roseGoldRush: {
        name: 'Rose Gold Rush',
        color1: '#e11d78',   // Deep rose — primary
        color2: '#fff0f6',   // Light rose-white text
        color3: '#1a0010',   // Dark bg
        color4: '#f9a8d4',   // Soft pink — price, stats
        color5: '#be185d',   // Deep rose — badge end
        color6: '#9d174d',   // Very deep rose — gradient end
        color7: '#fb7185',   // Coral accent
        color8: '#0d0007',   // Near-black shadow
    },

    // ── 14. Solar Flare ──────────────────────────────────────────────────────
    solarFlare: {
        name: 'Solar Flare',
        color1: '#f97316',   // Vivid orange — primary
        color2: '#ffffff',   // White text
        color3: '#1c0800',   // Dark warm bg
        color4: '#fde68a',   // Light amber — price, stats
        color5: '#ea580c',   // Deep orange — badge end
        color6: '#c2410c',   // Dark orange — gradient end
        color7: '#facc15',   // Yellow accent
        color8: '#0d0400',   // Near-black shadow
    },

    // ── 15. Sapphire Strike ──────────────────────────────────────────────────
    sapphireStrike: {
        name: 'Sapphire Strike',
        color1: '#2563eb',   // Sapphire — primary
        color2: '#ffffff',   // White text
        color3: '#0f172a',   // Deep slate bg
        color4: '#60a5fa',   // Light blue — price, stats
        color5: '#1d4ed8',   // Deep blue — badge end
        color6: '#1e40af',   // Darker blue — gradient end
        color7: '#38bdf8',   // Sky blue accent
        color8: '#060c18',   // Near-black shadow
    },

    // ── 16. Toxic Green ──────────────────────────────────────────────────────
    toxicGreen: {
        name: 'Toxic Green',
        color1: '#84cc16',   // Lime green — primary
        color2: '#0d0d0d',   // Near-black text (on bright bg)
        color3: '#111800',   // Very dark olive bg
        color4: '#d9f99d',   // Pale lime — price, stats
        color5: '#65a30d',   // Mid lime — badge end
        color6: '#4d7c0f',   // Deep lime — gradient end
        color7: '#facc15',   // Yellow accent
        color8: '#050700',   // Near-black shadow
    },

    // ── 17. Magenta Surge ────────────────────────────────────────────────────
    magentaSurge: {
        name: 'Magenta Surge',
        color1: '#d946ef',   // Vivid magenta — primary
        color2: '#ffffff',   // White text
        color3: '#1a0020',   // Deep dark bg
        color4: '#f0abfc',   // Light purple — price, stats
        color5: '#a21caf',   // Deep magenta — badge end
        color6: '#86198f',   // Very deep magenta — gradient end
        color7: '#f472b6',   // Pink accent
        color8: '#0d0012',   // Near-black shadow
    },

    // ── 18. Bronze & Flame ───────────────────────────────────────────────────
    bronzeAndFlame: {
        name: 'Bronze & Flame',
        color1: '#b45309',   // Bronze-amber — primary
        color2: '#fffbf5',   // Warm white text
        color3: '#1c0f00',   // Dark warm brown bg
        color4: '#fcd34d',   // Light gold — price, stats
        color5: '#92400e',   // Deep bronze — badge end
        color6: '#78350f',   // Very dark bronze — gradient end
        color7: '#fb923c',   // Orange accent
        color8: '#0d0700',   // Near-black shadow
    },

    // ── 19. Steel & Cyan ─────────────────────────────────────────────────────
    steelAndCyan: {
        name: 'Steel & Cyan',
        color1: '#06b6d4',   // Cyan — primary
        color2: '#ffffff',   // White text
        color3: '#0c1a2b',   // Dark steel bg
        color4: '#a5f3fc',   // Ice cyan — price, stats
        color5: '#0891b2',   // Mid cyan — badge end
        color6: '#0e7490',   // Deep cyan — gradient end
        color7: '#818cf8',   // Indigo accent
        color8: '#060e18',   // Near-black shadow
    },

    // ── 20. Scarlet Night ────────────────────────────────────────────────────
    scarletNight: {
        name: 'Scarlet Night',
        color1: '#ef4444',   // Scarlet red — primary
        color2: '#ffffff',   // White text
        color3: '#18020a',   // Very dark red-black bg
        color4: '#fca5a5',   // Light red — price, stats
        color5: '#dc2626',   // Deep red — badge end
        color6: '#b91c1c',   // Deeper red — gradient end
        color7: '#f97316',   // Orange accent
        color8: '#0d0105',   // Near-black shadow
    },

    // ── 21. Vivid Violet ─────────────────────────────────────────────────────
    vividViolet: {
        name: 'Vivid Violet',
        color1: '#7c3aed',   // Deep violet — primary
        color2: '#ffffff',   // White text
        color3: '#150a2d',   // Very dark purple bg
        color4: '#ddd6fe',   // Light lavender — price, stats
        color5: '#6d28d9',   // Mid violet — badge end
        color6: '#5b21b6',   // Deep violet — gradient end
        color7: '#f472b6',   // Pink accent
        color8: '#0a0518',   // Near-black shadow
    },

    // ── 22. Honey Trap ───────────────────────────────────────────────────────
    honeyTrap: {
        name: 'Honey Trap',
        color1: '#d97706',   // Honey amber — primary
        color2: '#ffffff',   // White text
        color3: '#1a0f00',   // Dark warm bg
        color4: '#fef3c7',   // Pale honey — price, stats
        color5: '#b45309',   // Dark honey — badge end
        color6: '#92400e',   // Deep bronze — gradient end
        color7: '#f59e0b',   // Amber accent
        color8: '#0d0800',   // Near-black shadow
    },

    // ── 23. Laser Red ────────────────────────────────────────────────────────
    laserRed: {
        name: 'Laser Red',
        color1: '#ff1744',   // Laser red — primary
        color2: '#ffffff',   // White text
        color3: '#1a0005',   // Very dark red-black bg
        color4: '#ff8a80',   // Soft red — price, stats
        color5: '#d50032',   // Deep laser red — badge end
        color6: '#9e0023',   // Deepest red — gradient end
        color7: '#ff6d00',   // Orange accent
        color8: '#0d0003',   // Near-black shadow
    },

    // ── 24. Deep Ocean ───────────────────────────────────────────────────────
    deepOcean: {
        name: 'Deep Ocean',
        color1: '#0369a1',   // Ocean blue — primary
        color2: '#f0f9ff',   // Ice white text
        color3: '#0a1929',   // Deep ocean bg
        color4: '#38bdf8',   // Sky blue — price, stats
        color5: '#075985',   // Mid ocean — badge end
        color6: '#0c4a6e',   // Deep ocean — gradient end
        color7: '#22d3ee',   // Cyan accent
        color8: '#030e1a',   // Near-black shadow
    },

    // ── 25. Ember & Ink ──────────────────────────────────────────────────────
    emberAndInk: {
        name: 'Ember & Ink',
        color1: '#ea580c',   // Ember orange — primary
        color2: '#fef9f5',   // Warm white text
        color3: '#0c0300',   // Near-black bg
        color4: '#fed7aa',   // Peach — price, stats
        color5: '#c2410c',   // Deep ember — badge end
        color6: '#9a3412',   // Dark ember — gradient end
        color7: '#fbbf24',   // Gold accent
        color8: '#000000',   // Black shadow
    },

    // ── 26. Ultraviolet Storm ────────────────────────────────────────────────
    ultravioletStorm: {
        name: 'Ultraviolet Storm',
        color1: '#6366f1',   // Indigo — primary
        color2: '#ffffff',   // White text
        color3: '#0f0c29',   // Deep indigo bg
        color4: '#a5b4fc',   // Light indigo — price, stats
        color5: '#4f46e5',   // Mid indigo — badge end
        color6: '#4338ca',   // Deep indigo — gradient end
        color7: '#e879f9',   // Fuchsia accent
        color8: '#07051a',   // Near-black shadow
    },

    // ── 27. Blood Moon ───────────────────────────────────────────────────────
    bloodMoon: {
        name: 'Blood Moon',
        color1: '#b91c1c',   // Blood red — primary
        color2: '#fff7f7',   // Pale warm white text
        color3: '#200000',   // Very dark red bg
        color4: '#fca5a5',   // Pale red — price, stats
        color5: '#991b1b',   // Deep blood red — badge end
        color6: '#7f1d1d',   // Very deep red — gradient end
        color7: '#fb923c',   // Orange accent
        color8: '#100000',   // Near-black red shadow
    },

    // ── 28. Toxic Surge ──────────────────────────────────────────────────────
    toxicSurge: {
        name: 'Toxic Surge',
        color1: '#10b981',   // Emerald — primary
        color2: '#ffffff',   // White text
        color3: '#042f22',   // Very dark green bg
        color4: '#6ee7b7',   // Mint — price, stats
        color5: '#059669',   // Deep emerald — badge end
        color6: '#047857',   // Darker emerald — gradient end
        color7: '#34d399',   // Light emerald accent
        color8: '#021a12',   // Near-black shadow
    },

    // ── 29. Flame & Steel ────────────────────────────────────────────────────
    flameAndSteel: {
        name: 'Flame & Steel',
        color1: '#f43f5e',   // Rose-red — primary
        color2: '#ffffff',   // White text
        color3: '#1e1e2e',   // Dark slate bg
        color4: '#fda4af',   // Soft rose — price, stats
        color5: '#e11d48',   // Deep rose — badge end
        color6: '#be123c',   // Dark rose — gradient end
        color7: '#38bdf8',   // Sky blue accent
        color8: '#0f0f1a',   // Near-black shadow
    },

    // ── 30. Supernova ────────────────────────────────────────────────────────
    supernova: {
        name: 'Supernova',
        color1: '#fb923c',   // Warm orange — primary
        color2: '#ffffff',   // White text
        color3: '#1a0e00',   // Very dark warm bg
        color4: '#fef08a',   // Pale yellow — price, stats
        color5: '#f97316',   // Deep orange — badge end
        color6: '#ea580c',   // Deeper orange — gradient end
        color7: '#fbbf24',   // Amber accent
        color8: '#0d0700',   // Near-black shadow
    },
};

let allProducts = [];
let isApplyingPreset = false;

const fontFamilies = [
    { label: 'Archivo Black', value: 'Archivo Black' },
    { label: 'Poppins',       value: 'Poppins' },
    { label: 'Montserrat',    value: 'Montserrat' },
    { label: 'Orbitron',      value: 'Orbitron' },
    { label: 'Bebas Neue',    value: 'Bebas Neue' },
    { label: 'Righteous',     value: 'Righteous' },
    { label: 'Roboto',        value: 'Roboto' },
    { label: 'Inter',         value: 'Inter' },
    { label: 'Lato',          value: 'Lato' },
    { label: 'Arial',         value: 'Arial' },
    { label: 'Helvetica',     value: 'Helvetica' }
];

const titleTags = [
    { label: 'H1', value: 'H1' },
    { label: 'H2', value: 'H2' },
    { label: 'H3', value: 'H3' },
    { label: 'H4', value: 'H4' },
    { label: 'H5', value: 'H5' },
    { label: 'H6', value: 'H6' }
];

const booleanOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No',  value: 'false' }
];

// Countdown mode options
const countdownModeOptions = [
    { label: 'Count down from hours (e.g. 24h)',   value: 'hours' },
    { label: 'Count down to end of day (midnight)', value: 'midnight' },
];

$w.onReady(async function () {
    const props = await wixWidget.getProps();

    // ── 1. Color Preset Dropdown ──────────────────────────────────────────────
    const presetOptions = Object.keys(URGENCY_TIMER_PRESETS).map(key => ({
        label: URGENCY_TIMER_PRESETS[key].name,
        value: key
    }));

    $w('#colorPresetDropdown').options = presetOptions;
    $w('#colorPresetDropdown').value = 'custom';

    $w('#colorPresetDropdown').onChange(async (event) => {
        const presetKey = event.target.value;
        const preset    = URGENCY_TIMER_PRESETS[presetKey];

        if (presetKey !== 'custom') {
            isApplyingPreset = true;
            await applyColorPreset(preset);
            isApplyingPreset = false;
        }
    });

    // ── 2. Color Pickers (color1–color8) ─────────────────────────────────────
    const colorDefaults = {
        color1: '#ff4757',
        color2: '#ffffff',
        color3: '#2f3542',
        color4: '#ffa502',
        color5: '#ff6348',
        color6: '#ff3838',
        color7: '#1e90ff',
        color8: '#000000',
    };

    for (let i = 1; i <= 8; i++) {
        const pickerId = `#panelColorPicker${i}`;
        const propKey  = `color${i}`;

        $w(pickerId).value = props[propKey] || colorDefaults[propKey];

        $w(pickerId).onChange((event) => {
            if (!isApplyingPreset) {
                wixWidget.setProps({ [propKey]: event.target.value });
                $w('#colorPresetDropdown').value = 'custom';
            }
        });
    }

    // ── 3. Load Products ─────────────────────────────────────────────────────
    await loadPanelProducts(props);

    // ── 4. Font & Tag Dropdowns ───────────────────────────────────────────────
    setupDropdown('#panelDropdown11', 'titleTag',           props, 'H2',           titleTags);
    setupDropdown('#panelDropdown12', 'titleFontFamily',    props, 'Archivo Black', fontFamilies);
    setupDropdown('#panelDropdown13', 'urgencyFontFamily',  props, 'Poppins',       fontFamilies);
    setupDropdown('#panelDropdown14', 'priceFontFamily',    props, 'Montserrat',    fontFamilies);
    setupDropdown('#panelDropdown15', 'timerFontFamily',    props, 'Orbitron',      fontFamilies);
    setupDropdown('#panelDropdown16', 'ctaFontFamily',      props, 'Poppins',       fontFamilies);

    // ── 5. Boolean Dropdowns ─────────────────────────────────────────────────
    // FIX: showSold dropdown removed. showViewers and autoRotate remain.
    setupDropdown('#panelDropdown17', 'showViewers', props, 'true', booleanOptions);
    setupDropdown('#panelDropdown18', 'autoRotate',  props, 'true', booleanOptions);

    // ── 6. Countdown Mode Dropdown ───────────────────────────────────────────
    setupDropdown('#countdownModeDropdown', 'countdownMode', props, 'hours', countdownModeOptions);

    // ── 7. Sliders ───────────────────────────────────────────────────────────
    setupSlider('#panelSlider1', 'titleFontSize',  props, 20, 14, 36);
    setupSlider('#panelSlider2', 'urgencyFontSize',props, 13, 10, 22);
    setupSlider('#panelSlider3', 'priceFontSize',  props, 28, 18, 48);
    setupSlider('#panelSlider4', 'timerFontSize',  props, 24, 16, 40);
    setupSlider('#panelSlider5', 'ctaFontSize',    props, 15, 12, 24);
    setupSlider('#panelSlider6', 'borderWidth',    props,  0,  0, 10);
    setupSlider('#panelSlider7', 'cornerRadius',   props, 16,  0, 40);
    // FIX: timerDuration slider — set countdown hours (1–72)
    setupSlider('#panelSlider8', 'timerDuration',  props, 24,  1, 72);
    setupSlider('#panelSlider9', 'rotationSpeed',  props,  8,  3, 20);

    // ── 8. Text Inputs ───────────────────────────────────────────────────────
    setupTextInput('#mainTextInput',    'mainText',    props, '🔥 HOT DEAL ENDING SOON');
    setupTextInput('#urgencyTextInput', 'urgencyText', props, 'Limited Time Offer!');
    setupTextInput('#ctaTextInput',     'ctaText',     props, 'Claim Deal');

    // ── 9. Reset Button ──────────────────────────────────────────────────────
    $w('#resetDefaultsButton').onClick(() => {
        const defaultProps = { ...colorDefaults };
        defaultProps.titleFontSize   = 20;
        defaultProps.urgencyFontSize = 13;
        defaultProps.priceFontSize   = 28;
        defaultProps.timerFontSize   = 24;
        defaultProps.ctaFontSize     = 15;
        defaultProps.borderWidth     = 0;
        defaultProps.cornerRadius    = 16;
        defaultProps.timerDuration   = 24;
        defaultProps.rotationSpeed   = 8;
        defaultProps.showViewers     = true;
        defaultProps.autoRotate      = true;
        defaultProps.countdownMode   = 'hours';
        defaultProps.mainText        = '🔥 HOT DEAL ENDING SOON';
        defaultProps.urgencyText     = 'Limited Time Offer!';
        defaultProps.ctaText         = 'Claim Deal';

        wixWidget.setProps(defaultProps);
        $w('#colorPresetDropdown').value = 'custom';
    });
});

// ── Apply a color preset: batch-update all 8 colors at once ──────────────────
async function applyColorPreset(preset) {
    const propsToUpdate = {};

    for (let i = 1; i <= 8; i++) {
        const colorKey = `color${i}`;
        if (preset[colorKey]) {
            propsToUpdate[colorKey] = preset[colorKey];
        }
    }

    await wixWidget.setProps(propsToUpdate);

    for (let i = 1; i <= 8; i++) {
        const colorKey = `color${i}`;
        if (preset[colorKey]) {
            $w(`#panelColorPicker${i}`).value = preset[colorKey];
        }
    }
}

// ── Load products for the 10 product dropdowns ────────────────────────────────
async function loadPanelProducts(props) {
    try {
        const result = await getAllProducts();
        allProducts  = result.products;

        const options = [
            { label: 'None', value: '' },
            ...allProducts.map(p => ({ label: p.name, value: p.id }))
        ];

        for (let i = 1; i <= 10; i++) {
            $w(`#panelDropdown${i}`).options = options;
            const saved = props[`productId${i}`];
            if (saved) $w(`#panelDropdown${i}`).value = saved;

            $w(`#panelDropdown${i}`).onChange((event) => {
                const index = i;
                wixWidget.setProps({ [`productId${index}`]: event.target.value });
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ── Helpers (matching original panel patterns) ────────────────────────────────
function setupColorInput(id, propKey, props, defaultValue) {
    const element = $w(id);
    element.value = props[propKey] || defaultValue;
    element.onChange((event) => {
        wixWidget.setProps({ [propKey]: event.target.value });
    });
}

function setupTextInput(id, propKey, props, defaultValue) {
    const element = $w(id);
    element.value = props[propKey] || defaultValue;
    element.onInput((event) => {
        wixWidget.setProps({ [propKey]: event.target.value });
    });
}

function setupSlider(id, propKey, props, defaultValue, min, max) {
    const element = $w(id);
    element.min   = min;
    element.max   = max;
    element.value = props[propKey] !== undefined ? props[propKey] : defaultValue;
    element.onChange((event) => {
        wixWidget.setProps({ [propKey]: Number(event.target.value) });
    });
}

function setupDropdown(id, propKey, props, defaultValue, options) {
    const element = $w(id);

    if (options.length > 0) {
        element.options = options;
    }

    let valueToSet = props[propKey];

    if (propKey === 'showViewers' || propKey === 'autoRotate') {
        valueToSet = valueToSet === undefined ? defaultValue : String(valueToSet);
    } else {
        valueToSet = valueToSet || defaultValue;
    }

    element.value = valueToSet;

    element.onChange((event) => {
        let newValue = event.target.value;

        if (propKey === 'showViewers' || propKey === 'autoRotate') {
            newValue = newValue === 'true';
        }

        wixWidget.setProps({ [propKey]: newValue });
    });
}


// =============================================================================
// FILE 3: CUSTOM ELEMENT CODE (urgencyTimer.js)
// =============================================================================

class UrgencyTimerElement extends HTMLElement {
    constructor() {
        super();
        this.products       = [];
        this.currentIndex   = 0;
        this.rotationInterval = null;
        this.timerIntervals = new Map();
        this.settings = {
            color1: '#ff4757',
            color2: '#ffffff',
            color3: '#2f3542',
            color4: '#ffa502',
            color5: '#ff6348',
            color6: '#ff3838',
            color7: '#1e90ff',
            color8: '#000000',
            borderWidth: 0,
            cornerRadius: 16,
            mainText: '🔥 HOT DEAL ENDING SOON',
            urgencyText: 'Limited Time Offer!',
            ctaText: 'Claim Deal',
            // FIX: two countdown controls
            countdownMode: 'hours',   // 'hours' | 'midnight'
            timerDuration: 24,        // hours to count down from (when mode = 'hours')
            showViewers: true,
            // FIX: showSold removed entirely
            autoRotate: true,
            rotationSpeed: 8,
            titleFontFamily: 'Archivo Black',
            titleFontSize: 20,
            urgencyFontFamily: 'Poppins',
            urgencyFontSize: 13,
            priceFontFamily: 'Montserrat',
            priceFontSize: 28,
            timerFontFamily: 'Orbitron',
            timerFontSize: 24,
            ctaFontFamily: 'Poppins',
            ctaFontSize: 15,
            titleTag: 'H2'
        };
        this.isRendered         = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData || [];
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    this.products     = data || [];
                    this.currentIndex = 0;
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    const oldAutoRotate    = this.settings.autoRotate;
                    const oldRotationSpeed = this.settings.rotationSpeed;
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                        if (oldAutoRotate !== this.settings.autoRotate ||
                            oldRotationSpeed !== this.settings.rotationSpeed) {
                            this.setupRotation();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }
        }
    }

    disconnectedCallback() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        this.timerIntervals.forEach(interval => clearInterval(interval));
        this.timerIntervals.clear();
    }

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        const priceNum   = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    getRandomViewers() {
        return Math.floor(Math.random() * 150) + 50;
    }

    // ── FIX: compute countdown end-time based on countdownMode ───────────────
    getCountdownEndTime() {
        const now = new Date();
        if (this.settings.countdownMode === 'midnight') {
            // Count down to end of current day
            const midnight = new Date(now);
            midnight.setHours(23, 59, 59, 999);
            return midnight;
        }
        // Default: count down from timerDuration hours
        const endTime = new Date(now);
        endTime.setHours(endTime.getHours() + (Number(this.settings.timerDuration) || 24));
        return endTime;
    }

    render() {
        // ── FIX: Card uses same fixed-width grid layout as the limited-stock widget
        // so all products fill an identical container. Responsive breakpoints match.
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@700;800;900&family=Orbitron:wght@700;900&family=Bebas+Neue&family=Righteous&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :host {
                    display: block;
                    width: 100%;
                    --color1: #ff4757;
                    --color2: #ffffff;
                    --color3: #2f3542;
                    --color4: #ffa502;
                    --color5: #ff6348;
                    --color6: #ff3838;
                    --color7: #1e90ff;
                    --color8: #000000;
                }

                @keyframes intense-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%       { transform: scale(1.08); opacity: 0.9; }
                }
                @keyframes shake-urgent {
                    0%, 100% { transform: translateX(0) rotate(0deg); }
                    25%       { transform: translateX(-8px) rotate(-2deg); }
                    75%       { transform: translateX(8px) rotate(2deg); }
                }
                @keyframes blink-fast {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.3; }
                }
                @keyframes glow-intense {
                    0%, 100% { box-shadow: 0 0 30px rgba(255,71,87,0.6), 0 0 60px rgba(255,71,87,0.3); }
                    50%       { box-shadow: 0 0 50px rgba(255,71,87,0.9), 0 0 100px rgba(255,71,87,0.5); }
                }
                @keyframes countdown-pulse {
                    0%, 100% { transform: scale(1);   background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%); }
                    50%       { transform: scale(1.1); background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                /* ── OUTER CONTAINER ── same 100% width pattern as limited-stock widget */
                .timer-container {
                    width: 100%;
                    padding: 0;
                    position: relative;
                }

                /* ── CARD GRID STACK (same pattern as limited-stock) ─────────────────
                   All cards share the same grid cell → identical width, no layout shift  */
                .product-carousel {
                    display: grid;
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr;
                    width: 100%;
                    overflow: hidden;
                }

                .urgency-card {
                    grid-column: 1;
                    grid-row: 1;
                    width: 100%;
                    min-width: 0;
                    background: linear-gradient(135deg, var(--color3) 0%, #1a1d24 100%);
                    border-radius: var(--corner-radius, 16px);
                    overflow: hidden;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.3);
                    position: relative;
                    animation: glow-intense 2s ease-in-out infinite;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.4s ease, visibility 0.4s ease;
                    pointer-events: none;
                }

                .urgency-card.active {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    animation: glow-intense 2s ease-in-out infinite, fadeIn 0.4s ease forwards;
                }

                /* shimmer top line */
                .urgency-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--color1) 0%, var(--color4) 50%, var(--color1) 100%);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                    z-index: 2;
                }

                .urgency-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    padding: 12px 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .urgency-header::after {
                    content: '🔥';
                    position: absolute;
                    font-size: 100px;
                    opacity: 0.1;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    animation: intense-pulse 1.5s ease-in-out infinite;
                }

                .main-text {
                    font-family: var(--urgency-font-family);
                    font-size: var(--urgency-font-size);
                    color: var(--color2);
                    margin: 0;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    z-index: 1;
                    position: relative;
                    animation: shake-urgent 3s ease-in-out infinite;
                }

                /* ── PRODUCT IMAGE: fixed height, never shrinks ─────────────────────── */
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .product-image-timer {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    border-bottom: 3px solid var(--color1);
                    transition: transform 0.4s ease;
                }

                .urgency-card.active:hover .product-image-timer {
                    transform: scale(1.08);
                }

                .discount-badge-timer {
                    position: absolute;
                    top: 12px; right: 12px;
                    width: 70px; height: 70px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color2);
                    font-weight: 900;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                    border: 4px solid var(--color2);
                    animation: intense-pulse 1.5s ease-in-out infinite;
                    z-index: 10;
                }
                .discount-value-timer {
                    font-size: 24px;
                    line-height: 1;
                    font-family: var(--timer-font-family);
                }
                .discount-label-timer {
                    font-size: 10px;
                    text-transform: uppercase;
                    font-family: var(--urgency-font-family);
                }

                /* ── PRODUCT CONTENT AREA ─────────────────────────────────────────── */
                .product-content {
                    padding: 20px;
                    width: 100%;
                }

                .product-title-timer {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    color: var(--color2);
                    margin: 0 0 12px 0;
                    font-weight: 900;
                    text-transform: uppercase;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    width: 100%;
                }

                .urgency-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    color: var(--color2);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-family: var(--urgency-font-family);
                    font-size: calc(var(--urgency-font-size) - 2px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    animation: intense-pulse 2s ease-in-out infinite;
                    margin-bottom: 12px;
                }

                .price-timer-section {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    margin-bottom: 15px;
                    padding: 12px 0;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    flex-wrap: wrap;
                }
                .product-price-timer {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 900;
                    color: var(--color4);
                    text-shadow: 0 0 20px rgba(255,165,2,0.5);
                }
                .product-compare-price-timer {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: #999;
                    text-decoration: line-through;
                }

                /* FIX: showSold stat removed. Only viewers row remains. */
                .stats-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-bottom: 0;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.1);
                    padding: 7px 14px;
                    border-radius: 20px;
                    font-family: var(--urgency-font-family);
                    font-size: 12px;
                    color: var(--color2);
                    font-weight: 600;
                }
                .stat-icon   { font-size: 16px; }
                .stat-number { font-weight: 800; color: var(--color4); }

                /* ── COUNTDOWN SECTION ─────────────────────────────────────────────── */
                .countdown-section {
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    text-align: center;
                    border-top: 2px solid rgba(255,71,87,0.3);
                }
                .countdown-label {
                    font-family: var(--urgency-font-family);
                    font-size: 12px;
                    color: var(--color4);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                .countdown-display {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .time-box {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    padding: 12px 16px;
                    border-radius: 10px;
                    min-width: 70px;
                    border: 2px solid rgba(255,255,255,0.2);
                    animation: countdown-pulse 2s ease-in-out infinite;
                }
                .time-value {
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    color: var(--color2);
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 0 15px rgba(255,255,255,0.5);
                }
                .time-label {
                    font-family: var(--urgency-font-family);
                    font-size: 10px;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    margin-top: 6px;
                    letter-spacing: 1px;
                }
                .time-separator {
                    color: var(--color4);
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    font-weight: 900;
                    align-self: center;
                    animation: blink-fast 1s ease-in-out infinite;
                }

                /* ── CTA BUTTON ───────────────────────────────────────────────────── */
                .cta-button-timer {
                    display: block;
                    width: 100%;
                    padding: 18px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    font-family: var(--cta-font-family);
                    font-size: var(--cta-font-size);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: none;
                    border-radius: 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 -4px 20px rgba(255,71,87,0.3);
                    position: relative;
                    overflow: hidden;
                }
                .cta-button-timer::before {
                    content: '⚡';
                    position: absolute;
                    left: -40px;
                    font-size: 24px;
                    transition: left 0.3s ease;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .cta-button-timer:hover::before { left: 30px; }
                .cta-button-timer:hover {
                    background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 -8px 30px rgba(255,71,87,0.5);
                    padding-left: 60px;
                }

                /* ── NAVIGATION ───────────────────────────────────────────────────── */
                .navigation-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    background: rgba(0,0,0,0.2);
                }
                .nav-arrow {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: var(--color2);
                    border: 2px solid var(--color1);
                    color: var(--color1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 20px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .nav-arrow:hover {
                    background: var(--color1);
                    color: var(--color2);
                    transform: scale(1.1);
                }
                .navigation-dots {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .nav-dot {
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    background: rgba(255,71,87,0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                }
                .nav-dot:hover { background: rgba(255,71,87,0.6); transform: scale(1.2); }
                .nav-dot.active {
                    background: var(--color1);
                    transform: scale(1.3);
                    box-shadow: 0 0 10px var(--color1);
                }

                /* ── EMPTY STATE ──────────────────────────────────────────────────── */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: #999;
                    font-family: var(--urgency-font-family);
                    font-size: 18px;
                }
                .empty-state::before {
                    content: '⏰';
                    display: block;
                    font-size: 80px;
                    margin-bottom: 20px;
                }

                /* ── RESPONSIVE ───────────────────────────────────────────────────── */
                @media (max-width: 768px) {
                    .product-image-container { height: 250px; }
                    .product-content { padding: 16px; }
                    .countdown-display { gap: 8px; }
                    .time-box { min-width: 60px; padding: 10px 12px; }
                }
                @media (max-width: 480px) {
                    .product-image-container { height: 220px; }
                    .time-box { min-width: 50px; padding: 8px 10px; }
                    .nav-arrow { width: 35px; height: 35px; font-size: 16px; }
                    .discount-badge-timer { width: 60px; height: 60px; }
                    .discount-value-timer { font-size: 20px; }
                }
            </style>

            <div class="timer-container">
                <div class="urgency-header">
                    <div class="main-text"></div>
                </div>
                <div class="product-carousel"></div>
                <div class="navigation-controls" style="display:none;">
                    <div class="nav-arrow nav-prev">‹</div>
                    <div class="navigation-dots"></div>
                    <div class="nav-arrow nav-next">›</div>
                </div>
            </div>
        `;
    }

    renderProducts() {
        const mainText  = this.querySelector('.main-text');
        const carousel  = this.querySelector('.product-carousel');
        const navControls = this.querySelector('.navigation-controls');
        const dotsContainer = this.querySelector('.navigation-dots');

        if (mainText) {
            mainText.textContent = this.settings.mainText || '🔥 HOT DEAL ENDING SOON';
        }

        if (!carousel) return;

        if (this.products.length === 0) {
            carousel.innerHTML = '<div class="empty-state">No products selected</div>';
            if (navControls) navControls.style.display = 'none';
            return;
        }

        // FIX: render ALL cards into the grid at once (same pattern as limited-stock)
        carousel.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');

        if (navControls) {
            navControls.style.display = this.products.length > 1 ? 'flex' : 'none';
        }

        this.showCard(this.currentIndex);
        this.renderDots();
        this.setupNavigation();
        this.setupRotation();
        this.updateStyles();

        // Start countdown for first product
        if (this.products[this.currentIndex]) {
            this.startCountdown(this.products[this.currentIndex].id);
        }
    }

    // FIX: all cards rendered into grid; only active one visible (no layout shift)
    showCard(index) {
        const cards = this.querySelectorAll('.urgency-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        this.currentIndex = index;
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice    = product.price || 'Price not available';
        const discount        = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        const titleTag        = this.settings.titleTag || 'H2';
        const viewers         = this.getRandomViewers();

        return `
            <div class="urgency-card">
                <div class="product-image-container">
                    ${discount ? `
                        <div class="discount-badge-timer">
                            <div class="discount-value-timer">${discount}%</div>
                            <div class="discount-label-timer">OFF</div>
                        </div>` : ''}
                    <img src="${product.imageUrl}"
                         alt="${product.name}"
                         class="product-image-timer"
                         onerror="this.src='https://via.placeholder.com/600x300'">
                </div>

                <div class="product-content">
                    <${titleTag} class="product-title-timer">${product.name}</${titleTag}>
                    <div class="urgency-badge">${this.settings.urgencyText}</div>

                    <div class="price-timer-section">
                        <span class="product-price-timer">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price-timer">${product.compareAtPrice}</span>` : ''}
                    </div>

                    ${this.settings.showViewers ? `
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-icon">👁️</span>
                                <span class="stat-number">${viewers}</span>&nbsp;watching
                            </div>
                        </div>` : ''}
                </div>

                <div class="countdown-section">
                    <div class="countdown-label">⏰ Offer Expires In</div>
                    <div class="countdown-display">
                        <div class="time-box">
                            <div class="time-value" data-unit="hours" data-product="${product.id}">00</div>
                            <div class="time-label">Hours</div>
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-box">
                            <div class="time-value" data-unit="minutes" data-product="${product.id}">00</div>
                            <div class="time-label">Minutes</div>
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-box">
                            <div class="time-value" data-unit="seconds" data-product="${product.id}">00</div>
                            <div class="time-label">Seconds</div>
                        </div>
                    </div>
                    <a href="${product.productUrl}" class="cta-button-timer">${this.settings.ctaText}</a>
                </div>
            </div>
        `;
    }

    renderDots() {
        const dotsContainer = this.querySelector('.navigation-dots');
        if (!dotsContainer || this.products.length <= 1) {
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        dotsContainer.innerHTML = this.products.map((_, i) =>
            `<div class="nav-dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
        ).join('');

        dotsContainer.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            });
        });
    }

    updateDots() {
        this.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    setupNavigation() {
        const prevBtn = this.querySelector('.nav-prev');
        const nextBtn = this.querySelector('.nav-next');

        if (prevBtn) {
            prevBtn.onclick = () => {
                const idx = (this.currentIndex - 1 + this.products.length) % this.products.length;
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                const idx = (this.currentIndex + 1) % this.products.length;
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            };
        }
    }

    setupRotation() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        if (!this.settings.autoRotate || this.products.length <= 1) return;

        const speed = (this.settings.rotationSpeed || 8) * 1000;
        this.rotationInterval = setInterval(() => {
            const idx = (this.currentIndex + 1) % this.products.length;
            this.showCard(idx);
            this.updateDots();
            this.startCountdown(this.products[idx].id);
        }, speed);
    }

    // FIX: countdown uses per-product data attribute to update the right card's timer
    startCountdown(productId) {
        if (this.timerIntervals.has(productId)) {
            clearInterval(this.timerIntervals.get(productId));
        }

        const endTime = this.getCountdownEndTime();

        const updateTimer = () => {
            const distance = endTime.getTime() - Date.now();

            // Selectors scoped to this product's data attribute
            const hoursEl   = this.querySelector(`[data-unit="hours"][data-product="${productId}"]`);
            const minutesEl = this.querySelector(`[data-unit="minutes"][data-product="${productId}"]`);
            const secondsEl = this.querySelector(`[data-unit="seconds"][data-product="${productId}"]`);

            if (distance < 0) {
                const iv = this.timerIntervals.get(productId);
                if (iv) clearInterval(iv);
                this.timerIntervals.delete(productId);
                if (hoursEl)   hoursEl.textContent   = '00';
                if (minutesEl) minutesEl.textContent = '00';
                if (secondsEl) secondsEl.textContent = '00';
                return;
            }

            const hours   = Math.floor(distance / 3600000);
            const minutes = Math.floor((distance % 3600000) / 60000);
            const seconds = Math.floor((distance % 60000) / 1000);

            if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        this.timerIntervals.set(productId, interval);
    }

    updateStyles() {
        const container = this.querySelector('.timer-container');
        if (!container) return;

        const vars = {
            '--color1': this.settings.color1,
            '--color2': this.settings.color2,
            '--color3': this.settings.color3,
            '--color4': this.settings.color4,
            '--color5': this.settings.color5,
            '--color6': this.settings.color6,
            '--color7': this.settings.color7,
            '--color8': this.settings.color8,
            '--title-font-family':   this.settings.titleFontFamily,
            '--urgency-font-family': this.settings.urgencyFontFamily,
            '--price-font-family':   this.settings.priceFontFamily,
            '--timer-font-family':   this.settings.timerFontFamily,
            '--cta-font-family':     this.settings.ctaFontFamily,
            '--title-font-size':     `${this.settings.titleFontSize}px`,
            '--urgency-font-size':   `${this.settings.urgencyFontSize}px`,
            '--price-font-size':     `${this.settings.priceFontSize}px`,
            '--timer-font-size':     `${this.settings.timerFontSize}px`,
            '--cta-font-size':       `${this.settings.ctaFontSize}px`,
            '--corner-radius':       `${this.settings.cornerRadius}px`,
        };

        Object.entries(vars).forEach(([k, v]) => container.style.setProperty(k, v));

        this.querySelectorAll('.urgency-card').forEach(card => {
            card.style.border = this.settings.borderWidth > 0
                ? `${this.settings.borderWidth}px solid ${this.settings.color1}`
                : 'none';
        });
    }
}

customElements.define('urgency-timer', UrgencyTimerElement);
