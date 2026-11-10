import os
import re

terms = ['firebase', 'firestore', 'google cloud', 'gcp']
file_exts = ('.jsx', '.js', '.tsx', '.ts', '.dart', '.html')

for root, dirs, files in os.walk('.'):
    if any(p in root for p in ['node_modules', '.git', 'dist', 'build', '.dart_tool', 'scratch', '.system_generated']):
        continue
    for file in files:
        if file.endswith(file_exts):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            for idx, line in enumerate(lines, 1):
                s = line.strip()
                if s.startswith('import ') or s.startswith('export ') or s.startswith('//') or s.startswith('/*') or s.startswith('*'):
                    continue
                if any(skip in s for skip in ['debugPrint', 'console.', 'FirebaseSyncService', 'from "firebase', "from 'firebase", 'firebaseConfig', 'FirebaseApp', 'FirebaseFirestore', 'FirebaseAuth']):
                    continue
                for t in terms:
                    if t in s.lower():
                        print(f"{path}:{idx}: {s}")
