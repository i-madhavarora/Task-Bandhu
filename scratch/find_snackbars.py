import os
import re

for root, dirs, files in os.walk('mobile_app/lib'):
    for f in files:
        if f.endswith('.dart'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fh:
                for i, l in enumerate(fh):
                    if 'showSnackBar' in l or '_errorMsg' in l or 'errorMsg' in l:
                        print(f"{p}:{i+1} -> {l.strip()[:100]}")

