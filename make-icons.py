#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор иконок и OG-картинки для «Базы Мастера».

Визуал НЕ выдуман: он повторяет SVG, который js/app.js (функция iPWA)
уже собирал в рантайме —
    <rect width="512" height="512" rx="96" fill="#001e50"/>
    <text ... font-size="200" font-weight="bold" fill="#00b0f0">VW</text>
Здесь те же цвета и та же надпись, но растеризованные в реальные файлы,
которые можно положить на сервер и прописать в manifest.webmanifest.

Запуск:  python3 make-icons.py [каталог-назначения]   (по умолчанию project/icons)
Нужен:   Pillow  (шрифт — любой TTF с кириллицей, путь в FONT ниже).

Создаёт:
    icon.svg            — векторный источник (any, масштабируется)
    favicon.ico         — 16/32/48 px (вкладка браузера, старые клиенты)
    apple-touch-icon.png— 180 px (домашний экран iOS)
    icon-192.png        — 192 px (манифест, purpose: any)
    icon-512.png        — 512 px (манифест, purpose: any, splash)
    maskable-512.png    — 512 px с безопасной зоной (purpose: maskable)
    og-image.png        — 1200×630 (Open Graph / Twitter Card)
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

FONT_CANDIDATES = [
    ('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
     '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'),
    ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
     '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
    ('/app/node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf',
     '/app/node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf'),
    ('C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf'),
]
FONT = FONT_REG = None
for _b, _r in FONT_CANDIDATES:                     # нужен любой TTF с кириллицей
    if os.path.exists(_b) and os.path.exists(_r):
        FONT, FONT_REG = _b, _r
        break
if FONT is None:
    sys.exit('Не найден TTF с кириллицей — пропишите пути в FONT_CANDIDATES')

NAVY = (0, 30, 80)          # #001e50 — фон иконки (как в iPWA)
CYAN = (0, 176, 240)        # #00b0f0 — надпись (как в iPWA)
BG_DARK = (10, 24, 48)      # #0a1830 — theme_color / background_color
WHITE = (238, 242, 249)     # #eef2f9 — основной текст приложения
MUTED = (160, 178, 205)
FAINT = (110, 130, 165)


def badge(size, radius_ratio=96 / 512, text_ratio=200 / 512, inset=0):
    """Квадратная иконка: скруглённый navy-фон + надпись VW (цвета из iPWA)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    box = [inset, inset, size - 1 - inset, size - 1 - inset]
    inner = box[2] - box[0] + 1
    d.rounded_rectangle(box, radius=int(inner * radius_ratio), fill=NAVY + (255,))
    f = ImageFont.truetype(FONT, int(inner * text_ratio))
    d.text(((box[0] + box[2] + 1) / 2, (box[1] + box[3] + 1) / 2),
           'VW', font=f, fill=CYAN + (255,), anchor='mm')
    return img


def on_canvas(icon, size, bg=None):
    """Иконка нужного размера; bg=None оставляет углы прозрачными."""
    c = (Image.new('RGBA', (size, size), bg + (255,)) if bg
         else Image.new('RGBA', (size, size), (0, 0, 0, 0)))
    c.paste(icon, ((size - icon.width) // 2, (size - icon.height) // 2), icon)
    return c


def fit(draw, text, path, size, maxw):
    """Кегль, при котором text гарантированно укладывается в maxw."""
    while size > 12:
        f = ImageFont.truetype(path, size)
        if draw.textlength(text, font=f) <= maxw:
            return f
        size -= 2
    return ImageFont.truetype(path, size)


def make_icons(out):
    os.makedirs(out, exist_ok=True)

    # ── векторный источник (тот же markup, что генерировал js/app.js) ──
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
           '<rect width="512" height="512" rx="96" fill="#001e50"/>'
           '<text x="256" y="320" font-family="Arial" font-size="200" '
           'font-weight="bold" fill="#00b0f0" text-anchor="middle">VW</text>'
           '</svg>\n')
    with open(os.path.join(out, 'icon.svg'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(svg)

    full = badge(512)
    on_canvas(full, 512).save(os.path.join(out, 'icon-512.png'), 'PNG', optimize=True)
    on_canvas(full.resize((192, 192), Image.LANCZOS), 192).save(
        os.path.join(out, 'icon-192.png'), 'PNG', optimize=True)
    # iOS игнорирует альфу и кладёт под неё свой фон — даём непрозрачный navy
    on_canvas(full.resize((180, 180), Image.LANCZOS), 180, bg=NAVY).save(
        os.path.join(out, 'apple-touch-icon.png'), 'PNG', optimize=True)

    # maskable: содержимое внутри безопасной зоны (80% от холста → отступ 10%)
    mask = badge(412, radius_ratio=0.5, text_ratio=200 / 512 * 0.86)
    on_canvas(mask, 512, bg=NAVY).save(
        os.path.join(out, 'maskable-512.png'), 'PNG', optimize=True)

    # ICO: 16/32/48
    src = on_canvas(full, 48)
    src.save(os.path.join(out, 'favicon.ico'), 'ICO', sizes=[(16, 16), (32, 32), (48, 48)])

    # ── OG-картинка 1200×630 ──
    W, H = 1200, 630
    og = Image.new('RGB', (W, H), BG_DARK)
    d = ImageDraw.Draw(og)
    for y in range(H):                                     # вертикальный градиент
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(
            int(BG_DARK[i] + (NAVY[i] - BG_DARK[i]) * t) for i in range(3)))
    b = badge(170)                                         # бейдж слева
    og.paste(b, (88, 230), b)

    X, RIGHT = 300, 1112
    MAXW = RIGHT - X
    f_kicker = fit(d, 'БАЗА МАСТЕРА', FONT, 34, MAXW)
    f_title = fit(d, 'Каталог запчастей VW Polo 6N', FONT, 62, MAXW)
    f_sub = fit(d, 'Оригинальные номера · VIN-дешифратор · PR-коды · регламенты ТО',
                FONT_REG, 30, MAXW)
    f_note = fit(d, 'Работает офлайн — интернет не нужен', FONT_REG, 26, MAXW)
    d.text((X, 176), 'БАЗА МАСТЕРА', font=f_kicker, fill=CYAN)
    d.text((X, 236), 'Каталог запчастей VW Polo 6N', font=f_title, fill=WHITE)
    d.text((X, 308), 'и Caddy 9K/9U · 1994–2003', font=f_title, fill=WHITE)
    d.text((X, 396), 'Оригинальные номера · VIN-дешифратор · PR-коды · регламенты ТО',
           font=f_sub, fill=MUTED)
    d.rounded_rectangle([88, 470, RIGHT, 476], radius=3, fill=CYAN)  # акцент
    d.text((88, 520), 'Работает офлайн — интернет не нужен', font=f_note, fill=FAINT)
    og.save(os.path.join(out, 'og-image.png'), 'PNG', optimize=True)


if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join('project', 'icons')
    make_icons(dst)
    for n in sorted(os.listdir(dst)):
        p = os.path.join(dst, n)
        print('%-24s %7d байт' % (n, os.path.getsize(p)))
