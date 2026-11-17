#!/usr/bin/env python3
"""Nimbus the study cloud: SVG source for the mascot moods and the app icon.

The same geometry is used by components/mascot/Mascot.tsx (react-native-svg).
Run: python3 design/nimbus.py  ->  design/nimbus-preview.html, design/icon.svg
"""
import os

OUT = os.path.dirname(os.path.abspath(__file__))
INK, OUTLINE, BLUSH = '#1b2430', '#7fb3e8', '#ff9db0'

# cloud = union of circles + a rounded base; drawn twice (thick outline layer, then fill) for a clean silhouette
PUFFS = [(100, 104, 50), (56, 120, 34), (144, 120, 34), (76, 80, 30), (124, 74, 36)]
BASE = (54, 112, 92, 46, 23)  # x, y, w, h, rx

def body(fill='url(#nb-body)', outline=OUTLINE, sw=9):
    x, y, w, h, rx = BASE
    shapes = ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}"/>' for cx, cy, r in PUFFS) + f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>'
    return (f'<g fill="{outline}" stroke="{outline}" stroke-width="{sw}" stroke-linejoin="round">{shapes}</g>'
            f'<g fill="{fill}">{shapes}</g>'
            # soft highlight on the top-left puff
            f'<ellipse cx="70" cy="70" rx="14" ry="8" fill="#fff" opacity=".9" transform="rotate(-30 70 70)"/>')

def eyes(kind='open', look=(0, 0)):
    dx, dy = look
    if kind == 'happy':
        return ''.join(f'<path d="M{x-9} {116} Q{x} {104} {x+9} {116}" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>' for x in (82, 118))
    out = ''
    for x in (82, 118):
        out += f'<ellipse cx="{x+dx}" cy="{112+dy}" rx="7.5" ry="10" fill="{INK}"/>'
        out += f'<circle cx="{x+dx+2.5}" cy="{108+dy}" r="3" fill="#fff"/>'
    return out

def cheeks():
    return ''.join(f'<ellipse cx="{x}" cy="128" rx="9" ry="5" fill="{BLUSH}" opacity=".65"/>' for x in (66, 134))

MOUTHS = {
    'smile': f'<path d="M90 128 Q100 138 110 128" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>',
    'open': f'<path d="M87 126 Q100 146 113 126 Z" fill="{INK}"/><path d="M93 135 Q100 141 107 135 Q100 131 93 135Z" fill="#ff7a90"/>',
    'hmm': f'<path d="M93 132 Q101 128 109 131" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>',
    'frown': f'<path d="M90 135 Q100 126 110 135" fill="none" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/>',
}

def extras(mood):
    if mood == 'think':
        return ('<circle cx="160" cy="58" r="5" fill="#9cc7f0"/><circle cx="172" cy="42" r="7" fill="#9cc7f0"/>'
                '<text x="176" y="30" font-family="Arial Rounded MT Bold, Arial" font-weight="700" font-size="26" fill="#0a66c2">?</text>')
    if mood == 'sad':
        return (f'<path d="M72 101 L90 95" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
                f'<path d="M128 101 L110 95" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
                '<path d="M150 84 Q156 96 150 100 Q144 96 150 84Z" fill="#6ec1ff"/>')
    if mood == 'celebrate':
        cap = ('<g transform="rotate(-12 112 46)"><path d="M78 46 L112 32 L146 46 L112 60 Z" fill="#1b2430"/>'
               '<rect x="98" y="50" width="28" height="12" rx="3" fill="#1b2430"/>'
               '<path d="M146 46 L146 66" stroke="#e5a50a" stroke-width="3"/><circle cx="146" cy="68" r="4" fill="#e5a50a"/></g>')
        conf = ''.join(f'<rect x="{x}" y="{y}" width="7" height="12" rx="2" fill="{c}" transform="rotate({r} {x} {y})"/>'
                       for x, y, c, r in [(28, 50, '#e5a50a', -20), (176, 92, '#4cc26a', 25), (34, 150, '#6b4fd8', 40), (170, 150, '#f07272', -35), (40, 92, '#0a66c2', 10)])
        stars = ''.join(f'<path d="M{x} {y-8} L{x+2.5} {y-2.5} L{x+8} {y} L{x+2.5} {y+2.5} L{x} {y+8} L{x-2.5} {y+2.5} L{x-8} {y} L{x-2.5} {y-2.5}Z" fill="#e5a50a"/>'
                        for x, y in [(22, 118), (180, 66)])
        return cap + conf + stars
    return ''

MOODS = {
    'idle': ('open', (0, 0), 'smile'),
    'happy': ('happy', (0, 0), 'open'),
    'think': ('open', (3, -4), 'hmm'),
    'sad': ('open', (0, 2), 'frown'),
    'celebrate': ('happy', (0, 0), 'open'),
}

DEFS = ('<defs><linearGradient id="nb-body" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="170">'
        '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e8fb"/></linearGradient></defs>')

def mascot(mood, shadow=True):
    e, look, m = MOODS[mood]
    sh = '<ellipse cx="100" cy="176" rx="52" ry="7" fill="#0a2540" opacity=".12"/>' if shadow else ''
    return f'{DEFS}{sh}{body()}{eyes(e, look)}{cheeks()}{MOUTHS[m]}{extras(mood)}'

def svg(inner, size=200, vb='0 0 200 200'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{vb}">{inner}</svg>'

def icon():
    bg = ('<defs><linearGradient id="ic-bg" x1="0" y1="0" x2="1" y2="1">'
          '<stop offset="0" stop-color="#2b8ef0"/><stop offset="1" stop-color="#0a4f9a"/></linearGradient>'
          '<linearGradient id="nb-body" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="170"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e8fb"/></linearGradient></defs>'
          '<rect width="1024" height="1024" fill="url(#ic-bg)"/>'
          '<circle cx="820" cy="190" r="260" fill="#fff" opacity=".07"/><circle cx="160" cy="900" r="300" fill="#fff" opacity=".05"/>')
    e, look, m = MOODS['happy']
    cloud = f'<g transform="translate(112 112) scale(4)">{body(outline="#0a4f9a", sw=7)}{eyes(e, look)}{cheeks()}{MOUTHS[m]}</g>'
    badge = ('<circle cx="770" cy="770" r="118" fill="#e5a50a" stroke="#fff" stroke-width="22"/>'
             '<path d="M712 772 L756 816 L834 728" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{bg}{cloud}{badge}</svg>'

def splash():
    # opaque: rendered on the splash background color so no transparency is needed
    return svg(DEFS + '<rect x="-40" y="-25" width="280" height="280" fill="#0a66c2"/>' + mascot('happy', shadow=False).replace(DEFS, ''), 1024, '-40 -25 280 280')

def android_fg():
    e, look, m = MOODS['happy']
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}<rect width="1024" height="1024" fill="#0a66c2"/>'
            f'<g transform="translate(262 230) scale(2.5)">{body(outline="#0a4f9a", sw=7)}{eyes(e, look)}{cheeks()}{MOUTHS[m]}</g></svg>')

if __name__ == '__main__':
    open(os.path.join(OUT, 'icon.svg'), 'w').write(icon())
    open(os.path.join(OUT, 'splash.svg'), 'w').write(splash())
    open(os.path.join(OUT, 'android-fg.svg'), 'w').write(android_fg())
    cards = ''.join(f'<figure>{svg(mascot(m), 180)}<figcaption>{m}</figcaption></figure>' for m in MOODS)
    open(os.path.join(OUT, 'nimbus-preview.html'), 'w').write(
        '<!doctype html><meta charset="utf-8"><title>Nimbus</title><style>body{font-family:system-ui;background:#f5f7fa;margin:24px}'
        '.row{display:flex;gap:16px;flex-wrap:wrap}figure{background:#fff;border-radius:16px;padding:12px;margin:0;text-align:center}'
        '.dark figure{background:#171e26;color:#e6ebf1}.dark{background:#0f141a;padding:16px;border-radius:16px;margin-top:16px}</style>'
        f'<h2>Nimbus</h2><div class="row">{cards}</div><div class="dark row">{cards}</div>'
        f'<h2>Icon</h2><div class="row"><img src="icon.svg" width="256" style="border-radius:56px"><img src="icon.svg" width="120" style="border-radius:27px"><img src="icon.svg" width="60" style="border-radius:13px"></div>')
    print('ok')
