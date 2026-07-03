"""만세력 SQLite → 사주용 절입시각 JSON 내보내기.

- 월주 경계인 12절(節)만 추출: 소한~대설 (중기 제외)
- 일진 수식 (jdn - ANCHOR_JDN) % 60 을 days 테이블 전건과 대조. 불일치 시 중단.
실행: python scripts/export_saju_data.py  (저장소 루트에서)
"""
import json
import sqlite3
from pathlib import Path

DB = r"C:\Users\Hi\Desktop\test2\manseryeok.sqlite"
OUT = Path(__file__).resolve().parent.parent / "play" / "data" / "saju-terms.json"
ANCHOR_JDN = 2460671  # 2024-12-26 = 갑자일 (day_ganji=0)
JEOL = ["소한", "입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설"]

con = sqlite3.connect(DB)
cur = con.cursor()

rows = cur.execute("SELECT jdn, day_ganji FROM days").fetchall()
bad = [(j, g) for j, g in rows if (j - ANCHOR_JDN) % 60 != g]
if bad:
    raise SystemExit(f"일진 대조 실패: {len(bad)}/{len(rows)}건 불일치 → 중단. 예: {bad[:3]}")
print(f"일진 검증 OK: {len(rows)}건 전부 일치")

terms = {}
for year in range(1900, 2101):
    by_name = dict(
        cur.execute("SELECT term_name, term_kst FROM solar_terms WHERE year=?", (year,))
    )
    arr = []
    for name in JEOL:
        kst = by_name[name]  # 결손이면 KeyError로 중단
        arr.append(kst[5:7] + "-" + kst[8:10] + " " + kst[11:16])  # 'MM-DD HH:MM'
    terms[str(year)] = arr

OUT.parent.mkdir(parents=True, exist_ok=True)
payload = {
    "anchorJdn": ANCHOR_JDN,
    "note": "terms[year] = [소한,입춘,경칩,청명,입하,망종,소서,입추,백로,한로,입동,대설] 'MM-DD HH:MM' KST",
    "terms": terms,
}
OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"저장: {OUT} ({OUT.stat().st_size} bytes)")
