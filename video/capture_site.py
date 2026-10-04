"""Capture the real Legible site (live server on :8766) as high-resolution stills for the demo film.

    ../.venv/Scripts/python capture_site.py      # writes public/shots/*.png + public/shots/rects.json
"""
import json
import pathlib

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent / "public" / "shots"
URL = "http://localhost:8766/"
RECTS = {}


def rects(page, root, names):
    """Boxes of child elements relative to `root`, in CSS pixels (zoom targets for the film)."""
    return page.evaluate("""([root, names]) => {
      const r = document.querySelector(root).getBoundingClientRect(), out = {};
      for (const [k, sel] of Object.entries(names)) {
        const el = document.querySelector(sel); if (!el) continue;
        const b = el.getBoundingClientRect();
        out[k] = { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
      }
      out._root = { w: r.width, h: r.height };
      return out;
    }""", [root, names])


def shot(page, selector, name, children=None):
    page.locator(selector).screenshot(path=str(OUT / f"{name}.png"))
    if children is not None:
        RECTS[name] = rects(page, selector, children)
    print("captured", name)


with sync_playwright() as p:
    OUT.mkdir(parents=True, exist_ok=True)
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(1500)

    # hero (viewport at the top) and the scenario block, arrows' moving dots hidden (re-animated in the film)
    page.screenshot(path=str(OUT / "hero.png"))
    print("captured hero")
    page.add_style_tag(content=".sc-arrow i { visibility: hidden; } .toast { display: none; } nav.top { display: none !important; }")
    page.locator("#scenario").scroll_into_view_if_needed()
    page.wait_for_timeout(1200)
    shot(page, "#scenario", "scenario", {"arrow1": ".sc-arrow:nth-of-type(2)", "arrow2": ".sc-arrow:nth-of-type(4)",
                                          "draft": "#scDraft", "check": "#scCheck", "client": "#scClient"})
    RECTS["scenario"]["arrows"] = page.evaluate("""() => {
      const r = document.querySelector('#scenario').getBoundingClientRect();
      return [...document.querySelectorAll('#scenario .sc-arrow')].map(a => { const b = a.getBoundingClientRect();
        return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }; });
    }""")

    # demo desk: before the check
    page.locator("#desk").scroll_into_view_if_needed()
    page.wait_for_timeout(2500)  # sentence colouring finishes
    children = {"legend": "#legend", "doc": "#doc", "draft": "#draft", "verify": "#verify", "card": "#card",
                "export": "#export"}
    shot(page, "#desk", "desk0", children)
    # line boxes of the court-of-appeal sentence, as the AI wrote it (before the check), for a precise highlight
    RECTS["desk0"]["wrongLines"] = page.evaluate("""() => {
      const i = A.draft.findIndex(v => (v.reason || '').includes('court of appeal') && (v.where || '').includes('13'));
      const r = document.querySelector('#desk').getBoundingClientRect();
      const span = document.querySelector(`#draft .d[data-i="${Math.max(i, 0)}"]`);
      return [...span.getClientRects()].map(b => ({ x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }));
    }""")

    # run the check (live API), then select the court-of-appeal sentence (§ 13)
    page.click("#verify")
    page.wait_for_function("document.getElementById('verify').textContent !== 'Checking…'", timeout=60000)
    page.wait_for_timeout(1200)
    shot(page, "#desk", "desk1", children)
    target = page.evaluate("""() => A.draft.findIndex(v => (v.reason || '').includes('court of appeal') && (v.where || '').includes('13'))""")
    page.click(f'#draft .d[data-i="{max(target, 0)}"]')
    page.wait_for_timeout(1500)  # doc scroll + thread
    shot(page, "#desk", "desk2", {**children, "target": ".s.target", "sel": ".d.sel", "apply": "#apply",
                                  "verdict": "#card .vh", "reason": "#card .reason"})

    # apply that fix, then every other one, then send
    page.click("#apply")
    page.wait_for_timeout(500)
    shot(page, "#desk", "desk3", {**children, "sel": ".d.sel"})
    page.wait_for_timeout(1200)
    blocked = page.evaluate("() => A.draft.map((v, i) => [i, v.verdict, !!v.applied]).filter(x => x[1] === 'block' && !x[2]).map(x => x[0])")
    for i in blocked:
        page.click(f'#draft .d[data-i="{i}"]')
        page.wait_for_timeout(300)
        if page.locator("#apply").count():
            page.click("#apply")
            page.wait_for_timeout(1600)
    page.evaluate("() => document.querySelectorAll('.toast').forEach(t => t.remove())")
    page.add_style_tag(content=".toast { display: block !important; }")
    page.click(f'#draft .d[data-i="{max(target, 0)}"]')
    page.wait_for_timeout(800)
    page.click("#export")
    page.wait_for_timeout(300)
    shot(page, "#desk", "desk4", {**children, "sel": ".d.sel"})
    RECTS["toast"] = page.evaluate("() => (document.querySelector('.toast') || {}).textContent || ''")

    # benchmark, after its bars have grown
    page.locator("#benchmark").scroll_into_view_if_needed()
    page.wait_for_timeout(1800)
    shot(page, "#benchmark", "bench", {"table": "#bench"})

    (OUT / "rects.json").write_text(json.dumps(RECTS, indent=1), encoding="utf-8")
    browser.close()
