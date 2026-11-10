import os
import re

found = []
for root, dirs, files in os.walk('mobile_app/lib'):
    for f in files:
        if f.endswith('.dart'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fh:
                for i, line in enumerate(fh):
                    l = line.strip()
                    # Check for leaked e / exceptions in strings
                    if ('$e' in l or 'e.toString()' in l or 'error:' in l.lower()) and not l.startswith('//') and not 'debugPrint' in l and not 'print(' in l:
                        if any(k in l for k in ["'Network error", '"Network error', 'error: ', "error':", 'message:']):
                            found.append((p, i + 1, l))

print(f"Total found: {len(found)}")
for p, line_no, l in found:
    print(f"{p}:{line_no} -> {l}")

