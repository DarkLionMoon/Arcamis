#!/usr/bin/env python3
"""ARCAMIS — Export Completo Contenuti
Uso: python3 export-all.py --token=ntn_xxx
"""
import json, os, sys, time, re
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from html.parser import HTMLParser

TOKEN = ''
for a in sys.argv[1:]:
    if a.startswith('--token='): TOKEN = a.split('=',1)[1]
if not TOKEN:
    TOKEN = os.environ.get('NOTION_TOKEN','')
if not TOKEN:
    print('❌ Token mancante. Uso: python3 export-all.py --token=ntn_xxx'); sys.exit(1)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content')
DELAY = 0.4

PAGES = [
    {'k':'gameplay','l':'Gameplay','i':'⚔️','id':'2f00274fdc1c8065a11ff45192aa5dcb'},
    {'k':'materiale','l':'Materiale approvato','i':'📋','id':'3130274fdc1c807eb61fde24e8236659'},
    {'k':'inizia','l':'Come si inizia','i':'🌟','id':'2dd222f22ef8413f8cb48f03bbb4f4b0'},
    {'k':'avanti','l':'Andando avanti','i':'📈','id':'5cea525d149f4acb9c59007bf6b3d5ff'},
    {'k':'galleria','l':'Galleria PG','i':'🖼️','id':'2fd0274fdc1c80d8b948c4133f874f28'},
    {'k':'biblioteca','l':'Biblioteca','i':'📚','id':'2f00274fdc1c8089bfe6c24434d53b67'},
    {'k':'farmacia','l':'Bottega farmaceutica','i':'🧪','id':'3090274fdc1c8013a183dfc31297c477'},
    {'k':'arcamis','l':'Arcamis','i':'🏰','id':'3090274fdc1c80e1a365ce1c36873455'},
    {'k':'selva','l':'Selva Fogliabruna','i':'🍂','id':'30d0274fdc1c800999feeb0ca6669b22'},
    {'k':'foresta','l':'Foresta Smarrimento','i':'🌲','id':'30d0274fdc1c8016b113d5c2d7662d8f'},
    {'k':'volonx','l':'Volonx','i':'🏔️','id':'30d0274fdc1c804b9cb7e366f02bd635'},
    {'k':'arpax','l':'Arpax','i':'🦅','id':'30d0274fdc1c807eb443f55071f00844'},
    {'k':'deserto','l':'Deserto del Crepuscolo','i':'🔥','id':'2f00274fdc1c805ca01ec57f18d2ffee'},
    {'k':'gilda','l':'Gilda degli avventurieri','i':'🗡️','id':'2f00274fdc1c801b8c13cefd9e15694e'},
    {'k':'locanda','l':'Locanda','i':'🍺','id':'2f00274fdc1c80faa99eda064ef0fabc'},
    {'k':'ospedale','l':'Ospedale','i':'⚕️','id':'2f00274fdc1c807aa03cc6cbeb3687cc'},
    {'k':'sartoria','l':'Sartoria','i':'🧵','id':'2ff0274fdc1c8035bad4f0b6ab705192'},
    {'k':'pantheon','l':'Pantheon','i':'🛐','id':'2f00274fdc1c80679bd3c3df8a1fa040'},
    {'k':'maestria','l':'Maestria / Titoli','i':'🔨','id':'2f00274fdc1c802a9babd4239d97a319'},
]

DBS = [
    {'name':'gallery','label':'Galleria PG','dbId':'2fd0274fdc1c80038889fc072a360bae'},
    {'name':'npc','label':'NPC','dbId':'3320274fdc1c805090becb2a5a0414e1'},
    {'name':'biblioteca','label':'Biblioteca','dbId':'3040274fdc1c80e0a0dccfa9761bff55'},
    {'name':'timeline','label':'Timeline','dbId':'2fc0274fdc1c800f8ac0d6d03b255cad'},
    {'name':'subclasses','label':'Subclass','dbId':'2f70274fdc1c80e3bdc7f95f81eb9cc0'},
    {'name':'species','label':'Specie','dbId':'3350274fdc1c808fba5ed9ad1f3b4bb4'},
    {'name':'changelog','label':'Changelog','dbId':'3400274fdc1c80178db3dcf6ba7098aa'},
]

SHEETS = [
    {'key':'alchimista','sid':'1uhrl26JgLv3pkqkqUwJITeVRC66sDsEn_7iRna9bk4Q'},
    {'key':'architetto','sid':'1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps'},
    {'key':'artigiano','sid':'1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss'},
    {'key':'artista','sid':'14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4'},
    {'key':'falegname','sid':'1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo'},
    {'key':'metallurgo','sid':'193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc'},
    {'key':'oste','sid':'1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM'},
    {'key':'sarto','sid':'1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU'},
    {'key':'reputation','sid':'1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M','gid':'1406195911'},
]

DOCS = [
    {'key':'patenti','did':'1VHhDaYADbsVu9yq00ESBcVzat2kqWa3NMkPV1tb_ccc','fmt':'html'},
    {'key':'codice','did':'1vht_pvOzfvNDLaibetb3bdXOxWwYCugq_Km_s9xmmAQ','fmt':'html'},
    {'key':'come-funzionano','did':'1alXhUBS7xRFduBjlN6fwuilIgQDznsOehe4nTiCsIK0','fmt':'txt'},
]

def log(msg, cls=''):
    prefix = {'ok':'\033[32m','err':'\033[31m','info':'\033[36m'}.get(cls,'')
    print(f'{prefix}{msg}\033[0m')

def notion_get(url):
    req = Request(url, headers={'Authorization':f'Bearer {TOKEN}','Notion-Version':'2022-06-28'})
    try:
        with urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except HTTPError as e:
        raise Exception(f'HTTP {e.code}: {e.read().decode()[:200]}')

def notion_blocks(block_id, depth=0):
    if depth > 5: return []
    blocks = []
    cursor = None
    while True:
        url = f'https://api.notion.com/v1/blocks/{block_id}/children?page_size=100'
        if cursor: url += f'&start_cursor={cursor}'
        data = notion_get(url)
        for b in (data.get('results') or []):
            if b.get('has_children'):
                b['children'] = notion_blocks(b['id'], depth+1)
            blocks.append(b)
        if not data.get('has_more'): break
        cursor = data.get('next_cursor')
    return blocks

def notion_db(db_id):
    pages = []
    cursor = None
    while True:
        url = f'https://api.notion.com/v1/databases/{db_id}/query'
        body = json.dumps({}).encode()
        if cursor:
            body = json.dumps({'start_cursor': cursor}).encode()
        req = Request(url, data=body, method='POST', headers={
            'Authorization': f'Bearer {TOKEN}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        })
        with urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
        for p in (data.get('results') or []):
            props = p.get('properties') or {}
            title_arr = (props.get('title') or {}).get('title') or []
            pages.append({
                'id': p['id'],
                'title': ''.join(t.get('plain_text','') for t in title_arr),
                'icon': (p.get('icon') or {}).get('emoji',''),
                'cover': ((p.get('cover') or {}).get('external') or {}).get('url') or ((p.get('cover') or {}).get('file') or {}).get('url'),
            })
        if not data.get('has_more'): break
        cursor = data.get('next_cursor')
    return pages

def rich_text_to_md(rt_list):
    if not rt_list: return ''
    parts = []
    for rt in rt_list:
        t = rt.get('plain_text','')
        ann = rt.get('annotations') or {}
        if ann.get('bold'): t = f'**{t}**'
        if ann.get('italic'): t = f'*{t}*'
        if ann.get('code'): t = f'`{t}`'
        href = rt.get('href')
        if href: t = f'[{t}]({href})'
        parts.append(t)
    return ''.join(parts)

def blocks_to_md(blocks):
    if not blocks: return ''
    md = ''
    for b in blocks:
        t = b['type']
        c = rich_text_to_md(b.get(t,{}).get('rich_text'))
        if t == 'paragraph': md += c + '\n\n'
        elif t == 'heading_1': md += f'# {c}\n\n'
        elif t == 'heading_2': md += f'## {c}\n\n'
        elif t == 'heading_3': md += f'### {c}\n\n'
        elif t == 'bulleted_list_item': md += f'- {c}\n'
        elif t == 'numbered_list_item': md += f'1. {c}\n'
        elif t == 'quote': md += f'> {c}\n\n'
        elif t == 'divider': md += '---\n\n'
        elif t == 'code': md += f'```\n{c}\n```\n\n'
        elif t == 'callout':
            emoji = (b.get('callout',{}).get('icon') or {}).get('emoji','')
            md += f'> {emoji} {c}\n\n'
        elif t == 'image':
            url = ((b.get('image',{}).get('file') or b.get('image',{}).get('external')) or {}).get('url','')
            if url: md += f'![]({url})\n\n'
        elif t == 'bookmark':
            url = b.get('bookmark',{}).get('url','')
            if url: md += f'[Bookmark]({url})\n\n'
        elif t == 'table':
            for row in (b.get('table',{}).get('children') or []):
                cells = row.get('table',{}).get('cells') or []
                md += '| ' + ' | '.join(rich_text_to_md(c) for c in cells) + ' |\n'
            md += '\n'
        elif t == 'child_page':
            md += f'[📄 {b.get("child_page",{}).get("title","Page")}]\n\n'
        else:
            if c: md += c + '\n\n'
        if b.get('children'): md += blocks_to_md(b['children'])
    return md

def fetch_url(url):
    req = Request(url)
    with urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', errors='replace')

def mkdir(d):
    os.makedirs(d, exist_ok=True)

def main():
    log('\n⚔  ARCAMIS — Export Completo Contenuti\n', 'info')
    mkdir(os.path.join(OUT,'pages'))
    mkdir(os.path.join(OUT,'db'))
    mkdir(os.path.join(OUT,'mestieri'))
    mkdir(os.path.join(OUT,'docs'))
    stats = {'pages':0,'dbs':0,'sheets':0,'docs':0,'err':0}

    # 1. Pagine Wiki
    log(f'\n📄 FASE 1: Pagine Wiki ({len(PAGES)})', 'info')
    for p in PAGES:
        try:
            log(f"  → {p['l']}...")
            page = notion_get(f"https://api.notion.com/v1/pages/{p['id']}")
            blocks = notion_blocks(p['id'])
            md = blocks_to_md(blocks)
            data = {'k':p['k'],'title':p['l'],'icon':p['i'],'content':md,'lastModified':__import__('datetime').datetime.utcnow().isoformat()+'Z'}
            with open(os.path.join(OUT,'pages',p['k']+'.json'),'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            log(f"  ✅ {p['l']} ({len(md)} chars)", 'ok')
            stats['pages'] += 1
        except Exception as e:
            log(f"  ❌ {p['l']}: {e}", 'err')
            stats['err'] += 1
        time.sleep(DELAY)

    # 2. Database
    log(f'\n🗄️  FASE 2: Database ({len(DBS)})', 'info')
    for db in DBS:
        try:
            log(f"  → {db['label']}...")
            pages = notion_db(db['dbId'])
            with open(os.path.join(OUT,'db',db['name']+'.json'),'w') as f:
                json.dump(pages, f, ensure_ascii=False, indent=2)
            log(f"  ✅ {db['label']} ({len(pages)} items)", 'ok')
            stats['dbs'] += 1
        except Exception as e:
            log(f"  ❌ {db['label']}: {e}", 'err')
            stats['err'] += 1
        time.sleep(DELAY)

    # 3. Google Sheets
    log(f'\n📊 FASE 3: Google Sheets ({len(SHEETS)})', 'info')
    for sh in SHEETS:
        try:
            log(f"  → {sh['key']}...")
            url = f"https://docs.google.com/spreadsheets/d/{sh['sid']}/export?format=csv"
            if 'gid' in sh: url += f"&gid={sh['gid']}"
            csv_text = fetch_url(url)
            rows = []
            for line in csv_text.strip().split('\n'):
                cells, cur, in_q = [], '', False
                for ch in line:
                    if ch == '"': in_q = not in_q
                    elif ch == ',' and not in_q: cells.append(cur.strip()); cur = ''
                    else: cur += ch
                cells.append(cur.strip())
                rows.append(cells)
            fn = 'reputation.json' if sh['key'] == 'reputation' else sh['key']+'.json'
            with open(os.path.join(OUT,'mestieri',fn),'w') as f:
                json.dump(rows, f, ensure_ascii=False, indent=2)
            log(f"  ✅ {sh['key']} ({len(rows)} rows)", 'ok')
            stats['sheets'] += 1
        except Exception as e:
            log(f"  ⚠️  {sh['key']}: {e}", 'err')
            stats['err'] += 1
        time.sleep(DELAY)

    # 4. Google Docs
    log(f'\n📝 FASE 4: Google Docs ({len(DOCS)})', 'info')
    for doc in DOCS:
        try:
            log(f"  → {doc['key']}...")
            url = f"https://docs.google.com/document/d/{doc['did']}/export?format={doc['fmt']}"
            content = fetch_url(url)
            data = {'key':doc['key'],'content':content,'lastModified':__import__('datetime').datetime.utcnow().isoformat()+'Z'}
            with open(os.path.join(OUT,'docs',doc['key']+'.json'),'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            log(f"  ✅ {doc['key']} ({len(content)} chars)", 'ok')
            stats['docs'] += 1
        except Exception as e:
            log(f"  ⚠️  {doc['key']}: {e}", 'err')
            stats['err'] += 1
        time.sleep(DELAY)

    # Summary
    print('\n' + '═'*50)
    print('📊 RIEPILOGO EXPORT')
    print('═'*50)
    print(f"  Pagine Wiki:    {stats['pages']}/{len(PAGES)}")
    print(f"  Database:       {stats['dbs']}/{len(DBS)}")
    print(f"  Google Sheets:  {stats['sheets']}/{len(SHEETS)}")
    print(f"  Google Docs:    {stats['docs']}/{len(DOCS)}")
    print(f"  Errori:         {stats['err']}")
    print(f"  Output:         {OUT}/")
    print('═'*50)
    if stats['err'] == 0:
        log('\n✅ Export completato! Tutti i file sono in content/', 'ok')
    else:
        log(f"\n⚠️  Export completato con {stats['err']} errori.", 'err')

if __name__ == '__main__':
    main()
