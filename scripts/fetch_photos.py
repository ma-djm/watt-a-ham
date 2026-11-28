"""Deterministic fetcher, license verifier, and .NET JPEG optimizer for 32 Wikimedia Commons equipment photos."""
import concurrent.futures
import html
import json
import os
import re
import subprocess
import tempfile
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "photos")
OUT_META_PY = os.path.join(ROOT, "scripts", "photos_data.py")

ALLOWED_LICENSE_RE = re.compile(
    r"^(Public domain|PD|CC[- ]?0|CC0|CC BY([- ]SA)?( \d\.\d)?( [a-z]{2,3})?)$",
    re.IGNORECASE,
)

# (slug, commons_file_title, display_title, educational_caption)
PHOTO_SPECS = [
    (
        "handheld-ht",
        "File:Baofeng UV-5R transceiver.jpg",
        "Dual-Band Handheld Transceiver (HT)",
        "Palm-sized VHF/UHF handheld showing the flexible 'rubber-duck' whip antenna, dual-frequency LCD, keypad, and side PTT area.",
    ),
    (
        "desktop-transceiver",
        "File:IC-7300.jpg",
        "HF/VHF Base Station Transceiver",
        "Modern desktop rig featuring a large smooth VFO tuning dial, live spectrum/waterfall screen, S-meter, and front filter controls.",
    ),
    (
        "mobile-rig-mic",
        "File:IC-2100.jpg",
        "Compact VHF Mobile Transceiver",
        "Rugged 2-meter FM mobile rig built for 13.8V vehicle or desk mounting alongside a modular hand-microphone jack.",
    ),
    (
        "amateur-shack",
        "File:ICOM IC-2340H hamradio station.jpg",
        "Complete Amateur Radio 'Shack'",
        "A typical hobbyist operating desk combining desktop HF/VHF transceivers, a portable HT, and station accessories.",
    ),
    (
        "cw-iambic-paddles",
        "File:Bencher BY-1 Iambic Paddle.JPG",
        "Morse Code (CW) Iambic Paddles",
        "Dual finger paddles that wire to an electronic keyer—squeezing left and right levers sends crisp, evenly timed dots and dashes.",
    ),
    (
        "mmdvm-hotspot",
        "File:一种单工mmdvm盒子的内部结构.jpg",
        "Pocket MMDVM Digital Voice Hotspot",
        "Low-power RF transceiver hat mounted on a compact single-board computer to bridge DMR or D-STAR handhelds over Wi-Fi.",
    ),
    (
        "rf-power-amplifier",
        "File:RM Italy KL-203 linear amplifier front.jpeg",
        "External RF Linear Power Amplifier",
        "Compact solid-state RF amplifier—note the front mode switch (AM/CW-FM vs. SSB) that adjusts timing delay for voice crests.",
    ),
    (
        "ft8-waterfall",
        "File:Waterfall-diagram-ft87 WSJT-X Denis apel.jpg",
        "WSJT-X FT8 Weak-Signal Waterfall",
        "Each narrow vertical streak is a separate station transmitting 15-second FT8 digital bursts inside a single 3 kHz audio slice.",
    ),
    (
        "swr-wattmeter",
        "File:SWR & power meter front view.jpg",
        "Inline Directional SWR & Wattmeter",
        "Wired inline in the coax between rig and antenna to read forward RF wattage and reflected Standing Wave Ratio (SWR).",
    ),
    (
        "dummy-load",
        "File:Dummy Load.jpg",
        "50-Ohm Finned RF Dummy Load",
        "A shielded 50-ohm non-inductive resistor surrounded by cooling fins so you can test transmitters off-air without radiating.",
    ),
    (
        "antenna-analyzer",
        "File:NanoVNA.jpg",
        "Handheld Antenna & SWR Analyzer",
        "Hooks straight to your antenna feed line (no radio needed) and sweeps milliwatt signals to graph resonant frequency and SWR.",
    ),
    (
        "bench-power-supply",
        "File:Netzgeraet.jpg",
        "Regulated DC Bench Power Supply",
        "Converts household AC wall power into rock-steady DC voltage with live Voltage (V) and Current (A) meters.",
    ),
    (
        "ferrite-choke",
        "File:A collection of Snap-On - Clamp-on ferrite beads.jpg",
        "Snap-On Ferrite Bead RF Chokes",
        "Split iron-oxide cylinders that clip around mic cords, USB leads, or power wires to block stray RF feedback currents.",
    ),
    (
        "digital-multimeter",
        "File:2017 Cyfrowy miernik uniwersalny.jpg",
        "Handheld Digital Multimeter (DMM)",
        "3-in-1 diagnostic meter: measure Voltage in parallel, Current in series, and Resistance (Ω) only with circuit power OFF.",
    ),
    (
        "solder-joint",
        "File:Cold solder joint2.jpg",
        "Rough, Cracked 'Cold' Solder Joint",
        "Notice the dull, grainy, fractured ring around the component pin—caused by insufficient iron heat or moving the lead as it cooled.",
    ),
    (
        "antenna-tuner",
        "File:Kenwood AT-230 antenna-tuner-inside.jpg",
        "Inside an LC Antenna Tuner (Coupler)",
        "Open chassis showing the adjustable air-variable capacitors and heavy wire inductor coil—matching Figure T-3 in real hardware!",
    ),
    (
        "resistors-potentiometer",
        "File:Electronic-Component-Potentiometer.jpg",
        "Rotary Potentiometer (Variable Resistor)",
        "Three-lug adjustable resistor whose rotating shaft slides an internal wiper—used for volume and squelch knobs.",
    ),
    (
        "capacitors-assorted",
        "File:Capacitors_(7189597135).jpg",
        "Assorted Electrolytic, Film & Ceramic Capacitors",
        "Capacitors store energy in an electric field across insulated plates—large cylindrical cans filter DC power supplies.",
    ),
    (
        "inductors-coils",
        "File:Toroidal inductor.jpg",
        "Copper-Wound Toroidal Inductor Coil",
        "Insulated copper wire wrapped around a magnetic ferrite ring to store energy in a magnetic field and block high-frequency AC.",
    ),
    (
        "diodes-leds",
        "File:Diode 1N4007.jpg",
        "1N4007 Rectifier Diode (Cathode Stripe)",
        "One-way semiconductor valve: current enters the unstriped Anode and exits the silver-striped Cathode end.",
    ),
    (
        "transistors-packages",
        "File:Transistorer (cropped).jpg",
        "Discrete BJT & FET Transistor Packages",
        "From heavy metal-can and tab-mounted RF/power transistors (top) down to tiny 3-pin small-signal and surface-mount switches.",
    ),
    (
        "relay-contacts",
        "File:Delta Electronics DPS-350FB A - board 1 - OEG SDT-SS-112M - case removed-3045.jpg",
        "Electromechanical Relay (Cover Removed)",
        "Energizing the copper electromagnet coil (left) magnetically pulls the spring-loaded metal contacts (right) open or closed.",
    ),
    (
        "integrated-circuit",
        "File:NE555 DIP & SOIC.jpg",
        "Integrated Circuit (IC) Microchips",
        "Dozens to millions of transistors, diodes, and resistors etched onto one silicon chip in through-hole (DIP) and surface-mount packages.",
    ),
    (
        "blade-cartridge-fuses",
        "File:Electrical fuses, plug-in type, different sizes.jpeg",
        "Automotive Blade Overcurrent Fuses",
        "Wired in series with hot DC power leads—the calibrated U-shaped metal element inside melts open before overloaded wires catch fire.",
    ),
    (
        "coax-cutaway",
        "File:RG-59.jpg",
        "Coaxial Cable Cutaway (4 Layers)",
        "Outer UV-resistant jacket (A), woven copper shield braid (B), white insulating dielectric (C), and solid copper center conductor (D).",
    ),
    (
        "pl259-connector",
        "File:UHF PL Connector.jpg",
        "PL-259 ('UHF') Coaxial Connector",
        "Threaded outer coupling ring and thick center pin—the universal screw-on RF plug on HF and VHF ham rigs and SWR meters.",
    ),
    (
        "type-n-connector",
        "File:Male type N connector.jpg",
        "Weatherproof 50-Ohm Type N Connector",
        "Precision constant-impedance RF connector with internal weather gasket—preferred over PL-259 for low loss above 400 MHz.",
    ),
    (
        "yagi-antenna",
        "File:Antenne-IMG 1963.JPG",
        "Multi-Element Directional Yagi-Uda Beams",
        "Parallel metal rods along a boom (reflector, driven element, directors) focus radio energy into one high-gain beam.",
    ),
    (
        "mobile-loading-whip",
        "File:Small antenna loading coil.jpg",
        "Mobile Whip Antenna with Loading Coil",
        "A wound inductor coil midway up the steel whip electrically lengthens a compact vehicle antenna to reach resonance.",
    ),
    (
        "repeater-tower",
        "File:Antenas direccionales.jpg",
        "Lattice Antenna Tower & Mast Array",
        "Elevated tower lifting VHF/UHF antennas clear of trees and rooftops—always keep towers well clear of power lines and fall zones.",
    ),
    (
        "ground-clamp-turnbuckle",
        "File:Turnbuckles.jpg",
        "Threaded Guy-Wire Turnbuckles",
        "Used to tension tower guy wires—on an antenna tower, loop safety wire through the body and eyes so wind vibration cannot unwind them.",
    ),
    (
        "battery-12v",
        "File:12V VRLA Gel Battery.jpg",
        "12-Volt Sealed Lead-Acid Storage Battery",
        "Portable 12V deep-cycle radio battery rated in Ampere-hours (Ah)—always fuse both leads and never short the terminals!",
    ),
]


def clean_text(raw: str) -> str:
    txt = html.unescape(re.sub(r"<[^>]+>", " ", raw or ""))
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def fetch_metadata_batch(titles: list[str]) -> dict[str, dict]:
    out = {}
    for i in range(0, len(titles), 10):
        chunk = titles[i : i + 10]
        params = urllib.parse.urlencode({
            "action": "query",
            "titles": "|".join(chunk),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size|mime",
            "iiurlwidth": "960",
            "format": "json",
        })
        url = f"https://commons.wikimedia.org/w/api.php?{params}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "WattAHamPhotoBuilder/1.0 (https://github.com/ma-djm/watt-a-ham)"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
        norm_map = {n["to"]: n["from"] for n in data.get("query", {}).get("normalized", [])}
        for page in data.get("query", {}).get("pages", {}).values():
            ptitle = page["title"]
            orig_key = norm_map.get(ptitle, ptitle)
            ii = (page.get("imageinfo") or [None])[0]
            if not ii:
                raise RuntimeError(f"Missing imageinfo on Commons for {orig_key} ({ptitle})")
            out[orig_key] = {"canonical_title": ptitle, "ii": ii}
    return out


def download_raw(task):
    slug, download_url, raw_dest = task
    req = urllib.request.Request(
        download_url,
        headers={"User-Agent": "WattAHamPhotoBuilder/1.0 (https://github.com/ma-djm/watt-a-ham)"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        blob = resp.read()
    with open(raw_dest, "wb") as f:
        f.write(blob)
    return slug, len(blob)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    titles = [spec[1] for spec in PHOTO_SPECS]
    meta_by_title = fetch_metadata_batch(titles)

    with tempfile.TemporaryDirectory() as tmpdir:
        dl_tasks = []
        records = []
        for slug, ftitle, disp_title, caption in PHOTO_SPECS:
            info = meta_by_title[ftitle]
            ii = info["ii"]
            ext = ii.get("extmetadata", {})
            lic = clean_text(ext.get("LicenseShortName", {}).get("value", ""))
            if not ALLOWED_LICENSE_RE.match(lic):
                raise ValueError(f"Disallowed license for {ftitle}: {lic!r}")
            if lic.lower() in ("pd", "public domain"):
                lic = "Public Domain"

            artist = clean_text(ext.get("Artist", {}).get("value", ""))
            artist = re.sub(r"\(?\btalk\b\)?", "", artist, flags=re.IGNORECASE)
            artist = re.sub(r"\s+", " ", artist).strip(" -·,;") or "Wikimedia Commons"
            if len(artist) > 58:
                artist = artist[:55].rstrip() + "..."

            dl_url = ii.get("thumburl") or ii.get("url")
            raw_path = os.path.join(tmpdir, f"{slug}.raw")
            out_path = os.path.join(OUT_DIR, f"{slug}.jpg")
            dl_tasks.append((slug, dl_url, raw_path))
            source_url = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(
                info["canonical_title"].replace(" ", "_"), safe=":/()_-.,"
            )
            records.append({
                "slug": slug,
                "raw_path": raw_path,
                "out_path": out_path,
                "title": disp_title,
                "caption": caption,
                "credit": artist,
                "license": lic,
                "sourceUrl": source_url,
            })

        print(f"Downloading {len(dl_tasks)} Wikimedia thumbnails...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(download_raw, dl_tasks))

        # Resize & compress all 32 images via .NET System.Drawing (max 680x510, JPEG quality 76, dark matte for PNG alpha)
        manifest_json = os.path.join(tmpdir, "jobs.json")
        dims_json = os.path.join(tmpdir, "dims.json")
        with open(manifest_json, "w", encoding="utf-8") as f:
            json.dump(
                [{"slug": r["slug"], "in": r["raw_path"], "out": r["out_path"]} for r in records],
                f,
            )

        ps_script = os.path.join(tmpdir, "resize.ps1")
        with open(ps_script, "w", encoding="utf-8") as f:
            f.write(
                """
param([string]$JobsPath, [string]$OutDimsPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$jobs = Get-Content -Raw -Encoding UTF8 $JobsPath | ConvertFrom-Json
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 76L)
$result = @{}

foreach ($j in $jobs) {
  $src = [System.Drawing.Image]::FromFile($j.in)
  try {
    $maxW = 680.0
    $maxH = 510.0
    $scale = [Math]::Min(1.0, [Math]::Min($maxW / $src.Width, $maxH / $src.Height))
    $nw = [Math]::Max(1, [int][Math]::Round($src.Width * $scale))
    $nh = [Math]::Max(1, [int][Math]::Round($src.Height * $scale))
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.Clear([System.Drawing.Color]::FromArgb(15, 23, 42))
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.DrawImage($src, 0, 0, $nw, $nh)
    } finally {
      $g.Dispose()
    }
    if (Test-Path $j.out) { Remove-Item -Force $j.out }
    $bmp.Save($j.out, $jpegCodec, $encParams)
    $bmp.Dispose()
    $result[$j.slug] = @{ w = $nw; h = $nh }
  } finally {
    $src.Dispose()
  }
}
$result | ConvertTo-Json -Compress | Set-Content -Encoding UTF8 $OutDimsPath
"""
            )

        subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_script, manifest_json, dims_json],
            check=True,
        )
        with open(dims_json, encoding="utf-8-sig") as f:
            dims = json.load(f)

    photos_dict = {}
    total_bytes = 0
    for r in records:
        slug = r["slug"]
        sz = os.path.getsize(r["out_path"])
        total_bytes += sz
        d = dims[slug]
        photos_dict[slug] = {
            "src": f"./assets/photos/{slug}.jpg",
            "width": int(d["w"]),
            "height": int(d["h"]),
            "title": r["title"],
            "caption": r["caption"],
            "credit": r["credit"],
            "license": r["license"],
            "sourceUrl": r["sourceUrl"],
        }

    py_out = (
        '"""Auto-generated metadata & attribution registry for bundled Wikimedia Commons equipment photos."""\n\n'
        "PHOTOS = "
        + json.dumps(photos_dict, ensure_ascii=False, indent=4)
        + "\n"
    )
    with open(OUT_META_PY, "w", encoding="utf-8") as f:
        f.write(py_out)

    print(f"SUCCESS: Wrote {len(photos_dict)} optimized photos ({total_bytes / 1024:.1f} KB total) + scripts/photos_data.py")


if __name__ == "__main__":
    main()
