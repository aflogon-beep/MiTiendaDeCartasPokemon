# Iconos de la PWA a partir del dibujo de 2000×2000 (original.jpg, generado con Gemini).
# Uso: pip install pillow && python3 docs/icono/iconos.py   (escribe en public/icons/)
from PIL import Image, ImageDraw, ImageFilter
import math
from pathlib import Path
HERE = Path(__file__).parent
SRC = HERE / "original.jpg"
OUT = str(HERE.parent.parent / "public" / "icons") + "/"
im = Image.open(SRC).convert("RGB"); W, H = im.size; px = im.load()
bg = px[10, 10]
pts = [(x, y) for y in range(0, H, 4) for x in range(0, W, 4) if sum(abs(px[x, y][i] - bg[i]) for i in range(3)) > 40]
cx = (min(p[0] for p in pts) + max(p[0] for p in pts)) / 2; cy = (min(p[1] for p in pts) + max(p[1] for p in pts)) / 2
R = max(math.hypot(x - cx, y - cy) for x, y in pts)
print("centro", cx, cy, "radio", R)
def grad(n):
    g = Image.new("RGB", (n, n)); d = ImageDraw.Draw(g)
    top, bot = (28, 33, 45), (35, 39, 51)
    for y in range(n):
        t = y / (n - 1); d.line([(0, y), (n, y)], fill=tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return g
# "any": el dibujo centrado en su contenido, tal cual
side = 2000; box = (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)
# el dibujo sobre un fondo más grande del mismo degradado, para poder recortar fuera de sus bordes sin bandas negras
pad = 400; big = grad(W + 2 * pad); big.paste(im, (pad, pad))
canvas = grad(side); crop = big.crop(tuple(round(v + pad) for v in box))
mask = Image.new("L", crop.size, 0); ImageDraw.Draw(mask).ellipse((40, 40, side - 40, side - 40), fill=255); mask = mask.filter(ImageFilter.GaussianBlur(60))
canvas.paste(crop, (0, 0), mask); anyimg = canvas
# "maskable": todo el contenido dentro del círculo central del 80 % (radio 0,4 del lado), con un poco de margen
mside = round(R / 0.38); m = grad(mside)
sc = Image.new("RGB", (side, side)); sc.paste(crop)
off = round((mside - side) / 2); m.paste(sc, (off, off), mask)
for n in (192, 512): anyimg.resize((n, n), Image.LANCZOS).save(OUT + f"icon-{n}.png", optimize=True)
m.resize((512, 512), Image.LANCZOS).save(OUT + "icon-maskable-512.png", optimize=True)
m.resize((180, 180), Image.LANCZOS).save(OUT + "apple-touch-icon.png", optimize=True)
anyimg.resize((64, 64), Image.LANCZOS).save(OUT + "favicon-64.png", optimize=True)
