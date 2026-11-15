"""Deterministic builder and validator for data.js (window.HAM_DATA)."""
import json
import os
import re
import sys
from figures_svg import FIGURES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS_DIR = os.path.join(ROOT, "scripts", "data_parts")
RAW_POOL_PATH = os.path.join(ROOT, "scripts", "pool_raw.json")
OUT_DATA_JS = os.path.join(ROOT, "data.js")

SUBELEMENTS = [
    {"id": "T1", "title": "Commission's Rules", "examQuestions": 6},
    {"id": "T2", "title": "Operating Procedures", "examQuestions": 3},
    {"id": "T3", "title": "Radio Wave Propagation", "examQuestions": 3},
    {"id": "T4", "title": "Amateur Radio Practices", "examQuestions": 2},
    {"id": "T5", "title": "Electrical Principles", "examQuestions": 4},
    {"id": "T6", "title": "Electronic & Electrical Components", "examQuestions": 4},
    {"id": "T7", "title": "Practical Circuits", "examQuestions": 4},
    {"id": "T8", "title": "Signals & Emissions", "examQuestions": 4},
    {"id": "T9", "title": "Antennas & Feed Lines", "examQuestions": 2},
    {"id": "T0", "title": "Electrical & RF Safety", "examQuestions": 3},
]

CAMPAIGN = [
    {
        "chapter": 1,
        "title": "Operating Procedures",
        "subelement": "T2",
        "focus": "Calling CQ, repeaters, simplex, Q-signals, emergency operations.",
        "groups": ["T2A", "T2B", "T2C"],
        "bossAfter": None,
    },
    {
        "chapter": 2,
        "title": "Station Setup & Practices",
        "subelement": "T4",
        "focus": "Transceiver controls, microphones, digital mode hookups, interference.",
        "groups": ["T4A", "T4B"],
        "bossAfter": None,
    },
    {
        "chapter": 3,
        "title": "Electrical, Antenna & RF Safety",
        "subelement": "T0",
        "focus": "Grounding, fuses, battery safety, tower climbing, RF exposure limits.",
        "groups": ["T0A", "T0B", "T0C"],
        "bossAfter": {
            "id": "boss_1",
            "title": "Boss Checkpoint I: On-Air & Safe",
            "subtitle": "1 random question from every group unlocked so far (Chapters 1–3)",
        },
    },
    {
        "chapter": 4,
        "title": "FCC Rules I: License & Callsigns",
        "subelement": "T1",
        "focus": "Purpose of Amateur Service, license classes, callsign formats, FRN/renewal.",
        "groups": ["T1A", "T1C"],
        "bossAfter": None,
    },
    {
        "chapter": 5,
        "title": "Basic Electronics & Ohm's Law",
        "subelement": "T5",
        "focus": "Voltage, current, resistance, metric prefixes, dB, Ohm's Law & Power math puzzles.",
        "groups": ["T5A", "T5B", "T5C", "T5D"],
        "bossAfter": None,
    },
    {
        "chapter": 6,
        "title": "Electronic Components",
        "subelement": "T6",
        "focus": "Resistors, capacitors, transistors, ICs, and Figures T-1, T-2, T-3 schematics.",
        "groups": ["T6A", "T6B", "T6C", "T6D"],
        "bossAfter": {
            "id": "boss_2",
            "title": "Boss Checkpoint II: Bench & Schematics",
            "subtitle": "Mid-campaign checkpoint across all unlocked groups so far",
        },
    },
    {
        "chapter": 7,
        "title": "Practical Circuits",
        "subelement": "T7",
        "focus": "Receivers, transmitters, amplifiers, filters, power supplies, multimeters.",
        "groups": ["T7A", "T7B", "T7C", "T7D"],
        "bossAfter": None,
    },
    {
        "chapter": 8,
        "title": "Radio Wave Propagation",
        "subelement": "T3",
        "focus": "Wavelength vs. frequency, polarization, line-of-sight, ionosphere bounce.",
        "groups": ["T3A", "T3B", "T3C"],
        "bossAfter": None,
    },
    {
        "chapter": 9,
        "title": "FCC Rules II: Band Privileges",
        "subelement": "T1",
        "focus": "Authorized frequencies (paired with the Visual Band Map) & permitted transmissions.",
        "groups": ["T1B", "T1D"],
        "bossAfter": {
            "id": "boss_3",
            "title": "Boss Checkpoint III: Airwaves & Bands",
            "subtitle": "Checkpoint across all unlocked groups through Chapter 9",
        },
    },
    {
        "chapter": 10,
        "title": "Antennas & Feed Lines",
        "subelement": "T9",
        "focus": "Dipoles, verticals, Yagi beams, SWR, coax loss, and RF connectors.",
        "groups": ["T9A", "T9B"],
        "bossAfter": None,
    },
    {
        "chapter": 11,
        "title": "Signals & Modulation",
        "subelement": "T8",
        "focus": "AM/FM/SSB, bandwidth, satellites, FT8, APRS, and digital modes.",
        "groups": ["T8A", "T8B", "T8C", "T8D"],
        "bossAfter": None,
    },
    {
        "chapter": 12,
        "title": "FCC Rules III: Control & ID",
        "subelement": "T1",
        "focus": "Control operator rules, third-party traffic, station identification, records.",
        "groups": ["T1E", "T1F"],
        "bossAfter": {
            "id": "boss_4",
            "title": "Boss Checkpoint IV: Full Pool Gauntlet",
            "subtitle": "All 35 groups unlocked — prove mastery before your Final Certification!",
        },
    },
]

ERRATA_2026_02_19 = {
    "T1C01": "For which classes of amateur radio licenses does the FCC currently issue new licenses?",
    "T5A05": "A difference in which of the following causes electron flow?",
    "T7A09": "What is the function of the switch which selects either SSB or CW-FM on some VHF power amplifiers?",
    "T0A10": "What hazard exists when rapidly charging or discharging an unprotected battery?",
}

POSITIONAL_RE = re.compile(
    r"(?i)\b(all\s+(of\s+)?these\s+(choices|answers)|none\s+(of\s+)?these\s+(choices|answers)|"
    r"all\s+of\s+the\s+above|none\s+of\s+the\s+above|both\s+[abcd]\s+and\s+[abcd]|"
    r"neither\s+[abcd]\s+nor\s+[abcd]|choices?\s+[abcd]\s+and\s+[abcd])\b"
)

MATH_IDS = {
    "T3B06",
    "T5B01", "T5B02", "T5B03", "T5B04", "T5B05", "T5B06", "T5B07", "T5B08",
    "T5B09", "T5B10", "T5B11", "T5B12", "T5B13",
    "T5C08", "T5C09", "T5C10",
    "T5D01", "T5D02", "T5D03", "T5D04", "T5D05", "T5D06",
    "T5D07", "T5D08", "T5D09", "T5D10", "T5D11", "T5D12",
    "T9A08",
}


def parse_fcc_rules(refs_str: str) -> list[str]:
    if not refs_str:
        return []
    inner = refs_str.strip().strip("[]")
    if not inner:
        return []
    return [part.strip() for part in inner.split(",") if part.strip()]


def map_figure(fig_str: str) -> str | None:
    if not fig_str:
        return None
    low = fig_str.lower().strip()
    if "t-1" in low:
        return "T-1"
    if "t-2" in low:
        return "T-2"
    if "t-3" in low:
        return "T-3"
    raise ValueError(f"Unknown figure string: {fig_str!r}")


def detect_positional(choices: list[str]) -> bool:
    return any(bool(POSITIONAL_RE.search(c)) for c in choices)


def main() -> None:
    with open(RAW_POOL_PATH, encoding="utf-8") as f:
        raw_pool = json.load(f)

    explanations: dict[str, dict] = {}
    briefings: dict[str, dict] = {}

    part_files = [
        "part1_T1_T2.json",
        "part2_T3_T4_T0.json",
        "part3_T5_T6.json",
        "part4_T7_T8_T9.json",
    ]
    for pf in part_files:
        p = os.path.join(PARTS_DIR, pf)
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing study data part: {p}")
        with open(p, encoding="utf-8") as f:
            pdata = json.load(f)
        explanations.update(pdata.get("explanations", {}))
        briefings.update(pdata.get("briefings", {}))

    pool = []
    seen_ids = set()
    groups_seen = set()
    subs_seen = set()

    for item in raw_pool:
        qid = item["id"]
        assert qid not in seen_ids, f"Duplicate question ID: {qid}"
        seen_ids.add(qid)

        sub = qid[:2]
        grp = qid[:3]
        subs_seen.add(sub)
        groups_seen.add(grp)

        choices = item["answers"]
        assert len(choices) == 4, f"{qid}: expected 4 choices"
        ans = item["correct"]
        assert ans in (0, 1, 2, 3), f"{qid}: invalid answer index {ans}"

        assert qid in explanations, f"Missing explanation for {qid}"
        exp_entry = explanations[qid]
        exp_text = exp_entry.get("explanation", "").strip()
        assert len(exp_text) >= 25, f"Explanation too short for {qid}: {exp_text!r}"

        tags = list(dict.fromkeys(exp_entry.get("tags", [])))
        if qid in MATH_IDS and "math" not in tags:
            tags.insert(0, "math")
        fig = map_figure(item.get("figure", ""))
        if fig and "schematics" not in tags:
            tags.append("schematics")

        pool.append({
            "id": qid,
            "element": 2,
            "subelement": sub,
            "group": grp,
            "question": item["question"].strip(),
            "choices": [c.strip() for c in choices],
            "answer": ans,
            "has_positional_choice": detect_positional(choices),
            "fcc_rules": parse_fcc_rules(item.get("refs", "")),
            "figure": fig,
            "tags": tags,
            "explanation": exp_text,
        })

    # Validation checks per TECHNICAL_DESIGN.md Section 3.2
    assert len(pool) == 409, f"Expected 409 questions, got {len(pool)}"
    assert len(subs_seen) == 10, f"Expected 10 subelements, got {len(subs_seen)}"
    assert len(groups_seen) == 35, f"Expected 35 groups, got {len(groups_seen)}"

    # Campaign completeness check
    campaign_groups = [g for ch in CAMPAIGN for g in ch["groups"]]
    assert len(campaign_groups) == 35 and set(campaign_groups) == groups_seen, (
        "Campaign groups mismatch pool groups!"
    )

    # Errata verification
    by_id = {q["id"]: q for q in pool}
    for eid, expected_stem in ERRATA_2026_02_19.items():
        actual = by_id[eid]["question"]
        assert actual == expected_stem, (
            f"Errata mismatch for {eid}:\n  expected: {expected_stem}\n  actual:   {actual}"
        )

    # Briefings verification
    assert set(briefings.keys()) == groups_seen, (
        f"Briefings keys mismatch: missing={groups_seen - set(briefings.keys())}"
    )
    for g, b in briefings.items():
        cards = b.get("cards", [])
        assert 2 <= len(cards) <= 4, f"Briefing {g} should have 2-4 cards, got {len(cards)}"
        assert b.get("title"), f"Briefing {g} missing title"

    # Figures verification
    assert set(FIGURES.keys()) == {"T-1", "T-2", "T-3"}
    fig_qs = [q for q in pool if q["figure"] is not None]
    assert len(fig_qs) == 12, f"Expected 12 figure questions, got {len(fig_qs)}"

    ham_data = {
        "meta": {
            "element": 2,
            "licenseClass": "Technician",
            "poolCycle": "2026-2030",
            "effective": "2026-07-01 to 2030-06-30",
            "errataDate": "2026-02-19",
            "totalQuestions": len(pool),
            "totalGroups": len(groups_seen),
        },
        "subelements": SUBELEMENTS,
        "campaign": CAMPAIGN,
        "briefings": briefings,
        "figures": FIGURES,
        "pool": pool,
    }

    js_payload = (
        "// Auto-generated by scripts/build_data.py — 2026-2030 NCVEC Technician Pool (Feb 19, 2026 Errata)\n"
        "window.HAM_DATA = "
        + json.dumps(ham_data, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    with open(OUT_DATA_JS, "w", encoding="utf-8") as f:
        f.write(js_payload)

    size_kb = os.path.getsize(OUT_DATA_JS) / 1024
    pos_count = sum(1 for q in pool if q["has_positional_choice"])
    math_count = sum(1 for q in pool if "math" in q["tags"])
    print(
        f"SUCCESS: Generated data.js ({size_kb:.1f} KB) | "
        f"{len(pool)} questions | {len(briefings)} briefings | "
        f"{pos_count} positional-guarded | {math_count} math-tagged | {len(fig_qs)} figure-linked."
    )


if __name__ == "__main__":
    main()
