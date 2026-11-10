with open('mobile_app/lib/features/dashboard/app_icon_picker_sheet.dart', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('  void _showApexUpgradeModal')
end_idx = text.find('  @override\n  Widget build')

print(f"start: {start_idx}, end: {end_idx}")
if start_idx != -1 and end_idx != -1:
    print("Found modal text from start to end!")

