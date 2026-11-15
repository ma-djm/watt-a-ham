"""Crisp dark-mode-friendly inline SVG schematics for official NCVEC 2026-2030 Figures T-1, T-2, and T-3."""

FIGURE_T1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 305" role="img" aria-label="Figure T-1 schematic diagram with components 1 through 5" class="schematic-svg">
  <defs>
    <marker id="t1-emit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,1 L9,5 L0,9 Z" fill="currentColor"/>
    </marker>
  </defs>
  <g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Input jack terminals -->
    <path d="M58,150 L72,158 L58,166 M72,158 H92"/>
    <circle cx="99" cy="158" r="6.5"/>
    <path d="M58,187 L72,195 L58,203 M72,195 H92"/>
    <circle cx="99" cy="195" r="6.5"/>

    <!-- Ground 5 -->
    <path d="M99,202 V238 M83,238 H115 M85,238 L78,254 M99,238 L92,254 M113,238 L106,254"/>

    <!-- Resistor 1 -->
    <path d="M106,158 H154 L160,141 L171,175 L182,141 L193,175 L204,141 L215,175 L221,158 H286"/>

    <!-- NPN Transistor 2 -->
    <circle cx="308" cy="158" r="46"/>
    <path d="M286,129 V187" stroke-width="5"/>
    <path d="M286,144 L328,121 V78"/>
    <path d="M286,172 L325,194" marker-end="url(#t1-emit)"/>
    <path d="M328,195 V234 M312,234 H344 M314,234 L307,250 M328,234 L321,250 M342,234 L335,250"/>

    <!-- Lamp 3 -->
    <path d="M328,78 H368 V60 A7,7 0 0,1 382,60 V78 H424"/>
    <path d="M360,78 V57 A15,15 0 0,1 390,57 V78 M358,78 H368 M382,78 H392"/>

    <!-- Battery 4 -->
    <path d="M424,78 V118"/>
    <path d="M398,118 H450"/>
    <path d="M411,131 H437" stroke-width="4"/>
    <path d="M398,144 H450"/>
    <path d="M411,157 H437" stroke-width="4"/>
    <path d="M424,157 V208 M408,208 H440 M410,208 L403,224 M424,208 L417,224 M438,208 L431,224"/>
  </g>
  <g fill="var(--fig-accent, #38bdf8)" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle">
    <text x="188" y="130">1</text>
    <text x="280" y="104">2</text>
    <text x="375" y="34">3</text>
    <text x="466" y="144">4</text>
    <text x="95" y="276">5</text>
    <text x="280" y="296" fill="currentColor" font-size="16" opacity="0.85">Figure T-1</text>
  </g>
</svg>"""

FIGURE_T2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 790 315" role="img" aria-label="Figure T-2 power supply schematic diagram with components 1 through 10" class="schematic-svg">
  <defs>
    <marker id="t2-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,1 L9,5 L0,9 Z" fill="currentColor"/>
    </marker>
  </defs>
  <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- AC Plug 1 -->
    <circle cx="72" cy="172" r="24"/>
    <path d="M59,163 H85 M59,181 H85" stroke-width="5.5"/>
    <path d="M72,163 V76 H128"/>
    <path d="M72,181 V252 H274 V216"/>

    <!-- Fuse 2 -->
    <rect x="128" y="69" width="38" height="14"/>
    <path d="M135,69 V83 M159,69 V83 M166,76 H188"/>

    <!-- Switch 3 (SPST) -->
    <circle cx="194" cy="76" r="5"/>
    <path d="M199,74 L227,61"/>
    <circle cx="232" cy="76" r="5"/>
    <path d="M237,76 H274 V128"/>

    <!-- Transformer 4 -->
    <path d="M274,128 A11,11 0 0,1 274,150 A11,11 0 0,1 274,172 A11,11 0 0,1 274,194 A11,11 0 0,1 274,216"/>
    <path d="M308,124 V220 M322,124 V220"/>
    <path d="M356,128 A11,11 0 0,0 356,150 A11,11 0 0,0 356,172 A11,11 0 0,0 356,194 A11,11 0 0,0 356,216"/>
    <path d="M356,216 V260 M342,260 H370 M344,260 L338,274 M356,260 L350,274 M368,260 L362,274"/>
    <path d="M356,128 V76 H414"/>

    <!-- Rectifier Diode 5 -->
    <path d="M414,65 L436,76 L414,87 Z" fill="currentColor"/>
    <path d="M436,64 V88 M436,76 H630"/>

    <!-- Filter Capacitor 6 -->
    <circle cx="504" cy="76" r="3.8" fill="currentColor"/>
    <path d="M504,76 V170 M484,170 H524 M484,185 Q504,175 524,185 M504,180 V236"/>
    <path d="M490,236 H518 M492,236 L486,250 M504,236 L498,250 M516,236 L510,250"/>

    <!-- Bleeder Resistor 7 & LED 8 -->
    <circle cx="584" cy="76" r="3.8" fill="currentColor"/>
    <path d="M584,76 V114 L596,120 L572,130 L596,140 L572,150 L596,160 L584,166 V184"/>
    <path d="M574,184 H594 L584,202 Z" fill="currentColor"/>
    <path d="M573,202 H595 M584,202 V248"/>
    <path d="M598,188 L615,200" marker-end="url(#t2-arrow)" stroke-width="1.9"/>
    <path d="M594,196 L611,208" marker-end="url(#t2-arrow)" stroke-width="1.9"/>
    <path d="M570,248 H598 M572,248 L566,262 M584,248 L578,262 M596,248 L590,262"/>

    <!-- Variable Resistor 9 -->
    <path d="M630,76 L636,62 L646,90 L656,62 L666,90 L676,62 L682,76 H750"/>
    <circle cx="698" cy="76" r="3.8" fill="currentColor"/>
    <path d="M698,76 V112 H656 V92" marker-end="url(#t2-arrow)" stroke-width="2"/>

    <!-- Zener Diode 10 -->
    <circle cx="722" cy="76" r="3.8" fill="currentColor"/>
    <path d="M722,76 V136"/>
    <path d="M712,156 H732 L722,136 Z" fill="currentColor"/>
    <path d="M711,142 V136 H733 V130"/>
    <path d="M722,156 V198 M708,198 H736 M710,198 L704,212 M722,198 L716,212 M734,198 L728,212"/>

    <!-- Output Terminal -->
    <circle cx="757" cy="76" r="6"/>
  </g>
  <g fill="var(--fig-accent, #38bdf8)" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="700" text-anchor="middle">
    <text x="110" y="179">1</text>
    <text x="147" y="56">2</text>
    <text x="213" y="54">3</text>
    <text x="315" y="108">4</text>
    <text x="425" y="54">5</text>
    <text x="468" y="184">6</text>
    <text x="556" y="146">7</text>
    <text x="556" y="200">8</text>
    <text x="656" y="52">9</text>
    <text x="692" y="154">10</text>
    <text x="395" y="302" fill="currentColor" font-size="16" opacity="0.85">Figure T-2</text>
  </g>
</svg>"""

FIGURE_T3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 330" role="img" aria-label="Figure T-3 antenna tuner schematic diagram with components 1 through 4" class="schematic-svg">
  <defs>
    <marker id="t3-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.2" markerHeight="6.2" orient="auto">
      <path d="M0,1 L9,5 L0,9 Z" fill="currentColor"/>
    </marker>
  </defs>
  <g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Input 1 -->
    <path d="M126,118 Q133,127 126,136 Q119,145 126,154"/>
    <path d="M126,136 H188"/>

    <!-- Variable Capacitor 2 -->
    <path d="M188,112 V160 M202,112 V160" stroke-width="3.2"/>
    <path d="M168,158 L218,115" marker-end="url(#t3-arrow)" stroke-width="2"/>
    <path d="M202,136 H324"/>

    <!-- Output Variable Capacitor (unnumbered) -->
    <path d="M324,112 V160 M338,112 V160" stroke-width="3.2"/>
    <path d="M304,158 L354,115" marker-end="url(#t3-arrow)" stroke-width="2"/>

    <!-- Antenna 4 -->
    <path d="M338,136 H402 V84"/>
    <path d="M378,44 H426 L402,84 Z M402,44 V84" stroke-width="2.8"/>

    <!-- Variable Inductor 3 -->
    <circle cx="260" cy="136" r="4.2" fill="currentColor"/>
    <path d="M260,136 V168"/>
    <path d="M260,168 A11,11 0 0,0 260,190 A11,11 0 0,0 260,212 A11,11 0 0,0 260,234 A11,11 0 0,0 260,256"/>
    <path d="M260,256 V288 M245,288 H275 M247,288 L241,303 M260,288 L254,303 M273,288 L267,303"/>
    <circle cx="260" cy="271" r="4.2" fill="currentColor"/>
    <path d="M260,271 H302 V212 H265" marker-end="url(#t3-arrow)" stroke-width="2"/>
  </g>
  <g fill="var(--fig-accent, #38bdf8)" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle">
    <text x="96" y="143">1</text>
    <text x="195" y="98">2</text>
    <text x="224" y="220">3</text>
    <text x="402" y="30">4</text>
    <text x="260" y="324" fill="currentColor" font-size="16" opacity="0.85">Figure T-3</text>
  </g>
</svg>"""

FIGURES = {
    "T-1": FIGURE_T1,
    "T-2": FIGURE_T2,
    "T-3": FIGURE_T3,
}
