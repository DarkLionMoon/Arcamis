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
PAGES_DIR = ROOT_DIR / 'content' / 'pages'
SCHEMA_DIR = ROOT_DIR / 'content' / 'schemas'
REGISTRY_SCHEMA_PATH = SCHEMA_DIR / 'registry.schema.json'
PAGE_SCHEMA_PATH = SCHEMA_DIR / 'page.schema.json'

def load_registry():
    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_json(path, what):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ════════════════════════════════════════════════════════════════
#  VALIDAZIONE — schema JSON + integrità + link contenuti
#  (pure Python: nessuna dipendenza esterna richiesta)
# ════════════════════════════════════════════════════════════════

def schema_error(path, msg):
    return f"{path}: {msg}"

def _type_matches(node, t):
    if t == 'string':
        return isinstance(node, str)
    if t == 'boolean':
        return isinstance(node, bool)
    if t == 'integer':
        return isinstance(node, int) and not isinstance(node, bool)
    if t == 'number':
        return isinstance(node, (int, float)) and not isinstance(node, bool)
    if t == 'object':
        return isinstance(node, dict)
    if t == 'array':
        return isinstance(node, list)
    return True

def _validate_node(node, schema, path, errors):
    stype = schema.get('type')
    if isinstance(stype, list):
        if not any(_type_matches(node, t) for t in stype):
            errors.append(schema_error(path, f"atteso {stype}, trovato {type(node).__name__}"))
        return
    if stype == 'object':
        if not isinstance(node, dict):
            errors.append(schema_error(path, f"atteso oggetto, trovato {type(node).__name__}"))
            return
        for req in schema.get('required', []):
            if req not in node:
                errors.append(schema_error(path, f"campo obbligatorio mancante: '{req}'"))
        props = schema.get('properties', {})
        for key, value in node.items():
            if key in props:
                _validate_node(value, props[key], f"{path}.{key}", errors)
            elif schema.get('additionalProperties') is False:
                errors.append(schema_error(path, f"proprietà non prevista: '{key}'"))
    elif stype == 'array':
        if not isinstance(node, list):
            errors.append(schema_error(path, f"atteso array, trovato {type(node).__name__}"))
            return
        items = schema.get('items', {})
        for i, value in enumerate(node):
            _validate_node(value, items, f"{path}[{i}]", errors)
    elif stype == 'string':
        if not isinstance(node, str):
            errors.append(schema_error(path, f"attesa stringa, trovato {type(node).__name__}"))
        elif 'enum' in schema and node not in schema['enum']:
            errors.append(schema_error(path, f"valore '{node}' non tra {schema['enum']}"))
        elif 'pattern' in schema and not re.match(schema['pattern'], node):
            errors.append(schema_error(path, f"'{node}' non rispetta il pattern {schema['pattern']}"))
    elif stype == 'boolean':
        if not isinstance(node, bool):
            errors.append(schema_error(path, f"atteso boolean, trovato {type(node).__name__}"))
    elif stype == 'integer':
        if isinstance(node, bool) or not isinstance(node, int):
            errors.append(schema_error(path, f"atteso intero, trovato {type(node).__name__}"))
    elif stype == 'number':
        if isinstance(node, bool) or not isinstance(node, (int, float)):
            errors.append(schema_error(path, f"atteso numero, trovato {type(node).__name__}"))

def validate_schema(reg, errors):
    """Valida registry.json e i file pagina contro i rispettivi schemi."""
    if REGISTRY_SCHEMA_PATH.exists():
        schema = load_json(REGISTRY_SCHEMA_PATH, 'registry.schema.json')
        _validate_node(reg, schema, 'registry.json', errors)
    else:
        errors.append(f"Schema registry mancante: {REGISTRY_SCHEMA_PATH}")

    page_schema = load_json(PAGE_SCHEMA_PATH, 'page.schema.json') if PAGE_SCHEMA_PATH.exists() else None
    if page_schema is None:
        errors.append(f"Schema pagina mancante: {PAGE_SCHEMA_PATH}")
        return

    for f in sorted(PAGES_DIR.glob('*.json')):
        if f.name == 'registry.json':
            continue
        try:
            page = load_json(f, f.name)
        except json.JSONDecodeError as e:
            errors.append(schema_error(f.name, f"JSON non valido: {e}"))
            continue
        _validate_node(page, page_schema, f.name, errors)
        if page.get('k') and page['k'] + '.json' != f.name:
            errors.append(schema_error(f.name, f"la chiave 'k' ({page['k']}) non corrisponde al nome file"))

def find_dups(items, key, label):
    seen, dups = set(), set()
    for it in items:
        v = it.get(key)
        if v in seen:
            dups.add(v)
        seen.add(v)
    return dups

def validate_integrity(reg, errors, warnings):
    """Cross-reference registry: duplicati, riferimenti orfani, file mancanti/estranei."""
    pages = reg.get('pages', [])
    ids = {p['id'] for p in pages}
    keys = {p['k'] for p in pages}

    for v in find_dups(pages, 'k', 'chiave "k"'):
        warnings.append(f"registry.json: chiave \"k\" duplicata: '{v}' (verifica che le pipeline admin/export non collidano)")
    for label, key in (('id', 'id'), ('slug', 'slug'), ('path', 'path')):
        for v in find_dups([p for p in pages if p.get(key)], key, label):
            errors.append(f"registry.json: {label} duplicato: '{v}'")

    def check_refs(items, ref_key, where):
        for it in items:
            rid = it if isinstance(it, str) else it.get(ref_key)
            if rid and rid not in ids:
                errors.append(f"registry.json: riferimento orfano a id '{rid}' in {where}")

    for s in reg.get('sections', []):
        check_refs(s.get('pages', []), 'pages', f"sections['{s.get('v')}']")
    check_refs(reg.get('lavori', []), 'id', 'lavori')

    known_paths = set()
    for p in pages:
        if p.get('path'):
            if p['path'] in known_paths:
                errors.append(f"registry.json: path duplicato: '{p['path']}'")
            known_paths.add(p['path'])
    for po in reg.get('pathOverrides', []):
        if po.get('path') in known_paths:
            errors.append(f"registry.json: path '{po['path']}' di pathOverrides in conflitto con un path di pagina")
        known_paths.add(po.get('path'))

    for p in pages:
        if p.get('admin') and not (PAGES_DIR / (p['k'] + '.json')).exists():
            errors.append(f"registry.json: pagina admin '{p['k']}' senza file locale content/pages/{p['k']}.json")

    for f in sorted(PAGES_DIR.glob('*.json')):
        if f.name == 'registry.json':
            continue
        k = f.stem
        if k not in keys:
            errors.append(f"file orfano: content/pages/{f.name} non presente nel registry")

def validate_content_links(reg, errors, warnings):
    """Verifica che immagini e link markdown nei contenuti puntino a file esistenti
    o a route interne del sito (path del registry)."""
    known_routes = {'/'}
    for p in reg.get('pages', []):
        if p.get('path'):
            known_routes.add('/' + p['path'])
    img_rx = re.compile(r'!\[[^\]]*\]\(([^)]+)\)')
    link_rx = re.compile(r'(?<!!)\[[^\]]*\]\(([^)]+)\)')
    refs = {}
    for f in sorted(PAGES_DIR.glob('*.json')):
        if f.name == 'registry.json':
            continue
        page = load_json(f, f.name)
        content = page.get('content') or ''
        for m in img_rx.finditer(content):
            url = m.group(1).split('#')[0]
            if url.startswith(('http://', 'https://', 'data:', 'mailto:', '#')):
                continue
            refs.setdefault(url, []).append((f.name, 'img'))
        for m in link_rx.finditer(content):
            url = m.group(1).split('#')[0]
            if url.startswith(('http://', 'https://', 'data:', 'mailto:', '#')):
                continue
            refs.setdefault(url, []).append((f.name, 'link'))

    for url, uses in refs.items():
        path = url.split('#')[0]
        if not path.startswith('/'):
            warnings.append(f"contenuto: riferimento relativo senza '/' iniziale: '{url[:60]}…' (usato in {uses[0][0]})")
            continue
        if path in known_routes:
            continue
        rel = Path(path[1:])
        if not (ROOT_DIR / rel).exists():
            warnings.append(f"contenuto: riferimento mancante '{url}' (usato in {uses[0][0]})")

def validate_all(reg):
    """Esegue tutte le validazioni. Ritorna (errors, warnings)."""
    errors, warnings = [], []
    validate_schema(reg, errors)
    validate_integrity(reg, errors, warnings)
    validate_content_links(reg, errors, warnings)
    return errors, warnings

def run_validation(reg):
    errors, warnings = validate_all(reg)
    for w in warnings:
        print(f"⚠ {w}")
    for e in errors:
        print(f"✗ {e}")
    print(f"\nValidazione: {len(errors)} errori, {len(warnings)} avvisi")
    return errors

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

def generate_data_json(reg):
    """Generate a dedicated JSON file for the admin panel, avoiding JS regex parsing."""
    pages = []
    for p in reg['pages']:
        if not p.get('menu'):
            continue
        obj = {'k': p['k'], 'l': p['l'], 'i': p['i'], 'id': p['id']}
        if p.get('sec'):
            obj['sec'] = p['sec']
        if p.get('sub'):
            obj['sub'] = p['sub']
        pages.append(obj)

    sections = [{'v': s['v'], 'l': s['l']} for s in reg['sections'] if not s.get('adminOnly')]
    lavori = [{'l': w['l'], 'i': w['i'], 'id': w['id']} for w in reg['lavori']]

    data = {
        'root': reg['root'],
        'guild': reg['guild'],
        'pages': pages,
        'sections': sections,
        'lavori': lavori
    }
    return json.dumps(data, ensure_ascii=False, indent=2) + '\n'

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

def generate_search_and_recent(reg):
    """Indice di ricerca client-side + pagine aggiornate di recente."""
    import re as _re
    idx = []
    recents = []
    for p in reg['pages']:
        f = PAGES_DIR / (p['k'] + '.json')
        if not f.exists():
            continue
        try:
            doc = load_json(f, f.name)
        except Exception:
            continue
        text = _re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', doc.get('content') or '')
        text = _re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
        text = _re.sub(r'[#>*`~_|\-]{1,3}', ' ', text)
        text = _re.sub(r'\s+', ' ', text).strip()
        idx.append({'id': 'pag-' + p['k'], 'title': doc.get('title') or p['l'], 'icon': doc.get('icon') or p['i'], 'text': text[:4000]})
        lm = doc.get('lastModified')
        if lm:
            recents.append({'id': 'pag-' + p['k'], 'title': doc.get('title') or p['l'], 'icon': doc.get('icon') or p['i'], 'lastEdited': lm})
    recents.sort(key=lambda x: x.get('lastEdited') or '', reverse=True)
    search = json.dumps(idx, ensure_ascii=False, indent=1) + '\n'
    recent = json.dumps({'pages': recents[:8]}, ensure_ascii=False, indent=1) + '\n'
    return search, recent

def main():
    check_mode = '--check' in sys.argv
    reg = load_registry()

    errors = run_validation(reg)
    if errors:
        print('✗ Validazione fallita: generazione interrotta.')
        return 1
    if check_mode:
        print('✓ OK: registry e pagine validi.')
        return 0

    # 1. scripts/js/data.js
    write_file('scripts/js/data.js', generate_data_js(reg))

    # 1b. scripts/js/data.json (dedicated JSON for admin)
    write_file('scripts/js/data.json', generate_data_json(reg))

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

    # 4-5. Indice ricerca client-side + novità recenti (da file locali)
    search_json, recent_json = generate_search_and_recent(reg)
    write_file('content/search-index.json', search_json)
    write_file('content/recent.json', recent_json)

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

    # 7. admin/index.html inline script (namespace ArcAdmin)
    admin_path = ROOT_DIR / 'admin' / 'index.html'
    admin_html = admin_path.read_text(encoding='utf-8')
    adm_pages, adm_sections = generate_admin_inline(reg)
    admin_html = replace_between(
        admin_html,
        r'window\.ArcAdmin\.pages = \[[\s\S]*?\n\];',
        f"window.ArcAdmin.pages = [\n{',\n'.join(adm_pages)}\n];"
    )
    admin_html = replace_between(
        admin_html,
        r'window\.ArcAdmin\.sections = \[[\s\S]*?\n\];',
        f"window.ArcAdmin.sections = [\n{',\n'.join(adm_sections)}\n];"
    )
    write_file('admin/index.html', admin_html)

    # 8. sitemap.xml
    write_file('sitemap.xml', generate_sitemap(reg))

    print('\n✓ All artifacts generated successfully!')
    return 0

if __name__ == '__main__':
    sys.exit(main())