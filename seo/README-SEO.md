# SEO-пакет: sitemap.xml, robots.txt и боевой base URL

Дата: 2026-10-30 · версия приложения: **1.13.3 (не менялась)** · патчи **35** (дерево поставки) и **36** (живой репозиторий)

Задание владельца: «нужен рабочий sitemap». По ходу дела нашлась и устранена более
серьёзная проблема — `canonical` и Open Graph указывали на адрес, которого не существует.

---

## 1. Что было на сервере (проверено запросами 2026-10-30)

Живой сайт: **https://donignasio1989.github.io/polo-db/** — GitHub Pages публикуют
корень репозитория `DonIgnasio1989/polo-db`. Отдаётся версия **1.13.3**;
`js/app.js`, `css/app.css`, `data/update.json`, `sw.js`, `manifest.webmanifest`
совпали с рабочей копией **байт-в-байт**. `index.html` отличался только переводами
строк (в репозитории **LF**, у нас **CRLF**) и уже исправленным владельцем `url` в JSON-LD.

| Файл | Было | Стало |
|---|---|---|
| `sitemap.xml` | 283 Б, **1 URL** (только главная), без `xmlns:image` | 100 905 Б, **316 URL** |
| `robots.txt` | 84 Б: `User-agent: *` / `Allow: /` / `Sitemap:` | 1 394 Б: `Allow` + `Sitemap` + `Host` + **12 `Disallow`** |
| `canonical`, `og:url` | `https://donignasio1989.github.io/` → **404** «There isn't a GitHub Pages site here» | `https://donignasio1989.github.io/polo-db/` |
| `og:image`, `twitter:image` | `https://donignasio1989.github.io/icons/og-image.png` → **404** (превью в VK/Telegram без картинки) | `…/polo-db/icons/og-image.png` (проверено: 200, `image/png`) |
| `url` в JSON-LD | в репозитории уже `…/polo-db/`, в рабочей копии — корень | синхронизировано |

Что ещё показала проверка живого сайта (это и определило список `Disallow`):

| Отдают 200 | Отдают 404 |
|---|---|
| `/icons/og-image.png`, `/data/parts.json`, `/data/update.json`, `/manifest.webmanifest`, `/sw.js`, `/css/app.css` | `/restore/…`, `/docs/` |
| **`/data/vin-db.json` — 14 065 811 Б, 13 414 VIN** (поля: `vin`, `model`, `body`, `gen`, `year`, `plant`, `brand`, `paint`, `trim`, `prod_date`, `pr`) | `/data/vin-db.jsonl` |
| `/tools/validate-data.js`, `/tests/test_1106.js`, `/data-src/parts-06.json`, `/patches/README.md`, `/merged-data-src/…`, `/volkswagenclub-net/…` | `/vin-dump/…` (страница папки есть, файлов нет) |

⚠ **`Disallow` запрещает роботу обход, но не доступ по прямой ссылке.** Дамп VIN как
лежал открытым, так и лежит — приложение его само запрашивает, закрыть нельзя, не
сломав VIN-дешифратор. Если это нежелательно, вопрос решается не robots.txt
(варианты: не публиковать `vin-db.json` в репозитории, держать его на отдельном
хосте с доступом, или закрыть репозиторий) — по команде подготовлю разбор.

---

## 2. Состав sitemap — 316 URL

Данные берутся **из тех же файлов, что читает приложение**, — второго источника правды нет:

| Источник | Что дал |
|---|---|
| `data/parts.json` (4127 карточек) | 20 категорий, 285 пар «категория + подкатегория» |
| `data/sections.json` | 10 справочных разделов: Моменты затяжки (97 строк), Диагностика OBD (112), Лампы (16), Жидкости (17), Колёса (26), Электросхемы (12), Предохранители (27), Реле (26), Обозначения проводов (38), Пины (19) |
| `js/app.js` → `BASE_CATS`, `SEC_TABLE_IDS` | порядок категорий = порядок в сайдбаре; ID разделов-таблиц |

| Уровень | Шаблон | Штук | priority | changefreq |
|---|---|---|---|---|
| главная | `/polo-db/` + `<image:image>` (`icons/og-image.png`) | 1 | 1.0 | weekly |
| категория | `/polo-db/#/cat/Engine` | 20 | 0.8 | monthly |
| справочный раздел | `/polo-db/#/cat/Torque` | 10 | 0.7 | monthly |
| подкатегория | `/polo-db/#/cat/Engine/%D0%93%D0%A0%D0%9C` | 285 | 0.6 | monthly |
| **всего** | | **316** | | |

`lastmod` у всех — `2026-10-30` (дата релиза 1.13.3). Кириллица в `loc` —
percent-encoded (в sitemap разрешён только ASCII), максимальная длина URL 282 символа.

### Что сознательно не вошло

| Не вошло | Почему |
|---|---|
| `#/part/<oem>` — 4114 карточки | Технически можно, но это 4114 URL одного документа (см. §3) без выигрыша в индексации. Добавляется одной функцией `build_entries()`, если понадобится |
| `#/vin/<id>`, `#/maint/<id>` | Машины из гаража пользователя — на сервере их нет |
| `Favorites`, `Workshops`, `Log`, `Dash` | Локальные представления из `localStorage`, не контент |
| 103 карточки с пустым `sub` (Engine 32, Electrical 19, Body 11, Suspension 9, Brakes 9, Interior 7, Cooling 4, Maintenance 4, Heating 2, RoadKit 2, Fluids 2, Steering 1, Transmission 1) | Своего URL не получают: они видны на странице своей категории, которая в sitemap есть. Пустая подкатегория дала бы битый диплинк `#/cat/Engine/`. Сайдбар в `js/app.js:4366-4371` делает так же: `(p.sub||'').trim()`, пустые пропускает |
| `/data/*.json`, `/js/`, `/css/`, `/sw.js`, `/manifest.webmanifest`, `/icons/` | Служебные файлы приложения. В `robots.txt` они **не закрыты** — блокировка `/data/` сломала бы офлайн-каталог |

---

## 3. ⚠ Главное ограничение — честно

**Google и Яндекс не индексируют фрагмент после `#`.** Для поисковика все 315
«глубоких» URL — тот же документ, что и `/polo-db/`. Сitemap **не добавит страниц
в выдачу**. Он и не вредит: дублей не создаёт (`canonical` один, все 316 `loc`
уникальны), а ссылки **реально рабочие для человека** — `routeHash()` вызывается
в конце `init` (`js/app.js:7571`), поэтому открытие `/polo-db/#/cat/Engine/ГРМ`
сразу показывает нужную подкатегорию.

Вариант «главная + категории + подкатегории» выбран владельцем. Настоящая индексация
разделов возможна только через реальные пути (`/cat/Engine/`) — это отдельная работа:
history API вместо hash, серверный rewrite всех путей на `index.html` (на GitHub Pages —
через `404.html`) и смена формата копируемых ссылок. По команде оценю объём.

Два нюанса текущего роутинга (не дефекты sitemap):

1. При открытии `#/cat/<Cat>/<Sub>` **контент** фильтруется правильно, но папка
   категории в сайдбаре остаётся свёрнутой: ветка `#/cat/…` в `routeHash()`
   (`js/app.js:1510-1515`) ставит `activeCat`/`activeSub` и не трогает
   `SV.expandedCats`. Лечится строкой `SV.expandedCats[m[1]] = true;` — это правка
   рантайма, без команды не делаю.
2. Порядок подкатегорий в sitemap — по коду символа, в сайдбаре — `localeCompare(…, 'ru')`
   (`js/app.js:4373-4374`). На рабочесть ссылок не влияет; повторить ICU-сортировку
   в Python без выдумывания нельзя, поэтому оставлена детерминированная.

Проверено отдельно: `routeHash()` декодирует hash **дважды** (сначала всю строку, потом
захваченную группу), из-за чего имена с `%` открывались бы неверно, а `+` в
percent-encoding означает пробел. В данных таких нет — во всех 285 подкатегориях
отсутствуют `%`, `+`, `#`, `?`, `&` (максимальная длина имени 38 символов), так что
двойное декодирование безопасно. Если в каталоге появится имя с `%` — генератор
соберёт корректный percent-encoded URL, но открываться он будет неправильно: это
ограничение рантайма, а не sitemap.

---

## 4. robots.txt — что закрыто и почему

```
User-agent: *
Allow: /polo-db/
Allow: /polo-db/icons/
Disallow: /polo-db/data-src/              ← исходники каталога (22 файла)
Disallow: /polo-db/merged-data-src/       ← то же после слияния инструкций
Disallow: /polo-db/patches/               ← 35 диффов и modified/
Disallow: /polo-db/restore/               ← отчёты (на Pages и так 404)
Disallow: /polo-db/tests/                 ← тесты
Disallow: /polo-db/tools/                 ← инструменты сборки
Disallow: /polo-db/vin-dump/              ← исходники дампа VIN
Disallow: /polo-db/volkswagenclub-net/    ← разведка внешнего источника
Disallow: /polo-db/data/vin-db.json       ← 14 МБ, 13 414 VIN
Disallow: /polo-db/data/vin-db.jsonl
Disallow: /polo-db/data/filtered-vins.txt
Disallow: /polo-db/data/filtered-files.txt
Sitemap: https://donignasio1989.github.io/polo-db/sitemap.xml
Host: donignasio1989.github.io
```

`/data/` **не закрыт целиком**: `parts.json`, `categories.json`, `sections.json`,
`update.json` и прочие грузятся самим приложением — блокировка сломала бы каталог.
Пути заданы от корня сайта, поэтому при переносе на другой домен файл не правится —
достаточно пересобрать с новым `--base`.

Приложению robots.txt не мешает: `sw.js` его не кэширует (в `SHELL` только `./`,
`index.html`, `css/app.css`, `data/update.json`, `manifest.webmanifest`), а поисковые
роботы service worker не запускают.

---

## 5. Как применить

**Вариант А — патчем (рекомендую, репозиторий уже на 1.13.3):**

```bash
cd polo-db
git apply --check repo-patches/36-repo-live-seo.patch   # проверено на снимке main от 2026-10-30
git apply         repo-patches/36-repo-live-seo.patch
git status    # index.html, sitemap.xml, robots.txt + tools/build-sitemap.py, tools/test-build-sitemap.py
python3 tools/build-sitemap.py --check                  # 316 URL, 10 групп ✓
python3 tools/test-build-sitemap.py                     # негатив-тест 12/12 ✓
git commit -am "SEO: sitemap 316 URL, robots.txt, canonical/OG на /polo-db/"
```

Патч **36** собран поверх живого дерева (LF, с уже исправленным JSON-LD), поэтому
ложится без конфликта. Патчи 01–35 при этом не нужны.

**Вариант Б — файлами:**

```bash
cp project/sitemap.xml  <корень репозитория>/
cp project/robots.txt   <корень репозитория>/
cp project/tools/build-sitemap.py project/tools/test-build-sitemap.py <репозиторий>/tools/
# и вручную 5 строк в index.html: canonical, og:url, og:image, twitter:image, url в JSON-LD
```

**После выкладки** (проверить, что отдается новое):

```
https://donignasio1989.github.io/polo-db/sitemap.xml   → 100 905 Б, 316 <loc>
https://donignasio1989.github.io/polo-db/robots.txt    → 1 394 Б, 12 Disallow
```

Затем переотправить sitemap: Search Console → «Файлы Sitemap» → `sitemap.xml`;
Яндекс.Вебмастер → «Индексирование → Файлы Sitemap». В отчёте будет 1 URL
(см. §3) — это ожидаемо.

---

## 6. Генератор и проверки

```bash
python3 project/tools/build-sitemap.py --check                 # самопроверка, файлы не писать
python3 project/tools/build-sitemap.py --out project/dist      # положить в поставку
python3 project/tools/build-sitemap.py --base https://другой.домен/ --out .
python3 project/tools/test-build-sitemap.py                    # негатив-тест верификатора
```

Ключи: `--base`, `--parts`, `--sections`, `--appjs`, `--out`, `--lastmod`, `--image`,
`--no-robots`, `--check`. Пересобирать нужно после любой пересборки каталога
(`tools/build-parts.js`) и после добавления справочных разделов.

Самопроверки — 10 групп, все зелёные:

| № | Что проверяется | Результат |
|---|---|---|
| 1 | XML well-formed, корень `urlset`, namespace sitemaps.org 0.9 + image 1.1 | ✓ |
| 2 | Состав 1 + 20 + 10 + 285 = 316; первый URL — главная | ✓ |
| 3 | Каждый `loc`: уникальный (316/316), ASCII, абсолютный, в пределах base, ≤2048 (макс. 282), без ` "'<>`, не более одного `#` | ✓ |
| 4 | Каждый hash разбирается regex'ами `routeHash()` | ✓ |
| 5 | Round-trip: percent-decode → исходные `cat`/`sub`/`SectionId`, без потерь и лишних | ✓ |
| 6 | `lastmod` — валидная дата `YYYY-MM-DD` | ✓ |
| 7 | `priority` в 0.0–1.0, `changefreq` из списка протокола, обязательные теги не пусты | ✓ |
| 8 | `robots.txt`: ровно одна `Sitemap:` и она совпадает с base, есть `User-agent: *`, одна `Host:`, все 12 `Disallow` на месте | ✓ |
| 9 | Каждая `cat` из `parts.json` есть в sitemap; ⚠ про 103 карточки без `sub` (штатное) | ✓ |
| 10 | Лимиты протокола: ≤50 000 URL, ≤50 МБ | ✓ |

Негатив-тест (`test-build-sitemap.py`, **12/12**) подтверждает, что верификатор
не «всегда ОК»: дубль URL, не-ASCII в `loc`, битый `lastmod`, рассинхрон base/robots,
невалидный XML, пустой `loc`, `priority=7`, `changefreq=часто`, hash не из `routeHash()`,
отсутствие `Sitemap:`, robots без `Disallow` — поймано всё.

Попутно найден и исправлен дефект самого верификатора: на неразобранном hash он падал
с `AttributeError` вместо сообщения (проверки 5 и 9 теперь такие URL пропускают — их
уже поймала проверка 4).

---

## 7. Про версию — почему 1.13.3 осталась

Владелец выбрал «версию не поднимать». Частичный bump (только `meta[app-ui-ver]` и
`css/app.css?v=`) **сломал бы тест** `test_1106.js:244-252` «версия синхронна в 5 местах»:
он сравнивает `APP_VERSION`, `meta[app-ui-ver]`, `css?v=`, `appVersion` и
`changelog[0].version`. Поэтому версия не менялась нигде — 1.13.3 во всех пяти местах.

Побочные эффекты (осознанные):

- запись в `changelog` не добавлялась — она привязана к версии, а версия прежняя
  (в `update.json` по-прежнему 34 записи);
- `css/app.css?v=` не поднимался — стили не менялись, незачем перекачивать 186 КБ;
- `data/update.json` и `js/app.js` не тронуты, значит `DN`/`DV` и кэш пользователей
  не затрагиваются: обновление прилетит как обычная замена `index.html`.

---

## 8. Поставка и верификация

| Что | Где |
|---|---|
| Патч для дерева поставки: `index.html` (CRLF), `sitemap.xml`, `robots.txt`, `tools/build-sitemap.py`, `tools/test-build-sitemap.py` — 2848 строк | `patches/35-seo-sitemap-robots-baseurl.patch` |
| Патч для живого репозитория (LF, поверх вашего `index.html`) — 2846 строк | `repo-patches/36-repo-live-seo.patch` |
| Копии изменённых файлов | `patches/modified/` — **35 файлов** |
| Готовая поставка на сервер | `project/dist/` — **23 файла, 3.99 МБ** (21 файл извлечён из архива 1.13.3 и сверен с `project/` байт-в-байт, `index.html` обновлён, добавлены `sitemap.xml` + `robots.txt`) |
| Сквозная верификация | `verify35.py` |
| Архивы | `baza-mastera-1.13.3-seo.zip` и `.tar.gz` — **142 файла** (~2.25 МБ / ~2.17 МБ), `build-archive.py` с самопроверкой содержимого: «всё байт-в-байт ✓». Прежние `baza-mastera-1.13.3.zip/.tar.gz` удалены как устаревшие |

Прогон `verify35.py` (чистое дерево из `uploads/` → все патчи → тесты):

```
чистое дерево: 85 файлов из 85 ожидаемых
патчей: 35 (патчи для живого репозитория лежат в repo-patches/ и тут не применяются)
git apply: ВСЕ 35/35 ✓
modified/: 35/35 файлов байт-в-байт ✓
tests/test_instructions.js: 55 ok, 0 fail
tests/test_1106.js:         37 ok, 0 fail   ← «версия синхронна в 5 местах» зелёный
tests/test_sections_1110.js: 50/1 (прежний честный провал T3: нет tools/build-sections.py)
check-engines: S:52 R:0 A:63 O:0 N:1 X:11, ENGINES 53, REF 63 · --strict → exit 0
build-sitemap --check: 316 URL = 1 + 20 + 10 + 285
SEO-блок: ✓ все loc под боевым base, ASCII, уникальны, разбираются routeHash();
          canonical/og:url/og:image/twitter:image/JSON-LD синхронны; robots.txt — 1 Sitemap + 12 Disallow
ИТОГ: ✅ верификация пройдена
```

Прочие проверки: `validate-data` — 0 ошибок / 6 предупреждений; `build-instructions --check` —
82 записи / 0 ошибок / 4127 карточек; CJK-скан 11 изменённых файлов — 0 иероглифов.

---

## 9. Состав папки `seo/`

| Файл | Что это |
|---|---|
| `README-SEO.md` | этот документ |
| `sitemap.xml`, `robots.txt` | собранные файлы — **копии `project/sitemap.xml` и `project/robots.txt`** (md5 совпадают) |
| `build-sitemap.py`, `test-build-sitemap.py` | копии `project/tools/…` (md5 совпадают); боевые — в `project/tools/` |
| `fix-index-base-url.py` | разовый скрипт правки `index.html` — **уже применён**, повторный запуск упадёт на assert (вхождения старого хоста кончились). Оставлен как документирование правки; то же самое делает патч 35/36 |
| `check-patch36.py` | сверка патча 36: применяет его к снимку живого репозитория (`live/`) и сравнивает результат с `project/` — 5/5 байт-в-байт ✓ |
| `ЖУРНАЛ-2026-10-30.md` | хронология и доказательства: разведка сайта, замеры «что торчит наружу», данные для sitemap, решения владельца, почему версия осталась 1.13.3, все прогоны |
