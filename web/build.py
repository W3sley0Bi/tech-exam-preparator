#!/usr/bin/env python3
"""Build data/questions.js and data/notes.js for the AZ-900 prep app.

Inputs:
  data/raw/page-*.json   scraped Examprepper pages (list of slim questions)
  notes/*.md             Obsidian notes (copied from vault), images in notes/img/
Outputs:
  data/questions.js      window.QUESTIONS = [...]
  data/notes.js          window.NOTES = [...]
  img/q/*                locally cached question/answer images
"""
import json, os, re, glob, hashlib, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(ROOT, 'data', 'raw')
IMG = os.path.join(ROOT, 'img', 'q')
os.makedirs(IMG, exist_ok=True)

# --- domain classification (official skills outline, July 2026) ---------------
D1 = ['iaas', 'paas', 'saas', 'infrastructure as a service', 'platform as a service', 'software as a service',
      'public cloud', 'private cloud', 'hybrid cloud', 'hybrid', 'capital expenditure', 'capex', 'operational expenditure',
      'opex', 'consumption-based', 'consumption based', 'elastic', 'elasticity', 'scalab', 'scale out', 'scale up',
      'high availability', 'highly available', 'fault toleran', 'disaster recovery', 'agility', 'shared responsibility',
      'serverless', 'economies of scale', 'expenditure', 'cloud model', 'reliability', 'predictab']
D3 = ['azure policy', 'policies', 'policy', 'resource lock', 'lock', 'tag', 'cost', 'pricing calculator',
      'total cost of ownership', 'tco', 'advisor', 'azure monitor', 'service health', 'log analytics',
      'application insights', 'arm template', 'resource manager', 'cloud shell', 'powershell', 'azure cli', 'cli',
      'azure portal', 'azure arc', 'blueprint', 'purview', 'compliance', 'service trust', 'trust center', 'sla',
      'service level agreement', 'support plan', 'privacy', 'gdpr', 'budget', 'reservation', 'reserved instance',
      'cost management', 'preview', 'general availability', 'bicep', 'infrastructure as code', 'alert', 'governance']
D2 = ['virtual machine', 'vm', 'scale set', 'availability set', 'availability zone', 'region', 'datacenter',
      'resource group', 'subscription', 'management group', 'container', 'kubernetes', 'aks', 'function', 'app service',
      'web app', 'virtual network', 'vnet', 'subnet', 'peering', 'vpn', 'expressroute', 'dns', 'endpoint', 'storage',
      'blob', 'archive', 'tier', 'redundan', 'lrs', 'grs', 'zrs', 'azcopy', 'storage explorer', 'file sync', 'migrate',
      'data box', 'entra', 'azure ad', 'active directory', 'sso', 'single sign-on', 'multi-factor', 'mfa',
      'passwordless', 'conditional access', 'rbac', 'role-based', 'zero trust', 'defense in depth', 'defender',
      'sentinel', 'firewall', 'ddos', 'network security group', 'nsg', 'key vault', 'cosmos', 'sql', 'database',
      'virtual desktop', 'iot', 'machine learning', 'cognitive', 'devops', 'synapse', 'hdinsight', 'load balancer',
      'application gateway', 'bastion', 'front door', 'traffic manager', 'cdn']

def kw_score(text, words):
    s = 0
    for w in words:
        if re.search(r'(?<![a-z])' + re.escape(w), text):
            s += 1
    return s

def classify(q):
    t = ' '.join([q['text'], ' '.join((q.get('ch') or {}).values()), q.get('d', '')]).lower()
    scores = {'concepts': kw_score(t, D1) * 1.2, 'architecture': kw_score(t, D2), 'management': kw_score(t, D3) * 1.1}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'architecture'

# --- images ------------------------------------------------------------------
def local_name(url):
    ext = os.path.splitext(url.split('?')[0])[1] or '.png'
    return hashlib.sha1(url.encode()).hexdigest()[:16] + ext

def fetch_img(url):
    path = os.path.join(IMG, local_name(url))
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return url, True
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        with open(path, 'wb') as f:
            f.write(data)
        return url, True
    except Exception as e:
        print('  image failed', url, e)
        return url, False

# --- community answer parsing --------------------------------------------------
def parse_community(ac):
    """['B (90%)', '7%'] -> [{'ans':'B','pct':90}] (entries without a letter are dropped)"""
    out = []
    for s in ac or []:
        m = re.match(r'\s*([A-Z]+)\s*\((\d+)%\)', s)
        if m:
            out.append({'ans': m.group(1), 'pct': int(m.group(2))})
    return out

def build_questions():
    files = sorted(glob.glob(os.path.join(RAW, 'page-*.json')), key=lambda p: int(re.findall(r'\d+', p)[-1]))
    qs = []
    for f in files:
        qs.extend(json.load(open(f)))
    seen, uniq = set(), []
    for q in sorted(qs, key=lambda q: q['n']):
        if q['n'] in seen:
            continue
        seen.add(q['n'])
        uniq.append(q)

    urls = {u for q in uniq for u in q['qi'] + q['ai']}
    print(f'{len(uniq)} questions, {len(urls)} images')
    ok = {}
    with cf.ThreadPoolExecutor(8) as ex:
        for url, good in ex.map(fetch_img, sorted(urls)):
            ok[url] = good
    img = lambda u: ('img/q/' + local_name(u)) if ok.get(u) else u

    out = []
    for q in uniq:
        community = parse_community(q['ac'])
        site = (q['a'] or '').strip()
        best = community[0]['ans'] if community and community[0]['pct'] >= 50 else (site or (community[0]['ans'] if community else ''))
        out.append({
            'n': q['n'],
            'domain': classify(q),
            'text': q['text'],
            'choices': dict(sorted(q['ch'].items())) if q['ch'] else None,
            'mc': bool(q['mc'] and q['ch']),
            'answer': best,
            'site': site,
            'community': community,
            'desc': q['d'],
            'qimg': [img(u) for u in q['qi']],
            'aimg': [img(u) for u in q['ai']],
            'comments': q['cm'],
        })
    merge_conversions(out)
    with open(os.path.join(ROOT, 'data', 'questions.js'), 'w') as f:
        f.write('window.QUESTIONS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    by = {}
    for q in out:
        by[q['domain']] = by.get(q['domain'], 0) + 1
    print('domains:', by, '| MC:', sum(q['mc'] for q in out))

# --- AI conversions (data/convert/out, produced from data/convert/SPEC.md) ------
KINDS = {'yesno', 'dropdown', 'match', 'multiselect'}

def valid_ix(c):
    if c.get('kind') == 'multiselect':
        opts, ans = c.get('options') or [], c.get('answers') or []
        return len(opts) >= 2 and ans and all(a in opts for a in ans)
    items = c.get('items') or []
    return c.get('kind') in KINDS and items and all(
        len(it.get('options') or []) >= 2 and it.get('answer') in it['options'] for it in items)

def merge_conversions(out):
    conv_dir = os.path.join(ROOT, 'data', 'convert', 'out')
    by_n = {q['n']: q for q in out}
    converted = rejected = 0
    for f in sorted(glob.glob(os.path.join(conv_dir, 'batch-*.json'))):
        for c in json.load(open(f)):
            q = by_n.get(c.get('n'))
            if not q or q['mc']:
                continue
            if c.get('domain') in ('concepts', 'architecture', 'management'):
                q['domain'] = c['domain']
            if valid_ix(c):
                q['ix'] = {k: c.get(k) for k in ('kind', 'prompt', 'items', 'options', 'answers', 'confidence', 'note')}
                converted += 1
            elif c.get('kind') != 'unsupported':
                rejected += 1
    mcd = os.path.join(conv_dir, 'mc-domains.json')
    if os.path.exists(mcd):
        for n, v in json.load(open(mcd)).items():
            q = by_n.get(int(n))
            if q and q['mc']:
                if v.get('domain') in ('concepts', 'architecture', 'management'):
                    q['domain'] = v['domain']
                if v.get('note'):
                    q['review_note'] = v['note']
    print(f'interactive: {converted} converted, {rejected} rejected as invalid')
    tagged = 0
    for f in sorted(glob.glob(os.path.join(conv_dir, 'skills-*.json'))):
        for n, sid in json.load(open(f)).items():
            q = by_n.get(int(n))
            if q:
                q['skill'] = sid; tagged += 1
    print(f'skills: {tagged} questions tagged')

def build_curriculum():
    units = json.load(open(os.path.join(ROOT, 'data', 'curriculum.json')))
    sn = os.path.join(ROOT, 'data', 'convert', 'out', 'skill-notes.json')
    notes = json.load(open(sn)) if os.path.exists(sn) else {}
    for u in units:
        for sk in u['skills']:
            sk['notes'] = notes.get(sk['id'], [])
    with open(os.path.join(ROOT, 'data', 'curriculum.js'), 'w') as f:
        f.write('window.CURRICULUM = ' + json.dumps(units, ensure_ascii=False) + ';\n')

# --- notes ---------------------------------------------------------------------
NOTE_ORDER = [
    ('concepts', 'Introduction to cloud (az-900) - Describe cloud concepts.md', 'Describe cloud concepts'),
    ('architecture', 'Describe Azure architecture and services.md', 'Describe Azure architecture and services'),
    ('management', 'Describe Azure management and governance.md', 'Describe Azure management and governance'),
    ('practice', 'practice.md', 'Practice notes'),
]

def build_notes():
    notes = []
    for nid, fname, title in NOTE_ORDER:
        p = os.path.join(ROOT, 'notes', fname)
        if not os.path.exists(p):
            continue
        md = open(p, encoding='utf-8').read()
        md = re.sub(r'!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]', lambda m: f'![](notes/img/{m.group(1).replace(" ", "%20")})', md)
        notes.append({'id': nid, 'title': title, 'md': md})
    with open(os.path.join(ROOT, 'data', 'notes.js'), 'w') as f:
        f.write('window.NOTES = ' + json.dumps(notes, ensure_ascii=False) + ';\n')
    print(f'{len(notes)} notes')

if __name__ == '__main__':
    build_notes()
    build_curriculum()
    if glob.glob(os.path.join(RAW, 'page-*.json')):
        build_questions()
