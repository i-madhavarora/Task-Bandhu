with open('mobile_app/lib/features/dashboard/app_icon_picker_sheet.dart', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove _showApexUpgradeModal & _buildPerkRow
start_idx = text.find('  void _showApexUpgradeModal')
end_idx = text.find('  @override\n  Widget build')

assert start_idx != -1 and end_idx != -1, "Modal markers not found"
text = text[:start_idx] + text[end_idx:]

# 2. Replace the upgrade button with the locked container (NO DIRECT UPGRADE BUTTON)
old_button_marker = """                // Apply or Unlock Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: isLocked
                      ? ElevatedButton(
                          onPressed: () => _showApexUpgradeModal(context, auth, iconService),"""

new_button_replacement = """                // Apply or Locked Container (NO DIRECT UPGRADE BUTTON)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: isLocked
                      ? Container(
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withOpacity(0.4),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(CupertinoIcons.lock_fill, color: Color(0xFFF59E0B), size: 16),
                              SizedBox(width: 8),
                              Text(
                                'Apex Prestige Account Required',
                                style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        )"""

btn_start = text.find('                // Apply or Unlock Button')
btn_end = text.find('                      : ElevatedButton(', btn_start)
assert btn_start != -1 and btn_end != -1, f"Button markers not found ({btn_start}, {btn_end})"

text = text[:btn_start] + new_button_replacement + '\n' + text[btn_end:]

with open('mobile_app/lib/features/dashboard/app_icon_picker_sheet.dart', 'w', encoding='utf-8') as f:
    f.write(text)

print("app_icon_picker_sheet.dart updated successfully!")

