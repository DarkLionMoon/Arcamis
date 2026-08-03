#!/usr/bin/env python3
"""
Arcamis Wiki — Build Script
Converte Markdown → JSON Notion-compatibile e copia i database statici.
Uso: python3 scripts/build.py
"""

import os
import re
import json
import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / 'content'
PUBLIC_DIR = ROOT / 'public' / 'data'

# ═══════════════════════════════════════
# FRONTMATTER PARSER
# ═══════════════════════════════════════

def parse_frontmatter(text):
    """Parse YAML-like frontmatter from Markdown."""
    meta = {}
    body = text
    if text.startswith('---'):
        end = text.find('---', 3)
        if end > 0:
            block = text[3:end].strip()
            body = text[end + 3:].strip()
            for line in block.split('\n'):
                line = line.strip()
                if ':' not in line:
                    continue
                key, val = line.split(':', 1)
                key = key.strip()
                val = val.strip()
                # Parse arrays [a, b, c]
                if val.startswith('[') and val.endswith(']'):
                    val = [v.strip().strip('"').strip("'") for v in val[1:-1].split(',') if v.strip()]
                # Parse booleans
                elif val.lower() == 'true':
                    val = True
                elif val.lower() == 'false':
                    val = False
                # Parse numbers
                elif val.isdigit():
                    val = int(val)
                # Strip quotes
                elif (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                meta[key] = val
    return meta, body


# ═══════════════════════════════════════
# RICH TEXT BUILDER
# ═══════════════════════════════════════

def make_rich_text(text, bold=False, italic=False, code=False, strikethrough=False, underline=False, color='default', href=None):
    """Create a Notion rich_text object."""
    rt = {
        'type': 'text',
        'text': {'content': text},
        'plain_text': text,
        'annotations': {
            'bold': bold,
            'italic': italic,
            'strikethrough': strikethrough,
            'underline': underline,
            'code': code,
            'color': color
        },
        'href': href
    }
    return rt


def parse_inline(text):
    """Parse inline Markdown (bold, italic, code, links) into rich_text array."""
    result = []
    i = 0
    current = ''

    while i < len(text):
        # Bold + Italic: ***text*** or ___text___
        if text[i:i+3] in ('***', '___'):
            marker = text[i:i+3]
            end = text.find(marker, i + 3)
            if end > 0:
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                inner = text[i+3:end]
                for rt in parse_inline(inner):
                    rt['annotations']['bold'] = True
                    rt['annotations']['italic'] = True
                    result.append(rt)
                i = end + 3
                continue

        # Bold: **text** or __text__
        if text[i:i+2] in ('**', '__'):
            marker = text[i:i+2]
            end = text.find(marker, i + 2)
            if end > 0:
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                inner = text[i+2:end]
                for rt in parse_inline(inner):
                    rt['annotations']['bold'] = True
                    result.append(rt)
                i = end + 2
                continue

        # Italic: *text* or _text_
        if text[i] in ('*', '_') and i + 1 < len(text) and text[i+1] not in ('*', '_'):
            # Check if it's a closing marker (preceded by space)
            marker = text[i]
            end = text.find(marker, i + 1)
            if end > 0 and text[end-1:end+1] != '\\ ':
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                inner = text[i+1:end]
                for rt in parse_inline(inner):
                    rt['annotations']['italic'] = True
                    result.append(rt)
                i = end + 1
                continue

        # Code: `text`
        if text[i] == '`':
            end = text.find('`', i + 1)
            if end > 0:
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                result.append(make_rich_text(text[i+1:end], code=True))
                i = end + 1
                continue

        # Strikethrough: ~~text~~
        if text[i:i+2] == '~~':
            end = text.find('~~', i + 2)
            if end > 0:
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                inner = text[i+2:end]
                for rt in parse_inline(inner):
                    rt['annotations']['strikethrough'] = True
                    result.append(rt)
                i = end + 2
                continue

        # Link: [text](url)
        if text[i] == '[':
            match = re.match(r'\[([^\]]+)\]\(([^)]+)\)', text[i:])
            if match:
                if current:
                    result.append(make_rich_text(current))
                    current = ''
                link_text = match.group(1)
                link_url = match.group(2)
                rt = make_rich_text(link_text, href=link_url)
                result.append(rt)
                i += len(match.group(0))
                continue

        current += text[i]
        i += 1

    if current:
        result.append(make_rich_text(current))

    return result if result else [make_rich_text(text)]


# ═══════════════════════════════════════
# MARKDOWN → NOTION BLOCKS
# ═══════════════════════════════════════

def md_to_blocks(md_text):
    """Convert Markdown text to Notion block array."""
    lines = md_text.split('\n')
    blocks = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Empty line
        if not stripped:
            i += 1
            continue

        # Horizontal rule: ---, ***, ___
        if re.match(r'^[-*_]{3,}$', stripped):
            blocks.append({'type': 'divider', 'divider': {}})
            i += 1
            continue

        # Code block: ```lang
        if stripped.startswith('```'):
            lang = stripped[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1  # skip closing ```
            code_text = '\n'.join(code_lines)
            blocks.append({
                'type': 'code',
                'code': {
                    'rich_text': [make_rich_text(code_text)],
                    'language': lang or 'plain text'
                }
            })
            continue

        # Blockquote: > text
        if stripped.startswith('>'):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                quote_lines.append(lines[i].strip().lstrip('>').strip())
                i += 1
            quote_text = '\n'.join(quote_lines)
            blocks.append({
                'type': 'quote',
                'quote': {
                    'rich_text': parse_inline(quote_text)
                }
            })
            continue

        # Heading 1: # text
        if re.match(r'^# [^#]', stripped):
            text = stripped[2:].strip()
            blocks.append({
                'type': 'heading_1',
                'heading_1': {
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Heading 2: ## text
        if re.match(r'^## [^#]', stripped):
            text = stripped[3:].strip()
            blocks.append({
                'type': 'heading_2',
                'heading_2': {
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Heading 3: ### text
        if re.match(r'^### [^#]', stripped):
            text = stripped[4:].strip()
            blocks.append({
                'type': 'heading_3',
                'heading_3': {
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Image: ![alt](url)
        img_match = re.match(r'^!\[([^\]]*)\]\(([^)]+)\)', stripped)
        if img_match:
            alt = img_match.group(1)
            url = img_match.group(2)
            block = {
                'type': 'image',
                'image': {
                    'type': 'external',
                    'external': {'url': url}
                }
            }
            if alt:
                block['image']['caption'] = [make_rich_text(alt)]
            blocks.append(block)
            i += 1
            continue

        # Table: | col1 | col2 |
        if stripped.startswith('|') and '|' in stripped[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1
            blocks.extend(parse_table(table_lines))
            continue

        # Unordered list: - text or * text
        list_match = re.match(r'^[-*] (.+)', stripped)
        if list_match:
            text = list_match.group(1)
            blocks.append({
                'type': 'bulleted_list_item',
                'bulleted_list_item': {
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Ordered list: 1. text
        ol_match = re.match(r'^\d+\. (.+)', stripped)
        if ol_match:
            text = ol_match.group(1)
            blocks.append({
                'type': 'numbered_list_item',
                'numbered_list_item': {
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Callout: > [!NOTE] text or similar
        callout_match = re.match(r'^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)', stripped, re.IGNORECASE)
        if callout_match:
            callout_type = callout_match.group(1).upper()
            text = callout_match.group(2)
            emoji_map = {
                'NOTE': '📝', 'TIP': '💡', 'WARNING': '⚠️',
                'IMPORTANT': '❗', 'CAUTION': '🔥'
            }
            blocks.append({
                'type': 'callout',
                'callout': {
                    'icon': {'emoji': emoji_map.get(callout_type, '📝')},
                    'rich_text': parse_inline(text)
                }
            })
            i += 1
            continue

        # Regular paragraph
        para_lines = [stripped]
        i += 1
        while i < len(lines):
            next_stripped = lines[i].strip()
            if not next_stripped or next_stripped.startswith('#') or next_stripped.startswith('>') or \
               next_stripped.startswith('```') or next_stripped.startswith('|') or \
               re.match(r'^[-*] ', next_stripped) or re.match(r'^\d+\. ', next_stripped) or \
               re.match(r'^[-*_]{3,}$', next_stripped) or re.match(r'^!\[', next_stripped):
                break
            para_lines.append(next_stripped)
            i += 1
        para_text = ' '.join(para_lines)
        blocks.append({
            'type': 'paragraph',
            'paragraph': {
                'rich_text': parse_inline(para_text)
            }
        })

    return blocks


def parse_table(lines):
    """Parse Markdown table lines into Notion table block."""
    if len(lines) < 2:
        return []

    def split_row(line):
        cells = line.split('|')
        # Remove first and last empty cells from leading/trailing |
        if cells and cells[0].strip() == '':
            cells = cells[1:]
        if cells and cells[-1].strip() == '':
            cells = cells[:-1]
        return [c.strip() for c in cells]

    headers = split_row(lines[0])
    # Skip separator line (---|---|---)
    data_start = 1
    if len(lines) > 1 and re.match(r'^[\s|:-]+$', lines[1]):
        data_start = 2

    rows = []
    for line in lines[data_start:]:
        row = split_row(line)
        # Pad or trim to match header count
        while len(row) < len(headers):
            row.append('')
        row = row[:len(headers)]
        rows.append(row)

    # Build Notion table block
    table_width = len(headers)
    has_column_header = True

    table_rows = []
    # Header row
    header_cells = []
    for h in headers:
        header_cells.append({
            'type': 'table_cell',
            'table_cell': {'rich_text': parse_inline(h)}
        })
    table_rows.append({
        'type': 'table_row',
        'table_row': {'cells': header_cells}
    })
    # Data rows
    for row in rows:
        cells = []
        for cell in row:
            cells.append({
                'type': 'table_cell',
                'table_cell': {'rich_text': parse_inline(cell)}
            })
        table_rows.append({
            'type': 'table_row',
            'table_row': {'cells': cells}
        })

    return [{
        'type': 'table',
        'table': {
            'has_column_header': has_column_header,
            'has_row_header': False,
            'table_width': table_width,
            'children': table_rows
        }
    }]


# ═══════════════════════════════════════
# PAGE ID GENERATOR
# ═══════════════════════════════════════

def generate_page_id(title):
    """Generate a stable 32-char hex ID from title (matching Notion format)."""
    h = hashlib.md5(title.encode('utf-8')).hexdigest()
    return h


# ═══════════════════════════════════════
# BUILD PAGES
# ═══════════════════════════════════════

def build_pages():
    """Convert all Markdown files in content/pages/ to JSON."""
    pages_dir = CONTENT_DIR / 'pages'
    out_dir = PUBLIC_DIR / 'pages'
    out_dir.mkdir(parents=True, exist_ok=True)

    pages_meta = []
    count = 0

    for md_file in sorted(pages_dir.glob('*.md')):
        text = md_file.read_text(encoding='utf-8')
        meta, body = parse_frontmatter(text)

        title = meta.get('title', md_file.stem.replace('-', ' ').title())
        icon = meta.get('icon', '📄')
        cover = meta.get('cover', None)
        order = meta.get('order', 999)

        page_id = generate_page_id(title)
        blocks = md_to_blocks(body)

        page_data = {
            'page': {
                'id': page_id,
                'icon': {'emoji': icon},
                'cover': {'type': 'external', 'external': {'url': cover}} if cover else None,
                'last_edited_time': '2025-01-01T00:00:00Z',
                'properties': {
                    'title': {
                        'title': [{
                            'type': 'text',
                            'text': {'content': title},
                            'plain_text': title,
                            'annotations': {
                                'bold': False, 'italic': False,
                                'strikethrough': False, 'underline': False,
                                'code': False, 'color': 'default'
                            },
                            'href': None
                        }]
                    }
                }
            },
            'blocks': blocks
        }

        out_file = out_dir / f'{page_id}.json'
        out_file.write_text(json.dumps(page_data, ensure_ascii=False, indent=2), encoding='utf-8')

        pages_meta.append({
            'id': page_id,
            'title': title,
            'icon': icon,
            'order': order,
            'k': md_file.stem,
            'tags': meta.get('tags', [])
        })

        count += 1
        print(f'  ✓ {title} → {page_id}.json')

    # Write pages index
    pages_meta.sort(key=lambda p: (p.get('order', 999), p['title']))
    index_file = out_dir / '_index.json'
    index_file.write_text(json.dumps(pages_meta, ensure_ascii=False, indent=2), encoding='utf-8')

    return pages_meta


# ═══════════════════════════════════════
# COPY STATIC DATA
# ═══════════════════════════════════════

def copy_data(src_name, dst_name=None):
    """Copy a data directory from content/ to public/data/."""
    src = CONTENT_DIR / src_name
    dst = PUBLIC_DIR / (dst_name or src_name)
    if not src.exists():
        print(f'  ⚠ {src_name}/ non trovato, skip')
        return 0
    dst.mkdir(parents=True, exist_ok=True)
    count = 0
    for f in src.iterdir():
        if f.is_file():
            shutil.copy2(f, dst / f.name)
            count += 1
    print(f'  ✓ {count} file copiati da {src_name}/')
    return count


# ═══════════════════════════════════════
# BUILD SEARCH INDEX
# ═══════════════════════════════════════

def build_search_index(pages_meta):
    """Build a search index from all pages."""
    index = []
    pages_dir = PUBLIC_DIR / 'pages'

    for p in pages_meta:
        page_file = pages_dir / f'{p["id"]}.json'
        if not page_file.exists():
            continue
        data = json.loads(page_file.read_text(encoding='utf-8'))
        blocks = data.get('blocks', [])

        # Extract plain text from blocks
        text_parts = []
        for block in blocks:
            block_type = block.get('type', '')
            rt_array = block.get(block_type, {}).get('rich_text', [])
            for rt in rt_array:
                text_parts.append(rt.get('plain_text', ''))

        index.append({
            'id': p['id'],
            'title': p['title'],
            'icon': p['icon'],
            'text': ' '.join(text_parts)[:2000]  # First 2000 chars
        })

    out_file = PUBLIC_DIR / 'search-index.json'
    out_file.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'  ✓ Search index: {len(index)} pagine')


# ═══════════════════════════════════════
# MAIN
# ═══════════════════════════════════════

def main():
    print('═══ Arcamis Wiki — Build ═══\n')

    # 1. Build pages from Markdown
    print('📄 Building pages...')
    pages_meta = build_pages()
    print(f'   {len(pages_meta)} pagine convertite\n')

    # 2. Copy database JSONs
    print('📦 Copying databases...')
    copy_data('db')
    print()

    # 3. Copy mestieri JSONs
    print('⚒️ Copying mestieri...')
    copy_data('mestieri')
    print()

    # 4. Copy static files
    print('📁 Copying static files...')
    copy_data('static')
    print()

    # 5. Build search index
    print('🔍 Building search index...')
    build_search_index(pages_meta)
    print()

    print('═══ Build completata! ═══')
    print(f'   Output: {PUBLIC_DIR}')


if __name__ == '__main__':
    main()
