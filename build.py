#!/usr/bin/env python3
"""content/{ko,en,ja}.json -> public/index.html, public/en/index.html, public/ja/index.html

사용: python3 build.py            (갱신일은 UPDATED 상수)
본문 문자열은 신뢰된 원고이므로 HTML 일부(<b>, <span class="mono">)를 그대로 넣는다.
"""
import json
import re
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
SITE = "https://bio.joonlab98.com"
UPDATED = "2026-11-23"
EMAIL = "wns9133@gmail.com"
LANGS = ["ko", "en", "ja"]
LANG_NAMES = {"ko": "한국어", "en": "English", "ja": "日本語"}
SECTIONS = ["intro", "now", "teaching", "projects", "consulting", "writing", "career", "contact"]

FONTS = {
    "ko": "family=Hahmlet:wght@600&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans+KR:wght@400;500;600",
    "en": "family=Hahmlet:wght@600&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans+KR:wght@400;500;600",
    "ja": "family=Shippori+Mincho:wght@600&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans+JP:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500",
}
FONT_VARS = {
    "ko": ('"Hahmlet", "Noto Serif KR", serif', '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'),
    "en": ('"Hahmlet", Georgia, serif', '"IBM Plex Sans KR", system-ui, -apple-system, sans-serif'),
    "ja": ('"Shippori Mincho", "Hiragino Mincho ProN", serif', '"IBM Plex Sans JP", "Hiragino Sans", "IBM Plex Sans KR", sans-serif'),
}

e = html.escape


HANGUL = re.compile(r"[\uac00-\ud7a3]+(?:\s[\uac00-\ud7a3]+)*")


def hangul_lang(text, lang):
    return ' lang="ko"' if lang != "ko" and HANGUL.search(text) else ""


def wrap_hangul(text, lang):
    if lang == "ko":
        return text
    return HANGUL.sub(lambda m: f'<span lang="ko">{m.group(0)}</span>', text)


def page_url(lang):
    return SITE + ("/" if lang == "ko" else f"/{lang}/")


def links_row(links, ui):
    if not links:
        return ""
    out = []
    for l in links:
        out.append(f'<a href="{e(l["url"])}">{e(l["label"])} <span aria-hidden="true">↗</span></a>')
    return "".join(out)


def render(c):
    lang = c["lang"]
    ui, toc, meta = c["ui"], c["toc"], c["meta"]
    serif, sans = FONT_VARS[lang]
    og_name = "og.png" if lang == "ko" else f"og-{lang}.png"
    mail_href = f'mailto:{EMAIL}?subject={html.escape(__import__("urllib.parse").parse.quote(ui["mail_subject"]))}'

    # head: alternates
    alts = "\n".join(
        f'<link rel="alternate" hreflang="{l}" href="{page_url(l)}">' for l in LANGS
    ) + f'\n<link rel="alternate" hreflang="x-default" href="{page_url("ko")}">'
    og_alts = "\n".join(
        f'<meta property="og:locale:alternate" content="{json.load(open(ROOT/"content"/f"{l}.json"))["meta"]["og_locale"]}">'
        for l in LANGS if l != lang and (ROOT/"content"/f"{l}.json").exists()
    )
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": c["hero"]["name"],
        "alternateName": ["박준", "Park Joon", "パク・ジュン"],
        "url": page_url(lang),
        "image": SITE + "/assets/profile.jpg",
        "jobTitle": "AX Engineer",
        "worksFor": [{"@type": "Organization", "name": "AIRS Medical"}, {"@type": "Organization", "name": "JoonLab"}],
        "alumniOf": ["Kyoto University", "Okayama University"],
        "sameAs": ["https://github.com/joonlab", "https://www.linkedin.com/in/joonlab/", "https://www.youtube.com/@joonlab98", "https://joonlab98.com"],
    }

    # TOC
    toc_items = "\n".join(
        f'<li><a href="#{s}"{" aria-current=\"true\"" if i == 0 else ""}><span class="mono">{i+1:02d}</span>{e(toc[s])}</a></li>'
        for i, s in enumerate(SECTIONS)
    )
    lang_links = " ".join(
        (f'<a href="{"/" if l == "ko" else "/" + l + "/"}" hreflang="{l}" lang="{l}"'
         + (' aria-current="page"' if l == lang else "") + f' title="{LANG_NAMES[l]}"><span class="full">{LANG_NAMES[l]}</span><span class="short" aria-hidden="true">{l.upper()}</span></a>')
        for l in LANGS
    )

    def sechead(sid, num, extra=""):
        right = f'<span class="mono">{extra}</span>' if extra else ""
        return f'<div class="sechead"><h2 id="{sid}-h"><span class="mono secno">{num:02d}</span>{e(toc[sid])}</h2>{right}</div>'

    # NOW
    now_items = []
    for it in c["now"]["items"]:
        lines = "".join(f"<li>{x}</li>" for x in it["lines"])
        now_items.append(
            f'<li><span class="mono d">{e(it["date"])}</span><div><p class="t">{it["title"]}</p><ul class="sub">{lines}</ul></div></li>'
        )
    figs = "".join(
        f'<tr><td class="num">{e(f["num"])}</td><td>{f["what"]}</td><td class="src">{e(f["src"])}</td></tr>'
        for f in c["now"]["figures"]
    )

    # TEACHING
    t_items = []
    for g in c["teaching"]["groups"]:
        lines = "".join(f"<li>{x}</li>" for x in g["lines"])
        per = f'<span class="mono d2">{e(g["period"])}</span>' if g.get("period") else ""
        t_items.append(f'<li><div class="k"><p class="t">{e(g["org"])}</p>{per}</div><ul class="sub">{lines}</ul></li>')

    # PROJECTS
    p_items = []
    for i, p in enumerate(c["projects"]["items"], 1):
        more = ""
        btn = ""
        if p.get("more"):
            mid = f"m{i}"
            btn = f'<button class="more-btn" type="button" aria-expanded="false" aria-controls="{mid}" aria-describedby="p{i}-h">{e(ui["more"])}</button>'
            lis = "".join(f"<li>{x}</li>" for x in p["more"])
            more = f'<div class="more" id="{mid}"><div inert><ul>{lis}</ul></div></div>'
        row = links_row(p.get("links", []), ui) + btn
        row_html = f'<div class="row">{row}</div>' if row else ""
        p_items.append(
            f'<li><span class="no mono">{i:02d}</span><div>'
            f'<h3 id="p{i}-h">{e(p["title"])}</h3><p class="meta">{e(p["meta"])}</p>'
            f'<p class="what">{p["what"]}</p><p class="result">{p["result"]}</p>{row_html}{more}</div></li>'
        )
    pj = c["projects"]
    all_link = f'<p class="note">{e(pj["all_link_text"])} <a href="{e(pj["all_link_url"])}">{e(pj["all_link_label"])} <span aria-hidden="true">↗</span></a></p>'

    # CONSULTING
    c_items = "".join(
        f'<li><span class="mono d">{e(x["date"])}</span><div><p class="t">{e(x["title"])}</p><p class="b">{x["body"]}</p></div></li>'
        for x in c["consulting"]["items"]
    )
    # WRITING
    w_items = "".join(
        f'<li><span class="mono d">{e(x["kind"])}</span><div><p class="t"><a href="{e(x["url"])}">{e(x["title"])}</a></p><p class="b">{e(x["desc"])}</p></div></li>'
        for x in c["writing"]["items"]
    )
    # CAREER
    k_items = "".join(
        f'<li><span class="mono d">{e(x["date"])}</span><div><p class="t">{e(x["title"])}</p><p class="b">{e(x["body"])}</p></div></li>'
        for x in c["career"]["items"]
    )
    langs = "".join(
        f'<li><span lang="{ {"한국어":"ko","日本語":"ja","English":"en"}.get(x["name"], lang) }">{e(x["name"])}</span><span class="mono">{e(x["level"])}</span></li>'
        for x in c["career"]["langs"]
    )
    # CONTACT
    ct = "".join(
        f'<li><a href="{e(x["url"])}"><span>{e(x["label"])}</span><span class="desc">{e(x["desc"])} <span aria-hidden="true">↗</span></span></a></li>'
        for x in c["contact"]["links"]
    )

    h = c["hero"]
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(meta["title"])}</title>
<meta name="description" content="{e(meta["description"])}">
<link rel="canonical" href="{page_url(lang)}">
{alts}
<meta name="theme-color" content="#FCFCFB">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="박준 PARK JOON">
<meta property="og:title" content="{e(meta["title"])}">
<meta property="og:description" content="{e(meta["description"])}">
<meta property="og:url" content="{page_url(lang)}">
<meta property="og:image" content="{SITE}/assets/{og_name}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{meta["og_locale"]}">
{og_alts}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(meta["title"])}">
<meta name="twitter:description" content="{e(meta["description"])}">
<meta name="twitter:image" content="{SITE}/assets/{og_name}">
<script>try{{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}}catch(e){{}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{FONTS[lang]}&display=swap">
<link rel="stylesheet" href="/assets/site.css">
<style>:root{{--serif:{serif};--sans:{sans}}}</style>
<script type="application/ld+json">{json.dumps(person, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#main">{e(ui["skip"])}</a>
<div class="wrap">
  <aside class="rail">
    <div class="rail-top">
      <div class="site"><b>{e(h["name"])}</b>bio.joonlab98.com</div>
      <nav aria-label="{e(ui["toc_label"])}"><ol id="toc">
{toc_items}
      </ol></nav>
    </div>
    <div class="foot">
      <nav class="langs" aria-label="{e(ui["lang_label"])}">{lang_links}</nav>
      <span class="upd">{e(ui["updated"])} <span class="mono">{UPDATED}</span></span>
      <button class="themebtn" id="theme" type="button" data-dark="{e(ui["theme_to_dark"])}" data-light="{e(ui["theme_to_light"])}">{e(ui["theme_to_dark"])}</button>
    </div>
  </aside>

  <main id="main" tabindex="-1">
    <section id="intro" aria-labelledby="name">
      <div class="hero-in">
        <div class="idrow">
          <img class="photo" src="/assets/profile.jpg" width="72" height="72" alt="{e(ui["photo_alt"])}">
          <div>
            <h1 id="name">{e(h["name"])}</h1>
            <div class="en"{hangul_lang(h["name_sub"], lang)}>{e(h["name_sub"])}</div>
          </div>
        </div>
        <p class="lede">{e(h["lede"])}</p>
        <p class="role">{h["role"]}</p>
        <p class="subline">{e(h["sub"])}</p>
        <div class="actions">
          <a class="btn" href="{mail_href}">{e(ui["contact_btn"])}</a>
          <button class="copy" type="button" id="copy" data-mail="{EMAIL}" data-ok="{e(ui["copied"])}" data-fail="{e(ui["copy_fail"])}"><span class="mono">{EMAIL}</span> {e(ui["copy"])}</button>
          <span class="status" id="copy-status" role="status" aria-live="polite"></span>
        </div>
      </div>
    </section>

    <section id="now" aria-labelledby="now-h">
      {sechead("now", 2, (f"{e(ui['as_of'])} {UPDATED}" if lang == "en" else f"{UPDATED} {e(ui['as_of'])}"))}
      <ol class="list">{"".join(now_items)}</ol>
      <div class="figs">
        <h3>{e(c["now"]["fig_title"])}</h3>
        <table>
          <thead><tr><th scope="col">{e(ui["th_num"])}</th><th scope="col">{e(ui["th_what"])}</th><th scope="col">{e(ui["th_src"])}</th></tr></thead>
          <tbody>{figs}</tbody>
        </table>
      </div>
    </section>

    <section id="teaching" aria-labelledby="teaching-h">
      {sechead("teaching", 3)}
      <p class="intro">{e(c["teaching"]["intro"])}</p>
      <ol class="list grp">{"".join(t_items)}</ol>
    </section>

    <section id="projects" aria-labelledby="projects-h">
      {sechead("projects", 4, e(pj["note"]))}
      <ol class="proj">{"".join(p_items)}</ol>
      {all_link}
    </section>

    <section id="consulting" aria-labelledby="consulting-h">
      {sechead("consulting", 5)}
      <ol class="list">{c_items}</ol>
    </section>

    <section id="writing" aria-labelledby="writing-h">
      {sechead("writing", 6)}
      <ol class="list">{w_items}</ol>
    </section>

    <section id="career" aria-labelledby="career-h">
      {sechead("career", 7)}
      <ol class="list">{k_items}</ol>
      <div class="figs">
        <h3>{e(c["career"]["langs_title"])}</h3>
        <ul class="langlist">{langs}</ul>
      </div>
    </section>

    <section id="contact" aria-labelledby="contact-h">
      {sechead("contact", 8)}
      <ul class="links">{ct}</ul>
      <p class="note">{e(c["contact"]["note"])}</p>
    </section>

    <footer>{wrap_hangul(e(c["footer"]), lang)} · <span class="mono">{UPDATED}</span></footer>
  </main>
</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
"""


def main():
    for lang in LANGS:
        src = ROOT / "content" / f"{lang}.json"
        if not src.exists():
            print(f"skip {lang}: no content")
            continue
        c = json.load(open(src, encoding="utf-8"))
        out = PUBLIC / ("index.html" if lang == "ko" else f"{lang}/index.html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(c), encoding="utf-8")
        print("wrote", out)


if __name__ == "__main__":
    main()
