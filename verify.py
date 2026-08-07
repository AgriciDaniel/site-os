#!/usr/bin/env python3
"""
Smoke test for the OS shell. Drives the running build with Playwright and
asserts the behaviours the design depends on, rather than only screenshotting it.

Run the server first:  npm start   (port 3100)
Then:                  python3 verify.py
"""
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
SHOTS = Path(__file__).resolve().parent / "verify-shots"
WIN = "[data-scheme=tertiary].\\@container"

results: list[tuple[bool, str]] = []


def check(ok: bool, label: str) -> bool:
    results.append((ok, label))
    print(f"  {'PASS' if ok else 'FAIL'}  {label}")
    return ok


def box(page):
    el = page.query_selector(WIN)
    return el.bounding_box() if el else None


def main() -> int:
    SHOTS.mkdir(exist_ok=True)

    # 1. The static HTML must carry real content, with no JS involved. This is
    #    the SEO claim and it is testable without a browser.
    print("static HTML (no JavaScript):")
    for path, needle in [("/", "A website visitors can"),
                         ("/products", "Explorer"),
                         ("/about", "Token system")]:
        html = urllib.request.urlopen(BASE + path, timeout=20).read().decode("utf-8", "ignore")
        check(needle in html, f"{path} server HTML contains {needle!r}")

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1600, "height": 1000})
        page = ctx.new_page()
        page.set_default_timeout(20000)

        # 2. The default product experience: one locked route window.
        print("\nlocked responsive shell:")
        locked = ctx.new_page()
        locked.goto(BASE + "/", wait_until="networkidle")
        locked.wait_for_timeout(1000)
        check(locked.get_attribute(".shell-root", "data-window-mode") == "locked",
              "locked window mode is the default")
        check(len(locked.query_selector_all(WIN)) == 1, "default has exactly one route window")
        check(locked.query_selector("[aria-label='Minimize window']") is None,
              "locked window omits minimize")
        check(not locked.query_selector_all(
            "button[aria-label^='Focus '], button[aria-label^='Restore ']"),
            "locked mode has no dock")

        locked_before = box(locked)
        locked.mouse.move(locked_before["x"] + 220, locked_before["y"] + 18)
        locked.mouse.down()
        locked.mouse.move(locked_before["x"] + 420, locked_before["y"] + 150, steps=10)
        locked.mouse.up()
        locked.wait_for_timeout(350)
        locked_after = box(locked)
        check(abs(locked_after["x"] - locked_before["x"]) < 2
              and abs(locked_after["y"] - locked_before["y"]) < 2,
              "locked title bar does not drag")

        expected_panels = {
            "Locked by default": "The frame stays put",
            "Responsive inside": "One page, shaped",
            "Free when invited": "The full desktop",
        }
        for label, heading in expected_panels.items():
            locked.get_by_role("tab", name=label).click()
            locked.wait_for_timeout(120)
            panel = locked.query_selector("[role=tabpanel]").inner_text()
            check(heading in panel, f"marketing tab {label!r} updates its panel")

        # Locked icons are single-click launchers, and navigation replaces the
        # one route window instead of opening a second copy.
        icon_routes = [
            ("home", "/", "Home"),
            ("products", "/products", "Products"),
            ("pricing", "/pricing", "Pricing"),
            ("notes", "/notes", "Notes"),
            ("terminal", "/terminal", "Terminal"),
            ("about", "/about", "About"),
            ("update", "/system-update", "System update"),
            ("trash", "/trash", "Trash"),
        ]
        for icon_id, path, title in icon_routes:
            locked.query_selector(f"[data-icon={icon_id}]").click()
            locked.wait_for_timeout(550)
            window_title = locked.query_selector(f"{WIN} > div span").inner_text().strip()
            check(locked.url.endswith(path), f"{icon_id} icon navigates to {path}")
            check(len(locked.query_selector_all(WIN)) == 1 and window_title == title,
                  f"{icon_id} replaces the one route window ({window_title!r})")

        locked.get_by_role("button", name="Close window").click()
        locked.wait_for_timeout(350)
        check(len(locked.query_selector_all(WIN)) == 0, "locked window closes")
        locked.query_selector("[data-icon=home]").click()
        locked.wait_for_timeout(900)
        check(len(locked.query_selector_all(WIN)) == 1, "single-click icon reopens the window")
        locked.screenshot(path=str(SHOTS / "00-locked-desktop.png"))
        locked.close()

        print("\ntablet locked shell:")
        tablet = ctx.new_page()
        tablet.set_viewport_size({"width": 768, "height": 1024})
        tablet.goto(BASE + "/", wait_until="networkidle")
        tablet.wait_for_timeout(900)
        tb = box(tablet)
        check(590 <= tb["width"] <= 615, f"tablet window uses ~80% width ({round(tb['width'])})")
        check(945 <= tb["height"] <= 970, f"tablet window uses ~95% height ({round(tb['height'])})")
        check(tablet.eval_on_selector(".shell-taskbar", "el => getComputedStyle(el).display") == "none",
              "tablet taskbar is hidden")
        tablet_overflow = tablet.eval_on_selector(
            ".app-scroll-viewport", "el => el.scrollWidth - el.clientWidth")
        check(tablet_overflow == 0, "tablet route window has no horizontal overflow")
        tablet.screenshot(path=str(SHOTS / "00-locked-tablet.png"))
        tablet.close()

        print("\nphone locked shell:")
        phone = ctx.new_page()
        phone.set_viewport_size({"width": 390, "height": 844})
        phone.goto(BASE + "/", wait_until="networkidle")
        phone.wait_for_timeout(900)
        pb = box(phone)
        check(round(pb["x"]) == 8 and round(pb["y"]) == 8
              and round(pb["width"]) == 374 and round(pb["height"]) == 828,
              f"phone window fills the inset shell ({pb})")
        visible_controls = [
            el.get_attribute("aria-label")
            for el in phone.query_selector_all(f"{WIN} [aria-label$='window']")
            if el.is_visible()
        ]
        check(visible_controls == ["Close window"],
              f"phone keeps only the close control ({visible_controls})")
        phone_overflow = phone.eval_on_selector(
            ".app-scroll-viewport", "el => el.scrollWidth - el.clientWidth")
        check(phone_overflow == 0, "phone route window has no horizontal overflow")
        phone.get_by_role("button", name="Close window").click()
        phone.wait_for_timeout(350)
        icons = phone.query_selector_all("[data-icon]")
        icon_xs = sorted({round(ic.bounding_box()["x"]) for ic in icons})
        check(len(icons) == 8 and len(icon_xs) == 3,
              f"phone launcher is an eight-icon, three-column grid ({icon_xs})")
        phone.query_selector("[data-icon=home]").click()
        phone.wait_for_timeout(800)
        check(len(phone.query_selector_all(WIN)) == 1,
              "phone icon opens its app with a single tap")
        phone.screenshot(path=str(SHOTS / "00-locked-phone.png"))
        phone.close()

        print("\nfree-window desktop mode:")
        page.goto(BASE + "/?experience=os&windows=free", wait_until="networkidle")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "01-desktop-light.png"))

        check(box(page) is not None, "a window rendered")

        # The default window must not sit on top of the desktop icon columns. The
        # first version nudged the homepage LEFT to "keep the wallpaper visible",
        # which parked it over the left column and hid every icon on that side.
        wb = box(page)
        leftcol = page.query_selector("[data-icon=home]").bounding_box()
        rightcol = page.query_selector("[data-icon=trash]").bounding_box()
        check(wb["x"] > leftcol["x"] + leftcol["width"],
              f"default window clears the LEFT icon column (win x={round(wb['x'])},"
              f" col ends {round(leftcol['x'] + leftcol['width'])})")
        check(wb["x"] + wb["width"] < rightcol["x"],
              f"default window clears the RIGHT icon column (win ends"
              f" {round(wb['x'] + wb['width'])}, col starts {round(rightcol['x'])})")
        check(page.query_selector("text=Products") is not None, "taskbar menu present")
        check(len(page.query_selector_all("#desktop-surface button")) >= 5,
              "desktop icons rendered")

        # 2. Drag: the window must actually move, and commit to state.
        print("\ndrag:")
        before = box(page)
        header = page.query_selector(f"{WIN} >> div")
        page.mouse.move(before["x"] + 200, before["y"] + 18)
        page.mouse.down()
        page.mouse.move(before["x"] + 340, before["y"] + 130, steps=12)
        page.wait_for_timeout(100)
        live = box(page)
        check(live is not None and abs(live["x"] - before["x"]) > 60,
              f"window follows the cursor before release "
              f"({round(before['x'])} -> {round(live['x'])})")
        page.mouse.up()
        page.wait_for_timeout(500)
        after = box(page)
        check(after is not None and abs(after["x"] - before["x"]) > 60,
              f"window moved on x ({round(before['x'])} -> {round(after['x'])})")
        check(abs(after["x"] - live["x"]) < 2 and abs(after["y"] - live["y"]) < 2,
              f"release preserves the live position "
              f"({round(live['x'])},{round(live['y'])} -> "
              f"{round(after['x'])},{round(after['y'])})")
        page.screenshot(path=str(SHOTS / "02-dragged.png"))

        # 3. Maximize, then restore to the EXACT previous geometry.
        print("\nmaximize and exact restore:")
        pre = box(page)
        page.keyboard.press("Shift+ArrowUp")
        page.wait_for_timeout(500)
        maxed = box(page)
        check(maxed["width"] > pre["width"] + 100, "maximize grew the window")
        page.screenshot(path=str(SHOTS / "03-maximized.png"))
        page.keyboard.press("Shift+ArrowUp")
        page.wait_for_timeout(500)
        back = box(page)
        check(abs(back["width"] - pre["width"]) < 2 and abs(back["x"] - pre["x"]) < 2,
              "restore returned exact geometry")

        # 4. Snap left, then unsnap.
        print("\nsnap:")
        page.keyboard.press("Shift+ArrowLeft")
        page.wait_for_timeout(500)
        snapped = box(page)
        check(snapped["x"] < 4 and snapped["width"] < 900, "snapped to left half")
        page.screenshot(path=str(SHOTS / "04-snapped-left.png"))
        page.keyboard.press("Shift+ArrowDown")
        page.wait_for_timeout(500)
        check(abs(box(page)["width"] - pre["width"]) < 2, "unsnap restored geometry")

        # 5. Resize from the west edge: width grows, RIGHT edge stays put.
        print("\nwest-edge resize:")
        r0 = box(page)
        right0 = r0["x"] + r0["width"]
        page.mouse.move(r0["x"] + 1, r0["y"] + r0["height"] / 2)
        page.mouse.down()
        page.mouse.move(r0["x"] - 120, r0["y"] + r0["height"] / 2, steps=12)
        page.mouse.up()
        page.wait_for_timeout(500)
        r1 = box(page)
        right1 = r1["x"] + r1["width"]
        check(r1["width"] > r0["width"] + 40, f"width grew ({round(r0['width'])} -> {round(r1['width'])})")
        check(abs(right1 - right0) < 12, f"right edge held ({round(right0)} -> {round(right1)})")
        page.screenshot(path=str(SHOTS / "05-resized-west.png"))

        # 6. Dark mode via the documented shortcut.
        print("\ntheming:")
        page.keyboard.press("\\")
        page.wait_for_timeout(600)
        check(page.evaluate("() => document.documentElement.classList.contains('dark')"),
              "backslash toggled dark mode")
        page.screenshot(path=str(SHOTS / "06-desktop-dark.png"))

        # Read through Playwright's selector engine: embedding the escaped
        # `\@container` class into a JS string literal loses an escape level.
        read_bg = "el => getComputedStyle(el).getPropertyValue('--bg').trim()"
        bgdark = page.eval_on_selector(WIN, read_bg)
        page.keyboard.press("\\")
        page.wait_for_timeout(600)
        bglight = page.eval_on_selector(WIN, read_bg)
        check(bgdark != bglight and bgdark and bglight,
              f"tertiary --bg differs by mode (dark {bgdark!r} vs light {bglight!r})")

        # 6b. <body> must resolve --bg in BOTH modes. If it does not, the frosted
        #     chrome blurs the browser's default canvas instead of the page.
        for mode in ('light', 'dark'):
            page.evaluate(
                f"() => {{ const r = document.documentElement;"
                f" r.classList.remove('light','dark'); r.classList.add('{mode}'); }}"
            )
            page.wait_for_timeout(400)
            bodybg = page.eval_on_selector(
                "body", "el => getComputedStyle(el).backgroundColor")
            opaque = bodybg not in ("rgba(0, 0, 0, 0)", "transparent")
            check(opaque, f"body has a real background in {mode} mode ({bodybg})")
        page.evaluate("() => { const r = document.documentElement;"
                      " r.classList.remove('dark'); r.classList.add('light'); }")
        page.wait_for_timeout(300)

        # 7. Panels.
        print("\npanels:")
        page.keyboard.press(".")
        page.wait_for_timeout(500)
        check(page.query_selector("[role=dialog]") is not None, "period opened shortcuts panel")
        page.screenshot(path=str(SHOTS / "07-shortcuts-panel.png"))
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        check(page.query_selector("[role=dialog]") is None, "escape dismissed panel")

        print("\nvisible shell controls:")
        page.get_by_role("button", name="Toggle color mode").click()
        page.wait_for_timeout(250)
        check(page.evaluate("() => document.documentElement.classList.contains('dark')"),
              "taskbar color-mode button switches to dark")
        page.get_by_role("button", name="Toggle color mode").click()
        page.wait_for_timeout(250)
        check(page.evaluate("() => document.documentElement.classList.contains('light')"),
              "taskbar color-mode button switches back to light")

        page.get_by_role("button", name="Keyboard shortcuts").click()
        page.wait_for_timeout(250)
        shortcuts = page.get_by_role("dialog", name="Keyboard shortcuts")
        check(shortcuts.is_visible(), "taskbar help button opens shortcuts")
        shortcuts.get_by_role("button", name="Esc").click()
        page.wait_for_timeout(250)
        check(page.query_selector("[role=dialog]") is None, "panel Esc button closes shortcuts")

        page.keyboard.press(",")
        page.wait_for_timeout(250)
        display = page.get_by_role("dialog", name="Display options")
        display_buttons = display.get_by_role("button").all()

        def click_display(label: str, occurrence: int = 0):
            matches = [button for button in display_buttons
                       if (button.inner_text() or "").strip().lower() == label.lower()]
            matches[occurrence].click()
            page.wait_for_timeout(180)

        wallpaper_before = page.evaluate("() => document.documentElement.dataset.wallpaper")
        click_display("dark")
        click_display("classic")
        click_display("on", 0)
        click_display("on", 1)
        click_display("Cycle")
        check(page.evaluate("() => document.documentElement.classList.contains('dark')"),
              "display panel dark button works")
        check(page.evaluate("() => document.documentElement.dataset.skin === 'classic'"),
              "display panel classic button works")
        check(page.evaluate("() => document.documentElement.dataset.transparency === 'opaque'"),
              "display panel transparency button works")
        check(page.query_selector("[data-fps]") is not None
              or "fps" in (page.inner_text("body") or "").lower(),
              "display panel frame-meter button works")
        check(page.evaluate("() => document.documentElement.dataset.wallpaper") != wallpaper_before,
              "display panel wallpaper button works")

        click_display("light")
        click_display("modern")
        click_display("off", 0)
        click_display("off", 1)
        display.get_by_role("button", name="Esc").click()
        page.wait_for_timeout(250)
        check(page.evaluate(
            "() => document.documentElement.classList.contains('light')"
            " && document.documentElement.dataset.skin === 'modern'"
            " && document.documentElement.dataset.transparency === 'blurred'"),
            "display controls reset to the default presentation")

        # 8. Close all first, so desktop icons are not sitting behind a window.
        print("\nclose all:")
        page.keyboard.press("Shift+X")
        page.wait_for_timeout(700)
        check(len(page.query_selector_all(WIN)) == 0, "shift+X closed all windows")
        page.screenshot(path=str(SHOTS / "09-empty-desktop.png"))

        # 9. Open two windows from desktop icons, and confirm a route that is
        #    already open gets focused rather than duplicated.
        print("\nmulti-window:")

        def open_icon(label: str) -> bool:
            # Case-insensitive: icon labels mix "Products" with "notes.md".
            for ic in page.query_selector_all("#desktop-surface button"):
                if label.lower() in (ic.inner_text() or "").lower():
                    ic.dblclick()
                    page.wait_for_timeout(1300)
                    return True
            return False

        check(open_icon("Products"), "opened Products from its desktop icon")
        n1 = len(page.query_selector_all(WIN))
        check(n1 == 1, f"one window open ({n1})")

        check(open_icon("Notes"), "opened Notes from its desktop icon")
        n2 = len(page.query_selector_all(WIN))
        check(n2 == 2, f"two windows open simultaneously ({n2})")
        page.screenshot(path=str(SHOTS / "08-two-windows.png"))

        # Each window must show ITS OWN route's content. Regression guard for the
        # App Router trap: `children` is a live slot, so storing it per window
        # made every window render the current route.
        pairs = page.eval_on_selector_all(
            WIN,
            """els => els.map(e => ({
                   title: e.querySelector('span')?.innerText?.trim(),
                   h1: e.querySelector('h1')?.innerText?.trim() }))""",
        )
        check(len(pairs) == 2, f"two windows to compare ({len(pairs)})")
        check(all(p["title"] and p["h1"] for p in pairs), "every window has a title and content")
        check(len({p["h1"] for p in pairs}) == 2,
              f"windows show DIFFERENT content ({[p['h1'] for p in pairs]})")
        titles = {p["title"] for p in pairs}
        check(titles == {"Products", "Notes"}, f"titles are the launched routes ({titles})")
        notes = next((p for p in pairs if p["title"] == "Notes"), None)
        check(notes is not None and notes["h1"] == "Adaptation notes",
              f"Notes window shows Notes content ({notes and notes['h1']!r})")
        prod = next((p for p in pairs if p["title"] == "Products"), None)
        check(prod is not None and prod["h1"] == "Products",
              f"Products window shows Products content ({prod and prod['h1']!r})")

        # Re-opening an already-open route must focus, not duplicate.
        open_icon("Products")
        n3 = len(page.query_selector_all(WIN))
        check(n3 == 2, f"no duplicate window for an already-open route ({n3})")

        # Minimize must not lose the window: it stays reachable from the taskbar.
        # Target the FOCUSED window; a plain selector returns the first in DOM
        # order, which is the one underneath.
        page.query_selector("[data-focused=true] button[aria-label='Minimize window']").click()
        page.wait_for_timeout(500)
        visible = len(page.query_selector_all(WIN))
        check(visible == 1, f"minimize hid one window ({n3} -> {visible})")
        page.screenshot(path=str(SHOTS / "11-minimized.png"))

        # 10. Ported features from the archived OS-Template.
        print("\nported: dock, terminal, classic skin:")

        # The dock is the only route back to a minimized window.
        dock = page.query_selector_all("button[aria-label^='Focus '], button[aria-label^='Restore ']")
        check(len(dock) >= 1, f"dock lists open windows ({len(dock)})")

        # The scanline overlay covers the whole desktop. If it is not
        # pointer-events-none it silently eats every desktop icon click, so this
        # check exists to catch that regression specifically.
        page.keyboard.press("Shift+X")
        page.wait_for_timeout(700)
        check(open_icon("Terminal"), "desktop icons still clickable under the scanline overlay")

        # The terminal must actually drive the shell, not just print.
        page.click(".font-mono input")
        page.keyboard.type("fetch")
        page.keyboard.press("Enter")
        page.wait_for_timeout(500)
        body = page.inner_text("body")
        check("os-shell-site" in body, "terminal `fetch` printed system info")

        page.keyboard.type("theme dark")
        page.keyboard.press("Enter")
        page.wait_for_timeout(700)
        check(page.evaluate("() => document.documentElement.classList.contains('dark')"),
              "terminal `theme dark` changed the shell mode")
        page.screenshot(path=str(SHOTS / "12-terminal.png"))

        page.keyboard.type("open /notes")
        page.keyboard.press("Enter")
        page.wait_for_timeout(1300)
        check(len(page.query_selector_all(WIN)) == 2, "terminal `open /notes` launched a window")

        page.keyboard.type("skin classic")
        page.keyboard.press("Enter")
        page.wait_for_timeout(700)
        check(page.evaluate("() => document.documentElement.dataset.skin === 'classic'"),
              "terminal `skin classic` switched the skin")
        radius = page.eval_on_selector(WIN, "el => getComputedStyle(el).borderRadius")
        check(radius != "20px", f"classic skin squares off window corners ({radius})")
        page.screenshot(path=str(SHOTS / "13-classic-skin.png"))

        # Traffic lights must keep their labels: colour alone cannot carry meaning.
        lights = page.eval_on_selector_all(
            "[data-focused=true] button[aria-label$='window']",
            """els => els.map(e => ({ label: e.getAttribute('aria-label'),
                                      bg: getComputedStyle(e).backgroundColor }))""",
        )
        check(len(lights) == 3, f"three window controls in classic skin ({len(lights)})")
        # Every light must actually be painted. A flat custom token that shadows a
        # stock Tailwind scale makes `bg-amber-400` resolve to nothing, which is
        # invisible rather than broken, so assert on the computed colour.
        transparent = [l["label"] for l in lights if l["bg"] in ("rgba(0, 0, 0, 0)", "transparent")]
        check(not transparent, f"all traffic lights are painted (unpainted: {transparent})")

        page.keyboard.type("theme light")
        page.keyboard.press("Enter")
        page.wait_for_timeout(400)

        # 11. Desktop icons: distinctness, both columns, and drag feel.
        print("\ndesktop icons:")
        # The terminal test above leaves focus inside its <input>, and the shell
        # deliberately suppresses single-key shortcuts while typing. So blur first,
        # or Shift+X silently does nothing and every icon ends up behind a window.
        page.evaluate("() => document.activeElement && document.activeElement.blur()")
        page.mouse.click(780, 620)
        page.wait_for_timeout(300)
        page.keyboard.press("Shift+X")
        page.wait_for_timeout(800)
        check(len(page.query_selector_all(WIN)) == 0,
              f"desktop cleared before icon tests ({len(page.query_selector_all(WIN))} windows)")

        icons = page.eval_on_selector_all(
            "[data-icon]",
            """els => els.map(e => {
                   const r = e.getBoundingClientRect();
                   const svg = e.querySelector('svg');
                   return { id: e.dataset.icon,
                            x: Math.round(r.x), y: Math.round(r.y),
                            paths: svg ? svg.querySelectorAll('path,rect,circle').length : 0,
                            art: svg ? svg.innerHTML : '' };
               })""",
        )
        check(len(icons) == 8, f"eight desktop icons ({len(icons)})")

        # Every icon must be a DIFFERENT drawing. The original set was one stroke
        # glyph in an identical box, so Products/Pricing/Terminal were the same
        # square. Comparing the SVG markup catches a regression to placeholders.
        art = {i["art"] for i in icons}
        check(len(art) == len(icons), f"every icon is a distinct drawing ({len(art)}/{len(icons)})")
        thin = [i["id"] for i in icons if i["paths"] < 3]
        check(not thin, f"every icon has real shape mass, not one thin glyph ({thin})")

        # Both edges populated, as in the reference.
        xs = sorted({i["x"] for i in icons})
        check(len(xs) >= 2 and (xs[-1] - xs[0]) > 600,
              f"icons occupy BOTH edges (columns at x={xs})")

        # A 4px nudge must NOT drag: it is under the 6px activation constraint,
        # so it stays a click. This is the defect that made dragging feel broken.
        target = page.query_selector("[data-icon=pricing]")
        b0 = target.bounding_box()
        page.mouse.move(b0["x"] + b0["width"] / 2, b0["y"] + b0["height"] / 2)
        page.mouse.down()
        page.mouse.move(b0["x"] + b0["width"] / 2 + 4, b0["y"] + b0["height"] / 2 + 3, steps=3)
        page.mouse.up()
        page.wait_for_timeout(400)
        b1 = page.query_selector("[data-icon=pricing]").bounding_box()
        check(abs(b1["x"] - b0["x"]) < 2 and abs(b1["y"] - b0["y"]) < 2,
              f"a 4px nudge does not move the icon (moved {round(b1['x']-b0['x'])},"
              f"{round(b1['y']-b0['y'])})")

        # A real drag must move it, and land on the grid.
        page.mouse.move(b0["x"] + b0["width"] / 2, b0["y"] + b0["height"] / 2)
        page.mouse.down()
        for i in range(1, 11):
            page.mouse.move(b0["x"] + b0["width"] / 2 + 210 * i / 10,
                            b0["y"] + b0["height"] / 2 + 130 * i / 10)
            page.wait_for_timeout(12)
        page.mouse.up()
        page.wait_for_timeout(500)
        b2 = page.query_selector("[data-icon=pricing]").bounding_box()
        check(abs(b2["x"] - b0["x"]) > 100, f"a real drag moves the icon (dx={round(b2['x']-b0['x'])})")
        # Grid is 96x100 with origin 16,12 relative to the desktop surface, which
        # starts below the 40px taskbar.
        gx = (round(b2["x"]) - 16) % 96
        check(gx in (0, 95, 1), f"drop snapped to the x grid (offset {gx})")
        page.screenshot(path=str(SHOTS / "21-icons-dragged.png"))

        # Double-click still opens after all that dragging.
        page.query_selector("[data-icon=pricing]").dblclick()
        page.wait_for_timeout(1400)
        n = len(page.query_selector_all(WIN))
        check(n == 1, f"double-click still opens after dragging ({n} windows)")

        # Close it, then relaunch from the SAME icon. This is the dead-end bug:
        # the pathname is still /pricing, so `openPath` took a shortcut that only
        # focused an existing window and did nothing when none existed. Every icon
        # stopped working after its window had been closed once.
        page.keyboard.press("Shift+W")
        page.wait_for_timeout(800)
        n = len(page.query_selector_all(WIN))
        check(n == 0, f"window closed ({n} windows)")
        page.query_selector("[data-icon=pricing]").dblclick()
        page.wait_for_timeout(1400)
        n = len(page.query_selector_all(WIN))
        check(n == 1, f"icon relaunches its app after its window was closed ({n} windows)")

        # "Tidy icons" restores the default layout. Clear windows first so the
        # right-click lands on bare desktop rather than on a window.
        page.keyboard.press("Shift+X")
        page.wait_for_timeout(800)
        page.mouse.click(780, 640, button="right")
        page.wait_for_timeout(800)
        # Match on role rather than a bare text selector: the menu is portalled
        # and several bars on the page also contain the word "icons".
        items = page.query_selector_all("[role=menuitem]")
        tidy = next((i for i in items if "Tidy icons" in (i.inner_text() or "")), None)
        check(tidy is not None,
              f"Tidy icons menu item present ({[i.inner_text().strip() for i in items]})")
        if tidy:
            tidy.click()
            page.wait_for_timeout(700)
            b3 = page.query_selector("[data-icon=pricing]").bounding_box()
            check(abs(b3["x"] - b0["x"]) < 3, "Tidy icons restored the default column")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        page.screenshot(path=str(SHOTS / "22-icons-tidy.png"))

        # 12. Explicit conventional mode on a phone viewport.
        print("\nconventional mode escape hatch:")
        mob = ctx.new_page()
        mob.set_viewport_size({"width": 390, "height": 844})
        mob.goto(BASE + "/?experience=boring", wait_until="networkidle")
        mob.wait_for_timeout(1200)
        check(mob.query_selector(WIN) is None, "no window chrome in conventional mode")
        check("website visitors can" in (mob.inner_text("body") or "").lower(),
              "content still readable in boring mode")
        mob.screenshot(path=str(SHOTS / "10-mobile-boring.png"), full_page=True)
        mob.close()

        b.close()

    passed = sum(1 for ok, _ in results if ok)
    total = len(results)
    print(f"\n{passed}/{total} checks passed. Screenshots in {SHOTS}")
    if passed < total:
        print("\nfailures:")
        for ok, label in results:
            if not ok:
                print(f"  - {label}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
