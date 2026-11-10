import os
from PIL import Image, ImageDraw

festivals = {
    'diwali': 'FINAL LOGO & APP ICONS/festive_logos/tb_d_diwali.png',
    'holi': 'FINAL LOGO & APP ICONS/festive_logos/tb_l_holi.png',
    'newyear': 'FINAL LOGO & APP ICONS/festive_logos/tb_d_newyear.png',
    'christmas': 'FINAL LOGO & APP ICONS/festive_logos/tb_d_christmas.png',
}

densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

res_dir = 'mobile_app/android/app/src/main/res'
drawable_dir = os.path.join(res_dir, 'drawable')
v26_dir = os.path.join(res_dir, 'mipmap-anydpi-v26')

for fest_name, src_path in festivals.items():
    img = Image.open(src_path).convert('RGBA')
    
    # Save foreground drawable
    fg = img.resize((432, 432), Image.Resampling.LANCZOS)
    fg.save(os.path.join(drawable_dir, f'ic_launcher_{fest_name}_foreground.png'))
    
    # Save anydpi-v26 XMLs
    xml_content = f'''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_{fest_name}_foreground"/>
    <foreground android:drawable="@drawable/ic_launcher_{fest_name}_foreground"/>
</adaptive-icon>
'''
    with open(os.path.join(v26_dir, f'ic_launcher_{fest_name}.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)
    with open(os.path.join(v26_dir, f'ic_launcher_{fest_name}_round.xml'), 'w', encoding='utf-8') as f:
        f.write(xml_content)
        
    # Generate mipmaps for each density
    for d_name, size in densities.items():
        d_path = os.path.join(res_dir, d_name)
        
        # Square
        sq = img.resize((size, size), Image.Resampling.LANCZOS)
        sq.save(os.path.join(d_path, f'ic_launcher_{fest_name}.png'))
        
        # Round
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        rnd = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        rnd.paste(sq, (0, 0), mask=mask)
        rnd.save(os.path.join(d_path, f'ic_launcher_{fest_name}_round.png'))

print('Successfully generated all festive mipmaps and drawables!')

