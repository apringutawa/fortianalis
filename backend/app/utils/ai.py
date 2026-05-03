"""
AI Security Insight Generator
Supports: Google Gemini (primary) | rule-based fallback (when no API key)
"""
import os
import json


def generate_report_narrative(parsed_data: dict, ai_insight: dict) -> dict:
    """
    Generate comprehensive AI narratives for report sections:
    - Executive Summary (2-3 paragraphs overview)
    - Data explanations for each section
    - Detailed conclusions
    - Actionable recommendations

    Uses Gemini if GEMINI_API_KEY is set, otherwise falls back to rule-based.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if api_key:
        try:
            return _gemini_narrative(parsed_data, ai_insight, api_key)
        except Exception as exc:
            print(f"[ai] Gemini narrative error: {exc} — falling back to rule-based")

    return _rule_based_narrative(parsed_data, ai_insight)


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


# ─────────────────────────────────────────────────────────────────────────────
#  Report Narrative Generation (for comprehensive reports)
# ─────────────────────────────────────────────────────────────────────────────

def _build_narrative_prompt(parsed_data: dict, ai_insight: dict) -> str:
    stats = parsed_data.get("stats", {})
    attack_types = parsed_data.get("attackTypes", [])[:5]
    attacker_ips = parsed_data.get("attackerIPs", [])[:5]
    subdomains = parsed_data.get("subdomains", [])[:5]
    timeline = parsed_data.get("timelineData", [])

    attack_types_str = ", ".join(f"{a['name']} ({a['value']})" for a in attack_types) or "—"
    top_ips_str = ", ".join(f"{i['ip']} ({i['count']} attacks)" for i in attacker_ips) or "—"
    subdomain_str = ", ".join(f"{s['name']} ({s['attacks']} attacks)" for s in subdomains) or "—"

    return f"""Kamu adalah seorang analis keamanan siber senior spesialis WAF (Web Application Firewall).
Buatlah narasi laporan keamanan yang komprehensif dan profesional dalam Bahasa Indonesia berdasarkan data berikut:

STATISTIK KESELURUHAN:
- Total Request: {stats.get('totalRequests', 0):,}
- Total Serangan: {stats.get('totalAttacks', 0):,}
- Berhasil Diblokir: {stats.get('blockedAttacks', 0):,} ({stats.get('blockRate', 0):.1f}%)
- IP Unik Penyerang: {stats.get('uniqueIps', 0):,}

JENIS SERANGAN TERATAS:
{attack_types_str}

IP PENYERANG TERATAS:
{top_ips_str}

SUBDOMAIN YANG DISERANG:
{subdomain_str}

ANALISIS AWAL:
{ai_insight.get('analysis', '')}

REKOMENDASI AWAL:
{ai_insight.get('recommendation', '')}

Buatlah narasi untuk bagian-bagian berikut dalam format JSON:

1. executive_summary: Ringkasan eksekutif 2-3 paragraf yang menjelaskan kondisi keamanan secara keseluruhan, temuan utama, dan tingkat risiko.

2. statistics_narrative: Penjelasan 1-2 paragraf tentang statistik keseluruhan dan apa artinya bagi postur keamanan organisasi.

3. attack_types_narrative: Penjelasan 1-2 paragraf tentang jenis-jenis serangan yang terdeteksi, pola serangan, dan implikasinya.

4. timeline_narrative: Penjelasan 1-2 paragraf tentang pola serangan dari waktu ke waktu, jam-jam puncak serangan, dan tren yang terlihat.

5. subdomain_narrative: Penjelasan 1-2 paragraf tentang subdomain/layanan yang menjadi target, mengapa mereka menjadi target, dan tingkat risiko masing-masing.

6. attacker_narrative: Penjelasan 1-2 paragraf tentang profil penyerang, asal negara, pola serangan, dan tingkat ancaman yang mereka timbulkan.

7. conclusion: Kesimpulan komprehensif 2-3 paragraf yang merangkum temuan, menilai tingkat risiko keseluruhan, dan menyoroti area prioritas.

8. recommendations: Rekomendasi detail dan actionable dalam bentuk list (minimal 5 poin), mencakup tindakan jangka pendek dan jangka panjang.

Balas HANYA dengan JSON dalam format ini (tanpa backtick atau penjelasan tambahan):
{{
  "executive_summary": "...",
  "statistics_narrative": "...",
  "attack_types_narrative": "...",
  "timeline_narrative": "...",
  "subdomain_narrative": "...",
  "attacker_narrative": "...",
  "conclusion": "...",
  "recommendations": ["...", "...", "..."]
}}"""


def _gemini_narrative(parsed_data: dict, ai_insight: dict, api_key: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = _build_narrative_prompt(parsed_data, ai_insight)
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


def _rule_based_narrative(parsed_data: dict, ai_insight: dict) -> dict:
    stats = parsed_data.get("stats", {})
    total_req = stats.get("totalRequests", 0) or 1
    total_atk = stats.get("totalAttacks", 0)
    blocked = stats.get("blockedAttacks", 0)
    block_rate = stats.get("blockRate", 0)
    unique_ips = stats.get("uniqueIps", 0)

    attack_types = parsed_data.get("attackTypes", [])
    attacker_ips = parsed_data.get("attackerIPs", [])
    subdomains = parsed_data.get("subdomains", [])

    attack_rate = round(total_atk / total_req * 100, 1)
    top_attack = attack_types[0]["name"] if attack_types else "Unknown"

    # Executive Summary
    if attack_rate >= 50:
        severity = "KRITIS"
        risk_desc = "sangat tinggi dan memerlukan tindakan segera"
    elif attack_rate >= 20:
        severity = "TINGGI"
        risk_desc = "tinggi dan memerlukan perhatian prioritas"
    elif attack_rate >= 5:
        severity = "SEDANG"
        risk_desc = "sedang dan perlu monitoring ketat"
    else:
        severity = "RENDAH"
        risk_desc = "rendah namun tetap memerlukan kewaspadaan"

    executive_summary = f"""Laporan ini menyajikan analisis komprehensif terhadap {total_req:,} request yang diproses oleh FortiWeb WAF. Dari total tersebut, terdeteksi {total_atk:,} upaya serangan ({attack_rate}% attack rate), dengan tingkat ancaman dikategorikan sebagai {severity}. FortiWeb berhasil memblokir {blocked:,} serangan ({block_rate}% block rate), menunjukkan efektivitas pertahanan yang {'baik' if block_rate >= 90 else 'perlu ditingkatkan'}.

Serangan berasal dari {unique_ips:,} alamat IP unik, dengan jenis serangan dominan adalah {top_attack}. Analisis menunjukkan bahwa tingkat risiko keamanan saat ini adalah {risk_desc}. {'Sistem pertahanan WAF berfungsi dengan baik dan mampu menangkal mayoritas ancaman.' if block_rate >= 90 else 'Terdapat celah dalam pertahanan yang memungkinkan beberapa serangan lolos dari deteksi.'}

Laporan ini memberikan insight mendalam tentang pola serangan, target yang diserang, profil penyerang, serta rekomendasi tindakan untuk meningkatkan postur keamanan organisasi."""

    # Statistics Narrative
    statistics_narrative = f"""Dari {total_req:,} total request yang dianalisis, sistem mendeteksi {total_atk:,} upaya serangan, menghasilkan attack rate sebesar {attack_rate}%. Angka ini menunjukkan bahwa {'hampir setiap request kedua merupakan serangan' if attack_rate >= 50 else 'sebagian besar traffic adalah legitimate' if attack_rate < 10 else 'terdapat aktivitas mencurigakan yang signifikan'}. FortiWeb WAF berhasil memblokir {blocked:,} serangan dengan block rate {block_rate}%, {'yang merupakan indikator positif dari efektivitas konfigurasi WAF' if block_rate >= 90 else 'yang menunjukkan perlunya optimasi rule dan policy WAF'}.

Serangan berasal dari {unique_ips:,} alamat IP unik, menunjukkan {'serangan terdistribusi dari berbagai sumber' if unique_ips > 50 else 'serangan terkonsentrasi dari sejumlah kecil sumber'}. Hal ini {'mengindikasikan kemungkinan serangan terkoordinasi atau botnet' if unique_ips > 100 else 'memudahkan identifikasi dan blocking pada level firewall'}."""

    # Attack Types Narrative
    top_3_attacks = attack_types[:3]
    attack_list = ", ".join(f"{a['name']} ({a['value']} serangan)" for a in top_3_attacks)
    attack_types_narrative = f"""Analisis jenis serangan menunjukkan bahwa {top_attack} merupakan ancaman dominan dengan {attack_types[0]['value'] if attack_types else 0} insiden tercatat. Jenis serangan lain yang signifikan meliputi {attack_list}. Pola ini {'konsisten dengan tren serangan global terhadap aplikasi web' if top_attack in ['SQLi', 'XSS', 'Path Traversal'] else 'menunjukkan karakteristik serangan yang spesifik terhadap infrastruktur target'}.

Dominasi serangan {top_attack} mengindikasikan bahwa penyerang mencoba {'mengeksploitasi kelemahan pada input validation dan database query' if 'SQL' in top_attack else 'memanfaatkan celah pada aplikasi web untuk eksekusi kode berbahaya' if 'XSS' in top_attack or 'Injection' in top_attack else 'mengeksploitasi berbagai vektor serangan'}. Organisasi perlu memprioritaskan penguatan pertahanan terhadap jenis serangan ini."""

    # Timeline Narrative
    timeline_narrative = f"""Analisis timeline menunjukkan distribusi serangan sepanjang periode monitoring. Pola serangan {'menunjukkan aktivitas yang konsisten sepanjang waktu' if len(parsed_data.get('timelineData', [])) > 10 else 'terkonsentrasi pada periode tertentu'}, {'mengindikasikan serangan otomatis atau bot' if attack_rate > 20 else 'yang lebih konsisten dengan serangan manual atau targeted'}.

Pemahaman terhadap pola temporal ini penting untuk mengoptimalkan strategi pertahanan, termasuk penjadwalan maintenance, alokasi resource monitoring, dan implementasi rate limiting yang lebih efektif pada jam-jam puncak serangan."""

    # Subdomain Narrative
    top_subdomain = subdomains[0] if subdomains else {"name": "—", "attacks": 0}
    subdomain_narrative = f"""Analisis target serangan menunjukkan bahwa {top_subdomain['name']} merupakan subdomain yang paling banyak diserang dengan {top_subdomain['attacks']} serangan tercatat. {'Subdomain ini kemungkinan menjadi target karena merupakan entry point utama atau menyimpan data sensitif.' if top_subdomain['attacks'] > 100 else 'Distribusi serangan relatif merata di berbagai subdomain.'}

{'Konsentrasi serangan pada subdomain tertentu mengindikasikan reconnaissance yang telah dilakukan penyerang untuk mengidentifikasi target bernilai tinggi.' if len(subdomains) > 0 and subdomains[0]['attacks'] > 200 else 'Pola serangan menunjukkan scanning otomatis terhadap berbagai endpoint.'} Organisasi perlu memberikan perhatian khusus pada penguatan keamanan subdomain-subdomain yang menjadi target utama."""

    # Attacker Narrative
    top_attacker = attacker_ips[0] if attacker_ips else {"ip": "—", "country": "—", "count": 0}
    attacker_narrative = f"""Profil penyerang menunjukkan bahwa serangan berasal dari {unique_ips:,} alamat IP unik, dengan IP teratas {top_attacker['ip']} {'dari ' + top_attacker['country'] if top_attacker['country'] != '—' else ''} bertanggung jawab atas {top_attacker['count']} serangan. {'Distribusi geografis penyerang yang luas mengindikasikan serangan terdistribusi atau penggunaan proxy/VPN.' if unique_ips > 50 else 'Konsentrasi serangan dari sejumlah kecil IP memudahkan implementasi blocking berbasis IP.'}

{'Tingkat persistensi serangan dari IP-IP teratas menunjukkan serangan yang terkoordinasi dan bertarget.' if top_attacker['count'] > 100 else 'Pola serangan menunjukkan karakteristik scanning otomatis atau opportunistic attack.'} Rekomendasi meliputi implementasi geo-blocking untuk negara-negara sumber serangan utama dan rate limiting berbasis IP."""

    # Conclusion
    conclusion = f"""Berdasarkan analisis komprehensif terhadap log FortiWeb WAF, dapat disimpulkan bahwa organisasi menghadapi tingkat ancaman {severity} dengan {total_atk:,} upaya serangan terdeteksi dari {total_req:,} total request. FortiWeb WAF menunjukkan kinerja {'yang sangat baik' if block_rate >= 95 else 'yang baik' if block_rate >= 90 else 'yang memadai namun perlu optimasi'} dengan block rate {block_rate}%, {'berhasil menangkal mayoritas ancaman' if block_rate >= 90 else 'namun masih terdapat celah yang perlu ditutup'}.

Jenis serangan dominan adalah {top_attack}, dengan target utama pada {top_subdomain['name']}. Serangan berasal dari {unique_ips:,} IP unik, menunjukkan {'ancaman terdistribusi yang memerlukan strategi pertahanan berlapis' if unique_ips > 50 else 'ancaman terkonsentrasi yang dapat dimitigasi dengan blocking berbasis IP'}. Area prioritas yang memerlukan perhatian segera meliputi {'optimasi rule WAF, penguatan input validation, dan implementasi monitoring real-time' if block_rate < 90 else 'maintenance postur keamanan yang sudah baik dan continuous monitoring'}.

Secara keseluruhan, {'sistem pertahanan berfungsi dengan efektif namun tetap memerlukan monitoring dan improvement berkelanjutan' if block_rate >= 85 else 'terdapat kebutuhan mendesak untuk meningkatkan efektivitas pertahanan melalui optimasi konfigurasi WAF dan implementasi kontrol keamanan tambahan'}. Implementasi rekomendasi yang diberikan akan secara signifikan meningkatkan resiliensi organisasi terhadap ancaman siber."""

    # Recommendations
    recommendations = [
        f"Tingkatkan block rate WAF dari {block_rate}% menjadi minimal 95% melalui optimasi rule dan policy, terutama untuk serangan jenis {top_attack}.",
        f"Implementasikan rate limiting dan IP blocking untuk {min(10, len(attacker_ips))} IP penyerang teratas yang bertanggung jawab atas mayoritas serangan.",
        f"Lakukan security hardening pada {top_subdomain['name']} dan subdomain lain yang menjadi target utama, termasuk review konfigurasi dan patch management.",
        "Aktifkan monitoring real-time dan alerting untuk serangan dengan severity tinggi, dengan integrasi ke SIEM untuk korelasi event.",
        "Lakukan penetration testing dan vulnerability assessment secara berkala untuk mengidentifikasi dan menutup celah keamanan sebelum dieksploitasi.",
        "Implementasikan Web Application Firewall (WAF) rule tuning berdasarkan pola serangan yang teridentifikasi untuk mengurangi false positive dan meningkatkan detection rate.",
        "Pertimbangkan implementasi geo-blocking untuk negara-negara yang menjadi sumber serangan utama, dengan whitelist untuk partner bisnis yang legitimate.",
        "Tingkatkan kapasitas logging dan retention untuk mendukung forensik dan compliance requirement, minimal 90 hari retention untuk log keamanan.",
    ]

    if block_rate < 90:
        recommendations.insert(0, f"PRIORITAS TINGGI: Block rate saat ini ({block_rate}%) di bawah threshold aman. Segera review dan aktifkan mode 'Block' penuh pada policy WAF yang masih dalam mode 'Alert'.")

    return {
        "executive_summary": executive_summary,
        "statistics_narrative": statistics_narrative,
        "attack_types_narrative": attack_types_narrative,
        "timeline_narrative": timeline_narrative,
        "subdomain_narrative": subdomain_narrative,
        "attacker_narrative": attacker_narrative,
        "conclusion": conclusion,
        "recommendations": recommendations,
        "powered_by": "Rule-based Engine",
    }

