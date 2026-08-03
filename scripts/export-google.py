#!/usr/bin/env python3
"""
Arcamis Wiki — Export da Google Sheets/Docs
Scarica CSV da Google Sheets e HTML da Google Docs, li converte in JSON.
Uso: python3 scripts/export-google.py

Nessuna API key richiesta — usa gli URL pubblici di export.
"""

import json
import csv
import io
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / 'content'

# ═══════════════════════════════════════
# MESTIERI (Google Sheets CSV)
# ═══════════════════════════════════════

MESTIERI = {
    'alchimista': {
        'nome': 'Alchimista', 'emoji': '⚗️',
        'sheetId': '1uhrl26JgLv3pkqkqUwJITeVRC66sDsEn_7iRna9bk4Q',
        'colore': 'rgba(80,180,160,.8)',
    },
    'architetto': {
        'nome': 'Architetto', 'emoji': '🏛️',
        'sheetId': '1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps',
        'colore': 'rgba(190,140,60,.8)',
    },
    'artigiano': {
        'nome': 'Artigiano', 'emoji': '🔨',
        'sheetId': '1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss',
        'colore': 'rgba(180,110,40,.8)',
    },
    'artista': {
        'nome': 'Artista', 'emoji': '🎨',
        'sheetId': '14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4',
        'colore': 'rgba(240,100,160,.8)',
        'extra': ['Pergamene'],
    },
    'falegname': {
        'nome': 'Falegname', 'emoji': '🪚',
        'sheetId': '1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo',
        'colore': 'rgba(160,100,50,.8)',
    },
    'metallurgo': {
        'nome': 'Metallurgo', 'emoji': '⚒️',
        'sheetId': '193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc',
        'colore': 'rgba(160,160,180,.8)',
    },
    'oste': {
        'nome': 'Oste', 'emoji': '🍺',
        'sheetId': '1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM',
        'colore': 'rgba(200,140,40,.8)',
    },
    'sarto': {
        'nome': 'Sarto', 'emoji': '🧵',
        'sheetId': '1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU',
        'colore': 'rgba(180,80,220,.8)',
    },
}

# Google Doc IDs
GOOGLE_DOCS = {
    'come-funzionano': {
        'docId': '1alXhUBS7xRFduBjlN6fwuilIgQDznsOehe4nTiCsIK0',
        'title': 'Come Funzionano i Mestieri',
    },
    'codice-giuridico': {
        'docId': '1vht_pvOzfvNDLaibetb3bdXOxWwYCugq_Km_s9xmmAQ',
        'title': 'Pubblico Editto del Regno di Arcadia',
    },
    'patenti': {
        'docId': '1VHhDaYADbsVu9yq00ESBcVzat2kqWa3NMkPV1tb_ccc',
        'title': 'Patenti di Arcadia',
    },
}

# Reputazioni (Google Sheets CSV)
REPUTATION_SHEET = {
    'sheetId': '1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M',
    'gid': '1406195911',
}


def fetch_url(url, timeout=30):
    """Fetch URL content."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; ArcamisWiki/2.0)'
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f'    ⚠ Errore fetch: {e}')
        return None


def fetch_csv(sheet_id, gid=None):
    """Fetch CSV from Google Sheets."""
    url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv'
    if gid:
        url += f'&gid={gid}'
    return fetch_url(url)


def fetch_doc_html(doc_id):
    """Fetch HTML from Google Docs."""
    url = f'https://docs.google.com/document/d/{doc_id}/export?format=html'
    return fetch_url(url)


def parse_csv_rows(text):
    """Parse CSV text into list of rows."""
    reader = csv.reader(io.StringIO(text))
    return [row for row in reader]


def discover_sheet_tabs(sheet_id):
    """Try to discover available tabs (LV 1-5)."""
    tabs = ['Introduzione']
    for lv in range(1, 6):
        csv_data = fetch_csv(sheet_id, f'LV {lv}')
        if csv_data:
            rows = parse_csv_rows(csv_data)
            # Check if there's actual data (not just headers)
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            if data_rows:
                tabs.append(f'LV {lv}')
    return tabs


def export_mestiere(key, info):
    """Export a single mestiere from Google Sheets to JSON."""
    print(f'  → {info["nome"]}...')

    result = {
        'nome': info['nome'],
        'emoji': info['emoji'],
        'colore': info['colore'],
        'tabs': {}
    }

    # Discover available tabs
    tabs = discover_sheet_tabs(info['sheetId'])
    print(f'    Tab trovate: {", ".join(tabs)}')

    for tab in tabs:
        csv_data = fetch_csv(info['sheetId'], tab)
        if csv_data:
            rows = parse_csv_rows(csv_data)
            result['tabs'][tab] = rows

    return result


def export_come_funzionano():
    """Export Come Funzionano i Mestieri from Google Doc."""
    info = GOOGLE_DOCS['come-funzionano']
    print(f'  → {info["title"]}...')
    html = fetch_doc_html(info['docId'])
    if html:
        return {'title': info['title'], 'html': html}
    return None


def export_codice_giuridico():
    """Export Codice Giuridico from Google Doc."""
    info = GOOGLE_DOCS['codice-giuridico']
    print(f'  → {info["title"]}...')
    html = fetch_doc_html(info['docId'])
    if html:
        return {'title': info['title'], 'html': html}
    return None


def export_patenti():
    """Export Patenti di Arcadia from Google Doc."""
    info = GOOGLE_DOCS['patenti']
    print(f'  → {info["title"]}...')
    html = fetch_doc_html(info['docId'])
    if html:
        return {'title': info['title'], 'html': html}
    return None


def export_reputation():
    """Export reputation table from Google Sheets."""
    print(f'  → Reputazioni...')
    csv_data = fetch_csv(REPUTATION_SHEET['sheetId'], REPUTATION_SHEET['gid'])
    if csv_data:
        rows = parse_csv_rows(csv_data)
        return {'csv': csv_data, 'rows': rows}
    return None


def main():
    print('═══ Arcamis Wiki — Export da Google ═══\n')

    # 1. Export Mestieri
    print('⚒️ Esportazione mestieri...')
    mestieri_dir = CONTENT_DIR / 'mestieri'
    mestieri_dir.mkdir(parents=True, exist_ok=True)

    for key, info in MESTIERI.items():
        data = export_mestiere(key, info)
        if data:
            out_file = mestieri_dir / f'{key}.json'
            out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'    ✓ {info["nome"]} → {len(data.get("tabs", {}))} tab')

    print()

    # 2. Export Google Docs
    print('📝 Esportazione documenti...')
    static_dir = CONTENT_DIR / 'static'
    static_dir.mkdir(parents=True, exist_ok=True)

    # Come Funzionano
    data = export_come_funzionano()
    if data:
        out_file = static_dir / 'come-funzionano.html'
        out_file.write_text(data['html'], encoding='utf-8')
        print(f'    ✓ Come Funzionano i Mestieri')

    # Codice Giuridico
    data = export_codice_giuridico()
    if data:
        out_file = static_dir / 'codice-giuridico.html'
        out_file.write_text(data['html'], encoding='utf-8')
        print(f'    ✓ Pubblico Editto')

    # Patenti
    data = export_patenti()
    if data:
        out_file = static_dir / 'patenti.html'
        out_file.write_text(data['html'], encoding='utf-8')
        print(f'    ✓ Patenti di Arcadia')

    print()

    # 3. Export Reputazioni
    print('🗺️ Esportazione reputazioni...')
    data = export_reputation()
    if data:
        out_file = static_dir / 'reputation.json'
        out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'    ✓ Reputazioni')

    print('\n═══ Export completata! ═══')
    print(f'   Mestieri: {mestieri_dir}')
    print(f'   Statici: {static_dir}')
    print('\n   Ora puoi eseguire: python3 scripts/build.py')


if __name__ == '__main__':
    main()
