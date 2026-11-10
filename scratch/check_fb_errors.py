import re

with open('mobile_app/lib/services/firebase_sync_service.dart', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "'error'" in l or '"error"' in l:
        print(f"Line {i+1}: {l.strip()}")

