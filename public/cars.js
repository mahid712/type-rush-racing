// High-Fidelity Real-World Iconic Cars (Sleek Side-Profile Perspective) & Billowing Sand Dust Engine
let carInstanceCount = 0;

const CarGraphics = {
  colors: [
    { name: 'Racing Red', hex: '#ff2a3b' },
    { name: 'Miami Blue', hex: '#00c3ff' },
    { name: 'Acid Green', hex: '#00ff88' },
    { name: 'Speed Yellow', hex: '#ffcc00' },
    { name: 'Ultraviolet', hex: '#9d34ff' },
    { name: 'Sunset Orange', hex: '#ff6a00' },
    { name: 'Pure White', hex: '#f0f3f6' }
  ],

  styles: [
    { id: 'porsche', name: 'Porsche 911 GT3 RS' },
    { id: 'lambo', name: 'Lamborghini Huracán STO' },
    { id: 'mustang', name: 'Shelby GT500 Mustang' },
    { id: 'f1', name: 'Formula 1 Grand Prix' },
    { id: 'gtr', name: 'Nissan GT-R Nismo' }
  ],

  getStyleName(styleId) {
    if (styleId === 'gt') styleId = 'porsche';
    if (styleId === 'hyper') styleId = 'lambo';
    if (styleId === 'muscle') styleId = 'mustang';
    if (styleId === 'formula') styleId = 'f1';
    const found = this.styles.find(s => s.id === styleId);
    return found ? found.name : 'Supercar';
  },

  getColorName(hex) {
    if (!hex) return 'Custom Paint';
    const found = this.colors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    return found ? found.name : 'Custom Paint';
  },

  getCarSVG(color = '#00c3ff', style = 'porsche', withDrift = true) {
    // Unique ID prefix per SVG instance to prevent SVG gradient shadowing/blackout bugs when screens toggle display:none
    const uid = 'car_' + (++carInstanceCount) + '_' + Math.random().toString(36).substring(2, 7);

    // Map backwards compatibility aliases
    if (style === 'gt') style = 'porsche';
    if (style === 'hyper') style = 'lambo';
    if (style === 'muscle') style = 'mustang';
    if (style === 'formula') style = 'f1';

    // Track mode has room for rear dust clouds; lobby/preview mode is tightly cropped & centered on the car
    const viewBox = withDrift ? "-75 -5 275 80" : "10 6 182 62";

    // Common shaders & filters with unique instance IDs
    const defs = `
      <defs>
        <!-- Automotive Metallic Body Paint Shader (Clearcoat highlight + rich body + deep shadow) -->
        <linearGradient id="${uid}_paint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
          <stop offset="12%" stop-color="${color}"/>
          <stop offset="65%" stop-color="${color}"/>
          <stop offset="90%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#080c14" stop-opacity="0.55"/>
        </linearGradient>

        <!-- Automotive Windshield & Window Glass Reflection -->
        <linearGradient id="${uid}_glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#243b55" stop-opacity="0.95"/>
          <stop offset="35%" stop-color="#5a88b5" stop-opacity="0.85"/>
          <stop offset="65%" stop-color="#141e2a" stop-opacity="0.95"/>
        </linearGradient>

        <!-- Carbon Fiber Shader -->
        <linearGradient id="${uid}_carbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#12151b"/>
          <stop offset="50%" stop-color="#222631"/>
          <stop offset="100%" stop-color="#12151b"/>
        </linearGradient>

        <!-- Headlight Beam Gradient -->
        <linearGradient id="${uid}_beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
          <stop offset="35%" stop-color="#80e0ff" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#80e0ff" stop-opacity="0"/>
        </linearGradient>

        <!-- Soft Billowing Sand & Dust Plume Gradients (Pure Soft Clouds, No Sticks) -->
        <radialGradient id="${uid}_puff1" cx="45%" cy="45%" r="50%">
          <stop offset="0%" stop-color="#f5e0a3" stop-opacity="0.75"/>
          <stop offset="45%" stop-color="#d4a359" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#694614" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${uid}_puff2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ebd294" stop-opacity="0.6"/>
          <stop offset="55%" stop-color="#ba8d42" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#543710" stop-opacity="0"/>
        </radialGradient>

        <!-- Ground Glow Filter -->
        <filter id="${uid}_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;

    // Drift smoke effects only when on track
    const sandDustDriftEffects = withDrift ? `
      <g class="sand-dust-plume">
        <circle cx="28" cy="56" r="9" fill="url(#${uid}_puff1)" class="sand-cloud puff-bot-1"/>
        <circle cx="16" cy="53" r="13" fill="url(#${uid}_puff2)" class="sand-cloud puff-bot-2"/>
        <circle cx="2" cy="48" r="18" fill="url(#${uid}_puff1)" class="sand-cloud puff-bot-3"/>
        <circle cx="-16" cy="42" r="24" fill="url(#${uid}_puff2)" class="sand-cloud puff-bot-4"/>
        <circle cx="24" cy="48" r="8" fill="url(#${uid}_puff1)" class="sand-cloud puff-top-1"/>
        <circle cx="10" cy="42" r="14" fill="url(#${uid}_puff2)" class="sand-cloud puff-top-2"/>
        <circle cx="-6" cy="36" r="20" fill="url(#${uid}_puff1)" class="sand-cloud puff-top-3"/>
        <circle cx="-28" cy="30" r="26" fill="url(#${uid}_puff2)" class="sand-cloud puff-top-4"/>
        <ellipse cx="-12" cy="46" rx="28" ry="16" fill="url(#${uid}_puff2)" class="sand-cloud puff-center-1"/>
      </g>
      <g class="sand-flying-grains">
        <circle cx="20" cy="55" r="1.8" fill="#f5e0a3" class="sand-grain g1"/>
        <circle cx="8" cy="50" r="1.4" fill="#d4a359" class="sand-grain g2"/>
        <circle cx="-4" cy="45" r="1.8" fill="#a67c38" class="sand-grain g3"/>
        <circle cx="14" cy="42" r="1.5" fill="#f5e0a3" class="sand-grain g4"/>
        <circle cx="-14" cy="35" r="2" fill="#d4a359" class="sand-grain g5"/>
        <circle cx="-24" cy="28" r="1.6" fill="#a67c38" class="sand-grain g6"/>
      </g>
    ` : '';

    const headlightCone = withDrift ? `
      <polygon points="182,44 265,32 265,60 182,50" fill="url(#${uid}_beam)" class="headlight-beam"/>
    ` : '';

    // =========================================================================
    // 1. PORSCHE 911 GT3 RS (Iconic Teardrop Flyline, Swan-Neck Wing, BBS Wheels)
    // =========================================================================
    if (style === 'porsche') {
      return `
        <svg class="car-svg car-porsche" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
          ${defs}
          ${sandDustDriftEffects}
          ${headlightCone}

          <!-- Ground Contact Shadow & Neon Underglow -->
          <ellipse cx="106" cy="62.5" rx="76" ry="3.8" fill="#000000" opacity="0.6"/>
          <ellipse cx="106" cy="61.5" rx="72" ry="5" fill="${color}" opacity="0.45" filter="url(#${uid}_glow)"/>

          <!-- Swan-Neck Carbon Fiber GT3 RS Rear Wing Assembly (Solidly mounted to rear deck) -->
          <!-- Swan-Neck Upright Stanchions -->
          <path d="M 28,36 Q 26,14 36,12 L 39,13 Q 31,16 32,36 Z" fill="#141720" stroke="#000" stroke-width="0.5"/>
          <path d="M 36,36 Q 34,14 42,12 L 45,13 Q 39,16 40,36 Z" fill="#181c26" stroke="#000" stroke-width="0.5"/>
          <!-- High-Downforce Main Aerofoil Blade -->
          <path d="M 14,13.5 L 44,12 L 44,15.5 L 14,17 Z" fill="url(#${uid}_carbon)" stroke="#333" stroke-width="0.6"/>
          <!-- Shaped Endplates with Body Color Accent -->
          <polygon points="13,9 19,9 18,19 12,19" fill="${color}" stroke="#141720" stroke-width="0.8"/>
          <polygon points="14,11 18,11 17,17 13,17" fill="#141720"/>

          <!-- MAIN 911 COUPE SILHOUETTE (Seamless shell with carved wheel arches) -->
          <path d="M 22,44 
                   C 22,36 30,32 44,30 
                   C 56,28 66,24 74,19 
                   C 88,13 112,13 126,22 
                   C 136,28 150,32 166,37 
                   C 178,41 184,45 184,49 
                   L 186,52 
                   L 186,54.5 
                   L 166,55.5 
                   A 14 14 0 0 0 138,55.5 
                   L 66,55.5 
                   A 14 14 0 0 0 38,55.5 
                   L 22,54.5 
                   Z" 
                fill="url(#${uid}_paint)" 
                style="fill: ${color}; fill: url(#${uid}_paint);" 
                stroke="#0b0e14" 
                stroke-width="0.8"/>

          <!-- Front Fender Aero Louver Gills (GT3 RS Trademark) -->
          <path d="M 146,34 L 156,34 M 147,36 L 155,36 M 148,38 L 154,38" stroke="#12151c" stroke-width="1.2" stroke-linecap="round"/>

          <!-- Curved Greenhouse Glass Cabin & B-Pillar -->
          <path d="M 74,21 C 86,15 108,15 122,23 L 126,30 L 68,30 Z" fill="url(#${uid}_glass)"/>
          <path d="M 86,19 L 118,27" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
          <line x1="98" y1="17" x2="98" y2="30" stroke="#0e1318" stroke-width="2.5"/> <!-- Black B-Pillar -->

          <!-- Driver Helmet Inside Cockpit -->
          <circle cx="90" cy="23.5" r="4.2" fill="#ffd700" stroke="#111" stroke-width="0.8"/>
          <ellipse cx="92.5" cy="23.5" rx="2" ry="1.2" fill="#111"/>

          <!-- Aerodynamic Side Mirror -->
          <polygon points="122,27 127,25 127,29" fill="${color}" stroke="#111" stroke-width="0.6"/>

          <!-- Lower GT3 RS Decal Stripe -->
          <line x1="72" y1="52" x2="134" y2="52" stroke="#ffffff" stroke-width="1.2" opacity="0.45"/>

          <!-- Carbon Front Splitter & Side Skirt -->
          <rect x="170" y="55" width="16" height="3" rx="1" fill="#12151c" stroke="#2b303c" stroke-width="0.6"/>
          <rect x="66" y="55" width="72" height="2.5" rx="0.5" fill="#12151c" stroke="#000" stroke-width="0.5"/>

          <!-- Oval Teardrop Porsche Front Headlight (LED Halo) -->
          <ellipse cx="178" cy="43" rx="4" ry="2.8" fill="#e8f8ff" stroke="#77aacc" stroke-width="0.8"/>
          <circle cx="179" cy="43" r="1.5" fill="#ffffff"/>

          <!-- Slim LED Rear Lightbar -->
          <line x1="22" y1="42" x2="28" y2="42" stroke="#ff1133" stroke-width="2.2" stroke-linecap="round"/>

          <!-- REAR WHEEL ASSEMBLY (BBS Multi-Spoke with Yellow Caliper) -->
          <g class="wheel-rear">
            <circle cx="52" cy="51.5" r="12.5" fill="#121418" stroke="#252932" stroke-width="1"/>
            <circle cx="52" cy="51.5" r="11" fill="none" stroke="#0a0c10" stroke-width="1.5"/>
            <circle cx="52" cy="51.5" r="8.8" fill="#2c303a" stroke="#c0c4cc" stroke-width="0.8"/>
            <circle cx="52" cy="51.5" r="6.2" fill="#757982"/>
            <path d="M 50,45.5 A 6.2 6.2 0 0 1 56,45.5 L 55,47.5 A 4.2 4.2 0 0 0 51,47.5 Z" fill="#ffcc00" stroke="#b38f00" stroke-width="0.5"/>
            <line x1="52" y1="43.5" x2="52" y2="59.5" stroke="#e0e4ec" stroke-width="1"/>
            <line x1="44" y1="51.5" x2="60" y2="51.5" stroke="#e0e4ec" stroke-width="1"/>
            <line x1="46" y1="45.5" x2="58" y2="57.5" stroke="#e0e4ec" stroke-width="0.9"/>
            <line x1="46" y1="57.5" x2="58" y2="45.5" stroke="#e0e4ec" stroke-width="0.9"/>
            <circle cx="52" cy="51.5" r="2.2" fill="#111" stroke="#ffcc00" stroke-width="0.7"/>
          </g>

          <!-- FRONT WHEEL ASSEMBLY (BBS Multi-Spoke with Yellow Caliper) -->
          <g class="wheel-front">
            <circle cx="152" cy="51.5" r="12.5" fill="#121418" stroke="#252932" stroke-width="1"/>
            <circle cx="152" cy="51.5" r="11" fill="none" stroke="#0a0c10" stroke-width="1.5"/>
            <circle cx="152" cy="51.5" r="8.8" fill="#2c303a" stroke="#c0c4cc" stroke-width="0.8"/>
            <circle cx="152" cy="51.5" r="6.2" fill="#757982"/>
            <path d="M 150,45.5 A 6.2 6.2 0 0 1 156,45.5 L 155,47.5 A 4.2 4.2 0 0 0 151,47.5 Z" fill="#ffcc00" stroke="#b38f00" stroke-width="0.5"/>
            <line x1="152" y1="43.5" x2="152" y2="59.5" stroke="#e0e4ec" stroke-width="1"/>
            <line x1="144" y1="51.5" x2="160" y2="51.5" stroke="#e0e4ec" stroke-width="1"/>
            <line x1="146" y1="45.5" x2="158" y2="57.5" stroke="#e0e4ec" stroke-width="0.9"/>
            <line x1="146" y1="57.5" x2="158" y2="45.5" stroke="#e0e4ec" stroke-width="0.9"/>
            <circle cx="152" cy="51.5" r="2.2" fill="#111" stroke="#ffcc00" stroke-width="0.7"/>
          </g>
        </svg>
      `;
    }

    // =========================================================================
    // 2. LAMBORGHINI HURACÁN STO (Razor Wedge, Roof Snorkel, Shark Fin, STO Wing)
    // =========================================================================
    if (style === 'lambo') {
      return `
        <svg class="car-svg car-lambo" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
          ${defs}
          ${sandDustDriftEffects}
          ${headlightCone}

          <!-- Ground Contact Shadow & Neon Underglow -->
          <ellipse cx="106" cy="62.5" rx="76" ry="3.8" fill="#000000" opacity="0.6"/>
          <ellipse cx="106" cy="61.5" rx="70" ry="5" fill="${color}" opacity="0.45" filter="url(#${uid}_glow)"/>

          <!-- REAR WING ASSEMBLY (Twin Carbon Swan-Neck Pylons Solidly Anchored to Rear Deck) -->
          <!-- Pylon 1 (Rear) -->
          <path d="M 28,37 L 24,19 L 28,19 L 32,37 Z" fill="#141720" stroke="#000" stroke-width="0.5"/>
          <!-- Pylon 2 (Front) -->
          <path d="M 38,36 L 34,19 L 38,19 L 42,36 Z" fill="#181c26" stroke="#000" stroke-width="0.5"/>
          <!-- High-Downforce Carbon STO Aerofoil Blade -->
          <path d="M 18,17 L 44,16 L 44,19.5 L 18,20.5 Z" fill="url(#${uid}_carbon)" stroke="#333" stroke-width="0.6"/>
          <!-- STO Endplate (Carbon with body color accent) -->
          <polygon points="16,13 22,13 20,24 14,24" fill="${color}" stroke="#141720" stroke-width="0.8"/>
          <polygon points="17,15 21,15 19.5,22 15.5,22" fill="#141720"/>

          <!-- Central Longitudinal Shark Fin (Extends from roof snorkel down to rear deck) -->
          <path d="M 76,17 L 36,25 L 34,36 L 70,22 Z" fill="#13161e" stroke="#222" stroke-width="0.5" opacity="0.95"/>
          <!-- Roof Snorkel Air Scoop -->
          <path d="M 88,18 L 84,13.5 L 76,14.5 L 72,18 Z" fill="#141720" stroke="#333" stroke-width="0.7"/>
          <polygon points="86,17.5 83,14.5 80,15 82,17.5" fill="#0a0c10"/>

          <!-- MAIN SCULPTED LAMBORGHINI WEDGE BODY (Continuous shell with realistic wheel arches) -->
          <path d="M 20,44 
                   C 20,42 22,39 26,38 
                   L 46,34 
                   L 66,28 
                   L 76,18 
                   L 88,18 
                   C 102,23 116,28 126,33 
                   C 142,37 164,43 182,48 
                   L 186,51 
                   L 186,54.5 
                   L 166,55.5 
                   A 14 14 0 0 0 138,55.5 
                   L 66,55.5 
                   A 14 14 0 0 0 38,55.5 
                   L 22,54.5 
                   L 20,44 Z" 
                fill="url(#${uid}_paint)" 
                style="fill: ${color}; fill: url(#${uid}_paint);" 
                stroke="#0b0e14" 
                stroke-width="0.8"/>

          <!-- Body Aerodynamic Surface Crease & Shoulder Line -->
          <path d="M 32,38 Q 80,36 124,33" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.35"/>
          <path d="M 70,42 L 134,39" fill="none" stroke="#000000" stroke-width="0.8" opacity="0.4"/>

          <!-- Carbon Front Splitter & Low Aero Winglets -->
          <polygon points="170,55 188,53.5 188,57 168,57" fill="#12151c" stroke="#2b303c" stroke-width="0.6"/>
          <polygon points="184,51 188,51 188,55 184,55" fill="${color}"/> <!-- Splitter Winglet -->

          <!-- Side Carbon Rocker Sill (Ground clearance bar) -->
          <rect x="66" y="55" width="72" height="2.5" rx="0.5" fill="#141720" stroke="#000" stroke-width="0.5"/>
          <line x1="72" y1="56" x2="132" y2="56" stroke="${color}" stroke-width="0.8" opacity="0.7"/>

          <!-- Rear Carbon Race Diffuser -->
          <polygon points="20,53 26,53 24,57 18,57" fill="#12151c"/>
          <line x1="22" y1="53" x2="20" y2="57" stroke="#333" stroke-width="1.2"/>

          <!-- Hexagonal V10 Side Engine Air Intake Scoop -->
          <polygon points="68,39 88,37 82,47 64,47" fill="#0c0e14" stroke="#1c202a" stroke-width="1"/>
          <polygon points="70,40 85,38.5 81,45.5 66,45.5" fill="#05070a"/>

          <!-- Greenhouse Tinted Cockpit Glass -->
          <path d="M 76,21 C 82,20 86,20 90,20 L 122,32 L 118,34 L 70,34 Z" fill="url(#${uid}_glass)"/>
          <path d="M 88,21 L 118,31" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
          <line x1="122" y1="32" x2="90" y2="20" stroke="#0f1218" stroke-width="2"/>
          <line x1="76" y1="21" x2="70" y2="34" stroke="#0f1218" stroke-width="2"/>

          <!-- Driver Helmet Inside Cockpit -->
          <circle cx="94" cy="26" r="4.2" fill="#ffd700" stroke="#111" stroke-width="0.8"/>
          <ellipse cx="96.5" cy="26" rx="2" ry="1.2" fill="#111"/>

          <!-- Aerodynamic Carbon Side Mirror -->
          <polygon points="120,29 126,27 126,31" fill="${color}" stroke="#111" stroke-width="0.6"/>

          <!-- Cofango Front Hood Air Extraction Louvers -->
          <path d="M 144,38 L 152,38 M 145,40 L 153,40 M 146,42 L 154,42" stroke="#12151c" stroke-width="1.2" stroke-linecap="round"/>

          <!-- Signature Lamborghini Y-Shaped LED Headlight -->
          <path d="M 178,45 L 183,48 L 176,49" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="180" cy="47" r="1.2" fill="#90e0ef"/>

          <!-- Slim Rear LED Taillight Strip -->
          <line x1="20" y1="43" x2="26" y2="43" stroke="#ff1133" stroke-width="2" stroke-linecap="round"/>

          <!-- REAR WHEEL ASSEMBLY (Star-Forged Rim with Red Brembo Caliper) -->
          <g class="wheel-rear">
            <circle cx="52" cy="51.5" r="12.5" fill="#121418" stroke="#252932" stroke-width="1"/>
            <circle cx="52" cy="51.5" r="11" fill="none" stroke="#0a0c10" stroke-width="1.5"/>
            <circle cx="52" cy="51.5" r="9" fill="#20242e" stroke="#c0c4cc" stroke-width="0.7"/>
            <circle cx="52" cy="51.5" r="6.5" fill="#6d7280"/>
            <path d="M 50,45.5 A 6.5 6.5 0 0 1 56,45.5 L 55,47.5 A 4.5 4.5 0 0 0 51,47.5 Z" fill="#ff1a35" stroke="#990018" stroke-width="0.5"/>
            <polygon points="52,43.5 54,48.5 59,46.5 55,50.5 58,55.5 53,53.5 50,57.5 50,52.5 45,51.5 50,48.5" fill="#d8dce6" stroke="#444" stroke-width="0.4"/>
            <circle cx="52" cy="51.5" r="2.2" fill="#141720" stroke="#ff1a35" stroke-width="0.6"/>
          </g>

          <!-- FRONT WHEEL ASSEMBLY (Star-Forged Rim with Red Brembo Caliper) -->
          <g class="wheel-front">
            <circle cx="152" cy="51.5" r="12.5" fill="#121418" stroke="#252932" stroke-width="1"/>
            <circle cx="152" cy="51.5" r="11" fill="none" stroke="#0a0c10" stroke-width="1.5"/>
            <circle cx="152" cy="51.5" r="9" fill="#20242e" stroke="#c0c4cc" stroke-width="0.7"/>
            <circle cx="152" cy="51.5" r="6.5" fill="#6d7280"/>
            <path d="M 150,45.5 A 6.5 6.5 0 0 1 156,45.5 L 155,47.5 A 4.5 4.5 0 0 0 151,47.5 Z" fill="#ff1a35" stroke="#990018" stroke-width="0.5"/>
            <polygon points="152,43.5 154,48.5 159,46.5 155,50.5 158,55.5 153,53.5 150,57.5 150,52.5 145,51.5 150,48.5" fill="#d8dce6" stroke="#444" stroke-width="0.4"/>
            <circle cx="152" cy="51.5" r="2.2" fill="#141720" stroke="#ff1a35" stroke-width="0.6"/>
          </g>
        </svg>
      `;
    }

    // =========================================================================
    // 3. FORD MUSTANG SHELBY GT500 (Aggressive Cowl Hood, Fastback, Le Mans Stripes)
    // =========================================================================
    if (style === 'mustang') {
      return `
        <svg class="car-svg car-mustang" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
          ${defs}
          ${sandDustDriftEffects}
          ${headlightCone}

          <!-- Ground Contact Shadow & Neon Underglow -->
          <ellipse cx="106" cy="62.5" rx="76" ry="3.8" fill="#000000" opacity="0.6"/>
          <ellipse cx="106" cy="61.5" rx="72" ry="5" fill="${color}" opacity="0.45" filter="url(#${uid}_glow)"/>

          <!-- Carbon Fiber Pedestal Rear Spoiler (Solidly anchored to trunk) -->
          <rect x="18" y="25" width="22" height="3.5" rx="1" fill="#141720" stroke="#333" stroke-width="0.6"/>
          <path d="M 26,28 L 24,35 L 27,35 L 28,28 Z" fill="#141720"/>
          <path d="M 34,27 L 33,35 L 36,35 L 37,27 Z" fill="#141720"/>

          <!-- MAIN MUSCULAR FASTBACK SHELBY BODY -->
          <path d="M 22,44 
                   C 22,36 28,34 44,34 
                   L 76,20 
                   L 116,21 
                   L 132,33 
                   L 174,34 
                   C 182,34 186,39 186,44 
                   L 186,52 
                   L 186,54.5 
                   L 166,55.5 
                   A 14 14 0 0 0 138,55.5 
                   L 66,55.5 
                   A 14 14 0 0 0 38,55.5 
                   L 22,54.5 
                   Z" 
                fill="url(#${uid}_paint)" 
                style="fill: ${color}; fill: url(#${uid}_paint);" 
                stroke="#0b0e14" 
                stroke-width="0.8"/>

          <!-- Supercharger Cowl Hood Heat Extractor Bulge -->
          <polygon points="144,30.5 168,31.5 166,34.5 142,34.5" fill="#111" stroke="#333" stroke-width="0.8"/>

          <!-- Dual White Le Mans Racing Stripes -->
          <line x1="28" y1="52" x2="168" y2="52" stroke="#ffffff" stroke-width="3" stroke-dasharray="32,4,4,4"/>

          <!-- Fastback Glass & Quarter Window Louvers -->
          <path d="M 76,22 L 114,23 L 126,32 L 68,32 Z" fill="url(#${uid}_glass)"/>
          <line x1="72" y1="24" x2="80" y2="31" stroke="#111" stroke-width="2"/>
          <line x1="78" y1="23" x2="86" y2="30" stroke="#111" stroke-width="2"/>

          <!-- Driver Helmet -->
          <circle cx="92" cy="25" r="4.2" fill="#ffd700" stroke="#111" stroke-width="0.8"/>
          <ellipse cx="94.5" cy="25" rx="2" ry="1.2" fill="#111"/>

          <!-- Front Black Cobra Grille & Aggressive Round Headlight -->
          <circle cx="180" cy="42" r="3" fill="#ffffff" stroke="#ffcc00" stroke-width="0.8"/>
          <line x1="22" y1="38" x2="22" y2="46" stroke="#ff1133" stroke-width="2.5"/>

          <!-- REAR WHEEL ASSEMBLY (Muscle Deep-Dish 5-Spoke with Red Calipers) -->
          <g class="wheel-rear">
            <circle cx="52" cy="51.5" r="12.5" fill="#111" stroke="#333" stroke-width="1"/>
            <circle cx="52" cy="51.5" r="9" fill="#777c85" stroke="#fff" stroke-width="0.8"/>
            <circle cx="52" cy="51.5" r="6.5" fill="#444"/>
            <rect x="50" y="45.5" width="5" height="3" fill="#ff1133"/>
            <line x1="52" y1="43.5" x2="52" y2="59.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="45" y1="47.5" x2="59" y2="55.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="45" y1="55.5" x2="59" y2="47.5" stroke="#ffffff" stroke-width="1.8"/>
            <circle cx="52" cy="51.5" r="2.5" fill="#222" stroke="#fff" stroke-width="0.8"/>
          </g>

          <!-- FRONT WHEEL ASSEMBLY (Muscle Deep-Dish 5-Spoke with Red Calipers) -->
          <g class="wheel-front">
            <circle cx="152" cy="51.5" r="12.5" fill="#111" stroke="#333" stroke-width="1"/>
            <circle cx="152" cy="51.5" r="9" fill="#777c85" stroke="#fff" stroke-width="0.8"/>
            <circle cx="152" cy="51.5" r="6.5" fill="#444"/>
            <rect x="150" y="45.5" width="5" height="3" fill="#ff1133"/>
            <line x1="152" y1="43.5" x2="152" y2="59.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="145" y1="47.5" x2="159" y2="55.5" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="145" y1="55.5" x2="159" y2="47.5" stroke="#ffffff" stroke-width="1.8"/>
            <circle cx="152" cy="51.5" r="2.5" fill="#222" stroke="#fff" stroke-width="0.8"/>
          </g>
        </svg>
      `;
    }

    // =========================================================================
    // 4. FORMULA 1 GRAND PRIX CAR (HALO Ring, Helmet, DRS Rear Wing, Slick Tires)
    // =========================================================================
    if (style === 'f1') {
      return `
        <svg class="car-svg car-f1" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
          ${defs}
          ${sandDustDriftEffects}
          ${headlightCone}

          <!-- Ground Contact Shadow & Neon Underglow -->
          <ellipse cx="106" cy="62.5" rx="74" ry="3.8" fill="#000000" opacity="0.6"/>
          <ellipse cx="106" cy="61.5" rx="70" ry="5" fill="${color}" opacity="0.45" filter="url(#${uid}_glow)"/>

          <!-- DRS Multi-Tier Carbon Rear Wing (Anchored to Gearbox) -->
          <rect x="18" y="16" width="22" height="4" rx="1" fill="#14161c" stroke="${color}" stroke-width="1"/>
          <path d="M 28,20 L 26,46 L 30,46 L 32,20 Z" fill="#14161c"/>
          <polygon points="16,12 24,12 22,28 14,28" fill="${color}"/>

          <!-- Dorsal Engine Shark Fin & Airbox Intake Scoop -->
          <path d="M 40,24 L 84,20 L 80,36 L 42,36 Z" fill="url(#${uid}_paint)" style="fill: ${color}; fill: url(#${uid}_paint);" stroke="#0b0e14" stroke-width="0.6"/>
          <ellipse cx="86" cy="22" rx="4" ry="3" fill="#111" stroke="#ffdd00" stroke-width="1"/>

          <!-- Titanium HALO Safety Structure & Driver Helmet -->
          <path d="M 88,28 Q 98,22 108,26 L 108,30 Q 98,25 88,32 Z" fill="#222" stroke="#888" stroke-width="0.8"/>
          <circle cx="94" cy="28" r="4.2" fill="#ffd700" stroke="#111" stroke-width="1"/>
          <ellipse cx="96.5" cy="28" rx="2" ry="1.2" fill="#111"/>

          <!-- Low Needle-Nose Monocoque Chassis -->
          <path d="M 38,42 
                   L 70,36 L 110,34 L 160,45 L 184,52 L 184,55 L 164,55 L 36,55 Z" 
                fill="url(#${uid}_paint)" 
                style="fill: ${color}; fill: url(#${uid}_paint);" 
                stroke="#0b0e14" 
                stroke-width="0.8"/>

          <!-- Undercut Sidepod Air Intake -->
          <polygon points="76,38 98,37 94,48 74,48" fill="#121419" stroke="#333" stroke-width="0.8"/>

          <!-- Front Wing Cascades & Endplates -->
          <path d="M 174,53 L 188,51 L 188,56 L 174,56 Z" fill="#111" stroke="${color}" stroke-width="1"/>
          <polygon points="184,47 188,47 188,56 184,56" fill="${color}"/>

          <!-- Suspension Wishbone Carbon Rods (Connecting Chassis to Wheels) -->
          <line x1="52" y1="51.5" x2="68" y2="44" stroke="#555" stroke-width="1.8"/>
          <line x1="152" y1="51.5" x2="136" y2="42" stroke="#555" stroke-width="1.8"/>

          <!-- REAR OPEN WHEEL (Pirelli Slick Tire with Red Rim Stripe) -->
          <g class="wheel-rear">
            <circle cx="52" cy="51.5" r="12.5" fill="#121418" stroke="#e10600" stroke-width="1.4"/>
            <circle cx="52" cy="51.5" r="7.5" fill="#22252e" stroke="#fff" stroke-width="0.8"/>
            <circle cx="52" cy="51.5" r="2.8" fill="#e10600" stroke="#fff" stroke-width="0.6"/>
          </g>

          <!-- FRONT OPEN WHEEL (Pirelli Slick Tire with Red Rim Stripe) -->
          <g class="wheel-front">
            <circle cx="152" cy="51.5" r="12.5" fill="#121418" stroke="#e10600" stroke-width="1.4"/>
            <circle cx="152" cy="51.5" r="7.5" fill="#22252e" stroke="#fff" stroke-width="0.8"/>
            <circle cx="152" cy="51.5" r="2.8" fill="#e10600" stroke="#fff" stroke-width="0.6"/>
          </g>
        </svg>
      `;
    }

    // =========================================================================
    // 5. NISSAN GT-R NISMO (Godzilla JDM Profile, Carbon Wing, TE37 Bronze Wheels)
    // =========================================================================
    return `
      <svg class="car-svg car-gtr" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
        ${defs}
        ${sandDustDriftEffects}
        ${headlightCone}

        <!-- Ground Contact Shadow & Neon Underglow -->
        <ellipse cx="106" cy="62.5" rx="76" ry="3.8" fill="#000000" opacity="0.6"/>
        <ellipse cx="106" cy="61.5" rx="72" ry="5" fill="${color}" opacity="0.45" filter="url(#${uid}_glow)"/>

        <!-- High-Downforce Carbon Fiber Rear Wing (Twin stanchions anchored to trunk) -->
        <rect x="18" y="21" width="22" height="3" rx="1" fill="#14161c" stroke="${color}" stroke-width="0.8"/>
        <line x1="26" y1="24" x2="25" y2="34" stroke="#444" stroke-width="2"/>
        <line x1="34" y1="23" x2="33" y2="34" stroke="#444" stroke-width="2"/>
        <polygon points="16,18 22,18 20,26 14,26" fill="${color}"/>

        <!-- Sculpted GT-R Coupe Silhouette with Wheel Arch Cutouts -->
        <path d="M 22,44 
                 C 22,36 28,34 50,34 
                 L 84,20 
                 L 124,22 
                 L 138,34 
                 L 174,36 
                 L 184,42 
                 L 184,52 
                 L 184,54.5 
                 L 166,55.5 
                 A 14 14 0 0 0 138,55.5 
                 L 66,55.5 
                 A 14 14 0 0 0 38,55.5 
                 L 22,54.5 
                 Z" 
              fill="url(#${uid}_paint)" 
              style="fill: ${color}; fill: url(#${uid}_paint);" 
              stroke="#0b0e14" 
              stroke-width="0.8"/>

        <!-- Nismo Red Front Splitter & Side Skirt Pin-Stripe -->
        <path d="M 170,55 L 186,54 L 186,57 L 168,57" fill="#111" stroke="#e10600" stroke-width="1"/>
        <line x1="66" y1="56" x2="138" y2="56" stroke="#e10600" stroke-width="1.5"/>

        <!-- Greenhouse Tinted Windows & Roofline -->
        <path d="M 84,22 L 122,24 L 134,33 L 74,33 Z" fill="url(#${uid}_glass)"/>
        <line x1="104" y1="23" x2="104" y2="33" stroke="#111" stroke-width="2"/>

        <!-- Driver Helmet -->
        <circle cx="92" cy="26" r="4.2" fill="#ffd700" stroke="#111" stroke-width="0.8"/>
        <ellipse cx="94.5" cy="26" rx="2" ry="1.2" fill="#111"/>

        <!-- Front Fender Vertical Heat Extractor Vent -->
        <line x1="144" y1="38" x2="144" y2="48" stroke="#111" stroke-width="2" stroke-linecap="round"/>

        <!-- Projector Headlight & Godzilla Dual Round Taillight Glow -->
        <ellipse cx="180" cy="40" rx="3.5" ry="2.2" fill="#e8f8ff" stroke="#77aacc" stroke-width="0.8"/>
        <circle cx="24" cy="38" r="2.2" fill="#ff1a2a" stroke="#fff" stroke-width="0.6"/>

        <!-- REAR WHEEL ASSEMBLY (Rays Volk TE37 6-Spoke Bronze with Gold Brembo Brakes) -->
        <g class="wheel-rear">
          <circle cx="52" cy="51.5" r="12.5" fill="#111" stroke="#252830" stroke-width="1"/>
          <circle cx="52" cy="51.5" r="9" fill="#3a3022" stroke="#d4af37" stroke-width="0.8"/>
          <circle cx="52" cy="51.5" r="6.5" fill="#666"/>
          <rect x="50" y="45.5" width="5" height="3" fill="#d4af37"/>
          <line x1="52" y1="43.5" x2="52" y2="59.5" stroke="#d4af37" stroke-width="1.5"/>
          <line x1="45" y1="47.5" x2="59" y2="55.5" stroke="#d4af37" stroke-width="1.5"/>
          <line x1="45" y1="55.5" x2="59" y2="47.5" stroke="#d4af37" stroke-width="1.5"/>
          <circle cx="52" cy="51.5" r="2.2" fill="#111" stroke="#d4af37" stroke-width="0.6"/>
        </g>

        <!-- FRONT WHEEL ASSEMBLY (Rays Volk TE37 6-Spoke Bronze with Gold Brembo Brakes) -->
        <g class="wheel-front">
          <circle cx="152" cy="51.5" r="12.5" fill="#111" stroke="#252830" stroke-width="1"/>
          <circle cx="152" cy="51.5" r="9" fill="#3a3022" stroke="#d4af37" stroke-width="0.8"/>
          <circle cx="152" cy="51.5" r="6.5" fill="#666"/>
          <rect x="150" y="45.5" width="5" height="3" fill="#d4af37"/>
          <line x1="152" y1="43.5" x2="152" y2="59.5" stroke="#d4af37" stroke-width="1.5"/>
          <line x1="145" y1="47.5" x2="159" y2="55.5" stroke="#d4af37" stroke-width="1.5"/>
          <line x1="145" y1="55.5" x2="159" y2="47.5" stroke="#d4af37" stroke-width="1.5"/>
          <circle cx="152" cy="51.5" r="2.2" fill="#111" stroke="#d4af37" stroke-width="0.6"/>
        </g>
      </svg>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.CarGraphics = CarGraphics;
}
if (typeof module !== 'undefined') {
  module.exports = CarGraphics;
}
