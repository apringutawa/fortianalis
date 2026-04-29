import google.generativeai as genai
from app.core.config import settings

def generate_security_insight(parsed_data: dict) -> dict:
    """
    Uses Gemini AI to generate a security insight based on the parsed log data.
    """
    if not settings.GEMINI_API_KEY:AIzaSyAIL_COOouJcGabvn7p03MmWfC0OGQ1Sxo
        # Fallback if API key is not configured
        return {
            "analysis": "API key Gemini tidak ditemukan. Menampilkan analisis fallback: Terdeteksi aktivitas berisiko tinggi dari beberapa IP unik.",
            "recommendation": "Silakan konfigurasikan GEMINI_API_KEY di environment untuk mengaktifkan AI."
        }
        
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare context for the AI
        stats = parsed_data['stats']
        top_attacks = ", ".join([f"{a['name']} ({a['value']})" for a in parsed_data['attackTypes'][:3]])
        top_ips = ", ".join([f"{ip['ip']} ({ip['count']} attacks)" for ip in parsed_data['attackerIPs'][:3]])
        
        prompt = f"""
        Anda adalah seorang ahli Cybersecurity. Analisis data ringkasan log WAF berikut dan berikan insight keamanan dalam Bahasa Indonesia.
        
        Data:
        - Total Requests: {stats['totalRequests']}
        - Total Attacks: {stats['totalAttacks']}
        - Blocked Attacks: {stats['blockedAttacks']}
        - Top Attack Types: {top_attacks}
        - Top Attacker IPs: {top_ips}
        
        Tolong berikan respons dalam format JSON baku dengan 2 kunci:
        1. "analysis": Paragraf singkat menganalisis pola serangan.
        2. "recommendation": Paragraf singkat berisi rekomendasi teknis untuk admin server.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Simple extraction if the model wraps it in markdown json blocks
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        import json
        result = json.loads(text)
        return {
            "analysis": result.get("analysis", "Analisis tidak tersedia."),
            "recommendation": result.get("recommendation", "Rekomendasi tidak tersedia.")
        }
        
    except Exception as e:
        return {
            "analysis": f"Gagal menghasilkan analisis dari AI: {str(e)}",
            "recommendation": "Periksa konfigurasi API key atau koneksi internet Anda."
        }
