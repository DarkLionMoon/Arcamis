#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ARCAMIS — sync-registry.py
Genera tutti gli artifact da content/pages/registry.json
"""

import json
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
REGISTRY_PATH = ROOT_DIR / 'content' / 'pages' / 'registry.json'

def load_registry():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def escape_js(s):
    return (str(s)
        .replace('\\', '\\\\')
        .replace("'", "\\'")
        .replace('"', '\\"')
        .replace('\n', '\\n')
        .replace('\r', '\\r')
        .replace('\t', '\\t'))

def write_file(rel_path, content):
    full_path = ROOT_DIR / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding='utf-8')
    print(f"✓ Generated: {rel_path}")

def generate_data_js(reg):
    pages = []
    for p in reg['pages']:
        if not p.get('menu'):
            continue
        base = f"{{k:'{p['k']}',l:'{escape_js(p['l'])}',i:'{p['i']}',id:'{p['id']}'}}"
        if p.get('sec'):
            extra = f",sec:'{p['sec']}'"
            if p.get('sub'):
                extra += f",sub:'{escape_js(p['sub'])}'"
            base = base.replace('}', extra + '}')
        pages.append(base)

    sections = [f"{{v:\"{s['v']}\",l:\"{escape_js(s['l'])}\"}}" for s in reg['sections'] if not s.get('adminOnly')]
    lavori = [f"{{ l:'{escape_js(w['l'])}', i:'{w['i']}', id:'{w['id']}' }}" for w in reg['lavori']]

    return f"""/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
   (AUTO-GENERATO da sync-registry.py — NON MODIFICARE A MANO)
════════════════════════════════════ */
var ROOT = '{reg['root']}';
var GUILD = '{reg['guild']}';

var pages = [
  {',\n  '.join(pages)}
];

function getPage(idOrK){{
  return pages.find(p => p.id === idOrK || p.k === idOrK);
}}

/* ════ SEZIONI MENU (dropdown top bar) ════ */
var SECTIONS = [
  {',\n  '.join(sections)}
];

/* ════ LAVORI ════ */
var LAVORI = [
  {',\n  '.join(lavori)}
];"""

def generate_notion_nav_parts(reg):
    slug_entries = []
    for p in reg['pages']:
        if p.get('slug'):
            slug_entries.append(f"  '{p['slug']}': '{p['id']}'")
    for ls in reg.get('legacySlugs', []):
        slug_entries.append(f"  '{ls['slug']}': '{ls['id']}'")

    layout_db_entries = []
    for p in reg['pages']:
        if p.get('layoutDb'):
            layout_db_entries.append(f"  '{p['layoutDb']}': '{p['layout']}'")
    for ld in reg.get('layoutDatabases', []):
        layout_db_entries.append(f"  '{ld['id']}': '{ld['layout']}'")

    nav_map_entries = []
    for s in reg['sections']:
        if s.get('v') and s.get('pages'):
            for page_id in s['pages']:
                nav_map_entries.append(f"  '{page_id}': '{s['v']}'")

    return slug_entries, layout_db_entries, nav_map_entries

def generate_path_map(reg):
    entries = []
    for p in reg['pages']:
        if p.get('path'):
            entries.append(f"  '{p['path']}': '{p['id']}'")
    for po in reg.get('pathOverrides', []):
        entries.append(f"  '{po['path']}': '{po['id']}'")
    return entries

def generate_index_build(reg):
    entries = []
    for p in reg['pages']:
        if p.get('index'):
            entries.append(f"  {{ id:'{p['id']}', title:'{escape_js(p['l'])}', icon:'{p['i']}' }}")

    db_entries = []
    for d in reg.get('indexDatabases', []):
        db_entries.append(f"  {{ id:'{d['id']}', label:'{escape_js(d['label'])}' }}")

    return entries, db_entries

def generate_build_index(reg):
    entries = []
    for p in reg['pages']:
        if p.get('root'):
            entries.append(f"    {{ id: '{p['id']}', title: '{escape_js(p['l'])}', icon: '{p['i']}' }}")
    return entries

def generate_export_index(reg):
    pages = []
    for p in reg['pages']:
        if p.get('export'):
            pages.append(f"  {{k:'{p['k']}',l:'{escape_js(p['l'])}',i:'{p['i']}',id:'{p['id']}'}}")
    
    dbs = []
    for d in reg.get('databases', []):
        dbs.append(f"  {{name:'{d['name']}',label:'{escape_js(d['label'])}',dbId:'{d['dbId']}'}}")
    
    return pages, dbs

def generate_admin_inline(reg):
    pages = []
    for p in reg['pages']:
        if p.get('admin'):
            obj = f"{{k:'{p['k']}',l:'{escape_js(p['l'])}',i:'{p['i']}'"
            if p.get('adminId'):
                obj += f",id:'{p['adminId']}'"
            if p.get('sec'):
                obj += f",sec:'{p['sec']}'"
                if p.get('sub'):
                    obj += f",sub:'{escape_js(p['sub'])}'"
            if p.get('c'):
                obj += f",c:{p['c']}"
            obj += '}'
            pages.append(obj)

    sections = [f'{{v:"{s["v"]}",l:"{escape_js(s["l"])}"}}' for s in reg['sections']]
    return pages, sections

def generate_sitemap(reg):
    base_url = 'https://arcamis.pages.dev'
    urls = [
        {'loc': base_url, 'changefreq': 'weekly', 'priority': '1.0'}
    ]

    for e in reg.get('sitemap', []):
        urls.append({
            'loc': f"{base_url}/{e['path']}",
            'changefreq': e.get('changefreq', 'monthly'),
            'priority': e.get('priority', '0.7')
        })

    xml_lines = [
        f'  <url><loc>{u["loc"]}</loc><changefreq>{u["changefreq"]}</changefreq><priority>{u["priority"]}</priority></url>'
        for u in urls
    ]

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(xml_lines)}
</urlset>'''

def replace_between(content, pattern, replacement):
    """Replace a block between pattern markers."""
    regex = re.compile(pattern, re.DOTALL)
    return regex.sub(replacement, content)

def main():
    reg = load_registry()

    # 1. scripts/js/data.js
    write_file('scripts/js/data.js', generate_data_js(reg))

    # 2. notion-nav.js - replace _slugMap, _LAYOUT_DB_MAP, _navMap
    notion_nav_path = SCRIPT_DIR / 'js' / 'notion-nav.js'
    notion_nav = notion_nav_path.read_text(encoding='utf-8')
    
    slug_entries, layout_db_entries, nav_map_entries = generate_notion_nav_parts(reg)
    
    notion_nav = replace_between(
        notion_nav,
        r'var _slugMap = \{[\s\S]*?\n\};',
        f"var _slugMap = {{\n{',\n'.join(slug_entries)}\n}};"
    )
    
    notion_nav = replace_between(
        notion_nav,
        r'var _LAYOUT_DB_MAP = \{[\s\S]*?\n\};',
        f"var _LAYOUT_DB_MAP = {{\n{',\n'.join(layout_db_entries)}\n}};"
    )
    
    notion_nav = replace_between(
        notion_nav,
        r'var _navMap = \{[\s\S]*?\n\};',
        f"var _navMap = {{\n{',\n'.join(nav_map_entries)}\n}};"
    )
    
    write_file('scripts/js/notion-nav.js', notion_nav)

    # 3. app.js _pathMap
    app_js_path = SCRIPT_DIR / 'js' / 'app.js'
    app_js = app_js_path.read_text(encoding='utf-8')
    app_js = replace_between(
        app_js,
        r'var _pathMap = \{[\s\S]*?\n\};',
        f"var _pathMap = {{\n{',\n'.join(generate_path_map(reg))}\n}};"
    )
    write_file('scripts/js/app.js', app_js)

    # 4. functions/api/index-build.js
    index_build_path = ROOT_DIR / 'functions' / 'api' / 'index-build.js'
    index_build = index_build_path.read_text(encoding='utf-8')
    pages_entries, db_entries = generate_index_build(reg)
    index_build = replace_between(
        index_build,
        r'const PAGES_TO_INDEX = \[[\s\S]*?\n\];',
        f"const PAGES_TO_INDEX = [\n{',\n'.join(pages_entries)}\n];"
    )
    index_build = replace_between(
        index_build,
        r'const DATABASES_TO_INDEX = \[[\s\S]*?\n\];',
        f"const DATABASES_TO_INDEX = [\n{',\n'.join(db_entries)}\n];"
    )
    write_file('functions/api/index-build.js', index_build)

    # 5. functions/api/build-index.js
    build_index_path = ROOT_DIR / 'functions' / 'api' / 'build-index.js'
    build_index = build_index_path.read_text(encoding='utf-8')
    build_index = replace_between(
        build_index,
        r'const ROOT_PAGES = \[[\s\S]*?\n\s*\];',
        f"const ROOT_PAGES = [\n{',\n'.join(generate_build_index(reg))}\n  ];"
    )
    write_file('functions/api/build-index.js', build_index)

    # 6. export/index.html
    export_path = ROOT_DIR / 'export' / 'index.html'
    export_html = export_path.read_text(encoding='utf-8')
    exp_pages, exp_dbs = generate_export_index(reg)
    export_html = replace_between(
        export_html,
        r'var PAGES = \[[\s\S]*?\n\];',
        f"var PAGES = [\n{',\n'.join(exp_pages)}\n];"
    )
    export_html = replace_between(
        export_html,
        r'var DBS = \[[\s\S]*?\n\];',
        f"var DBS = [\n{',\n'.join(exp_dbs)}\n];"
    )
    write_file('export/index.html', export_html)

    # 7. admin/index.html inline script
    admin_path = ROOT_DIR / 'admin' / 'index.html'
    admin_html = admin_path.read_text(encoding='utf-8')
    adm_pages, adm_sections = generate_admin_inline(reg)
    admin_html = replace_between(
        admin_html,
        r'var PAGES = \[[\s\S]*?\n\];',
        f"var PAGES = [\n{',\n'.join(adm_pages)}\n];"
    )
    admin_html = replace_between(
        admin_html,
        r'var SECTIONS = \[[\s\S]*?\n\];',
        f"var SECTIONS = [\n{',\n'.join(adm_sections)}\n];"
    )
    write_file('admin/index.html', admin_html)

    # 8. sitemap.xml
    write_file('sitemap.xml', generate_sitemap(reg))

    print('\n✓ All artifacts generated successfully!')

if __name__ == '__main__':
    main()