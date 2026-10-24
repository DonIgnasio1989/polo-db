#!/usr/bin/env bash
# ============================================================
# tools/make-sample.sh — сделать ОТПРАВИМЫЙ образец дампа ETKA
# ------------------------------------------------------------
# Берёт первые N файлов из папки дампа, по M строк из каждого,
# конвертирует CP1251 → UTF-8 и склеивает в один маленький файл
# etka-sample.txt (десятки КБ) — его и можно прислать в чат.
#
# Запуск (Git Bash / Linux):
#   bash tools/make-sample.sh "D:/etka-dump" [файлов=3] [строк=60]
#   bash tools/make-sample.sh "D:/etka-dump" 3 60 etka-sample.txt
# ============================================================
set -e
SRC="${1:?укажите папку дампа, например D:/etka-dump}"
COUNT="${2:-3}"
LINES="${3:-60}"
OUT="${4:-etka-sample.txt}"

: > "$OUT"
i=0
for f in "$SRC"/*.txt; do
    [ -e "$f" ] || continue
    i=$((i+1))
    [ "$i" -gt "$COUNT" ] && break
    {
        echo "==================== FILE $i: $(basename "$f") ===================="
        # iconv есть в Git Bash; если файл уже UTF-8 — пробуем его первым
        if head -c 4096 "$f" | iconv -f UTF-8 -t UTF-8 >/dev/null 2>&1; then
            head -n "$LINES" "$f"
        else
            head -n "$LINES" "$f" | iconv -f CP1251 -t UTF-8//TRANSLIT 2>/dev/null \
              || head -n "$LINES" "$f" | iconv -f CP1251 -t UTF-8 2>/dev/null \
              || { echo "!! не смог перекодировать — файл как есть (может быть CP1251)"; head -n "$LINES" "$f"; }
        fi
        echo ""
    } >> "$OUT"
done
[ "$i" -eq 0 ] && { echo "в $SRC не найдено .txt"; exit 1; }
echo "готово: $OUT ($(wc -c < "$OUT") байт, файлов: $((i-1 >= COUNT ? COUNT : i)))"
