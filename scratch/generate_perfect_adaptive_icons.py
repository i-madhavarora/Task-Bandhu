import os
from PIL import Image, ImageDraw

def create_rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask

def create_circle_mask(size):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    return mask

# Icon specifications: name -> (source_path, background_hex)
icons = {
    'default': ('FINAL LOGO & APP ICONS/final_task_bandhu_dark.png', '#080D1A'),
    'dark': ('FINAL LOGO & APP ICONS/final_task_bandhu_dark.png', '#050811'),
    'light': ('FINAL LOGO & APP ICONS/final_task_bandhu_light.png', '#F8FAFC'),
    'diwali': ('FINAL LOGO & APP ICONS/festive_logos/tb_d_diwali.png', '#121423'),
    'holi': ('FINAL LOGO & APP ICONS/festive_logos/tb_l_holi.png', '#FAFAFA'),
    'newyear': ('FINAL LOGO & APP ICONS/festive_logos/tb_d_newyear.png', '#0A0D18'),
    'christmas': ('FINAL LOGO & APP ICONS/festive_logos/tb_d_christmas.png', '#0B1220'),
    'gold': ('FINAL LOGO & APP ICONS/premium_app_icons/1.png', '#1B1E25'),
    'cyber': ('FINAL LOGO & APP ICONS/premium_app_icons/2.png', '#1C144F'),
    'retro': ('FINAL LOGO & APP ICONS/premium_app_icons/3.png', '#17181D'),
    'flame': ('FINAL LOGO & APP ICONS/premium_app_icons/4.png', '#0B0D24'),
    'cosmic': ('FINAL LOGO & APP ICONS/premium_app_icons/5.png', '#91677F'),
    'mercury': ('FINAL LOGO & APP ICONS/premium_app_icons/6.png', '#10102A'),
}

# Duplicate for premium_1 .. premium_6
icons['premium_1'] = icons['gold']
icons['premium_2'] = icons['cyber']
icons['premium_3'] = icons['retro']
icons['premium_4'] = icons['flame']
icons['premium_5'] = icons['cosmic']
icons['premium_6'] = icons['mercury']

res_dir = 'mobile_app/android/app/src/main/res'
drawable_dir = os.path.join(res_dir, 'drawable')
v26_dir = os.path.join(res_dir, 'mipmap-anydpi-v26')

densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

os.makedirs(drawable_dir, exist_ok=True)
os.makedirs(v26_dir, exist_ok=True)

# Parse hex to RGB
def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

print("Generating Android Adaptive & Legacy Icons with Safe Zones...")

for icon_name, (src_path, bg_hex) in icons.items():
    if not os.path.exists(src_path):
        print(f"Skipping {icon_name}: {src_path} not found")
        continue

    src_img = Image.open(src_path).convert('RGBA')
    bg_rgb = hex_to_rgb(bg_hex)

    # 1. Generate Adaptive Icon Foreground (432x432 px at xxxhdpi)
    # Safe zone according to Google Android spec: 72dp = 288px centered in 108dp (432px).
    # We use 276x276 with rounded corners (radius 55) centered at offset 78, 78.
    target_fg_size = 276
    offset = (432 - target_fg_size) // 2

    fg_canvas = Image.new('RGBA', (432, 432), (0, 0, 0, 0))
    resized_logo = src_img.resize((target_fg_size, target_fg_size), Image.Resampling.LANCZOS)
    
    # Soft rounded mask so icon corners don't produce harsh edge artifacts
    corner_mask = create_rounded_mask(target_fg_size, 55)
    fg_canvas.paste(resized_logo, (offset, offset), mask=corner_mask)

    # Save foreground
    fg_file_prefix = 'ic_launcher' if icon_name == 'default' else f'ic_launcher_{icon_name}'
    fg_path = os.path.join(drawable_dir, f'{fg_file_prefix}_foreground.png')
    fg_canvas.save(fg_path)

    # Also save background drawable as fallback
    bg_canvas = Image.new('RGBA', (432, 432), bg_rgb + (255,))
    bg_path = os.path.join(drawable_dir, f'{fg_file_prefix}_background.png')
    bg_canvas.save(bg_path)

    # 2. Generate mipmap-anydpi-v26 XMLs
    xml_content = f'''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/{fg_file_prefix}_background"/>
    <foreground android:drawable="@drawable/{fg_file_prefix}_foreground"/>
</adaptive-icon>
'''
    with open(os.path.join(v26_dir, f'{fg_file_prefix}.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)
    with open(os.path.join(v26_dir, f'{fg_file_prefix}_round.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)

    # 3. Generate legacy mipmaps for each density (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
    for d_name, size in densities.items():
        d_path = os.path.join(res_dir, d_name)
        os.makedirs(d_path, exist_ok=True)

        # Square icon with rounded corners:
        sq_canvas = Image.new('RGBA', (size, size), bg_rgb + (255,))
        inner_sq_size = int(size * 0.88)
        inner_offset = (size - inner_sq_size) // 2
        inner_resized = src_img.resize((inner_sq_size, inner_sq_size), Image.Resampling.LANCZOS)
        inner_mask = create_rounded_mask(inner_sq_size, int(inner_sq_size * 0.22))
        sq_canvas.paste(inner_resized, (inner_offset, inner_offset), mask=inner_mask)
        
        # Apply outer container rounded mask
        outer_mask = create_rounded_mask(size, int(size * 0.22))
        final_sq = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        final_sq.paste(sq_canvas, (0, 0), mask=outer_mask)
        final_sq.save(os.path.join(d_path, f'{fg_file_prefix}.png'))

        # Round icon:
        rnd_canvas = Image.new('RGBA', (size, size), bg_rgb + (255,))
        inner_rnd_size = int(size * 0.82)
        inner_rnd_offset = (size - inner_rnd_size) // 2
        inner_rnd_resized = src_img.resize((inner_rnd_size, inner_rnd_size), Image.Resampling.LANCZOS)
        rnd_canvas.paste(inner_rnd_resized, (inner_rnd_offset, inner_rnd_offset))

        circle_mask = create_circle_mask(size)
        final_rnd = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        final_rnd.paste(rnd_canvas, (0, 0), mask=circle_mask)
        final_rnd.save(os.path.join(d_path, f'{fg_file_prefix}_round.png'))

print("All Android Adaptive & Legacy Icons successfully generated!")

