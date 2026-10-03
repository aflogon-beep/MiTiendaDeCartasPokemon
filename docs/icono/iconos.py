# Iconos de la PWA a partir del dibujo de 2000×2000 (original.jpg, generado con Gemini).
# Uso: pip install pillow && python3 docs/icono/iconos.py   (escribe en public/icons/)
#
# Diseño «A · Rojo» (elegido por Alberto): el dibujo recortado de su fondo oscuro, grande, con borde blanco
# de pegatina y sombra, sobre un degradado rojo Poké Ball con rayos dorados.
#   - icon-192/512, favicon y apple-touch: el dibujo ocupa el 86 % del alto.
#   - icon-maskable-512 (Android recorta en círculo o cuadrado redondeado): el 74 %, para que no se corte.
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "icons"
S = 1024  # se dibuja a este tamaño y se reduce

# 1 · Recortar el dibujo: se rellena el fondo desde los bordes (el contorno oscuro del dibujo hace de muro)
im = Image.open(HERE / "original.jpg").convert("RGB")
W, H = im.size
KEY = (255, 0, 255)
fill = im.copy()
for s in [(x, 0) for x in range(0, W, 50)] + [(x, H - 1) for x in range(0, W, 50)] + [
    (0, y) for y in range(0, H, 50)
] + [(W - 1, y) for y in range(0, H, 50)]:
    if fill.getpixel(s) != KEY:
        ImageDraw.floodfill(fill, s, KEY, thresh=40)
r, g, b = fill.split()
bgmask = ImageChops.multiply(
    ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), g.point(lambda v: 255 if v == 0 else 0)),
    b.point(lambda v: 255 if v == 255 else 0),
)
mask = ImageChops.invert(bgmask).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
bb = mask.getbbox()
ART, AMASK = im.crop(bb), mask.crop(bb)


# 2 · Fondo: degradado radial rojo con rayos dorados que se desvanecen hacia fuera
def background(n, c0=(255, 92, 70), c1=(150, 12, 30), ray=(255, 210, 120), ray_a=0.22, cy=0.42, k=16):
    bg = Image.new("RGB", (n, n))
    px = bg.load()
    fade = Image.new("L", (n, n))
    fd = fade.load()
    for y in range(n):
        for x in range(n):
            d = math.hypot(x - n / 2, y - n * cy)
            t = min(1, d / (n * 0.72)) ** 1.3
            px[x, y] = tuple(round(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))
            fd[x, y] = round(255 * max(0, 1 - d / (n * 0.7)))
    rays = Image.new("L", (n, n), 0)
    dr = ImageDraw.Draw(rays)
    for i in range(k):
        a0 = i * 2 * math.pi / k
        a1 = a0 + math.pi / k * 0.55
        dr.polygon(
            [
                (n / 2, n * cy),
                (n / 2 + 2 * n * math.cos(a0), n * cy + 2 * n * math.sin(a0)),
                (n / 2 + 2 * n * math.cos(a1), n * cy + 2 * n * math.sin(a1)),
            ],
            fill=round(255 * ray_a),
        )
    rays = ImageChops.multiply(rays.filter(ImageFilter.GaussianBlur(n / 120)), fade)
    bg.paste(ray, (0, 0), rays)
    return bg


BG = background(S)


# 3 · El dibujo encima: borde blanco de pegatina, sombra y el dibujo
def compose(h_frac, n=S, outline=(255, 250, 235), ow=0.018):
    img = BG.copy()
    h = round(n * h_frac)
    w = round(ART.width * h / ART.height)
    a, ma = ART.resize((w, h), Image.LANCZOS), AMASK.resize((w, h), Image.LANCZOS)
    ox, oy = (n - w) // 2, round((n - h) / 2 + n * 0.01)
    full = Image.new("L", (n, n), 0)
    full.paste(ma, (ox, oy))
    o = 2 * (round(n * ow) // 2) + 1
    stick = full.filter(ImageFilter.MaxFilter(o)).filter(ImageFilter.MaxFilter(o)).filter(ImageFilter.GaussianBlur(1.5))
    sh = ImageChops.offset(stick.filter(ImageFilter.GaussianBlur(n / 45)), 0, round(n * 0.022))
    img.paste((0, 0, 0), (0, 0), sh.point(lambda v: round(v * 0.45)))
    img.paste(outline, (0, 0), stick)
    img.paste(a, (ox, oy), ma)
    return img


anyimg, maskable = compose(0.86), compose(0.74)
for n in (192, 512):
    anyimg.resize((n, n), Image.LANCZOS).save(OUT / f"icon-{n}.png", optimize=True)
maskable.resize((512, 512), Image.LANCZOS).save(OUT / "icon-maskable-512.png", optimize=True)
anyimg.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)
anyimg.resize((64, 64), Image.LANCZOS).save(OUT / "favicon-64.png", optimize=True)
print("Iconos escritos en", OUT)
