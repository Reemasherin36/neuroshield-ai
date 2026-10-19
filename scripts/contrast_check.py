"""WCAG 2.x contrast audit for the colour pairs used in the UI (tokens from tailwind.config.ts).
Run: python scripts/contrast_check.py   (exit code 1 if any pair fails its required ratio)"""
import sys


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def over(fg, alpha, bg):
    f = [int(fg.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(bg.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(alpha * x + (1 - alpha) * y):02x}" for x, y in zip(f, b, strict=True))


T = dict(navy900="#0b2545", navy950="#071a33", navy100="#dde6f3", navy200="#b9cbe5", navy300="#8aa6cf", navy700="#223a61",
         navy50="#f1f5fb", white="#ffffff", ink="#0f1b2d", muted="#4a5b73", subtle="#5a6a80", teal700="#0f766e", teal800="#115e59",
         teal50="#effcf9", cyan300="#7ee3f5", alt="#f5f8fc", danger="#b42318", red50="#fef2f2", warn="#b45309", amber50="#fffbeb")
G = ["#071a33", "#0b2545", "#0b4f5c", "#0e7490"]  # hero gradient stops (tailwind hero-gradient)
ORB = "#14b8d8"  # blurred orb, 22% alpha, sits behind the left column
CHIP = "#071a33"  # glass-dark chip background, 40% alpha

pairs = [  # (name, fg, bg, required)
    ("body text on white", T["ink"], T["white"], 4.5), ("muted text on white", T["muted"], T["white"], 4.5),
    ("muted text on page bg", T["muted"], T["alt"], 4.5), ("subtle text on white", T["subtle"], T["white"], 4.5),
    ("subtle text on page bg", T["subtle"], T["alt"], 4.5), ("placeholder (subtle) on white", T["subtle"], T["white"], 4.5),
    ("primary button text", T["white"], T["teal700"], 4.5), ("primary button hover", T["white"], T["teal800"], 4.5),
    ("teal-700 link on white", T["teal700"], T["white"], 4.5), ("teal-800 on teal-50 (active nav)", T["teal800"], T["teal50"], 4.5),
    ("navy-700 icon on navy-50", T["navy700"], T["navy50"], 3.0), ("error text on white", T["danger"], T["white"], 4.5),
    ("error text on red-50", T["danger"], T["red50"], 4.5), ("warning text on amber-50", T["warn"], T["amber50"], 4.5),
    ("white on navy-900 (tooltip, model band)", T["white"], T["navy900"], 4.5), ("navy-100 on navy-950 (disclaimer bar)", T["navy100"], T["navy950"], 4.5),
    ("navy-200 on navy-950 (footer)", T["navy200"], T["navy950"], 4.5), ("navy-300 on navy-950 (footer small)", T["navy300"], T["navy950"], 4.5),
    ("navy-100 on navy-900 (model band)", T["navy100"], T["navy900"], 4.5), ("navy-200 on navy-900", T["navy200"], T["navy900"], 4.5),
    ("navy-200 on glass over navy-900", T["navy200"], over("#ffffff", 0.10, T["navy900"]), 4.5),
    ("cyan-300 on navy-900", T["cyan300"], T["navy900"], 4.5), ("navy-900 on white (hero button)", T["navy900"], T["white"], 4.5),
]
# Placement-aware hero checks. Left column text sits on gradient stops 1-3, with the orb behind stops 1-2.
for i, stop in enumerate(G[:3]):
    for name, fg in [("white (headline)", T["white"]), ("navy-100 (body and note)", T["navy100"]), ("cyan-300 (badge)", T["cyan300"])]:
        pairs.append((f"hero left: {name} on stop {i + 1} {stop}", fg, stop, 4.5))
for i, stop in enumerate(G[:2]):
    for name, fg in [("navy-100", T["navy100"]), ("cyan-300", T["cyan300"])]:
        pairs.append((f"hero left: {name} on stop {i + 1} + orb", fg, over(ORB, 0.22, stop), 4.5))
# Chips and the auth privacy note sit on stops 3-4 inside a dark glass panel.
for i, stop in enumerate(G[2:], start=3):
    pairs.append((f"chip white text on dark glass over stop {i}", T["white"], over(CHIP, 0.40, stop), 4.5))
    pairs.append((f"auth note navy-50 on dark glass over stop {i}", T["navy50"], over(CHIP, 0.40, stop), 4.5))

fails = 0
for name, fg, bg, req in pairs:
    r = ratio(fg, bg)
    ok = r >= req
    fails += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {r:5.2f} (need {req})  {name}")
print(f"\n{len(pairs) - fails}/{len(pairs)} pairs pass")
sys.exit(1 if fails else 0)
