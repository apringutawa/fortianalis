"""
AI Security Insight Generator
Supports: Google Gemini (primary) | rule-based fallback (when no API key)
"""
import os
import json


def generate_security_insight(parsed_data: dict) -> dict:
    """
    Generate a security insight narrative from parsed FortiWeb log data.
    Uses Gemini if GEMINI_API_KEY is set, otherwise falls back to a
    deterministic rule-based analysis.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if api_key:
        try:
            return _gemini_insight(parsed_data, api_key)
        except Exception as exc:
            print(f"[ai] Gemini error: {exc} — falling back to rule-based")

    return _rule_based_insight(parsed_data)


# ─────────────────────────────────────────────────────────────────────────────
#  Gemini integration
# ─────────────────────────────────────────────────────────────────────────────

def _build_prompt(parsed_data: dict) -> str:
    stats       = parsed_data.get("stats", {})
    top_attacks = parsed_data.get("attackTypes", [])[:3]
    top_ips     = parsed_data.get("attackerIPs", [])[:3]
    subdomains  = parsed_data.get("subdomains", [])[:3]

    top_attack_str   = ", ".join(a["name"] for a in top_attacks) or "—"
    top_ip_str       = ", ".join(i["ip"]   for i in top_ips)     or "—"
    subdomain_str    = ", ".join(s["name"] for s in subdomains)  or "—"

    return f"""Kamu adalah seorang analis keamanan siber senior spesialis WAF (Web Application Firewall).
Berikut adalah hasil analisis log FortiWeb yang baru saja diproses:

- Total Request  : {stats.get('totalRequests', 0):,}
- Total Serangan : {stats.get('totalAttacks', 0):,}
- Berhasil Blokir: {stats.get('blockedAttacks', 0):,} ({stats.get('blockRate', 0):.1f}%)
- IP Unik        : {stats.get('uniqueIps', 0):,}
- Jenis Serangan Dominan: {top_attack_str}
- IP Penyerang Teratas  : {top_ip_str}
- Subdomain Paling Diserang: {subdomain_str}

Tulis analisis singkat dalam 2–3 kalimat Bahasa Indonesia yang jelas dan teknis,
lalu berikan 2–3 rekomendasi aksi konkret.

Balas HANYA dengan JSON dalam format ini (tanpa backtick atau penjelasan tambahan):
{{"analysis": "...", "recommendation": "..."}}"""


def _gemini_insight(parsed_data: dict, api_key: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt   = _build_prompt(parsed_data)
    response = model.generate_content(prompt)

    raw_text = response.text.strip()

    # Strip markdown fences if Gemini wraps the JSON
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    result = json.loads(raw_text)
    result["powered_by"] = "Google Gemini"
    return result


# ─────────────────────────────────────────────────────────────────────────────
#  Rule-based fallback
# ─────────────────────────────────────────────────────────────────────────────

def _rule_based_insight(parsed_data: dict) -> dict:
    stats        = parsed_data.get("stats", {})
    total_req    = stats.get("totalRequests", 0) or 1
    total_atk    = stats.get("totalAttacks",  0)
    blocked      = stats.get("blockedAttacks", 0)
    block_rate   = stats.get("blockRate", round(blocked / total_atk * 100, 1) if total_atk else 0)
    unique_ips   = stats.get("uniqueIps", 0)

    top_attacks  = parsed_data.get("attackTypes", [])
    top_ips      = parsed_data.get("attackerIPs",  [])

    attack_rate  = round(total_atk / total_req * 100, 1)

    # Top attack type label
    top_atk_name = top_attacks[0]["name"] if top_attacks else "Unknown"

    # Severity assessment
    if attack_rate >= 50:
        severity_msg = "Tingkat ancaman KRITIS"
    elif attack_rate >= 20:
        severity_msg = "Tingkat ancaman TINGGI"
    elif attack_rate >= 5:
        severity_msg = "Tingkat ancaman SEDANG"
    else:
        severity_msg = "Tingkat ancaman RENDAH"

    analysis = (
        f"{severity_msg} terdeteksi: {total_atk:,} serangan dari {total_req:,} total request "
        f"({attack_rate}% attack rate). "
        f"Serangan dominan adalah {top_atk_name} yang menyumbang "
        f"{round(top_attacks[0]['value'] / total_atk * 100) if top_attacks and total_atk else '—'}% "
        f"dari total insiden. "
        f"FortiWeb WAF berhasil memblokir {block_rate}% serangan dari {unique_ips} IP unik."
    )

    recs = [
        f"Aktifkan rate-limiting pada endpoint yang paling sering diserang.",
        f"Review dan perbarui signature WAF untuk tipe serangan {top_atk_name}.",
        f"Lakukan investigasi mendalam pada {len(top_ips)} IP teratas yang tercatat sebagai attacker.",
    ]

    if block_rate < 90:
        recs.append(
            "Tingkat blokir di bawah 90% — pertimbangkan untuk mengaktifkan mode 'Block' "
            "penuh pada policy WAF yang saat ini masih dalam mode 'Alert'."
        )

    return {
        "analysis":    analysis,
        "recommendation": " ".join(f"{i+1}) {r}" for i, r in enumerate(recs)),
        "powered_by":  "Rule-based Engine",
    }
