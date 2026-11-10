import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask

def generate_retro_leather(size=1024):
    """Attachment 4: 2011 Vintage Brown Leather, Camera Lens, Rainbow Ribbon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base shape rounded rectangle
    base = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(base)

    # Split background: Upper leather (38%) and Lower beige (62%)
    split_y = int(size * 0.38)
    for y in range(split_y):
        t = y / split_y
        r = int(145 * (1 - t*0.2) + 95 * (t*0.2))
        g = int(88 * (1 - t*0.2) + 55 * (t*0.2))
        b = int(50 * (1 - t*0.2) + 30 * (t*0.2))
        bdraw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Leather texture noise
    random.seed(42)
    for _ in range(25000):
        rx = random.randint(0, size - 1)
        ry = random.randint(0, split_y - 1)
        grain_val = random.randint(-15, 15)
        px = base.getpixel((rx, ry))
        base.putpixel((rx, ry), (
            max(0, min(255, px[0] + grain_val)),
            max(0, min(255, px[1] + grain_val)),
            max(0, min(255, px[2] + grain_val)),
            255
        ))

    # Lower body (Beige parchment with subtle warm gradient)
    for y in range(split_y, size):
        t = (y - split_y) / (size - split_y)
        r = int(245 - t * 35)
        g = int(238 - t * 38)
        b = int(225 - t * 45)
        bdraw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Separator metallic bar & drop shadow
    bdraw.rectangle([(0, split_y - 4), (size, split_y + 4)], fill=(45, 30, 20, 220))
    bdraw.line([(0, split_y - 2), (size, split_y - 2)], fill=(210, 190, 170, 255), width=2)
    bdraw.line([(0, split_y + 6), (size, split_y + 12)], fill=(0, 0, 0, 90), width=6)

    # Rainbow Ribbon on top left
    ribbon_w = int(size * 0.048)
    ribbon_h = int(split_y * 0.95)
    ribbon_x = int(size * 0.08)
    stripes = [
        (235, 50, 60),   # Red
        (250, 185, 45),  # Yellow
        (75, 180, 85),   # Green
        (40, 140, 225),  # Blue
    ]
    for i, col in enumerate(stripes):
        sx = ribbon_x + i * ribbon_w
        bdraw.rectangle([(sx, 0), (sx + ribbon_w, ribbon_h)], fill=col + (255,))
        # Subtle stripe shadow
        bdraw.line([(sx, 0), (sx, ribbon_h)], fill=(0, 0, 0, 30), width=1)

    # Vintage "Task" metallic plate badge over ribbon
    badge_x = ribbon_x - int(size * 0.01)
    badge_y = ribbon_h - int(size * 0.08)
    badge_w = int(ribbon_w * 4.6)
    badge_h = int(size * 0.11)
    bdraw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=int(size*0.02), fill=(40, 40, 42, 255), outline=(180, 180, 180, 255), width=3)
    bdraw.rounded_rectangle([(badge_x + 4, badge_y + 4), (badge_x + badge_w - 4, badge_y + badge_h - 4)], radius=int(size*0.015), fill=(25, 25, 28, 255))

    # Viewfinder (top right)
    vf_size = int(size * 0.17)
    vf_x = int(size * 0.72)
    vf_y = int(size * 0.08)
    bdraw.rounded_rectangle([(vf_x, vf_y), (vf_x + vf_size, vf_y + vf_size)], radius=int(size*0.035), fill=(20, 20, 22, 255), outline=(70, 70, 75, 255), width=4)
    vf_inner = int(vf_size * 0.72)
    bdraw.ellipse([(vf_x + (vf_size - vf_inner)//2, vf_y + (vf_size - vf_inner)//2), (vf_x + (vf_size + vf_inner)//2, vf_y + (vf_size + vf_inner)//2)], fill=(12, 18, 25, 255), outline=(120, 120, 140, 255), width=3)
    # Viewfinder glass gleam
    bdraw.arc([(vf_x + 16, vf_y + 16), (vf_x + vf_size - 16, vf_y + vf_size - 16)], start=210, end=300, fill=(200, 220, 255, 200), width=4)

    # Flash dot
    bdraw.ellipse([(int(size * 0.62), int(size * 0.14)), (int(size * 0.66), int(size * 0.18))], fill=(30, 30, 32, 255), outline=(100, 100, 105, 255), width=2)
    bdraw.ellipse([(int(size * 0.63), int(size * 0.15)), (int(size * 0.65), int(size * 0.17))], fill=(220, 20, 40, 200))

    # Center Big Optical Lens Assembly
    cx, cy = size // 2, int(size * 0.58)
    outer_r = int(size * 0.32)

    # Drop shadow under lens
    for r in range(outer_r + 18, outer_r, -2):
        alpha = int((outer_r + 18 - r) * 12)
        bdraw.ellipse([(cx - r, cy - r + 8), (cx + r, cy + r + 8)], fill=(0, 0, 0, alpha))

    # Metallic Bezel Outer rings
    bdraw.ellipse([(cx - outer_r, cy - outer_r), (cx + outer_r, cy + outer_r)], fill=(200, 200, 205, 255), outline=(130, 130, 135, 255), width=4)
    bdraw.ellipse([(cx - outer_r + 8, cy - outer_r + 8), (cx + outer_r - 8, cy + outer_r - 8)], fill=(120, 120, 125, 255))
    bdraw.ellipse([(cx - outer_r + 14, cy - outer_r + 14), (cx + outer_r - 14, cy + outer_r - 14)], fill=(40, 40, 45, 255), outline=(180, 180, 185, 255), width=3)

    # Knurled grip ring
    knurl_r = outer_r - 22
    bdraw.ellipse([(cx - knurl_r, cy - knurl_r), (cx + knurl_r, cy + knurl_r)], fill=(22, 22, 26, 255))

    # Dark cyan/indigo optical glass core
    glass_r = knurl_r - 16
    for gr in range(glass_r, 0, -3):
        gt = gr / glass_r
        # Optical coating colors: deep navy, cyan reflection
        rc = int(8 + (1 - gt) * 20)
        gc = int(35 + (1 - gt) * 60)
        bc = int(55 + (1 - gt) * 90)
        bdraw.ellipse([(cx - gr, cy - gr), (cx + gr, cy + gr)], fill=(rc, gc, bc, 255))

    # Aperture inner iris
    iris_r = int(glass_r * 0.52)
    bdraw.ellipse([(cx - iris_r, cy - iris_r), (cx + iris_r, cy + iris_r)], fill=(8, 12, 16, 255), outline=(30, 60, 80, 255), width=3)
    core_r = int(iris_r * 0.5)
    bdraw.ellipse([(cx - core_r, cy - core_r), (cx + core_r, cy + core_r)], fill=(3, 5, 8, 255))

    # Optical glass reflection highlights (the curved white gleams)
    gleam_r = int(glass_r * 0.85)
    bdraw.arc([(cx - gleam_r, cy - gleam_r), (cx + gleam_r, cy + gleam_r)], start=215, end=265, fill=(255, 255, 255, 210), width=18)
    bdraw.arc([(cx - gleam_r, cy - gleam_r), (cx + gleam_r, cy + gleam_r)], start=220, end=250, fill=(255, 255, 255, 255), width=10)

    # Magenta anti-reflective coating glow dot in center
    bdraw.ellipse([(cx - 10, cy - 10), (cx + 10, cy + 10)], fill=(180, 50, 180, 140))
    bdraw.ellipse([(cx - 5, cy - 5), (cx + 5, cy + 5)], fill=(240, 120, 240, 220))

    # Mask to super-ellipse / squircle
    mask = create_rounded_mask((size, size), int(size * 0.22))
    img.paste(base, (0, 0), mask)
    return img

def generate_flame_gold(size=1024):
    """Attachment 3 Top-Left: Liquid Molten Fire & 3D Gold Flame"""
    img = Image.new('RGBA', (size, size), (6, 3, 2, 255))
    draw = ImageDraw.Draw(img)

    # Background subtle radial warmth
    cx, cy = size // 2, size // 2
    for r in range(int(size * 0.65), 0, -4):
        t = r / (size * 0.65)
        alpha = int((1 - t) * 60)
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=(180, 60, 10, alpha))

    # Layered organic flame curves forming the monogram aperture
    flame_canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(flame_canvas)

    # Outer flame loop
    points_outer = []
    num_pts = 160
    for i in range(num_pts):
        angle = (i / num_pts) * 2 * math.pi
        rad = size * 0.34
        # Add flame curls
        wave1 = math.sin(angle * 3) * (size * 0.04)
        wave2 = math.cos(angle * 5) * (size * 0.02)
        r = rad + wave1 + wave2
        px = cx + r * math.cos(angle)
        py = cy + r * math.sin(angle)
        points_outer.append((px, py))

    # Draw fiery glowing base
    for stroke_w, alpha, col in [(60, 60, (230, 60, 10)), (44, 120, (245, 130, 20)), (28, 200, (252, 195, 45)), (14, 255, (255, 245, 180))]:
        for i in range(len(points_outer)):
            p1 = points_outer[i]
            p2 = points_outer[(i + 1) % len(points_outer)]
            fdraw.line([p1, p2], fill=col + (alpha,), width=stroke_w)

    # Inner fiery loops (Aperture flame petal)
    inner_r = int(size * 0.16)
    for r in range(inner_r + 20, inner_r - 20, -2):
        t = (r - (inner_r - 20)) / 40.0
        r_col = int(255)
        g_col = int(140 + t * 90)
        b_col = int(20 + t * 140)
        fdraw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline=(r_col, g_col, b_col, 220), width=3)

    # Fiery droplet dot (Instagram style top right flash)
    dot_cx, dot_cy = int(cx + size * 0.22), int(cy - size * 0.22)
    for dr in range(36, 0, -2):
        dt = dr / 36.0
        fdraw.ellipse([(dot_cx - dr, dot_cy - dr), (dot_cx + dr, dot_cy + dr)], fill=(255, int(160 + (1-dt)*90), int(30 + (1-dt)*150), 230))

    # Flame flare sparks
    random.seed(99)
    for _ in range(80):
        ang = random.uniform(0, 2 * math.pi)
        dist = random.uniform(size * 0.22, size * 0.44)
        sx = cx + dist * math.cos(ang)
        sy = cy + dist * math.sin(ang)
        sr = random.randint(3, 8)
        fdraw.ellipse([(sx - sr, sy - sr), (sx + sr, sy + sr)], fill=(255, random.randint(180, 240), 80, random.randint(150, 255)))

    # Blur glow
    glow = flame_canvas.filter(ImageFilter.GaussianBlur(16))
    img.paste(glow, (0, 0), glow)
    img.paste(flame_canvas, (0, 0), flame_canvas)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), mask)
    return final_img

def generate_cosmic_rings(size=1024):
    """Attachment 3 Top-Right: Saturn Orbiting Neon Cyan & Purple Rings"""
    img = Image.new('RGBA', (size, size), (4, 4, 14, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Background nebula
    for r in range(int(size * 0.6), 0, -4):
        t = r / (size * 0.6)
        alpha = int((1 - t) * 70)
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=(30, 20, 80, alpha))

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(canvas)

    # 3D Tilted Orbital Ellipses (Saturn rings)
    # Ring 1: Cyan-Blue glow
    r1_w, r1_h = int(size * 0.38), int(size * 0.16)
    # Ring 2: Purple-Magenta glow
    r2_w, r2_h = int(size * 0.32), int(size * 0.32)

    # Draw rounded squircle glass tube base
    sq_size = int(size * 0.34)
    cdraw.rounded_rectangle([(cx - sq_size, cy - sq_size), (cx + sq_size, cy + sq_size)], radius=int(size*0.12), outline=(14, 165, 233, 180), width=24)
    cdraw.rounded_rectangle([(cx - sq_size, cy - sq_size), (cx + sq_size, cy + sq_size)], radius=int(size*0.12), outline=(217, 70, 239, 140), width=14)
    cdraw.rounded_rectangle([(cx - sq_size, cy - sq_size), (cx + sq_size, cy + sq_size)], radius=int(size*0.12), outline=(255, 255, 255, 230), width=6)

    # Orbiting glass ring 1 (Cyan electric)
    for width, alpha, col in [(28, 80, (6, 182, 212)), (18, 160, (56, 189, 248)), (8, 255, (240, 253, 250))]:
        cdraw.ellipse([(cx - r1_w, cy - r1_h - 40), (cx + r1_w, cy + r1_h + 40)], outline=col + (alpha,), width=width)

    # Orbiting glass ring 2 (Deep Violet-Pink)
    for width, alpha, col in [(24, 70, (192, 38, 211)), (16, 150, (232, 121, 249)), (6, 240, (255, 255, 255))]:
        cdraw.ellipse([(cx - int(r1_w*0.8), cy - r1_h + 80), (cx + int(r1_w*0.8), cy + r1_h + 160)], outline=col + (alpha,), width=width)

    # Center glowing lens circle
    center_r = int(size * 0.13)
    cdraw.ellipse([(cx - center_r, cy - center_r), (cx + center_r, cy + center_r)], outline=(6, 182, 212, 200), width=18)
    cdraw.ellipse([(cx - center_r, cy - center_r), (cx + center_r, cy + center_r)], outline=(255, 255, 255, 240), width=6)

    glow = canvas.filter(ImageFilter.GaussianBlur(18))
    img.paste(glow, (0, 0), glow)
    img.paste(canvas, (0, 0), canvas)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), mask)
    return final_img

def generate_chrome_mercury(size=1024):
    """Attachment 3 Bottom-Left: Polished Chrome Liquid Metal"""
    img = Image.new('RGBA', (size, size), (12, 14, 20, 255))
    cx, cy = size // 2, size // 2

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(canvas)

    sq_size = int(size * 0.33)
    radius = int(size * 0.12)

    # Chrome liquid outline with specular gradients
    for w, col in [
        (38, (40, 48, 60, 255)),
        (30, (140, 155, 175, 255)),
        (22, (220, 230, 245, 255)),
        (12, (255, 255, 255, 255)),
        (4, (180, 200, 225, 255)),
    ]:
        cdraw.rounded_rectangle([(cx - sq_size, cy - sq_size), (cx + sq_size, cy + sq_size)], radius=radius, outline=col, width=w)

    # Center mercury iris
    center_r = int(size * 0.14)
    for r, col in [
        (center_r + 14, (70, 80, 95, 255)),
        (center_r + 8, (190, 205, 220, 255)),
        (center_r, (255, 255, 255, 255)),
        (center_r - 8, (120, 135, 150, 255)),
    ]:
        cdraw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline=col, width=6)

    # Specular mercury droplet top right
    dot_x, dot_y = cx + int(size * 0.21), cy - int(size * 0.21)
    for dr in range(32, 0, -2):
        dt = dr / 32.0
        val = int(120 + (1 - dt) * 135)
        cdraw.ellipse([(dot_x - dr, dot_y - dr), (dot_x + dr, dot_y + dr)], fill=(val, val, int(val*1.04), 255))
    # Specular white highlight
    cdraw.ellipse([(dot_x - 12, dot_y - 12), (dot_x - 4, dot_y - 4)], fill=(255, 255, 255, 240))

    glow = canvas.filter(ImageFilter.GaussianBlur(10))
    img.paste(glow, (0, 0), glow)
    img.paste(canvas, (0, 0), canvas)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), mask)
    return final_img

def generate_neon_tube(size=1024):
    """Attachment 3 Bottom-Middle: Glowing Magenta Neon Gas Tube"""
    img = Image.new('RGBA', (size, size), (5, 1, 8, 255))
    cx, cy = size // 2, size // 2

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(canvas)

    sq_size = int(size * 0.33)
    radius = int(size * 0.12)

    # Segmented neon tube passes
    for w, alpha, col in [
        (50, 40, (217, 70, 239)),
        (34, 100, (236, 72, 153)),
        (20, 180, (244, 114, 182)),
        (10, 255, (255, 255, 255)),
    ]:
        cdraw.rounded_rectangle([(cx - sq_size, cy - sq_size), (cx + sq_size, cy + sq_size)], radius=radius, outline=col + (alpha,), width=w)

    center_r = int(size * 0.13)
    for w, alpha, col in [
        (40, 50, (217, 70, 239)),
        (24, 120, (236, 72, 153)),
        (14, 200, (244, 114, 182)),
        (6, 255, (255, 255, 255)),
    ]:
        cdraw.ellipse([(cx - center_r, cy - center_r), (cx + center_r, cy + center_r)], outline=col + (alpha,), width=w)

    # Neon tube dot
    dot_x, dot_y = cx + int(size * 0.21), cy - int(size * 0.21)
    for dr, alpha, col in [(28, 60, (217, 70, 239)), (18, 140, (236, 72, 153)), (8, 255, (255, 255, 255))]:
        cdraw.ellipse([(dot_x - dr, dot_y - dr), (dot_x + dr, dot_y + dr)], fill=col + (alpha,))

    glow = canvas.filter(ImageFilter.GaussianBlur(16))
    img.paste(glow, (0, 0), glow)
    img.paste(canvas, (0, 0), canvas)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), mask)
    return final_img

def generate_telegram_sunset(size=1024):
    """Attachment 2: Telegram Sunset Gradient with Paper Plane"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Sunset gradient from Coral-Peach (#F97316) to Magenta (#EC4899) to Violet (#7C3AED)
    base = Image.new('RGBA', (size, size))
    bdraw = ImageDraw.Draw(base)
    for y in range(size):
        t = y / size
        if t < 0.5:
            st = t / 0.5
            r = int(249 * (1 - st) + 236 * st)
            g = int(115 * (1 - st) + 72 * st)
            b = int(22 * (1 - st) + 153 * st)
        else:
            st = (t - 0.5) / 0.5
            r = int(236 * (1 - st) + 124 * st)
            g = int(72 * (1 - st) + 58 * st)
            b = int(153 * (1 - st) + 237 * st)
        bdraw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Paper Plane in center
    cx, cy = size // 2, size // 2
    # Vertices of the iconic paper plane
    nose = (cx + int(size * 0.24), cy - int(size * 0.16))
    left_wing = (cx - int(size * 0.22), cy - int(size * 0.05))
    tail = (cx - int(size * 0.08), cy + int(size * 0.18))
    fold = (cx + int(size * 0.02), cy + int(size * 0.02))

    # Shadow
    s_offset = int(size * 0.02)
    bdraw.polygon([
        (nose[0] + s_offset, nose[1] + s_offset),
        (left_wing[0] + s_offset, left_wing[1] + s_offset),
        (tail[0] + s_offset, tail[1] + s_offset),
    ], fill=(0, 0, 0, 50))

    # Left main wing
    bdraw.polygon([nose, left_wing, fold], fill=(255, 255, 255, 255))
    # Right wing
    bdraw.polygon([nose, fold, tail], fill=(225, 235, 245, 255))
    # Inner fold triangle
    bdraw.polygon([left_wing, fold, (cx - int(size * 0.04), cy + int(size * 0.09))], fill=(195, 210, 230, 255))

    mask = create_rounded_mask((size, size), int(size * 0.22))
    img.paste(base, (0, 0), mask)
    return img

def generate_telegram_cyan(size=1024):
    """Attachment 2: Telegram Vivid Sky Cyan"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    base = Image.new('RGBA', (size, size))
    bdraw = ImageDraw.Draw(base)

    # Cyan gradient (#0088CC to #2AABEE to #38BDF8)
    for y in range(size):
        t = y / size
        r = int(0 * (1 - t) + 40 * t)
        g = int(136 * (1 - t) + 185 * t)
        b = int(204 * (1 - t) + 248 * t)
        bdraw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    cx, cy = size // 2, size // 2
    nose = (cx + int(size * 0.24), cy - int(size * 0.16))
    left_wing = (cx - int(size * 0.22), cy - int(size * 0.05))
    tail = (cx - int(size * 0.08), cy + int(size * 0.18))
    fold = (cx + int(size * 0.02), cy + int(size * 0.02))

    # Paper Plane
    bdraw.polygon([nose, left_wing, fold], fill=(255, 255, 255, 255))
    bdraw.polygon([nose, fold, tail], fill=(228, 240, 250, 255))
    bdraw.polygon([left_wing, fold, (cx - int(size * 0.04), cy + int(size * 0.09))], fill=(190, 215, 240, 255))

    mask = create_rounded_mask((size, size), int(size * 0.22))
    img.paste(base, (0, 0), mask)
    return img

def generate_wa_emerald(size=1024):
    """Attachment 1: WhatsApp Minimalist Emerald Outline on Frosted Light Slate"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    base = Image.new('RGBA', (size, size), (248, 250, 252, 255))
    bdraw = ImageDraw.Draw(base)

    cx, cy = size // 2, size // 2
    out_r = int(size * 0.36)

    # Crisp Emerald Outline circle & speech tail
    bdraw.rounded_rectangle([(cx - out_r, cy - out_r), (cx + out_r, cy + out_r)], radius=int(size*0.14), outline=(16, 185, 129, 255), width=26)

    # Inner checkmark / monogram
    core_r = int(size * 0.20)
    bdraw.ellipse([(cx - core_r, cy - core_r), (cx + core_r, cy + core_r)], outline=(16, 185, 129, 255), width=22)

    # Stylized Task Bandhu checkmark / T
    bdraw.line([(cx - 70, cy), (cx - 20, cy + 60), (cx + 80, cy - 60)], fill=(16, 185, 129, 255), width=24)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    img.paste(base, (0, 0), mask)
    return img

def generate_wa_mono(size=1024):
    """Attachment 1: Minimalist Mono Ink / Obsidian Outline"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    base = Image.new('RGBA', (size, size), (15, 23, 42, 255))
    bdraw = ImageDraw.Draw(base)

    cx, cy = size // 2, size // 2
    out_r = int(size * 0.36)

    bdraw.rounded_rectangle([(cx - out_r, cy - out_r), (cx + out_r, cy + out_r)], radius=int(size*0.14), outline=(248, 250, 252, 255), width=26)
    core_r = int(size * 0.20)
    bdraw.ellipse([(cx - core_r, cy - core_r), (cx + core_r, cy + core_r)], outline=(248, 250, 252, 255), width=22)
    bdraw.line([(cx - 70, cy), (cx - 20, cy + 60), (cx + 80, cy - 60)], fill=(248, 250, 252, 255), width=24)

    mask = create_rounded_mask((size, size), int(size * 0.22))
    img.paste(base, (0, 0), mask)
    return img

if __name__ == '__main__':
    out_dir = 'mobile_app/assets'
    icons = {
        'logo_retro.png': generate_retro_leather,
        'logo_flame.png': generate_flame_gold,
        'logo_cosmic.png': generate_cosmic_rings,
        'logo_mercury.png': generate_chrome_mercury,
        'logo_neon_tube.png': generate_neon_tube,
        'logo_tg_sunset.png': generate_telegram_sunset,
        'logo_tg_cyan.png': generate_telegram_cyan,
        'logo_wa_emerald.png': generate_wa_emerald,
        'logo_wa_mono.png': generate_wa_mono,
    }

    for name, gen in icons.items():
        p = os.path.join(out_dir, name)
        print(f'Generating {name}...')
        im = gen(1024)
        im.save(p, 'PNG')
        print(f'Saved {p} ({im.size})')
    print('All designer icons generated successfully!')

