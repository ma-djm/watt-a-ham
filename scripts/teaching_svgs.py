"""Theme-aware conceptual teaching SVG diagrams for Watt a Ham walkthrough cards."""

SVG_STYLE = 'font-family="system-ui, -apple-system, sans-serif"'

ILLUSTRATIONS = {
    "repeater-vs-simplex": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" class="teaching-svg" role="img" aria-label="Simplex blocked by a hill versus a hilltop repeater relaying signals" {SVG_STYLE}>
  <!-- Hill -->
  <path d="M130,185 Q300,65 470,185 Z" fill="var(--accent-soft)" stroke="var(--border-strong)" stroke-width="2"/>
  <line x1="30" y1="185" x2="570" y2="185" stroke="var(--border-strong)" stroke-width="2"/>
  <!-- Repeater tower on peak -->
  <path d="M288,125 L300,52 L312,125 M292,98 H308 M300,52 V34" fill="none" stroke="var(--gold)" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="300" cy="31" r="5" fill="var(--gold)"/>
  <text x="300" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="var(--gold)">HILLTOP REPEATER</text>
  <!-- Left Handheld -->
  <rect x="52" y="138" width="32" height="46" rx="5" fill="var(--bg-elevated)" stroke="currentColor" stroke-width="2"/>
  <line x1="76" y1="138" x2="76" y2="114" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <text x="68" y="204" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">You (HT)</text>
  <!-- Right Handheld -->
  <rect x="516" y="138" width="32" height="46" rx="5" fill="var(--bg-elevated)" stroke="currentColor" stroke-width="2"/>
  <line x1="524" y1="138" x2="524" y2="114" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <text x="532" y="204" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">Friend (HT)</text>
  <!-- Repeater Relay Arcs -->
  <path d="M88,118 Q185,54 282,46" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6,4"/>
  <text x="168" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="var(--accent)">Input (e.g. +600 kHz)</text>
  <path d="M318,46 Q415,54 512,118" fill="none" stroke="var(--success)" stroke-width="2.5"/>
  <text x="434" y="64" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">Output (Simultaneous)</text>
  <!-- Blocked Simplex Line -->
  <line x1="94" y1="162" x2="235" y2="162" stroke="var(--danger)" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="300" y="168" text-anchor="middle" font-size="11" font-weight="800" fill="var(--danger)">✕ Direct Simplex Blocked by Terrain</text>
</svg>""",

    "ctcss-talkgroups": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 195" class="teaching-svg" role="img" aria-label="Analog CTCSS sub-audible tone key versus DMR Color Code and Talkgroups" {SVG_STYLE}>
  <rect x="18" y="18" width="268" height="160" rx="12" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="152" y="42" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--accent)">ANALOG FM REPEATER</text>
  <text x="152" y="72" text-anchor="middle" font-size="11.5" fill="currentColor">Your Voice (300–3000 Hz)</text>
  <path d="M48,92 Q68,74 88,92 T128,92 T168,92 T208,92 T248,92" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="152" y="122" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--gold)">+ Quiet CTCSS Tone (&lt;300 Hz) = Key 🔑</text>
  <path d="M48,142 Q98,132 148,142 T248,142" fill="none" stroke="var(--gold)" stroke-width="2.4"/>
  <text x="152" y="165" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Unlocks repeater squelch; static is ignored</text>

  <rect x="314" y="18" width="268" height="160" rx="12" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="448" y="42" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--purple)">DIGITAL DMR REPEATER</text>
  <rect x="336" y="58" width="224" height="32" rx="7" fill="var(--bg-surface)" stroke="var(--gold)"/>
  <text x="448" y="79" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--gold)">Color Code (0–15) = Front Door Key</text>
  <rect x="336" y="102" width="106" height="44" rx="7" fill="var(--accent-soft)" stroke="var(--accent)"/>
  <text x="389" y="122" text-anchor="middle" font-size="11" font-weight="800" fill="var(--accent)">Slot 1: TG 3100</text>
  <text x="389" y="137" text-anchor="middle" font-size="10" fill="currentColor">Nationwide Room</text>
  <rect x="454" y="102" width="106" height="44" rx="7" fill="var(--success-soft)" stroke="var(--success)"/>
  <text x="507" y="122" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">Slot 2: TG 9</text>
  <text x="507" y="137" text-anchor="middle" font-size="10" fill="currentColor">Local Club Room</text>
  <text x="448" y="165" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">2 simultaneous calls on 12.5 kHz channel</text>
</svg>""",

    "net-radiogram-flow": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 195" class="teaching-svg" role="img" aria-label="Directed Net hub with Net Control Station and Radiogram header structure" {SVG_STYLE}>
  <!-- Hub & Spoke Net -->
  <circle cx="145" cy="98" r="36" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.5"/>
  <text x="145" y="95" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--accent)">NET</text>
  <text x="145" y="110" text-anchor="middle" font-size="11" font-weight="800" fill="var(--accent)">CONTROL</text>
  <g stroke="var(--border-strong)" stroke-width="2" stroke-dasharray="4,3">
    <line x1="109" y1="98" x2="56" y2="52"/><line x1="109" y1="98" x2="56" y2="146"/>
    <line x1="181" y1="98" x2="234" y2="52"/><line x1="181" y1="98" x2="234" y2="146"/>
  </g>
  <circle cx="46" cy="46" r="16" fill="var(--bg-elevated)" stroke="currentColor"/><text x="46" y="50" text-anchor="middle" font-size="10" fill="currentColor">K1A</text>
  <circle cx="46" cy="152" r="16" fill="var(--bg-elevated)" stroke="currentColor"/><text x="46" y="156" text-anchor="middle" font-size="10" fill="currentColor">W2B</text>
  <circle cx="244" cy="46" r="16" fill="var(--bg-elevated)" stroke="currentColor"/><text x="244" y="50" text-anchor="middle" font-size="10" fill="currentColor">N3C</text>
  <circle cx="244" cy="152" r="16" fill="var(--bg-elevated)" stroke="currentColor"/><text x="244" y="156" text-anchor="middle" font-size="10" fill="currentColor">KC4D</text>
  <text x="145" y="182" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Speak ONLY when called (unless emergency)</text>

  <!-- Radiogram Anatomy -->
  <rect x="305" y="22" width="275" height="152" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="442" y="43" text-anchor="middle" font-size="12" font-weight="800" fill="var(--gold)">FORMAL RADIOGRAM ("TRAFFIC")</text>
  <rect x="320" y="53" width="245" height="36" rx="6" fill="var(--bg-surface)" stroke="var(--gold)"/>
  <text x="442" y="69" text-anchor="middle" font-size="11" font-weight="800" fill="var(--gold)">PREAMBLE (Tracking Header)</text>
  <text x="442" y="83" text-anchor="middle" font-size="10" fill="currentColor">Msg # · Priority · Origin · CHECK (= Word Count)</text>
  <rect x="320" y="97" width="245" height="32" rx="6" fill="var(--bg-surface)" stroke="var(--border-subtle)"/>
  <text x="442" y="117" text-anchor="middle" font-size="10.5" fill="currentColor">Address + Exact Word-Counted Message Text</text>
  <text x="442" y="154" text-anchor="middle" font-size="10.5" fill="var(--accent)">Digital Option: Winlink = Callsign Email over RF</text>
</svg>""",

    "station-hookup": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 235" class="teaching-svg" role="img" aria-label="Complete amateur radio station bench wiring diagram" {SVG_STYLE}>
  <!-- Power Supply -->
  <rect x="18" y="34" width="128" height="64" rx="9" fill="var(--bg-elevated)" stroke="var(--gold)" stroke-width="2"/>
  <text x="82" y="59" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--gold)">13.8V DC SUPPLY</text>
  <text x="82" y="76" text-anchor="middle" font-size="10" fill="currentColor">~12A for 50W Rig</text>
  <!-- Heavy DC Leads -->
  <line x1="146" y1="58" x2="218" y2="58" stroke="var(--danger)" stroke-width="4.5"/>
  <line x1="146" y1="74" x2="218" y2="74" stroke="currentColor" stroke-width="4.5"/>
  <text x="182" y="47" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--gold)">Short, Thick</text>

  <!-- Transceiver ("Rig") -->
  <rect x="218" y="28" width="154" height="76" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.4"/>
  <text x="295" y="54" text-anchor="middle" font-size="13" font-weight="900" fill="var(--accent)">TRANSCEIVER ("RIG")</text>
  <text x="295" y="72" text-anchor="middle" font-size="10.5" fill="currentColor">146.520 MHz · VFO</text>
  <text x="295" y="89" text-anchor="middle" font-size="10" fill="var(--text-secondary)">Speaker Out / Mic / PTT</text>

  <!-- Coax -> Inline SWR/Power Meter -> Antenna -->
  <line x1="372" y1="66" x2="416" y2="66" stroke="currentColor" stroke-width="3.5"/>
  <rect x="416" y="38" width="108" height="56" rx="8" fill="var(--bg-elevated)" stroke="var(--success)" stroke-width="2"/>
  <text x="470" y="61" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">SWR / POWER</text>
  <text x="470" y="77" text-anchor="middle" font-size="10" fill="currentColor">Inline in Coax</text>
  <line x1="524" y1="66" x2="574" y2="66" stroke="currentColor" stroke-width="3.5"/>
  <path d="M574,66 V26 M558,26 L574,48 L590,26" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/>
  <text x="574" y="92" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Antenna</text>

  <!-- Computer Sound-Card Digital Hookup (FT8) -->
  <rect x="218" y="142" width="154" height="62" rx="9" fill="var(--bg-elevated)" stroke="var(--purple)" stroke-width="2"/>
  <text x="295" y="166" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--purple)">COMPUTER (FT8)</text>
  <text x="295" y="184" text-anchor="middle" font-size="10" fill="currentColor">RX Audio (Line-In) · TX · PTT</text>
  <path d="M265,104 V142 M295,104 V142 M325,104 V142" stroke="var(--purple)" stroke-width="2" stroke-dasharray="3,3"/>

  <!-- Flat Copper Strap RF Bonding -->
  <line x1="82" y1="98" x2="82" y2="218" stroke="#f59e0b" stroke-width="5"/>
  <line x1="250" y1="104" x2="250" y2="124" stroke="#f59e0b" stroke-width="5"/>
  <line x1="82" y1="218" x2="470" y2="218" stroke="#f59e0b" stroke-width="6"/>
  <line x1="470" y1="94" x2="470" y2="218" stroke="#f59e0b" stroke-width="5"/>
  <text x="435" y="208" text-anchor="middle" font-size="10.5" font-weight="800" fill="#f59e0b">Flat Copper Strap Bonding</text>
</svg>""",

    "receiver-filter-rit": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 185" class="teaching-svg" role="img" aria-label="Receiver filter passband blocking adjacent noise and RIT fine-tuning receive pitch" {SVG_STYLE}>
  <line x1="40" y1="145" x2="560" y2="145" stroke="var(--border-strong)" stroke-width="2"/>
  <!-- Unwanted Interference Left & Right -->
  <path d="M75,145 L110,68 L145,145 Z" fill="var(--danger-soft)" stroke="var(--danger)" stroke-width="2"/>
  <text x="110" y="58" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--danger)">Nearby QRM</text>
  <path d="M445,145 L485,74 L525,145 Z" fill="var(--danger-soft)" stroke="var(--danger)" stroke-width="2"/>
  <text x="485" y="64" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--danger)">Static / Noise</text>
  <!-- Desired SSB Signal + 2400 Hz Filter Window -->
  <path d="M210,48 L228,145 M372,48 L354,145 M210,48 H372" fill="none" stroke="var(--accent)" stroke-width="3"/>
  <rect x="224" y="50" width="134" height="94" fill="var(--accent-soft)"/>
  <path d="M242,145 Q291,62 340,145" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2.5"/>
  <text x="291" y="34" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent)">2400 Hz SSB Filter Window</text>
  <text x="291" y="122" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">Clean Voice</text>
  <text x="300" y="170" text-anchor="middle" font-size="11" fill="var(--gold)">RIT / Clarifier nudges this RX window left/right without moving your TX frequency</text>
</svg>""",

    "electrical-ground-safety": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 205" class="teaching-svg" role="img" aria-label="120V AC hot-wire fuse placement and outdoor coax lightning arrester bonding" {SVG_STYLE}>
  <!-- Left: 120V AC Hot Fuse -->
  <rect x="18" y="18" width="268" height="168" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="152" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="var(--gold)">120V AC WIRING &amp; FUSE</text>
  <line x1="38" y1="74" x2="112" y2="74" stroke="currentColor" stroke-width="3.5"/>
  <rect x="112" y="65" width="48" height="18" rx="3" fill="var(--bg-surface)" stroke="var(--gold)" stroke-width="2.2"/>
  <text x="136" y="78" text-anchor="middle" font-size="10" font-weight="800" fill="var(--gold)">FUSE</text>
  <line x1="160" y1="74" x2="262" y2="74" stroke="currentColor" stroke-width="3.5"/>
  <text x="152" y="58" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--danger)">Black = HOT (Fuse in Series Here!)</text>
  <line x1="38" y1="112" x2="262" y2="112" stroke="#94a3b8" stroke-width="3"/>
  <text x="152" y="127" text-anchor="middle" font-size="10" fill="var(--text-secondary)">White = Neutral (Never fuse)</text>
  <line x1="38" y1="150" x2="262" y2="150" stroke="var(--success)" stroke-width="3"/>
  <text x="152" y="166" text-anchor="middle" font-size="10" font-weight="700" fill="var(--success)">Green / Bare = Safety Ground</text>

  <!-- Right: Entry Panel & Ground Rods -->
  <rect x="308" y="18" width="274" height="168" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="445" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent)">ENTRY ARRESTER &amp; BONDING</text>
  <rect x="385" y="58" width="120" height="40" rx="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2"/>
  <text x="445" y="76" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--accent)">Grounded Entry Panel</text>
  <text x="445" y="90" text-anchor="middle" font-size="9.5" fill="currentColor">Coax Lightning Arrester</text>
  <!-- Two Ground Rods Bonded Together -->
  <line x1="365" y1="124" x2="365" y2="174" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
  <line x1="525" y1="124" x2="525" y2="174" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
  <path d="M445,98 V132 H365 M445,132 H525" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
  <text x="445" y="152" text-anchor="middle" font-size="10.5" font-weight="800" fill="#f59e0b">Heavy Wire / Strap Bonds All Rods</text>
</svg>""",

    "tower-fall-zone": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 205" class="teaching-svg" role="img" aria-label="Antenna tower fall radius plus 10 feet clearance from overhead power lines" {SVG_STYLE}>
  <line x1="25" y1="175" x2="575" y2="175" stroke="var(--border-strong)" stroke-width="2"/>
  <!-- Tower on left -->
  <path d="M125,175 L142,45 L159,175 M130,135 H154 M135,95 H149" fill="none" stroke="var(--accent)" stroke-width="2.6"/>
  <text x="142" y="34" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--accent)">Tower Height (H)</text>
  <!-- Fall Arc -->
  <path d="M142,45 A130,130 0 0,1 272,175" fill="none" stroke="var(--gold)" stroke-width="2.2" stroke-dasharray="6,4"/>
  <text x="235" y="96" font-size="10.5" font-weight="700" fill="var(--gold)">Fall Arc</text>
  <!-- 10-ft Buffer Zone -->
  <line x1="272" y1="152" x2="395" y2="152" stroke="var(--danger)" stroke-width="2.5"/>
  <text x="333" y="144" text-anchor="middle" font-size="11" font-weight="800" fill="var(--danger)">+ 10 Feet Minimum!</text>
  <!-- Power Pole on right -->
  <line x1="425" y1="175" x2="425" y2="55" stroke="currentColor" stroke-width="4.5"/>
  <line x1="395" y1="68" x2="455" y2="68" stroke="currentColor" stroke-width="3.5"/>
  <circle cx="398" cy="68" r="4" fill="var(--danger)"/><circle cx="452" cy="68" r="4" fill="var(--danger)"/>
  <text x="425" y="45" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--danger)">Power Lines ⚡</text>
  <!-- Smooth ground rod note -->
  <path d="M125,165 Q102,165 98,188" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <text x="300" y="196" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">8-ft rod per leg · Smooth ground bends · Safety wire on turnbuckles · Never climb alone</text>
</svg>""",

    "rf-mpe-curve": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 195" class="teaching-svg" role="img" aria-label="FCC Maximum Permissible Exposure dip at 50 MHz human body resonance" {SVG_STYLE}>
  <line x1="64" y1="30" x2="64" y2="152" stroke="var(--border-strong)" stroke-width="2"/>
  <line x1="64" y1="152" x2="555" y2="152" stroke="var(--border-strong)" stroke-width="2"/>
  <text x="56" y="44" text-anchor="end" font-size="10" fill="var(--text-secondary)">Higher</text>
  <text x="56" y="146" text-anchor="end" font-size="10" fill="var(--text-secondary)">Strictest</text>
  <!-- MPE Bathtub Curve -->
  <path d="M82,46 Q170,48 225,132 L335,132 Q410,92 535,58" fill="none" stroke="var(--accent)" stroke-width="3.5"/>
  <rect x="218" y="116" width="124" height="34" rx="6" fill="var(--danger-soft)" stroke="var(--danger)" stroke-dasharray="4,3"/>
  <circle cx="255" cy="132" r="6" fill="var(--danger)"/>
  <text x="280" y="106" text-anchor="middle" font-size="12" font-weight="900" fill="var(--danger)">50 MHz (6m) = Lowest MPE!</text>
  <text x="112" y="170" text-anchor="middle" font-size="10.5" fill="currentColor">3.5 MHz</text>
  <text x="255" y="170" text-anchor="middle" font-size="11" font-weight="800" fill="var(--danger)">50 MHz (VHF)</text>
  <text x="345" y="170" text-anchor="middle" font-size="10.5" fill="currentColor">146 MHz</text>
  <text x="505" y="170" text-anchor="middle" font-size="10.5" fill="currentColor">1296 MHz</text>
  <text x="310" y="24" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--gold)">Adult Body Resonates at VHF → Absorbs RF Fastest Near 50 MHz</text>
</svg>""",

    "callsign-uls-flow": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 175" class="teaching-svg" role="img" aria-label="License grant timeline ending at FCC ULS database and Group D call sign format" {SVG_STYLE}>
  <g font-size="11" font-weight="800" text-anchor="middle">
    <rect x="18" y="24" width="122" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
    <text x="79" y="47" fill="currentColor">1. Pass Exam</text>
    <text x="79" y="63" font-size="9.5" font-weight="600" fill="var(--text-secondary)">Paper CSCE ≠ License</text>

    <path d="M140,50 H166" stroke="var(--accent)" stroke-width="2.5"/>
    <rect x="166" y="24" width="128" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
    <text x="230" y="47" fill="currentColor">2. Pay $35 Fee</text>
    <text x="230" y="63" font-size="9.5" font-weight="600" fill="var(--text-secondary)">FCC Emails Link</text>

    <path d="M294,50 H320" stroke="var(--accent)" stroke-width="2.5"/>
    <rect x="320" y="20" width="262" height="60" rx="9" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2.2"/>
    <text x="451" y="45" font-size="12" fill="var(--success)">3. Appears in FCC ULS Database ✓</text>
    <text x="451" y="64" font-size="10" fill="currentColor">Legal to Transmit! (10-Yr Term · 2-Yr Grace)</text>
  </g>
  <!-- Callsign Anatomy -->
  <rect x="90" y="100" width="420" height="58" rx="10" fill="var(--bg-elevated)" stroke="var(--gold)"/>
  <text x="300" y="123" text-anchor="middle" font-size="15" font-weight="900" fill="var(--gold)">Group D Tech Call Sign:  K F   1   X X X  (2×3 Format)</text>
  <text x="300" y="144" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">2 Prefix Letters  ·  1 Region Number  ·  3 Suffix Letters (or pick any eligible Vanity Call!)</text>
</svg>""",

    "water-pipe-electricity": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 185" class="teaching-svg" role="img" aria-label="Water pipe analogy comparing Voltage to pressure, Current to flow, and Resistance to pipe narrowing" {SVG_STYLE}>
  <!-- Pipe with Narrowing -->
  <path d="M55,68 H245 L275,88 H345 L375,68 H545 M55,132 H245 L275,112 H345 L375,132 H545" fill="none" stroke="currentColor" stroke-width="3"/>
  <rect x="58" y="71" width="186" height="58" fill="var(--accent-soft)"/>
  <rect x="275" y="90" width="70" height="20" fill="var(--warning-soft)"/>
  <rect x="376" y="71" width="166" height="58" fill="var(--accent-soft)" opacity="0.55"/>
  <!-- Arrows & Labels -->
  <text x="145" y="52" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--gold)">VOLTAGE (E, Volts)</text>
  <text x="145" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Push / Pressure →</text>
  <text x="310" y="52" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--warning)">RESISTANCE (R, Ω)</text>
  <text x="310" y="156" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Opposes DC, AC &amp; RF</text>
  <text x="465" y="52" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--accent)">CURRENT (I, Amps)</text>
  <text x="465" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">Electron Flow →</text>
  <text x="300" y="176" text-anchor="middle" font-size="11" font-weight="700" fill="var(--success)">POWER (Watts) = How fast energy does work (P = I × E)</text>
</svg>""",

    "series-vs-parallel": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 195" class="teaching-svg" role="img" aria-label="Series circuit with identical current versus Parallel circuit with identical voltage" {SVG_STYLE}>
  <!-- Series -->
  <rect x="20" y="18" width="265" height="160" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="152" y="40" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--accent)">SERIES CIRCUIT (One Loop)</text>
  <path d="M62,105 V68 H115 L122,58 L132,78 L142,58 L152,78 L158,68 H242 V142 H158 L152,132 L142,152 L132,132 L122,152 L115,142 H62 V118" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <line x1="48" y1="105" x2="76" y2="105" stroke="var(--gold)" stroke-width="3"/><line x1="54" y1="118" x2="70" y2="118" stroke="var(--gold)" stroke-width="4"/>
  <text x="152" y="110" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">SAME CURRENT Everywhere</text>

  <!-- Parallel -->
  <rect x="315" y="18" width="265" height="160" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="447" y="40" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--gold)">PARALLEL CIRCUIT (Rungs)</text>
  <path d="M355,102 V65 H535 M355,116 V150 H535" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <line x1="341" y1="102" x2="369" y2="102" stroke="var(--gold)" stroke-width="3"/><line x1="347" y1="116" x2="363" y2="116" stroke="var(--gold)" stroke-width="4"/>
  <path d="M435,65 V90 L445,96 L425,106 L445,116 L435,122 V150" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
  <path d="M515,65 V90 L525,96 L505,106 L525,116 L515,122 V150" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
  <text x="447" y="170" text-anchor="middle" font-size="11" font-weight="800" fill="var(--gold)">SAME VOLTAGE Across Every Branch</text>
</svg>""",

    "semiconductors-switches": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 190" class="teaching-svg" role="img" aria-label="Diode anode and striped cathode alongside BJT and FET pinout names" {SVG_STYLE}>
  <!-- Diode -->
  <rect x="16" y="18" width="182" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="107" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent)">DIODE (One-Way)</text>
  <line x1="36" y1="88" x2="178" y2="88" stroke="currentColor" stroke-width="2.5"/>
  <rect x="70" y="72" width="74" height="32" rx="5" fill="var(--bg-surface)" stroke="currentColor" stroke-width="2"/>
  <rect x="126" y="73" width="10" height="30" fill="var(--gold)"/>
  <text x="52" y="122" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Anode (+)</text>
  <text x="148" y="122" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--gold)">Cathode (Stripe)</text>
  <text x="107" y="152" text-anchor="middle" font-size="10" fill="var(--text-secondary)">LED glows on forward current</text>

  <!-- BJT -->
  <rect x="210" y="18" width="180" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="300" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="var(--success)">BJT TRANSISTOR</text>
  <circle cx="300" cy="96" r="32" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <line x1="286" y1="76" x2="286" y2="116" stroke="currentColor" stroke-width="4"/>
  <line x1="252" y1="96" x2="286" y2="96" stroke="currentColor" stroke-width="2.2"/>
  <path d="M286,86 L316,68 M286,106 L316,124" stroke="currentColor" stroke-width="2.2"/>
  <text x="242" y="100" text-anchor="end" font-size="11" font-weight="800" fill="var(--success)">Base</text>
  <text x="326" y="68" font-size="11" font-weight="800" fill="var(--success)">Collector</text>
  <text x="326" y="130" font-size="11" font-weight="800" fill="var(--success)">Emitter</text>

  <!-- FET -->
  <rect x="402" y="18" width="182" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="493" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="var(--purple)">FET TRANSISTOR</text>
  <circle cx="493" cy="96" r="32" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <line x1="478" y1="76" x2="478" y2="116" stroke="currentColor" stroke-width="3"/>
  <line x1="445" y1="96" x2="474" y2="96" stroke="currentColor" stroke-width="2.2"/>
  <path d="M484,82 H510 V66 M484,110 H510 V126" fill="none" stroke="currentColor" stroke-width="2.2"/>
  <text x="438" y="100" text-anchor="end" font-size="11" font-weight="800" fill="var(--purple)">Gate</text>
  <text x="518" y="68" font-size="11" font-weight="800" fill="var(--purple)">Drain</text>
  <text x="518" y="130" font-size="11" font-weight="800" fill="var(--purple)">Source</text>
</svg>""",

    "linear-psu-stages": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 175" class="teaching-svg" role="img" aria-label="Four stages of a linear DC power supply from 120V AC to steady 13.8V DC" {SVG_STYLE}>
  <g text-anchor="middle" font-weight="800" font-size="11">
    <rect x="14" y="28" width="132" height="78" rx="9" fill="var(--bg-elevated)" stroke="var(--accent)" stroke-width="2"/>
    <text x="80" y="50" fill="var(--accent)">1. TRANSFORMER</text>
    <text x="80" y="67" font-size="9.5" font-weight="600" fill="currentColor">Steps 120V AC down</text>
    <path d="M48,88 Q64,72 80,88 T112,88" fill="none" stroke="var(--accent)" stroke-width="2"/>

    <rect x="168" y="28" width="132" height="78" rx="9" fill="var(--bg-elevated)" stroke="var(--gold)" stroke-width="2"/>
    <text x="234" y="50" fill="var(--gold)">2. RECTIFIER</text>
    <text x="234" y="67" font-size="9.5" font-weight="600" fill="currentColor">Diodes: AC → Bumpy DC</text>
    <path d="M200,92 Q216,70 232,92 Q248,70 264,92" fill="none" stroke="var(--gold)" stroke-width="2"/>

    <rect x="322" y="28" width="132" height="78" rx="9" fill="var(--bg-elevated)" stroke="var(--purple)" stroke-width="2"/>
    <text x="388" y="50" fill="var(--purple)">3. FILTER CAP</text>
    <text x="388" y="67" font-size="9.5" font-weight="600" fill="currentColor">Smooths voltage ripple</text>
    <path d="M354,84 Q371,79 388,84 T422,84" fill="none" stroke="var(--purple)" stroke-width="2"/>

    <rect x="476" y="28" width="130" height="78" rx="9" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2"/>
    <text x="541" y="50" fill="var(--success)">4. REGULATOR</text>
    <text x="541" y="67" font-size="9.5" font-weight="600" fill="currentColor">Locks steady 13.8V DC</text>
    <line x1="508" y1="84" x2="574" y2="84" stroke="var(--success)" stroke-width="2.8"/>
  </g>
  <text x="310" y="142" text-anchor="middle" font-size="11" fill="var(--text-secondary)">Look familiar? That exact 4-step chain is drawn left-to-right inside Exam Figure T-2!</text>
</svg>""",

    "transceiver-stages": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180" class="teaching-svg" role="img" aria-label="Signal path blocks inside a transceiver including Oscillator, Mixer, Modulator, and Amplifier" {SVG_STYLE}>
  <g text-anchor="middle" font-size="11" font-weight="800">
    <rect x="20" y="42" width="118" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--accent)" stroke-width="2"/>
    <text x="79" y="66" fill="var(--accent)">OSCILLATOR</text>
    <text x="79" y="83" font-size="9.5" font-weight="600" fill="currentColor">Makes pure tone (VFO)</text>

    <path d="M138,71 H166" stroke="currentColor" stroke-width="2.2"/>
    <rect x="166" y="42" width="118" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--purple)" stroke-width="2"/>
    <text x="225" y="66" fill="var(--purple)">MIXER</text>
    <text x="225" y="83" font-size="9.5" font-weight="600" fill="currentColor">Shifts freq A → B</text>

    <path d="M284,71 H312" stroke="currentColor" stroke-width="2.2"/>
    <rect x="312" y="42" width="122" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--gold)" stroke-width="2"/>
    <text x="373" y="66" fill="var(--gold)">MODULATOR</text>
    <text x="373" y="83" font-size="9.5" font-weight="600" fill="currentColor">Adds speech / data</text>

    <path d="M434,71 H462" stroke="currentColor" stroke-width="2.2"/>
    <rect x="462" y="42" width="118" height="58" rx="8" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2"/>
    <text x="521" y="66" fill="var(--success)">RF AMPLIFIER</text>
    <text x="521" y="83" font-size="9.5" font-weight="600" fill="currentColor">Boosts TX watts</text>
  </g>
  <text x="300" y="138" text-anchor="middle" font-size="11" fill="currentColor">Receiver Ears: <tspan font-weight="800" fill="var(--accent)">Sensitivity</tspan> = hears faint signals · <tspan font-weight="800" fill="var(--gold)">Selectivity</tspan> = rejects crowded neighbors</text>
  <text x="300" y="160" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">PTT grounded = Transmit · Transverter = converts whole rig to a new band</text>
</svg>""",

    "multimeter-connections": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 190" class="teaching-svg" role="img" aria-label="Voltmeter connected in parallel versus Ammeter in series and Ohmmeter with power off" {SVG_STYLE}>
  <!-- Voltmeter Parallel -->
  <rect x="16" y="18" width="182" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--accent)"/>
  <text x="107" y="40" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--accent)">VOLTMETER = PARALLEL</text>
  <rect x="72" y="114" width="70" height="24" rx="4" fill="var(--bg-surface)" stroke="currentColor"/>
  <text x="107" y="130" text-anchor="middle" font-size="10" fill="currentColor">Load / Part</text>
  <circle cx="107" cy="74" r="18" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="107" y="79" text-anchor="middle" font-size="12" font-weight="900" fill="var(--accent)">V</text>
  <path d="M89,74 H62 V126 H72 M125,74 H152 V126 H142" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <text x="107" y="158" text-anchor="middle" font-size="10" fill="var(--text-secondary)">Reach ACROSS component</text>

  <!-- Ammeter Series -->
  <rect x="209" y="18" width="182" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--gold)"/>
  <text x="300" y="40" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--gold)">AMMETER = IN SERIES</text>
  <circle cx="262" cy="100" r="18" fill="var(--gold-soft)" stroke="var(--gold)" stroke-width="2"/>
  <text x="262" y="105" text-anchor="middle" font-size="12" font-weight="900" fill="var(--gold)">A</text>
  <rect x="306" y="88" width="64" height="24" rx="4" fill="var(--bg-surface)" stroke="currentColor"/>
  <text x="338" y="104" text-anchor="middle" font-size="10" fill="currentColor">Load</text>
  <path d="M224,100 H244 M280,100 H306 M370,100 H380" stroke="var(--gold)" stroke-width="2.4"/>
  <text x="300" y="158" text-anchor="middle" font-size="10" fill="var(--text-secondary)">Break wire &amp; insert INLINE</text>

  <!-- Ohmmeter Power Off -->
  <rect x="402" y="18" width="182" height="154" rx="10" fill="var(--bg-elevated)" stroke="var(--danger)"/>
  <text x="493" y="40" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--danger)">OHMMETER = POWER OFF!</text>
  <circle cx="493" cy="88" r="22" fill="var(--danger-soft)" stroke="var(--danger)" stroke-width="2"/>
  <text x="493" y="94" text-anchor="middle" font-size="14" font-weight="900" fill="var(--danger)">Ω</text>
  <text x="493" y="132" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">Unplug Circuit First!</text>
  <text x="493" y="154" text-anchor="middle" font-size="9.5" fill="var(--text-secondary)">Live voltage destroys Ω mode</text>
</svg>""",

    "wave-polarization": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 185" class="teaching-svg" role="img" aria-label="Electromagnetic wave showing Wavelength crest-to-crest and perpendicular Electric and Magnetic fields" {SVG_STYLE}>
  <line x1="45" y1="105" x2="555" y2="105" stroke="var(--border-strong)" stroke-width="2"/>
  <!-- Electric Field (Vertical Sine) -->
  <path d="M65,105 Q115,25 165,105 T265,105 T365,105 T465,105" fill="none" stroke="var(--accent)" stroke-width="3"/>
  <!-- Magnetic Field (Tilted 90 deg perspective) -->
  <path d="M65,105 Q115,142 165,105 T265,105 T365,105 T465,105" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-dasharray="5,3"/>
  <!-- Wavelength Bracket -->
  <line x1="115" y1="36" x2="315" y2="36" stroke="var(--success)" stroke-width="2.2"/>
  <line x1="115" y1="30" x2="115" y2="44" stroke="var(--success)" stroke-width="2.2"/>
  <line x1="315" y1="30" x2="315" y2="44" stroke="var(--success)" stroke-width="2.2"/>
  <text x="215" y="25" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--success)">Wavelength λ = 300 / MHz</text>
  <text x="495" y="64" font-size="11" font-weight="800" fill="var(--accent)">Electric Field</text>
  <text x="495" y="79" font-size="10" fill="var(--accent)">(= Polarization!)</text>
  <text x="495" y="136" font-size="11" font-weight="800" fill="var(--gold)">Magnetic Field (90°)</text>
  <text x="300" y="172" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Speed = 300,000,000 m/s for ALL frequencies · Match V/H polarization on line-of-sight VHF/UHF!</text>
</svg>""",

    "propagation-paths": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 195" class="teaching-svg" role="img" aria-label="Ionospheric HF skywave skip versus UHF escaping to space and VHF tropospheric ducting" {SVG_STYLE}>
  <!-- Ionosphere Band -->
  <path d="M20,58 Q300,14 580,58" fill="none" stroke="var(--purple)" stroke-width="14" opacity="0.25"/>
  <text x="300" y="26" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--purple)">IONOSPHERE (E &amp; F Regions — Charged by Sunspots)</text>
  <!-- Curved Earth -->
  <path d="M30,178 Q300,122 570,178" fill="var(--bg-elevated)" stroke="var(--border-strong)" stroke-width="2.5"/>
  <!-- Station Left -->
  <circle cx="95" cy="164" r="5" fill="var(--gold)"/>
  <text x="95" y="186" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Transmitter</text>
  <!-- UHF escapes to space -->
  <line x1="95" y1="164" x2="185" y2="14" stroke="var(--danger)" stroke-width="2.2" stroke-dasharray="4,4"/>
  <text x="155" y="76" font-size="10.5" font-weight="800" fill="var(--danger)">UHF escapes</text>
  <!-- HF / 10m / 6m Skywave Skip -->
  <path d="M95,164 L310,40 L515,166" fill="none" stroke="var(--accent)" stroke-width="2.8"/>
  <text x="438" y="88" font-size="11" font-weight="800" fill="var(--accent)">HF / 10m / 6m Skip!</text>
  <!-- Tropospheric Ducting -->
  <path d="M95,164 Q245,112 385,152" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-dasharray="6,3"/>
  <text x="255" y="132" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--success)">Tropospheric Duct (~300 mi VHF/UHF)</text>
</svg>""",

    "antenna-patterns-swr": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 190" class="teaching-svg" role="img" aria-label="Top-down radiation patterns of a Half-Wave Dipole figure-8 versus a Yagi directional beam" {SVG_STYLE}>
  <!-- Left: Dipole Broadside Figure-8 -->
  <rect x="18" y="18" width="268" height="156" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="152" y="39" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--accent)">HALF-WAVE DIPOLE (Top View)</text>
  <line x1="78" y1="104" x2="226" y2="104" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="152" cy="74" rx="44" ry="28" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <ellipse cx="152" cy="134" rx="44" ry="28" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="152" y="78" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">Strongest Broadside</text>

  <!-- Right: Yagi Beam Highest Gain -->
  <rect x="314" y="18" width="268" height="156" rx="10" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>
  <text x="448" y="39" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--success)">YAGI BEAM (Greatest Gain)</text>
  <line x1="348" y1="104" x2="438" y2="104" stroke="currentColor" stroke-width="3"/>
  <line x1="356" y1="68" x2="356" y2="140" stroke="var(--gold)" stroke-width="3"/>
  <line x1="384" y1="74" x2="384" y2="134" stroke="var(--gold)" stroke-width="3"/>
  <line x1="412" y1="80" x2="412" y2="128" stroke="var(--gold)" stroke-width="3"/>
  <line x1="436" y1="84" x2="436" y2="124" stroke="var(--gold)" stroke-width="3"/>
  <path d="M384,104 C445,52 562,68 562,104 C562,140 445,156 384,104 Z" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2.2"/>
  <text x="498" y="108" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--success)">Focused Beam →</text>
</svg>""",

    "satellite-uv-pass": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 185" class="teaching-svg" role="img" aria-label="LEO amateur satellite pass showing Mode U/V uplink and downlink and Doppler shift" {SVG_STYLE}>
  <path d="M40,86 Q300,12 560,86" fill="none" stroke="var(--border-strong)" stroke-width="2" stroke-dasharray="6,4"/>
  <!-- Satellite -->
  <rect x="282" y="32" width="36" height="24" rx="4" fill="var(--gold)" stroke="currentColor" stroke-width="2"/>
  <rect x="242" y="37" width="36" height="14" fill="var(--accent)"/><rect x="322" y="37" width="36" height="14" fill="var(--accent)"/>
  <text x="300" y="22" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--gold)">LEO Satellite (~100-Min Orbit)</text>
  <!-- Ground Hams -->
  <circle cx="155" cy="154" r="7" fill="var(--purple)"/>
  <text x="155" y="174" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">You (Handheld + Beam)</text>
  <circle cx="445" cy="154" r="7" fill="var(--success)"/>
  <text x="445" y="174" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">Other Stations</text>
  <!-- Mode U/V Links -->
  <line x1="162" y1="146" x2="286" y2="58" stroke="var(--purple)" stroke-width="2.6"/>
  <text x="192" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="var(--purple)">Uplink: 70cm (U)</text>
  <line x1="314" y1="58" x2="438" y2="146" stroke="var(--success)" stroke-width="2.6"/>
  <text x="408" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="var(--success)">Downlink: 2m (V)</text>
  <text x="300" y="132" text-anchor="middle" font-size="10.5" fill="var(--text-secondary)">Doppler Shift changes pitch · Match beacon strength · Spin fading from rotation</text>
</svg>"""
}
