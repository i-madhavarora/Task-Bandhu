import re

path = 'mobile_app/lib/features/dashboard/dashboard_screen.dart'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern for the inserted block
block_pattern = r'''\s*// 7B\. Apex Prestige Suite\s*ListTile\(.+?Divider\(height: 16, color: dividerColor\),'''

# Remove all matches of the inserted block
cleaned = re.sub(block_pattern, '', text, flags=re.DOTALL)

# Now find the AnalyticsSheet tile and insert exactly once after its divider
target = 'builder: (_) => const AnalyticsSheet(),\n                    );\n                  },\n                ),\n                Divider(height: 16, color: dividerColor),'

replacement = target + '''

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),'''

if target in cleaned:
    final_text = cleaned.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(final_text)
    print("SUCCESS: Cleaned and inserted exactly once.")
else:
    print("WARNING: target not found in cleaned text.")

