#!/usr/bin/env python3
"""
Arcamis Wiki — Export da Notion API
Scarica tutte le pagine e i database da Notion e li salva in content/.
Uso: NOTION_TOKEN=ntn_xxx python3 scripts/export-notion.py

Prima di usare questo script:
1. Vai su https://www.notion.so/my-integrations
2. Crea un'integrazione e copia il token
3. Nelle pagine Notion → ... → Connections → aggiungi la tua integrazione
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / 'content'

TOKEN = os.environ.get('NOTION_TOKEN', '')
HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
}

# ═══════════════════════════════════════
# PAGINE DA ESPORTARE (da data.js)
# ═══════════════════════════════════════

PAGES = [
    {'k': 'gameplay',   'id': '2f00274fdc1c8065a11ff45192aa5dcb'},
    {'k': 'regole',     'id': '2f00274fdc1c800b9d8fc366e8e40c5c'},
    {'k': 'materiale',  'id': '3130274fdc1c807eb61fde24e8236659'},
    {'k': 'inizia',     'id': '2dd222f22ef8413f8cb48f03bbb4f4b0'},
    {'k': 'avanti',     'id': '5cea525d149f4acb9c59007bf6b3d5ff'},
    {'k': 'galleria',   'id': '2fd0274fdc1c80d8b948c4133f874f28'},
    {'k': 'biblioteca', 'id': '2f00274fdc1c8089bfe6c24434d53b67'},
    {'k': 'farmacia',   'id': '2f00274fdc1c804b9015c72cb6121404'},
    {'k': 'arcamis',    'id': '3090274fdc1c80e1a365ce1c36873455'},
    {'k': 'selva',      'id': '30d0274fdc1c800999feeb0ca6669b22'},
    {'k': 'foresta',    'id': '30d0274fdc1c8016b113d5c2d7662d8f'},
    {'k': 'volonx',     'id': '30d0274fdc1c804b9cb7e366f02bd635'},
    {'k': 'arpax',      'id': '30d0274fdc1c807eb443f55071f00844'},
    {'k': 'deserto',    'id': '2f00274fdc1c805ca01ec57f18d2ffee'},
    {'k': 'gilda',      'id': '2f00274fdc1c801b8c13cefd9e15694e'},
    {'k': 'locanda',    'id': '2f00274fdc1c80faa99eda064ef0fabc'},
    {'k': 'ospedale',   'id': '2f00274fdc1c807aa03cc6cbeb3687cc'},
    {'k': 'sartoria',   'id': '2ff0274fdc1c8035bad4f0b6ab705192'},
    {'k': 'pantheon',   'id': '2f00274fdc1c80679bd3c3df8a1fa040'},
    {'k': 'changelog',  'id': '3000274fdc1c8033a214c44a1aa7f01f'},
    {'k': 'maestria',   'id': '2f00274fdc1c80259b3bc01b09b5757d'},
    {'k': 'lore',       'id': '2f00274fdc1c806f8f17dbc6532d2211'},
    {'k': 'homebrew',   'id': '2f00274fdc1c80e78ad7ce985007b7c6'},
    {'k': 'mappe',      'id': '2f10274fdc1c80489f23c49164747770'},
]

# Lavori
LAVORI = [
    {'k': 'gilda-avventurieri',    'id': '2f00274fdc1c801b8c13cefd9e15694e'},
    {'k': 'locanda',               'id': '2f00274fdc1c80faa99eda064ef0fabc'},
    {'k': 'forgia',                'id': '2f00274fdc1c805ca01ec57f18d2ffee'},
    {'k': 'biblioteca',            'id': '2f00274fdc1c8089bfe6c24434d53b67'},
    {'k': 'bottega-farmaceutica',  'id': '2f00274fdc1c801c9697e75caa8d5f13'},
    {'k': 'caserma',               'id': '2ff0274fdc1c80688dd6c2b293a1f626'},
    {'k': 'corporazione',          'id': '2ff0274fdc1c80769a4ae243f22f0582'},
    {'k': 'ospedale',              'id': '2f00274fdc1c807aa03cc6cbeb3687cc'},
    {'k': 'sartoria',              'id': '2ff0274fdc1c8035bad4f0b6ab705192'},
    {'k': 'tribunale',             'id': '3460274fdc1c800c8b3bf9a53d0cbf59'},
]

# Database da esportare
DATABASES = [
    {'k': 'gallery',    'id': '2fd0274fdc1c80038889fc072a360bae', 'label': 'Galleria PG'},
    {'k': 'changelog',  'id': '3400274fdc1c80178db3dcf6ba7098aa', 'label': 'Changelog'},
    {'k': 'timeline',   'id': '2fc0274fdc1c800f8ac0d6d03b255cad', 'label': 'Timeline'},
    {'k': 'subclass',   'id': '2f70274fdc1c80e3bdc7f95f81eb9cc0', 'label': 'Sottoclassi'},
    {'k': 'specie',     'id': '3350274fdc1c808fba5ed9ad1f3b4bb4', 'label': 'Specie'},
    {'k': 'specie-hb',  'id': '2f60274fdc1c80fba671c588ba93b116', 'label': 'Specie Homebrew'},
    {'k': 'library',    'id': '3040274fdc1c80e0a0dccfa9761bff55', 'label': 'Biblioteca'},
    {'k': 'npc',        'id': '3320274fdc1c805090becb2a5a0414e1', 'label': 'NPC'},
]


def notion_get(url, retries=3):
    """GET request to Notion API with retries."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** attempt
                print(f'    Rate limited, attendi {wait}s...')
                time.sleep(wait)
            else:
                print(f'    Errore HTTP {e.code}: {e.reason}')
                return None
        except Exception as e:
            print(f'    Errore: {e}')
            if attempt < retries - 1:
                time.sleep(1)
    return None


def notion_post(url, body, retries=3):
    """POST request to Notion API with retries."""
    for attempt in range(retries):
        try:
            data = json.dumps(body).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** attempt
                print(f'    Rate limited, attendi {wait}s...')
                time.sleep(wait)
            else:
                print(f'    Errore HTTP {e.code}: {e.reason}')
                return None
        except Exception as e:
            print(f'    Errore: {e}')
            if attempt < retries - 1:
                time.sleep(1)
    return None


def fetch_page(page_id):
    """Fetch a single page with all its blocks."""
    clean_id = page_id.replace('-', '')
    page_url = f'https://api.notion.com/v1/pages/{clean_id}'
    blocks_url = f'https://api.notion.com/v1/blocks/{clean_id}/children?page_size=100'

    page = notion_get(page_url)
    if not page:
        return None

    # Fetch blocks with pagination
    all_blocks = []
    cursor = None
    while True:
        url = blocks_url
        if cursor:
            url += f'&start_cursor={cursor}'
        data = notion_get(url)
        if not data:
            break
        all_blocks.extend(data.get('results', []))
        if not data.get('has_more'):
            break
        cursor = data.get('next_cursor')

    # Fetch children recursively (depth 2)
    for block in all_blocks:
        if block.get('has_children'):
            child_url = f"https://api.notion.com/v1/blocks/{block['id']}/children?page_size=100"
            child_data = notion_get(child_url)
            if child_data:
                block['children'] = child_data.get('results', [])

    return {'page': page, 'blocks': all_blocks}


def fetch_database(db_id):
    """Fetch all entries from a Notion database."""
    clean_id = db_id.replace('-', '')
    url = f'https://api.notion.com/v1/databases/{clean_id}/query'
    body = {'page_size': 100}

    all_results = []
    cursor = None
    while True:
        if cursor:
            body['start_cursor'] = cursor
        data = notion_post(url, body)
        if not data:
            break
        all_results.extend(data.get('results', []))
        if not data.get('has_more'):
            break
        cursor = data.get('next_cursor')

    # Extract simplified page data
    pages = []
    for p in all_results:
        if not p or p.get('object') != 'page':
            continue
        props = p.get('properties', {})

        # Find title
        title = 'Senza titolo'
        for v in props.values():
            if v.get('type') == 'title':
                title = ''.join(t.get('plain_text', '') for t in v.get('title', []))
                break

        icon = p.get('icon', {}).get('emoji', '📄') if p.get('icon') else '📄'

        cover = None
        if p.get('cover'):
            c = p['cover']
            cover = c.get('external', {}).get('url') or c.get('file', {}).get('url')

        pages.append({
            'id': p['id'].replace('-', ''),
            'title': title,
            'icon': icon,
            'cover': cover
        })

    return {'pages': pages}


def export_page_to_markdown(page_data, key):
    """Convert a Notion page to Markdown with frontmatter."""
    page = page_data['page']
    blocks = page_data['blocks']

    # Extract metadata
    title = 'Senza titolo'
    for v in page.get('properties', {}).values():
        if v.get('type') == 'title':
            title = ''.join(t.get('plain_text', '') for t in v.get('title', []))
            break

    icon = page.get('icon', {}).get('emoji', '📄') if page.get('icon') else '📄'
    cover = None
    if page.get('cover'):
        c = page['cover']
        cover = c.get('external', {}).get('url') or c.get('file', {}).get('url')

    # Frontmatter
    lines = ['---']
    lines.append(f'title: "{title}"')
    lines.append(f'icon: {icon}')
    if cover:
        lines.append(f'cover: {cover}')
    lines.append(f'notion_id: {page["id"]}')
    lines.append('---')
    lines.append('')

    # Convert blocks to Markdown
    lines.extend(blocks_to_markdown(blocks, indent=0))

    return '\n'.join(lines)


def blocks_to_markdown(blocks, indent=0):
    """Convert Notion blocks to Markdown lines."""
    lines = []
    prefix = '  ' * indent

    for block in blocks:
        btype = block.get('type', '')
        data = block.get(btype, {})
        children = block.get('children', [])

        if btype == 'paragraph':
            text = rich_text_to_md(data.get('rich_text', []))
            if text:
                lines.append(f'{prefix}{text}')
                lines.append('')

        elif btype in ('heading_1', 'heading_2', 'heading_3'):
            level = int(btype[-1])
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}{"#" * level} {text}')
            lines.append('')

        elif btype == 'bulleted_list_item':
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}- {text}')
            if children:
                lines.extend(blocks_to_markdown(children, indent + 1))

        elif btype == 'numbered_list_item':
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}1. {text}')
            if children:
                lines.extend(blocks_to_markdown(children, indent + 1))

        elif btype == 'quote':
            text = rich_text_to_md(data.get('rich_text', []))
            for qline in text.split('\n'):
                lines.append(f'{prefix}> {qline}')
            lines.append('')

        elif btype == 'callout':
            emoji = data.get('icon', {}).get('emoji', '📝')
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}> [{emoji}] {text}')
            lines.append('')

        elif btype == 'code':
            lang = data.get('language', '')
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}```{lang}')
            lines.append(f'{text}')
            lines.append(f'{prefix}```')
            lines.append('')

        elif btype == 'divider':
            lines.append(f'{prefix}---')
            lines.append('')

        elif btype == 'image':
            img = data.get('external', {}) or data.get('file', {})
            url = img.get('url', '')
            caption = rich_text_to_md(data.get('caption', []))
            alt = caption or 'image'
            lines.append(f'{prefix}![{alt}]({url})')
            lines.append('')

        elif btype == 'toggle':
            text = rich_text_to_md(data.get('rich_text', []))
            lines.append(f'{prefix}<details>')
            lines.append(f'{prefix}<summary>{text}</summary>')
            lines.append('')
            if children:
                lines.extend(blocks_to_markdown(children, indent + 1))
            lines.append(f'{prefix}</details>')
            lines.append('')

        elif btype == 'child_page':
            child_title = data.get('title', 'Sottopagina')
            lines.append(f'{prefix}**[{child_title}]**')
            lines.append('')

        elif btype == 'table':
            # Skip table rows, they'll be rendered as children
            pass

        elif btype == 'table_row':
            cells = data.get('cells', [])
            row = ' | '.join(rich_text_to_md(cell) for cell in cells)
            lines.append(f'{prefix}| {row} |')

        elif children:
            lines.extend(blocks_to_markdown(children, indent))

    return lines


def rich_text_to_md(rich_text_array):
    """Convert Notion rich_text array to Markdown string."""
    parts = []
    for rt in rich_text_array:
        text = rt.get('plain_text', '')
        annotations = rt.get('annotations', {})
        href = rt.get('href')

        # Apply annotations
        if annotations.get('code'):
            text = f'`{text}`'
        if annotations.get('bold'):
            text = f'**{text}**'
        if annotations.get('italic'):
            text = f'*{text}*'
        if annotations.get('strikethrough'):
            text = f'~~{text}~~'
        if href:
            text = f'[{text}]({href})'

        parts.append(text)
    return ''.join(parts)


def main():
    if not TOKEN:
        print('❌ Errore: NOTION_TOKEN non impostato.')
        print('   Usa: NOTION_TOKEN=ntn_xxx python3 scripts/export-notion.py')
        sys.exit(1)

    print('═══ Arcamis Wiki — Export da Notion ═══\n')

    # 1. Export pages
    print('📄 Esportazione pagine...')
    pages_dir = CONTENT_DIR / 'pages'
    pages_dir.mkdir(parents=True, exist_ok=True)

    exported = 0
    for p in PAGES + LAVORI:
        key = p['k']
        page_id = p['id']
        print(f'  → {key} ({page_id[:8]}...)')

        data = fetch_page(page_id)
        if not data:
            print(f'    ⚠ Errore nel fetch, skip')
            continue

        # Save as JSON (for the renderer)
        json_dir = ROOT / 'public' / 'data' / 'pages'
        json_dir.mkdir(parents=True, exist_ok=True)
        json_file = json_dir / f'{page_id.replace("-", "")}.json'
        json_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

        # Save as Markdown (for content editing)
        md_content = export_page_to_markdown(data, key)
        md_file = pages_dir / f'{key}.md'
        md_file.write_text(md_content, encoding='utf-8')

        exported += 1
        time.sleep(0.4)  # Rate limit

    print(f'\n   ✓ {exported} pagine esportate\n')

    # 2. Export databases
    print('📦 Esportazione database...')
    db_dir = CONTENT_DIR / 'db'
    db_dir.mkdir(parents=True, exist_ok=True)

    for db in DATABASES:
        key = db['k']
        db_id = db['id']
        print(f'  → {db["label"]} ({db_id[:8]}...)')

        data = fetch_database(db_id)
        if not data:
            print(f'    ⚠ Errore nel fetch, skip')
            continue

        db_file = db_dir / f'{key}.json'
        db_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'    ✓ {len(data.get("pages", []))} voci')
        time.sleep(0.4)

    # 3. Export NPC sub-databases (each city's child_database)
    print('\n🏙️ Esportazione sotto-database NPC...')
    npc_db_id = '3320274fdc1c805090becb2a5a0414e1'
    npc_data = fetch_database(npc_db_id)
    if npc_data:
        for city in npc_data.get('pages', []):
            city_id = city['id']
            print(f'  → {city.get("title", "Città")} ({city_id[:8]}...)')

            # Fetch city page to find child_database block
            page_data = fetch_page(city_id)
            if not page_data:
                print(f'    ⚠ Errore fetch pagina, skip')
                continue

            # Find child_database block
            db_block = None
            for block in page_data.get('blocks', []):
                if block.get('type') == 'child_database':
                    db_block = block
                    break

            if not db_block:
                print(f'    ⚠ Nessun database figlio trovato, skip')
                continue

            # Fetch sub-database entries
            sub_db_id = db_block['id'].replace('-', '')
            sub_data = fetch_database(sub_db_id)
            if sub_data:
                sub_file = db_dir / f'npc-{city_id}.json'
                sub_file.write_text(json.dumps(sub_data, ensure_ascii=False, indent=2), encoding='utf-8')
                print(f'    ✓ {len(sub_data.get("pages", []))} NPC')
            else:
                print(f'    ⚠ Errore fetch database')
            time.sleep(0.4)

    print('\n═══ Export completata! ═══')
    print(f'   Pagine: {pages_dir}')
    print(f'   Database: {db_dir}')
    print('\n   Ora puoi eseguire: python3 scripts/build.py')


if __name__ == '__main__':
    main()
