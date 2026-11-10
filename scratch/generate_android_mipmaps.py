import os
from PIL import Image

res_base = 'mobile_app/android/app/src/main/res'
densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

icons = [
    ('retro', 'mobile_app/assets/logo_retro.png'),
    ('flame', 'mobile_app/assets/logo_flame.png'),
    ('cosmic', 'mobile_app/assets/logo_cosmic.png'),
    ('mercury', 'mobile_app/assets/logo_mercury.png'),
    ('neon_tube', 'mobile_app/assets/logo_neon_tube.png'),
    ('tg_sunset', 'mobile_app/assets/logo_tg_sunset.png'),
    ('tg_cyan', 'mobile_app/assets/logo_tg_cyan.png'),
    ('wa_emerald', 'mobile_app/assets/logo_wa_emerald.png'),
    ('wa_mono', 'mobile_app/assets/logo_wa_mono.png'),
]

for tag, src in icons:
    if not os.path.exists(src):
        continue
    img = Image.open(src).convert('RGBA')
    for folder, dim in densities.items():
        out_dir = os.path.join(res_base, folder)
        os.makedirs(out_dir, exist_ok=True)
        out_square = os.path.join(out_dir, f'ic_launcher_{tag}.png')
        out_round = os.path.join(out_dir, f'ic_launcher_{tag}_round.png')
        resized = img.resize((dim, dim), Image.Resampling.LANCZOS)
        resized.save(out_square)
        resized.save(out_round)

    # Foreground for adaptive icon
    fg_dir = os.path.join(res_base, 'drawable')
    os.makedirs(fg_dir, exist_ok=True)
    fg_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    fg_img.save(os.path.join(fg_dir, f'ic_launcher_{tag}_foreground.png'))

    # XML in mipmap-anydpi-v26
    v26_dir = os.path.join(res_base, 'mipmap-anydpi-v26')
    os.makedirs(v26_dir, exist_ok=True)
    xml_content = f'''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_{tag}_foreground"/>
    <foreground android:drawable="@drawable/ic_launcher_{tag}_foreground"/>
</adaptive-icon>
'''
    with open(os.path.join(v26_dir, f'ic_launcher_{tag}.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)
    with open(os.path.join(v26_dir, f'ic_launcher_{tag}_round.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)

print('Android mipmap assets & adaptive icons created successfully!')

