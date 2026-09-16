"""Generate bright, airy, on-brand hero and banner creatives from the campaign
photos. The studio shots have dark green/red/maroon backdrops; this relights
them and dissolves the dark edges into the brand ivory with a warm-gold glow,
so they read light and premium in line with the Rudrika kit.

Source: assets/photos/rudrika-NN.jpg  ->  assets/creatives/*.jpg
Run: python3 landing-concepts/src/make_creatives.py
"""
import pathlib
from PIL import Image, ImageEnhance, ImageChops, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2]
PH = ROOT / "assets" / "photos"
OUT = ROOT / "assets" / "creatives"
OUT.mkdir(parents=True, exist_ok=True)

IVORY = (255, 247, 240)
GOLD = (196, 165, 128)


def gamma_lut(g, scale=1.0):
    return [min(255, int(((i / 255.0) ** g) * 255 * scale)) for i in range(256)]


def relight(im, g=0.80, bright=1.05, veil=0.16, contrast=1.04, color=1.07, warm=1.03):
    im = im.convert("RGB").point(gamma_lut(g, bright) * 3)
    v = Image.new("RGB", im.size, IVORY)
    im = Image.blend(im, ImageChops.screen(im, v), veil)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(color)
    r, gg, b = im.split()
    r = r.point(lambda x: min(255, int(x * warm)))
    return Image.merge("RGB", (r, gg, b))


def airy(name, out, cx=0.5, cy=0.52, rx=0.60, ry=0.72, feather=0.16,
         side=None, glow=0.5, q=86, relight_kw=None):
    """Relight + dissolve dark edges into ivory + warm-gold glow behind subject.
    side='left'/'right' pushes extra ivory to that side for headline space."""
    ph = relight(Image.open(PH / name), **(relight_kw or {}))
    w, h = ph.size
    ground = Image.new("RGB", (w, h), IVORY)
    # warm-gold radial glow behind the subject
    gl = Image.new("L", (w, h), 0)
    ImageDraw.Draw(gl).ellipse(
        [int(w * (cx - 0.45)), int(h * (cy - 0.5)), int(w * (cx + 0.45)), int(h * (cy + 0.55))],
        fill=int(255 * glow))
    gl = gl.filter(ImageFilter.GaussianBlur(int(min(w, h) * 0.14)))
    ground = Image.composite(Image.new("RGB", (w, h), GOLD), ground, gl.point(lambda x: int(x * 0.5)))
    # feathered subject mask
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse(
        [int(w * (cx - rx)), int(h * (cy - ry)), int(w * (cx + rx)), int(h * (cy + ry))], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(int(min(w, h) * feather)))
    if side:
        grad = Image.new("L", (w, h), 255)
        gd = grad.load()
        for x in range(w):
            t = x / w if side == "right" else 1 - x / w
            val = 255 if t < 0.5 else max(0, int(255 * (1 - (t - 0.5) * 2.0)))
            for y in range(h):
                gd[x, y] = val
        mask = ImageChops.multiply(mask, grad)
    Image.composite(ph, ground, mask).save(OUT / out, quality=q)


def relit_only(name, out, q=86, relight_kw=None):
    relight(Image.open(PH / name), **(relight_kw or {})).save(OUT / out, quality=q)


def crop_relit(name, out, box, q=88, relight_kw=None):
    im = relight(Image.open(PH / name), **(relight_kw or {}))
    w, h = im.size
    l, t, r, b = box
    im.crop((int(w * l), int(h * t), int(w * r), int(h * b))).save(OUT / out, quality=q)


# ---- heroes ----
airy("rudrika-26.jpg", "hero-portrait.jpg", cx=0.50, cy=0.50, rx=0.62, ry=0.62)
airy("rudrika-25.jpg", "hero-portrait-2.jpg", cx=0.50, cy=0.50, rx=0.60, ry=0.62)
airy("rudrika-09.jpg", "hero-drama.jpg", cx=0.42, cy=0.55, rx=0.52, ry=0.85)
airy("rudrika-14.jpg", "hero-wide.jpg", cx=0.60, cy=0.45, rx=0.66, ry=0.72, side="left")
airy("rudrika-12.jpg", "hero-wide-2.jpg", cx=0.45, cy=0.48, rx=0.62, ry=0.72)

# ---- section bands ----
airy("rudrika-16.jpg", "band-exclusive.jpg", cx=0.50, cy=0.48, rx=0.58, ry=0.66)
airy("rudrika-17.jpg", "band-teera.jpg", cx=0.50, cy=0.50, rx=0.60, ry=0.62)
airy("rudrika-13.jpg", "band-styling.jpg", cx=0.55, cy=0.45, rx=0.62, ry=0.70)
airy("rudrika-07.jpg", "band-about.jpg", cx=0.50, cy=0.48, rx=0.58, ry=0.66)

# ---- collection / fabric tiles (portrait, airy) ----
tiles = {"tile-silk": "rudrika-05.jpg", "tile-banarasi": "rudrika-16.jpg",
         "tile-tussar": "rudrika-22.jpg", "tile-linen": "rudrika-23.jpg",
         "tile-cotton": "rudrika-19.jpg", "tile-kota": "rudrika-27.jpg"}
for out, src in tiles.items():
    airy(src, out + ".jpg", cx=0.50, cy=0.46, rx=0.66, ry=0.66, feather=0.13, glow=0.4)

# ---- editorial (relit, keep composition) ----
relit_only("rudrika-04.jpg", "editorial-1.jpg")
relit_only("rudrika-20.jpg", "editorial-2.jpg")
relit_only("rudrika-21.jpg", "editorial-3.jpg")

# ---- silk texture crops for the 3D mesh (bright, zari-rich) ----
crop_relit("rudrika-18.jpg", "silk-texture.jpg", (0.15, 0.20, 0.95, 0.95),
           relight_kw=dict(g=0.72, bright=1.10, veil=0.10, color=1.12))
crop_relit("rudrika-06.jpg", "silk-texture-2.jpg", (0.10, 0.15, 0.90, 0.90),
           relight_kw=dict(g=0.72, bright=1.10, veil=0.10, color=1.12))

print("creatives written to", OUT)
for f in sorted(OUT.glob("*.jpg")):
    print(" ", f.name, f.stat().st_size // 1024, "KB")
