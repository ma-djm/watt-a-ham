"""Comprehensive beginner-friendly Ham Radio & Electronics Glossary (~110 entries)."""

GLOSSARY = {
    # --- Slang & Station Gear ---
    "rig": {
        "term": "Rig",
        "expansion": "Ham slang for your radio transceiver",
        "aliases": ["rig", "rigs"],
        "category": "Slang & Gear",
        "definition": "Everyday amateur radio nickname for a station's main transceiver—whether it is a pocket handheld, a car mobile unit, or a desktop base radio.",
        "analogy": "Just like guitarists call their amp-and-pedal setup their 'rig,' hams call their radio setup their rig."
    },
    "shack": {
        "term": "Shack",
        "expansion": "Your radio room or operating desk",
        "aliases": ["shack", "ham shack"],
        "category": "Slang & Gear",
        "definition": "Whatever corner, desk, workbench, or spare room houses your amateur radio equipment.",
        "analogy": "Dates back to early 1900s ships where the wireless operator worked inside a small wooden cabin on deck called the 'radio shack.'"
    },
    "ht": {
        "term": "HT (Handheld Transceiver)",
        "expansion": "Walkie-talkie style portable ham radio",
        "aliases": ["HT", "HTs", "handheld transceiver", "handheld"],
        "category": "Slang & Gear",
        "definition": "A battery-powered, palm-sized two-way amateur radio with a built-in mic, speaker, and flexible whip antenna, usually operating on VHF and UHF bands.",
        "analogy": "Like a supercharged walkie-talkie that can reach miles across town by bouncing signals through hilltop repeaters."
    },
    "transceiver": {
        "term": "Transceiver",
        "expansion": "Transmitter + Receiver in one unit",
        "aliases": ["transceiver", "transceivers"],
        "category": "Slang & Gear",
        "definition": "A single radio unit combining both a transmitter (to send signals) and a receiver (to listen) sharing one tuning dial and antenna jack.",
        "analogy": "Early hams needed two separate boxes on their desk—one to listen and one to transmit; modern rigs merge both into one transceiver."
    },
    "ptt": {
        "term": "PTT",
        "expansion": "Push-To-Talk switch",
        "aliases": ["PTT", "push-to-talk", "push to talk"],
        "category": "Slang & Gear",
        "definition": "The side button on a handheld or microphone (or computer keying line) that switches your transceiver from listening (receive) to sending (transmit) when grounded.",
        "analogy": "Unlike a phone call where both people talk at once, radio is one-way at a time—holding PTT claims the mic, and letting go listens."
    },
    "vfo": {
        "term": "VFO",
        "expansion": "Variable Frequency Oscillator (main tuning dial)",
        "aliases": ["VFO"],
        "category": "Slang & Gear",
        "definition": "The smooth tuning knob (and internal circuit) on a transceiver that lets you dial freely across any frequency in a band instead of jumping only between preset channels.",
        "analogy": "Memory mode is like car-stereo preset buttons; VFO mode is spinning the dial smoothly across the entire radio band."
    },
    "rit": {
        "term": "RIT / Clarifier",
        "expansion": "Receiver Incremental Tuning",
        "aliases": ["RIT", "clarifier"],
        "category": "Slang & Gear",
        "definition": "A fine-tuning control that nudges ONLY your receive frequency slightly up or down without changing your transmit frequency.",
        "analogy": "If an SSB caller sounds like Donald Duck or Darth Vader because they are slightly off frequency, RIT clears up their voice without starting a tuning chase."
    },
    "electronic-keyer": {
        "term": "Electronic Keyer",
        "expansion": "Automatic dot-and-dash timing helper for Morse code",
        "aliases": ["electronic keyer", "keyer", "keyers"],
        "category": "Slang & Gear",
        "definition": "A circuit (built into most modern rigs or a small desktop box) that connects to finger paddles and automatically generates evenly timed dots and dashes to assist manual sending of Morse code (CW).",
        "analogy": "A classic up-and-down telegraph key is like writing by hand; an electronic keyer with paddles is like a crisp mechanical keyboard for Morse code."
    },
    "dummy-load": {
        "term": "Dummy Load",
        "expansion": "50-ohm non-radiating test resistor",
        "aliases": ["dummy load", "dummy loads"],
        "category": "Slang & Gear",
        "definition": "A shielded 50-ohm non-inductive resistor mounted on a heat sink that replaces your antenna so you can test a transmitter at full power without radiating signals over the air.",
        "analogy": "Like a muffler/silencer on a test bench—your rig feels a perfect 50-ohm antenna, while all RF wattage safely turns into quiet warmth."
    },
    "antenna-analyzer": {
        "term": "Antenna Analyzer",
        "expansion": "Handheld SWR & resonance test instrument",
        "aliases": ["antenna analyzer", "analyzer"],
        "category": "Slang & Gear",
        "definition": "A compact bench or field meter that hooks directly to your antenna coax and sweeps tiny milliwatt signals across a band to show exactly where the antenna is resonant and what its SWR is—no transceiver needed.",
        "analogy": "Like an electronic guitar tuner, except for trimming wire and whip antennas to the exact right frequency."
    },
    "transverter": {
        "term": "Transverter",
        "expansion": "Band-shifting RF converter",
        "aliases": ["transverter", "transverters"],
        "category": "Slang & Gear",
        "definition": "An external accessory box that shifts both the transmit and receive signals of a common transceiver (for example, a 10-meter HF rig) up to a VHF, UHF, or microwave band.",
        "analogy": "Lets your existing HF transceiver talk on exotic microwave bands without buying a whole new radio."
    },
    "hotspot": {
        "term": "Digital Hotspot",
        "expansion": "Personal pocket RF-to-internet bridge",
        "aliases": ["hotspot", "hotspots", "digital hotspot", "digital mode hotspot"],
        "category": "Slang & Gear",
        "definition": "A tiny low-power radio board paired with Wi-Fi that links your DMR, D-STAR, or System Fusion handheld to worldwide digital voice/data networks when no local digital repeater is in range.",
        "analogy": "Works like a personal mini-repeater sitting on your bookshelf with a 100-foot range around your house."
    },
    "code-plug": {
        "term": "Code Plug",
        "expansion": "DMR radio configuration file",
        "aliases": ["code plug", "codeplug"],
        "category": "Slang & Gear",
        "definition": "The software settings file uploaded from a computer into a DMR digital radio containing local repeater frequencies, Color Codes, channels, and talkgroup IDs.",
        "analogy": "In the 1960s, commercial radios were configured by plugging in a physical wired jumper plug; today 'code plug' just means your saved settings file."
    },
    "bonding": {
        "term": "RF Bonding",
        "expansion": "Tying metal cases or ground rods together electrically",
        "aliases": ["bonding", "RF bonding", "flat copper strap"],
        "category": "Slang & Gear",
        "definition": "Connecting all metal equipment chassis on your desk (using wide flat copper strap) or all outdoor ground rods together so they sit at the exact same voltage.",
        "analogy": "Prevents stray RF feedback buzz on your microphone indoors and stops lightning surges from arcing between separate ground paths outdoors."
    },
    "ferrite-choke": {
        "term": "Ferrite Choke",
        "expansion": "Snap-on magnetic bead that blocks stray RF",
        "aliases": ["ferrite choke", "ferrite", "ferrite bead"],
        "category": "Slang & Gear",
        "definition": "A clip-on cylinder of iron-oxide ceramic snapped around a microphone cord, USB cable, or power wire to choke off stray radio-frequency currents while letting audio and DC pass untouched.",
        "analogy": "That little plastic lump you see near the end of laptop monitor or USB cables—it is a ferrite choke stopping RF interference!"
    },

    # --- Operating, Repeaters & Etiquette ---
    "simplex": {
        "term": "Simplex",
        "expansion": "Direct radio-to-radio on a single frequency",
        "aliases": ["simplex"],
        "category": "Operating",
        "definition": "Transmitting and receiving on the exact same frequency directly between two or more stations without going through an intermediate repeater.",
        "analogy": "Talking face-to-face across a campsite—no cell tower or hilltop relay in the middle, so it works even if all infrastructure is down."
    },
    "repeater": {
        "term": "Repeater",
        "expansion": "Automated hilltop relay station",
        "aliases": ["repeater", "repeaters", "repeater station"],
        "category": "Operating",
        "definition": "An automatically controlled amateur station—usually perched on a mountain, tall building, or tower—that listens on one frequency and simultaneously retransmits your signal at higher power on a second frequency.",
        "analogy": "Like someone standing on top of a ridge with a megaphone repeating everything whispered from one valley into the next valley over."
    },
    "repeater-offset": {
        "term": "Repeater Offset",
        "expansion": "Frequency split between repeater RX and TX",
        "aliases": ["repeater offset", "offset", "offsets"],
        "category": "Operating",
        "definition": "The fixed frequency difference between the frequency a repeater transmits on (its output) and the frequency it listens on (its input)—standardly ±600 kHz on 2 meters and ±5 MHz on 70 cm.",
        "analogy": "If a repeater shouted out on the exact same frequency it was trying to listen on, its own loud transmitter would deafen its receiver!"
    },
    "squelch": {
        "term": "Squelch",
        "expansion": "Idle static mute threshold",
        "aliases": ["squelch"],
        "category": "Operating",
        "definition": "A receiver circuit and knob/menu setting that mutes the speaker's rushing white-noise static when nobody is transmitting, then unmutes as soon as a real signal arrives.",
        "analogy": "An automatic noise gate—turn it too tight and weak callers get muted; open it all the way and you hear raw background hiss to catch faint signals."
    },
    "ctcss": {
        "term": "CTCSS (PL Tone)",
        "expansion": "Continuous Tone-Coded Squelch System",
        "aliases": ["CTCSS", "PL tone", "sub-audible tone"],
        "category": "Operating",
        "definition": "A quiet, low-pitched sub-audible tone (below 300 Hz) transmitted continuously underneath your voice to tell a repeater's squelch that a real ham—not random static—is calling.",
        "analogy": "Like a whispered musical password mixed invisibly under your speech that unlocks the repeater's front door."
    },
    "dcs": {
        "term": "DCS",
        "expansion": "Digital-Coded Squelch",
        "aliases": ["DCS"],
        "category": "Operating",
        "definition": "A slow, continuous sub-audible digital bit pattern sent underneath an analog FM voice signal—serving the same repeater-unlocking job as a CTCSS tone.",
        "analogy": "Same front-door lock idea as CTCSS, just sending a silent digital keycode instead of a musical hum."
    },
    "dtmf": {
        "term": "DTMF",
        "expansion": "Dual-Tone Multi-Frequency (touch-tones)",
        "aliases": ["DTMF"],
        "category": "Operating",
        "definition": "The standard `0–9`, star, and pound keypad tones where pressing one button sends two musical audio tones simultaneously (one row frequency + one column frequency) to control repeaters or IRLP links.",
        "analogy": "Literally the exact same 'beep-boop' touch-tones you hear when pressing numbers on a telephone keypad."
    },
    "color-code": {
        "term": "Color Code",
        "expansion": "DMR digital repeater access number (0–15)",
        "aliases": ["color code", "color codes", "Color Code"],
        "category": "Operating",
        "definition": "A number from 0 to 15 programmed into a DMR digital radio that must match the DMR repeater's Color Code before the repeater will accept your transmission.",
        "analogy": "Despite the name, nothing changes color—it is simply the DMR digital version of a CTCSS access tone."
    },
    "talkgroup": {
        "term": "Talkgroup",
        "expansion": "Virtual group channel ID on digital repeaters",
        "aliases": ["talkgroup", "talkgroups", "Talkgroup"],
        "category": "Operating",
        "definition": "A numeric routing ID on DMR and other digital networks that groups conversations into virtual rooms (like 'Local 9' or 'Worldwide 91') so listeners hear only the group they selected.",
        "analogy": "Like Slack or Discord channels sharing one repeater frequency so separate conversations don't bother each other."
    },
    "cq": {
        "term": "CQ",
        "expansion": "'Calling any station' (general invitation)",
        "aliases": ["CQ"],
        "category": "Operating",
        "definition": "The classic worldwide radio procedural call meaning 'I am looking to talk with anyone listening!'—used on simplex and HF/weak-signal bands (while on FM repeaters you simply say your call sign + 'listening').",
        "analogy": "Came from French 'sécurité' / English 'seek you'—the radio equivalent of walking into a friendly café and waving hello to anyone free to chat."
    },
    "q-signals": {
        "term": "Q-Signals (QRM & QSY)",
        "expansion": "Three-letter radio shorthand codes",
        "aliases": ["Q-signals", "Q-signal", "QRM", "QRN", "QSY"],
        "category": "Operating",
        "definition": "Standard 3-letter codes invented for fast Morse code and carried into voice radio: QRM = interference from other stations (Man-made), QRN = Natural static (lightning), and QSY = changing frequency (Shift Your frequency).",
        "analogy": "1920s text-messaging abbreviations that work across language barriers anywhere on Earth."
    },
    "band-plan": {
        "term": "Band Plan",
        "expansion": "Voluntary gentleman's agreement inside a band",
        "aliases": ["band plan", "band plans"],
        "category": "Operating",
        "definition": "A voluntary community roadmap (published by groups like the ARRL) that organizes each band into tidy neighborhoods for repeaters, simplex calling, FT8 digital, satellites, and SSB.",
        "analogy": "FCC rules set the outer highway speed limits and truck lanes; band plans are polite lane markings so joggers and semi-trucks don't share the same lane."
    },
    "dx": {
        "term": "DX",
        "expansion": "Long-distance or foreign radio contact",
        "aliases": ["DX"],
        "category": "Operating",
        "definition": "Old telegraph shorthand for 'distance'—referring to thrilling long-range contacts across states, oceans, or continents.",
        "analogy": "Chatting across town on a repeater is local ragchewing; catching a station 2,000 miles away on 10 meters or 6m Sporadic-E is working DX!"
    },
    "net": {
        "term": "Net & Net Control (NCS)",
        "expansion": "Scheduled on-air group gathering",
        "aliases": ["net", "nets", "Net Control Station", "NCS", "Net Control"],
        "category": "Operating",
        "definition": "An organized on-air group session led by a Net Control Station (NCS) who takes check-ins and directs who transmits next—used for club roll calls, weather spotting, and emergency drills.",
        "analogy": "A moderated conference call on the air: everyone holds their mic until the host (Net Control) calls their turn, unless breaking in with a real emergency."
    },
    "radiogram": {
        "term": "Radiogram (Formal Traffic)",
        "expansion": "Standardized word-counted emergency/relay message",
        "aliases": ["radiogram", "radiograms", "preamble", "traffic"],
        "category": "Operating",
        "definition": "A structured formal message ('traffic') relayed station-to-station, starting with a tracking header ('preamble') that includes a 'check' (exact count of words in the message body).",
        "analogy": "Like a Western Union telegram sent over ham radio, complete with a word count so the receiver knows immediately if static ate a word."
    },
    "grid-locator": {
        "term": "Grid Locator (Grid Square)",
        "expansion": "Maidenhead map code (e.g., FN31 or DM79)",
        "aliases": ["grid locator", "grid locators", "grid square", "grid squares"],
        "category": "Operating",
        "definition": "A compact letter-and-number geographic code (such as DM79 or FN31) dividing Earth into rectangular map boxes so VHF, FT8, and satellite operators can share locations in 4 characters.",
        "analogy": "A global game of Battleship coordinates—hams love collecting contacts across hundreds of different grid squares!"
    },

    # --- Modes & Signals ---
    "cw": {
        "term": "CW (Morse Code)",
        "expansion": "Continuous Wave",
        "aliases": ["CW"],
        "category": "Modes & Signals",
        "definition": "Another name for Morse code—transmitted by keying a pure, unmodulated radio wave on and off in short 'dits' and long 'dahs,' occupying the narrowest bandwidth of any mode (~150 Hz).",
        "analogy": "Like flashing a laser pointer in short and long blinks across a canyon—because all your watts concentrate into one razor-thin tone, CW punches through terrible noise."
    },
    "am": {
        "term": "AM",
        "expansion": "Amplitude Modulation",
        "aliases": ["AM", "amplitude modulation"],
        "category": "Modes & Signals",
        "definition": "Encoding voice or video onto a radio carrier wave by varying the wave's strength (amplitude) up and down in step with the audio—used for AM broadcast radio, aircraft comms, and analog fast-scan TV.",
        "analogy": "Varying how brightly a flashlight shines to match the loudness of your voice."
    },
    "ssb": {
        "term": "SSB (Single Sideband)",
        "expansion": "Power-efficient narrowband voice mode (~3 kHz)",
        "aliases": ["SSB", "single sideband", "USB", "upper sideband"],
        "category": "Modes & Signals",
        "definition": "A streamlined form of amplitude modulation (AM) that strips away the power-hungry carrier and duplicate sideband, putting 100% of your watts into a narrow ~3 kHz voice signal. Upper Sideband (USB) is standard on 10m, VHF, and UHF.",
        "analogy": "Standard AM wastes two-thirds of its wattage transmitting silence between words; SSB sends zero watts until you speak, reaching much farther per watt!"
    },
    "fm": {
        "term": "FM",
        "expansion": "Frequency Modulation (~10–15 kHz on repeaters)",
        "aliases": ["FM", "frequency modulation", "over-deviating"],
        "category": "Modes & Signals",
        "definition": "Encoding audio by wiggling a constant-strength carrier's frequency slightly above and below center—giving clear, static-free local audio for VHF/UHF handhelds, repeaters, and packet radio.",
        "analogy": "Wider (~10–15 kHz) than SSB, so it isn't ideal for faint distant signals, and its 'capture effect' locks onto only the strongest station at a time—great for crisp local repeaters!"
    },
    "bandwidth": {
        "term": "Bandwidth",
        "expansion": "Slice of spectrum width a signal occupies",
        "aliases": ["bandwidth", "bandwidths"],
        "category": "Modes & Signals",
        "definition": "How wide a frequency lane a transmitted signal takes up on the dial—ranging from razor-thin CW (150 Hz) and SSB voice (3 kHz) to FM voice (10–15 kHz) and fast-scan TV (~6 MHz).",
        "analogy": "A bicycle (CW) needs a 1-foot path, a sedan (SSB) needs one lane, a bus (FM) needs a wide lane, and a parade float (TV) takes up the whole highway!"
    },
    "ft8": {
        "term": "FT8 & WSJT-X",
        "expansion": "Weak-signal computer digital mode",
        "aliases": ["FT8", "WSJT-X"],
        "category": "Modes & Signals",
        "definition": "FT8 (part of the open-source WSJT-X software suite alongside moonbounce and meteor-scatter modes) sends 15-second synchronized tone bursts with heavy error correction that decode signals buried far below human hearing.",
        "analogy": "Even if a modest backyard wire antenna sounds like pure empty static to your ears, your laptop running FT8 can pull call signs out from halfway around the world."
    },
    "aprs": {
        "term": "APRS",
        "expansion": "Automatic Packet Reporting System",
        "aliases": ["APRS"],
        "category": "Modes & Signals",
        "definition": "A tactical digital packet system on VHF/HF that broadcasts live GPS coordinates, short text messages, and weather station telemetry so stations appear on shared real-time maps.",
        "analogy": "Live map pins and text messaging over pure radio waves—hugely popular for tracking marathon support vehicles, high-altitude balloons, and hikers."
    },
    "dmr": {
        "term": "DMR",
        "expansion": "Digital Mobile Radio (2-slot TDMA digital voice)",
        "aliases": ["DMR"],
        "category": "Modes & Signals",
        "definition": "A digital voice standard that slices a single 12.5 kHz repeater channel into two alternating rapid-fire time slots so two separate conversations can share one repeater simultaneously.",
        "analogy": "Two callers taking microscopic 30-millisecond turns on the same radio channel so smoothly that both hear continuous, clear speech."
    },
    "d-star": {
        "term": "D-STAR",
        "expansion": "Digital Smart Technologies for Amateur Radio",
        "aliases": ["D-STAR"],
        "category": "Modes & Signals",
        "definition": "An amateur-designed digital voice and data protocol that embeds your FCC call sign directly inside every transmission header for internet routing and automatic station ID.",
        "analogy": "Because your call sign is baked into the digital stream, you must type your call sign into a D-STAR radio's menu before it will let you transmit properly."
    },
    "packet-arq": {
        "term": "Packet Radio & ARQ",
        "expansion": "Error-checked digital data frames",
        "aliases": ["packet radio", "ARQ", "checksum"],
        "category": "Modes & Signals",
        "definition": "Packet radio chops data into addressed envelopes containing a header (call signs) and checksum (math check for static corruption); ARQ (Automatic Repeat Request) asks the sender to resend any damaged frame automatically.",
        "analogy": "Like TCP/IP on the internet—if a lightning crash garbles packet #4, the receiving station says 'Resend #4!' until the file arrives 100% error-free."
    },
    "psk": {
        "term": "PSK",
        "expansion": "Phase Shift Keying",
        "aliases": ["PSK", "Phase Shift Keying"],
        "category": "Modes & Signals",
        "definition": "A narrowband digital modulation technique (such as live keyboard-to-keyboard chatting in PSK31) that encodes 1s and 0s by flipping the timing phase of an RF carrier wave.",
        "analogy": "Instead of changing loudness or pitch, PSK flips the wave's rhythm mid-stride to represent digital bits."
    },
    "echolink-irlp": {
        "term": "EchoLink & IRLP",
        "expansion": "VoIP internet-linked repeater systems",
        "aliases": ["EchoLink", "IRLP", "VoIP", "gateway"],
        "category": "Modes & Signals",
        "definition": "Internet Voice-over-IP (VoIP) networks linking repeaters worldwide via gateway stations: IRLP connects radio-to-repeater using DTMF keypad codes, while EchoLink also lets verified hams connect straight from a phone or PC app without a radio.",
        "analogy": "Once you upload proof of your new license to EchoLink, you can talk out of a repeater in Tokyo or London right from your smartphone!"
    },
    "ntsc": {
        "term": "NTSC (Fast-Scan TV)",
        "expansion": "Analog color Amateur Television (~6 MHz)",
        "aliases": ["NTSC", "fast-scan TV"],
        "category": "Modes & Signals",
        "definition": "The classic North American analog live-video television format—used by hams on UHF and microwave bands (occupying ~6 MHz of bandwidth) to transmit live camera feeds from RC aircraft, towers, or events.",
        "analogy": "Old-school live broadcast TV sent by hams—needing 2,000 times more spectrum width than a single SSB voice call!"
    },
    "harmonics-spurious": {
        "term": "Harmonics & Spurious Emissions",
        "expansion": "Unwanted out-of-band transmitter byproducts",
        "aliases": ["harmonics", "harmonic", "spurious emissions"],
        "category": "Modes & Signals",
        "definition": "Unintended extra signals leaking out of a faulty or poorly filtered transmitter—harmonics appear at exact whole-number multiples of your dial frequency (e.g., 2× or 3×), potentially interfering with other services.",
        "analogy": "Like striking middle C on a piano and accidentally ringing high C an octave up—filters inside your rig keep those overtones off the air."
    },

    # --- Electronics & Circuits ---
    "voltage": {
        "term": "Voltage (E, Volts)",
        "expansion": "Electromotive Force — electrical pressure",
        "aliases": ["voltage", "electromotive force"],
        "category": "Electronics",
        "definition": "The electrical potential difference (measured in Volts, abbreviated V or E in Ohm's Law) that pushes electrons to flow through a conductor.",
        "analogy": "Water pressure sitting behind a garden hose nozzle—voltage can exist even when the switch is off and zero current is flowing."
    },
    "current": {
        "term": "Current (I, Amperes)",
        "expansion": "Flow rate of electrons",
        "aliases": ["current", "amperes", "amps"],
        "category": "Electronics",
        "definition": "The actual movement/flow rate of electrons through a circuit, measured in Amperes ('amps,' abbreviated A or I for 'Intensity' in formulas).",
        "analogy": "Gallons per minute of water actually rushing through the hose once you open the nozzle."
    },
    "resistance": {
        "term": "Resistance (R, Ohms)",
        "expansion": "Opposition to DC, AC, and RF current (Ω)",
        "aliases": ["resistance", "ohm", "ohms"],
        "category": "Electronics",
        "definition": "Friction-like opposition to electrical current flow across DC, AC, and radio frequencies alike, measured in Ohms (Ω) and turning electrical energy into heat.",
        "analogy": "A narrow kink or gravel screen inside a water pipe—higher resistance lets less current flow for the same voltage push."
    },
    "power-pep": {
        "term": "Power (Watts) & PEP",
        "expansion": "Rate of energy use · Peak Envelope Power",
        "aliases": ["PEP", "peak envelope power"],
        "category": "Electronics",
        "definition": "Electrical power (P = I × E, measured in Watts) is how fast energy is used or radiated. Peak Envelope Power (PEP) is the highest average RF wattage reached at the loudest voice crests—the standard FCC yardstick for ham power limits (200W HF / 1500W VHF+).",
        "analogy": "Like measuring a sprinter's top speed at full stride: SSB power rises and falls with your voice, so FCC limits cap your peak voice crests (PEP)."
    },
    "decibel": {
        "term": "Decibel (dB)",
        "expansion": "Logarithmic power ratio (+3 dB = 2×, +10 dB = 10×)",
        "aliases": ["decibel", "decibels", "dB"],
        "category": "Electronics",
        "definition": "A compact ratio scale comparing output power to input power: +3 dB means 2× power, -3 dB means ½ power, -6 dB means ¼ power, and +10 dB means 10× power.",
        "analogy": "Radio signals vary by factors of millions between a local tower and a distant satellite; decibels turn huge multiplications into bite-sized addition."
    },
    "ac-dc": {
        "term": "DC vs. AC",
        "expansion": "Direct Current vs. Alternating Current",
        "aliases": ["DC", "AC", "alternating current", "direct current"],
        "category": "Electronics",
        "definition": "Direct Current (DC, from batteries and 13.8V power supplies) flows steadily in one direction; Alternating Current (AC, from 120V wall outlets and radio waves!) reverses back and forth between positive and negative at a set frequency in Hertz (Hz).",
        "analogy": "DC is a river flowing steadily downstream; AC is ocean waves sloshing forward and backward."
    },
    "capacitor": {
        "term": "Capacitor & Filter Capacitor",
        "expansion": "Stores energy in an electric field (Farads)",
        "aliases": ["capacitor", "capacitors", "capacitance", "filter capacitor", "filter capacitors"],
        "category": "Electronics",
        "definition": "Two conductive metal plates separated by an insulating layer (dielectric) that store electrical energy in an electric field (measured in Farads, typically microfarads µF or picofarads pF). Large filter capacitors smooth pulsating DC in power supplies—and can hold a dangerous charge after unplugging!",
        "analogy": "Acts like a tiny spring-loaded water tank: it blocks steady DC once full, smooths out voltage ripples, and passes rapid AC vibrations."
    },
    "inductor": {
        "term": "Inductor",
        "expansion": "Coil of wire storing energy in a magnetic field (Henries)",
        "aliases": ["inductor", "inductors", "inductance"],
        "category": "Electronics",
        "definition": "A coil of wire (air-wound or wrapped around an iron/ferrite core) that stores energy in a surrounding magnetic field, measured in Henries (H, usually µH or mH), resisting sudden changes in current.",
        "analogy": "Like a heavy flywheel in water—steady DC glides right through the coil, while fast AC/RF fluctuations meet heavy magnetic pushback."
    },
    "impedance": {
        "term": "Impedance (Z)",
        "expansion": "Total opposition to AC/RF current (Ohms)",
        "aliases": ["impedance"],
        "category": "Electronics",
        "definition": "The combined opposition a circuit, cable, or antenna presents to alternating current (AC and RF), measured in Ohms—amateur transmitters and coax standardize on 50 ohms.",
        "analogy": "Resistance is DC friction; impedance is the full AC story combining resistance plus the pushback of capacitors and inductors."
    },
    "resonance": {
        "term": "Resonance (Tuned LC Circuit)",
        "expansion": "Inductor + Capacitor tuned to one natural frequency",
        "aliases": ["resonant", "resonance", "tuned circuit", "resonant circuit"],
        "category": "Electronics",
        "definition": "Connecting an inductor and a capacitor (in series or parallel) forms a tuned circuit—or resonant antenna length—where electric and magnetic energy slosh back and forth effortlessly at one specific frequency while rejecting others.",
        "analogy": "Pushing a playground swing at its exact natural rhythm: tiny pushes at the resonant frequency build huge motion, while off-rhythm pushes go nowhere."
    },
    "diode-rectifier": {
        "term": "Diode, LED & Rectifier",
        "expansion": "One-way semiconductor check valve (Anode → Cathode)",
        "aliases": ["diode", "diodes", "rectifier", "LED", "anode", "cathode"],
        "category": "Electronics",
        "definition": "A two-lead semiconductor (Anode in → Cathode out, marked with a stripe) that lets current flow in only one direction. LEDs glow when forward current flows; rectifier circuits use diodes to convert two-way AC into one-way pulsating DC.",
        "analogy": "A spring-loaded one-way flap valve in a pipe: push from the Anode side and it swings open; push from the striped Cathode side and it slams shut."
    },
    "transistor": {
        "term": "Transistor (BJT & FET)",
        "expansion": "3-pin semiconductor switch & power amplifier",
        "aliases": ["transistor", "transistors", "BJT", "FET", "field effect transistor"],
        "category": "Electronics",
        "definition": "An active 3-terminal semiconductor where a tiny signal on a control pin regulates a much larger current—acting as an electronic switch or RF amplifier. Bipolar (BJT) pins are Emitter-Base-Collector; Field-Effect (FET) pins are Gate-Drain-Source.",
        "analogy": "Like the trigger valve on a pressure washer: a gentle finger squeeze (Base or Gate) unleashes a massive blast of water from the pump."
    },
    "potentiometer": {
        "term": "Potentiometer (Variable Resistor)",
        "expansion": "Adjustable rotary/slider resistor",
        "aliases": ["potentiometer", "variable resistor"],
        "category": "Electronics",
        "definition": "A resistor with a sliding wiper contact connected to a knob—used everywhere on radio front panels as volume and squelch controls.",
        "analogy": "Spinning your volume knob slides a metal wiper along a resistive track to dial smooth audio levels."
    },
    "relay": {
        "term": "Relay",
        "expansion": "Electromagnet-operated mechanical switch",
        "aliases": ["relay", "relays"],
        "category": "Electronics",
        "definition": "An electrically controlled switch where energizing a low-power electromagnet coil pulls metal contacts closed or open to switch a separate high-power or high-voltage circuit.",
        "analogy": "Lets a delicate 5-volt microcontroller safely flip a 1,500-watt antenna amplifier switch without touching high power directly."
    },
    "multimeter": {
        "term": "Multimeter (Volt / Amp / Ohmmeter)",
        "expansion": "3-in-1 bench test meter",
        "aliases": ["multimeter", "voltmeter", "ammeter", "ohmmeter"],
        "category": "Electronics",
        "definition": "Handheld diagnostic tool: as a Voltmeter, touch probes IN PARALLEL across a live part; as an Ammeter, wire IN SERIES inside the current path; as an Ohmmeter, ALWAYS turn circuit power OFF before measuring resistance!",
        "analogy": "Measuring voltage on the Ohms setting is the #1 rookie mistake that pops a multimeter's internal fuse or circuitry."
    },

    # --- Antennas, Coax & Propagation ---
    "swr": {
        "term": "SWR (Standing Wave Ratio)",
        "expansion": "Antenna-to-feedline impedance match score",
        "aliases": ["SWR", "standing wave ratio"],
        "category": "Antennas & Coax",
        "definition": "A ratio comparing forward RF power sent down your cable to reflected power bouncing back from the antenna: 1:1 is a perfect match, while 4:1 signals a severe mismatch (triggering automatic transmitter power foldback to protect output transistors).",
        "analogy": "Rolling a bowling ball onto a smooth lane (1:1) vs. hitting a curb halfway down the alley so the ball bounces back at your feet (4:1)."
    },
    "coax": {
        "term": "Coax (Coaxial Cable / Feed Line)",
        "expansion": "50-ohm shielded antenna transmission line",
        "aliases": ["coax", "coaxial cable", "feed line", "feed lines", "RG-58", "RG-213", "hardline"],
        "category": "Antennas & Coax",
        "definition": "A center copper wire surrounded by foam/plastic insulation and a braided metal shield (standardized at 50 ohms for ham radio) that carries RF cleanly between rig and antenna. Thicker RG-213 has lower loss than thin RG-58, and air-insulated hardline has the lowest loss of all.",
        "analogy": "Because the RF stays trapped between the center wire and braided shield, you can tape coax right along metal gutters or walls without detuning it."
    },
    "pl259-type-n": {
        "term": "PL-259 & Type N Connectors",
        "expansion": "Standard screw-on RF coax plugs",
        "aliases": ["PL-259", "Type N", "BNC"],
        "category": "Antennas & Coax",
        "definition": "PL-259 (nicknamed the 'UHF connector' in the 1930s when 30 MHz counted as UHF!) is the standard plug on HF and VHF rigs, while gasketed, constant-50-ohm Type N connectors excel above 400 MHz. Tape ALL outdoor connectors against rain!",
        "analogy": "Moisture wicking inside coax braid is the #1 killer of outdoor antenna cables—weatherproofing tape saves your signal."
    },
    "antenna-tuner": {
        "term": "Antenna Tuner (Coupler)",
        "expansion": "Impedance-matching LC box at the rig",
        "aliases": ["antenna tuner", "coupler"],
        "category": "Antennas & Coax",
        "definition": "A box of adjustable capacitors and inductors (like Figure T-3!) placed between your transceiver and feed line that transforms a mismatched system impedance into the clean 50 ohms your transmitter expects.",
        "analogy": "Like bicycle gears matching your legs to a steep hill so your rig can deliver full rated wattage safely."
    },
    "dipole-yagi": {
        "term": "Dipole, Quarter-Wave & Yagi Antennas",
        "expansion": "Classic wire, whip, and directional beam antennas",
        "aliases": ["dipole", "Yagi", "beam antenna", "rubber duck", "antenna gain"],
        "category": "Antennas & Coax",
        "definition": "A half-wave dipole wire radiates strongest broadside to the wire; a 19-inch whip is a resonant quarter-wave on 2m (much more efficient than a stubby handheld 'rubber duck'); a multi-element Yagi beam focuses energy into one direction for maximum antenna gain.",
        "analogy": "A vertical whip is a bare lantern lighting 360° around you; a Yagi beam puts a parabolic flashlight reflector behind it to throw a bright spotlight in one direction."
    },
    "polarization": {
        "term": "Polarization",
        "expansion": "Orientation of a radio wave's electric field",
        "aliases": ["polarization", "horizontally polarized", "vertically polarized", "elliptically polarized"],
        "category": "Propagation",
        "definition": "Determined by the direction of the wave's electric field (matching the antenna rods): VHF/UHF FM handhelds and repeaters use vertical polarization, VHF/UHF weak-signal SSB/CW uses horizontal, and mismatching them line-of-sight costs huge signal strength!",
        "analogy": "Like polarized sunglasses—tilting your antenna 90° against a line-of-sight station blocks most of the signal, unless the wave bounced off the ionosphere (which scrambles it into elliptical polarization)."
    },
    "wavelength": {
        "term": "Wavelength (λ) & HF / VHF / UHF",
        "expansion": "Meters = 300 ÷ Frequency in MHz",
        "aliases": ["wavelength", "HF", "VHF", "UHF"],
        "category": "Propagation",
        "definition": "Physical crest-to-crest length of a wave racing at light speed (300,000,000 m/s): λ(m) = 300 / f(MHz). Higher frequency = shorter waves! HF = 3–30 MHz (long skip), VHF = 30–300 MHz (6m & 2m), UHF = 300–3000 MHz (70cm).",
        "analogy": "When hams say 'the 2-meter band,' they literally mean the radio waves around 146 MHz are ~2 meters (6.5 feet) long from crest to crest!"
    },
    "ionosphere": {
        "term": "Ionosphere, Sporadic E & Tropospheric Ducting",
        "expansion": "Upper-atmosphere mirrors & weather ducts for DX",
        "aliases": ["ionosphere", "Sporadic E", "tropospheric ducting", "multipath", "picket fencing", "knife-edge diffraction"],
        "category": "Propagation",
        "definition": "Sunlit ionized layers (E & F regions) high in the sky bounce HF (and 10m/6m at solar peaks or summer Sporadic E) across oceans, while UHF passes into space. Lower down, weather temperature inversions create 'tropospheric ducts' carrying VHF/UHF ~300+ miles, while city reflections cause 'multipath' flutter ('picket fencing').",
        "analogy": "The ionosphere acts like a giant curved mirror in the sky for lower frequencies, turning into clear glass at UHF."
    },
    "doppler-leo": {
        "term": "LEO Satellites, U/V & Doppler Shift",
        "expansion": "Low Earth Orbit ham birds (~100-min orbit)",
        "aliases": ["LEO", "Doppler shift", "Keplerian elements", "spin fading", "U/V"],
        "category": "Propagation",
        "definition": "Most amateur satellites zip overhead in Low Earth Orbit (~100 minutes per lap), tracked with Keplerian orbital files. Mode 'U/V' means 70cm UHF uplink / 2m VHF downlink, and the bird's 17,000 mph speed creates Doppler frequency shift (higher pitch approaching, lower receding).",
        "analogy": "Just like a train horn dropping pitch as it races past you—except with radio frequencies from an orbiting spacecraft!"
    },

    # --- Safety & FCC Part 97 Rules ---
    "mpe-duty-cycle": {
        "term": "Non-Ionizing RF, MPE & Duty Cycle",
        "expansion": "FCC thermal RF exposure safety rules",
        "aliases": ["non-ionizing", "MPE", "Maximum Permissible Exposure", "duty cycle", "OET Bulletin 65"],
        "category": "Safety & FCC Rules",
        "definition": "Radio waves are non-ionizing (warming tissue at high power, never damaging DNA like X-rays). Human body size absorbs RF fastest near 50 MHz (strictest MPE limit), and because heating averages over minutes, lowering your transmit 'duty cycle' (% of time transmitting) allows proportionally higher peak power density.",
        "analogy": "Holding your hand near a camp stove for 3 seconds out of every minute (low duty cycle) warms it far less than holding it there non-stop (100% duty cycle)."
    },
    "part97-uls": {
        "term": "Part 97, ULS & FRN",
        "expansion": "FCC amateur rules & Universal Licensing System",
        "aliases": ["Part 97", "ULS", "FRN", "CSCE"],
        "category": "Safety & FCC Rules",
        "definition": "47 CFR Part 97 is the official FCC rulebook for US ham radio. Before testing, you get a free FRN ID; after passing (receiving a paper CSCE receipt) and paying the $35 FCC fee, you may legally transmit the moment your new call sign appears in the online FCC ULS database!",
        "analogy": "Passing your road test gives you a paper slip, but the ULS database entry is your actual legal driver's license on the air."
    },
    "control-operator": {
        "term": "Control Operator & Control Point",
        "expansion": "Licensed ham legally in charge of transmissions",
        "aliases": ["control operator", "control point", "third-party communications", "third-party traffic"],
        "category": "Safety & FCC Rules",
        "definition": "Every transmitting station must have a licensed control operator at its control point (locally or over the internet), whose license class sets the allowed frequencies. Unlicensed friends/family ('third parties') can talk on your mic as long as you stay right there as control operator!",
        "analogy": "Like a licensed pilot sitting in the cockpit with dual controls while letting a friend take the yoke."
    },
    "ares-races": {
        "term": "ARES vs. RACES",
        "expansion": "Volunteer public-service vs. government civil-defense radio",
        "aliases": ["ARES", "RACES"],
        "category": "Safety & FCC Rules",
        "definition": "ARES (Amateur Radio Emergency Service) is an open community volunteer group for parades, marathons, and disasters; RACES (Radio Amateur Civil Emergency Service) is a formal Part 97 civil-defense service requiring official enrollment with a government emergency agency.",
        "analogy": "Memory hook: the 'C' in RACES stands for official government Civil defense certification!"
    },
    "winlink": {
        "term": "Winlink",
        "expansion": "Global Radio Email over HF & VHF/UHF",
        "aliases": ["Winlink"],
        "category": "Operating",
        "definition": "A worldwide amateur radio digital messaging network that sends and receives standard internet email over radio waves using callsign-based addresses when cell towers and local internet are down.",
        "analogy": "Like having an off-grid Gmail inbox powered purely by your transceiver and a laptop."
    },
    "sensitivity-selectivity": {
        "term": "Sensitivity vs. Selectivity",
        "expansion": "Hearing faint whispers vs. ignoring loud neighbors",
        "aliases": ["sensitivity", "selectivity"],
        "category": "Electronics",
        "definition": "Sensitivity is a receiver's ability to pull in very weak signals near the noise floor; selectivity is its ability to discriminate between closely spaced signals and reject strong stations right next door.",
        "analogy": "Sensitivity is having sharp hearing in a quiet room; selectivity is hearing your friend clearly across a loud, crowded restaurant."
    },
    "oscillator-mixer": {
        "term": "Oscillator & Mixer",
        "expansion": "Internal frequency generator & frequency converter stages",
        "aliases": ["oscillator", "mixer"],
        "category": "Electronics",
        "definition": "An oscillator generates a pure, steady signal at a specific frequency; a mixer combines two frequencies (your antenna signal + an oscillator) to shift the signal cleanly to a new intermediate or output frequency.",
        "analogy": "Like transposing a song into an easier musical key without changing the melody."
    },
    "modulation": {
        "term": "Modulation",
        "expansion": "Imprinting voice or data onto an RF carrier wave",
        "aliases": ["modulation", "modulate", "unmodulated carrier"],
        "category": "Modes & Signals",
        "definition": "Varying a blank radio carrier wave's amplitude (AM/SSB), frequency (FM), or phase (PM/PSK) so it carries speech, Morse tones, or computer data across space.",
        "analogy": "A blank sheet of paper is the RF carrier; writing your message onto it is modulation."
    },
    "transformer": {
        "term": "Transformer",
        "expansion": "Two magnetically coupled coils stepping AC voltage up or down",
        "aliases": ["transformer", "transformers"],
        "category": "Electronics",
        "definition": "Two wire windings sharing an iron or ferrite core that use changing magnetic fields to step 120V household AC down (or up) to another AC voltage—never works on steady DC and never creates extra power.",
        "analogy": "Like mechanical gears trading speed for torque: stepping 120V AC down to 15V AC gives lower voltage with higher available current."
    },
    "voltage-regulator": {
        "term": "Voltage Regulator",
        "expansion": "Circuit holding DC output rock-steady (e.g., 13.8V)",
        "aliases": ["voltage regulator", "regulator"],
        "category": "Electronics",
        "definition": "The final stage in a power supply that locks the output at a constant DC voltage (such as 13.8 V) even when household wall voltage fluctuates or your rig suddenly draws 15 amps on transmit.",
        "analogy": "Cruise control for voltage—keeping speed steady at 13.8V uphill or downhill."
    },
    "integrated-circuit": {
        "term": "Integrated Circuit (IC)",
        "expansion": "Microchip combining many components in one package",
        "aliases": ["integrated circuit", "IC"],
        "category": "Electronics",
        "definition": "A single semiconductor chip housing dozens to millions of transistors, diodes, resistors, and capacitors etched together inside one compact package.",
        "analogy": "An entire circuit board shrunk onto a silicon fingernail."
    },
    "spst-spdt": {
        "term": "SPST & SPDT Switches",
        "expansion": "Poles = independent circuits · Throws = output positions",
        "aliases": ["SPST", "SPDT", "single-pole single-throw", "single-pole double-throw"],
        "category": "Electronics",
        "definition": "SPST (Single-Pole Single-Throw, like Component 3 in Figure T-2) is a basic 2-terminal ON/OFF switch; SPDT (Single-Pole Double-Throw) has 3 terminals to route 1 input wire between either of 2 output paths.",
        "analogy": "SPST is a standard bedroom wall light switch; SPDT is a railroad track switch steering one train onto Track A or Track B."
    },
    "voltage-drop-ah": {
        "term": "Voltage Drop & Ampere-Hours (Ah)",
        "expansion": "Wire voltage loss & battery fuel-tank capacity",
        "aliases": ["voltage drop", "ampere-hour", "ampere-hours", "Ah"],
        "category": "Electronics",
        "definition": "Voltage drop is voltage lost across long/thin power wires under heavy transmit current (cured with short, thick wire). Ampere-hours (Ah) measure battery capacity—divide Ah by average current draw (A) to find runtime in hours!",
        "analogy": "A 12 Ah battery is a 12-gallon tank: burn 2 amps per hour and you get 6 hours on the air."
    },
    "fuse-arrester": {
        "term": "Fuse & Lightning Arrester",
        "expansion": "Overcurrent fire guard & outdoor coax surge diverter",
        "aliases": ["fuse", "fuses", "lightning arrester", "lightning arresters"],
        "category": "Safety & FCC Rules",
        "definition": "A fuse wires in series with the Black (hot) AC wire to melt and cut power during an overload before wires catch fire. A lightning arrester mounts on a grounded metal panel where coax enters your building to shunt static/lightning surges to Earth.",
        "analogy": "Never swap a 5A fuse for a 20A fuse—that's like taping a penny over a breaker and letting the wires inside your rig melt!"
    },
    "rfi-filters": {
        "term": "RFI, Fundamental Overload & Band-Reject Filters",
        "expansion": "Radio Frequency Interference cures",
        "aliases": ["RFI", "fundamental overload", "band-reject filter"],
        "category": "Electronics",
        "definition": "Even a 100% clean transmitter can overwhelm a nearby cheap radio/TV ('fundamental overload'—cured by adding a filter at that receiver's antenna input). Conversely, if a nearby commercial FM tower overloads your 2m ham rig, install a band-reject (notch) filter.",
        "analogy": "A band-reject filter acts like targeted earplugs blocking 88–108 MHz broadcast FM while letting 144 MHz ham signals pass wide open."
    },
    "cold-solder": {
        "term": "Rosin-Core Solder & Cold Joints",
        "expansion": "Bench electronics soldering essentials",
        "aliases": ["cold solder joint", "rosin-core", "acid-core"],
        "category": "Electronics",
        "definition": "Electronics soldering uses rosin-core (never corrosive plumbing acid-core!) solder. If the iron doesn't heat the parts enough or the wire moves while cooling, you get a weak 'cold joint' with a dull, rough, lumpy surface instead of a smooth fillet.",
        "analogy": "Good tin-lead solder wets smoothly like mercury; a cold joint looks crumbly and gray like frosted gravel."
    },
    "frequency-coordinator": {
        "term": "Volunteer Frequency Coordinator",
        "expansion": "Peer-selected local repeater channel planner",
        "aliases": ["Frequency Coordinator", "Volunteer Frequency Coordinator"],
        "category": "Safety & FCC Rules",
        "definition": "A volunteer (or regional council) selected by local repeater-eligible hams—not appointed by the FCC—who recommends transmit/receive channel pairs so neighboring repeaters don't step on each other.",
        "analogy": "Community traffic engineering by local hams, keeping hilltop repeaters spaced cleanly across each state."
    },
    "broadcasting-aux": {
        "term": "Broadcasting vs. Beacons & Auxiliary Stations",
        "expansion": "Illegal public radio vs. legal one-way ham links",
        "aliases": ["broadcasting", "auxiliary station", "beacon", "beacons", "vanity call sign"],
        "category": "Safety & FCC Rules",
        "definition": "Broadcasting (one-way transmissions aimed at the general public, or playing music) is illegal on ham bands—though one-way propagation beacons (like 28.2–28.3 MHz), code practice, telemetry, and point-to-point repeater 'auxiliary stations' are permitted. Any licensed ham can also request a custom 'vanity call sign'!",
        "analogy": "Talking TO other hams (or running a technical beacon) is amateur radio; pretending to be an FM DJ for the public is broadcasting."
    },
    "foxhunt-mesh": {
        "term": "Radio Direction Finding (Foxhunting) & Mesh Networks",
        "expansion": "Hidden-transmitter hunts & ham Wi-Fi backbones",
        "aliases": ["direction finding", "RDF", "mesh network", "loading"],
        "category": "Operating",
        "definition": "Radio Direction Finding uses a directional antenna to track down hidden 'fox' transmitters for sport (or locate power-line noise/jammers). Amateur mesh networks flash custom ham firmware onto Wi-Fi routers for high-speed emergency data; 'antenna loading' inserts inductor coils to electrically lengthen a compact whip.",
        "analogy": "Foxhunting is high-tech hide-and-seek in a park using a handheld Yagi beam as your compass!"
    }
}
