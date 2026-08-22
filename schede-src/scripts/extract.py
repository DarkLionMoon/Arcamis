#!/usr/bin/env python3
"""Estrae i database homebrew dal foglio Excel Arcamis in JSON per la webapp."""
import json
import re
import sys
from pathlib import Path

import openpyxl

XLSX = Path(__file__).resolve().parent.parent / "SCHEDA AUTOMATICA ARCAMIS (IN PROVA).xlsx"
OUT = Path(__file__).resolve().parent.parent / "src" / "lib" / "data"
OUT.mkdir(parents=True, exist_ok=True)

wb = openpyxl.load_workbook(XLSX, data_only=True)


def val(ws, coord):
    v = ws[coord].value
    if isinstance(v, str):
        v = v.strip()
        if v in ("", "-"):
            return None
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def dump_rows(sheet_name: str, first_row: int, last_row: int, cols: dict, key_col: str):
    """Righe non vuote del foglio come lista di dict."""
    ws = wb[sheet_name]
    rows = []
    for r in range(first_row, last_row + 1):
        rec = {k: val(ws, f"{c}{r}") for k, c in cols.items()}
        key = rec.get(key_col)
        if key:
            rec["_row"] = r
            rows.append(rec)
    return rows


def clean(rec: dict) -> dict:
    return {k: v for k, v in rec.items() if v is not None and not k.startswith("_")}


# ---------------------------------------------------------------- attacchi
ATT_COLS = {
    "nome": "B",
    "dado": "G",
    "tipoDanno": "I",
    "categoria": "M",
    "gittata": "P",
    "monaco": "T",
    "bonusMagico": "V",
    "dadiBonus": "Y",
    "tipoDannoBonus": "AA",
    "caratteristicaSostitutiva": "AD",
    "proprieta": "AF",
    "usaModCaratteristica": "AN",
    "maestria": "AP",
    "testoMaestria": "AT",
    "graze": "AU",
}
attacchi = [clean(r) for r in dump_rows("Info Attacchi", 7, 180, ATT_COLS, "nome")]
for a in attacchi:
    if "monaco" in a:
        a["monaco"] = bool(a["monaco"])
    if "usaModCaratteristica" in a:
        a["usaModCaratteristica"] = bool(a["usaModCaratteristica"])
(OUT / "attacks.json").write_text(json.dumps(attacchi, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"attacks.json: {len(attacchi)} armi")

# ---------------------------------------------------------------- indossabili
WEAR_COLS = {
    "nome": "B",
    "bonusCA": "H",
    "maxDes": "J",
    "categoria": "M",
    "forzaRichiesta": "R",
    "furtivita": "U",
    "bonusCAMagico": "Y",
    "bonusCompetenze": "AC",
    "bonusAbilita": "AF",
    "bonusTS": "AH",
    "privilegi": "AJ",
    "trucchetti": "AP",
    "incantesimiPreparati": "AR",
}
indossabili = [clean(r) for r in dump_rows("Info Indossabili", 6, 210, WEAR_COLS, "nome")]
for w in indossabili:
    for k in ("bonusCA", "maxDes", "bonusCAMagico"):
        if k in w and isinstance(w[k], (int, float)):
            w[k] = int(w[k])
(OUT / "wearables.json").write_text(json.dumps(indossabili, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"wearables.json: {len(indossabili)} oggetti")

# ---------------------------------------------------------------- classi
CLS_COLS = {
    "classe": "B",
    "sottoclasse": "E",
    "difesaSenzaArmatura": "I",
    "dadoVita": "K",
    "bonusIniziativa": "M",
    "hpPerLivello": "O",
    "tsEcompetenze": "Q",
    "competenze1Liv": "X",
    "competenzeMulticlasse": "AB",
    "tipoIncantatore": "AG",
    "caratteristicaIncantatore": "AJ",
    "movimentoExtra": "AQ",
    "velocitaAumentata": "AS",
    "privilegi": "AW",
    "nomeVisualizzato": "AX",
}
raw_cls = dump_rows("Info Classi", 7, 145, CLS_COLS, "classe")
classi = {}
for r in raw_cls:
    nome = r["classe"]
    c = classi.setdefault(
        nome,
        {
            "nome": nome,
            "difesaSenzaArmatura": None,
            "dadoVita": None,
            "bonusIniziativa": None,
            "hpPerLivello": None,
            "tsEcompetenze": None,
            "competenze1Liv": None,
            "competenzeMulticlasse": None,
            "tipoIncantatore": None,
            "caratteristicaIncantatore": None,
            "movimentoExtra": None,
            "velocitaAumentata": None,
            "privilegi": [],
            "sottoclassi": [],
        },
    )
    sottoclasse = r.get("sottoclasse")
    if sottoclasse and sottoclasse != "-":
        sc = {"nome": sottoclasse}
        for src, dst in [
            ("difesaSenzaArmatura", "difesaSenzaArmatura"),
            ("privilegi", "privilegi"),
            ("nomeVisualizzato", "nomeVisualizzato"),
        ]:
            if r.get(src):
                sc[dst] = r[src]
        if "privilegi" in sc:
            sc["privilegi"] = [p.strip() for p in sc["privilegi"].split(",") if p.strip()]
        c["sottoclassi"].append(sc)
        continue
    # riga base
    for k in (
        "difesaSenzaArmatura", "dadoVita", "bonusIniziativa", "hpPerLivello",
        "tsEcompetenze", "competenze1Liv", "competenzeMulticlasse",
        "tipoIncantatore", "caratteristicaIncantatore", "movimentoExtra", "velocitaAumentata",
    ):
        if r.get(k) is not None:
            c[k] = r[k]
    if r.get("privilegi"):
        c["privilegi"].extend(p.strip() for p in r["privilegi"].split(",") if p.strip())

classi_list = list(classi.values())
(OUT / "classes.json").write_text(json.dumps(classi_list, ensure_ascii=False, indent=1), encoding="utf-8")
tot_sc = sum(len(c["sottoclassi"]) for c in classi_list)
print(f"classes.json: {len(classi_list)} classi, {tot_sc} sottoclassi")

# ---------------------------------------------------------------- specie
SPEC_COLS = {
    "nome": "B",
    "aumentoCaratteristiche": "F",
    "armaturaNaturale": "I",
    "velocita": "K",
    "hpBonus": "N",
    "resistenze": "P",
    "linguaggi": "X",
    "attacchiNaturali": "AA",
    "competenzeArmiArmature": "AE",
    "altriPrivilegi": "AJ",
    "trucchetti": "AP",
    "incantesimiPreparati": "AR",
    "privilegiTesto": "AU",
}
specie = []
ws = wb["Info Specie"]
for r in range(6, 145):
    nome = val(ws, f"B{r}")
    if not nome:
        continue
    rec = clean({k: val(ws, f"{c}{r}") for k, c in SPEC_COLS.items()})
    priv = rec.pop("privilegiTesto", None)
    if priv:
        # formato: "1° Nome (dettagli),1° Nome2,..." — split sicuro sulle virgole fuori parentesi
        parti = re.split(r",(?![^(]*\))", priv)
        feats = []
        for p in parti:
            p = p.strip()
            if not p:
                continue
            m = re.match(r"^(\d+)°\s*(.*)$", p)
            if m:
                lvl, testo = int(m.group(1)), m.group(2)
                nm = testo.split("(")[0].strip()
                dettaglio = testo[len(nm):].strip(" ()") or None
                feats.append({"livello": lvl, "nome": nm, "dettaglio": dettaglio})
            else:
                feats.append({"livello": 1, "nome": p, "dettaglio": None})
        rec["privilegi"] = feats
    specie.append(rec)
(OUT / "species.json").write_text(json.dumps(specie, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"species.json: {len(specie)} specie")

# ---------------------------------------------------------------- talenti & liste varie da Scheda col BF
ws = wb["Scheda"]
talenti = []
for r in range(1, 200):
    v = val(ws, f"BF{r}")
    if v and isinstance(v, str) and not v.startswith("="):
        talenti.append(v.strip())
# dedup preservando ordine
talenti = list(dict.fromkeys(talenti))
(OUT / "feats.json").write_text(json.dumps(talenti, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"feats.json: {len(talenti)} talenti/doni")

linguaggi = sorted({val(ws, f"AZ{r}") for r in range(69, 146) if val(ws, f"AZ{r}")}
                   | {val(ws, f"BE{r}") for r in range(69, 90) if val(ws, f"BE{r}")})
(OUT / "languages.json").write_text(json.dumps(linguaggi, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"languages.json: {len(linguaggi)} linguaggi")

backgrounds_lang = {}
for r in range(69, 76):
    bg, nl, ns = val(ws, f"BB{r}"), val(ws, f"BC{r}"), val(ws, f"BD{r}")
    if bg:
        backgrounds_lang[bg] = {"linguaggi": int(nl or 0), "strumenti": int(ns or 0)}
(OUT / "backgrounds.json").write_text(json.dumps(backgrounds_lang, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"backgrounds.json: {len(backgrounds_lang)} tipi background")

print("\nOK ->", OUT)
