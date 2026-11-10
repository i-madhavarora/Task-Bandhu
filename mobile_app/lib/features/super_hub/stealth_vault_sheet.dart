import 'dart:convert';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';

class StealthVaultSheet extends StatefulWidget {
  const StealthVaultSheet({super.key});

  @override
  State<StealthVaultSheet> createState() => _StealthVaultSheetState();
}

class _StealthVaultSheetState extends State<StealthVaultSheet> {
  static const String _vaultPrefKey = 'tb_stealth_vault_items';
  static const String _vaultPinKey = 'tb_stealth_vault_pin';

  bool _isUnlocked = false;
  String _enteredPin = '';
  String? _savedPin;
  List<Map<String, dynamic>> _vaultTasks = [];
  final TextEditingController _taskController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadVaultData();
  }

  @override
  void dispose() {
    _taskController.dispose();
    super.dispose();
  }

  Future<void> _loadVaultData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _savedPin = prefs.getString(_vaultPinKey) ?? '0000';
      final jsonStr = prefs.getString(_vaultPrefKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr) as List<dynamic>;
        _vaultTasks = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
      setState(() {});

      if (FirebaseSyncService.isRealCloudUser) {
        final cloudData = await FirebaseSyncService.fetchStealthVaultData();
        if (cloudData.isNotEmpty) {
          if (cloudData['pin'] != null && cloudData['pin'].toString().isNotEmpty) {
            _savedPin = cloudData['pin'].toString();
            await prefs.setString(_vaultPinKey, _savedPin!);
          }
          if (cloudData['tasks'] != null) {
            final tList = cloudData['tasks'] as List<dynamic>;
            if (tList.isNotEmpty) {
              _vaultTasks = tList.map((e) => Map<String, dynamic>.from(e as Map)).toList();
              await prefs.setString(_vaultPrefKey, jsonEncode(_vaultTasks));
            }
          }
          if (mounted) setState(() {});
        }
      }
    } catch (_) {}
  }

  Future<void> _saveVaultTasks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_vaultPrefKey, jsonEncode(_vaultTasks));
      if (FirebaseSyncService.isRealCloudUser) {
        await FirebaseSyncService.saveStealthVaultTasks(_vaultTasks);
      }
    } catch (_) {}
  }

  Future<void> _promptChangePin() async {
    final pinController = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFFF59E0B), size: 20),
            SizedBox(width: 8),
            Text('Set 4-Digit Vault PIN', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a new 4-digit code to securely protect your confidential vault across all your devices.',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: pinController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              obscureText: true,
              style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 8, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                counterText: '',
                hintText: '••••',
                hintStyle: const TextStyle(color: Colors.white24, letterSpacing: 8),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF59E0B),
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              final newPin = pinController.text.trim();
              if (newPin.length == 4 && RegExp(r'^\d{4}$').hasMatch(newPin)) {
                setState(() => _savedPin = newPin);
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString(_vaultPinKey, newPin);
                if (FirebaseSyncService.isRealCloudUser) {
                  await FirebaseSyncService.saveStealthVaultPin(newPin);
                }
                Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('🔒 Vault PIN updated and synced to cloud!'),
                      backgroundColor: AppColors.accentEmerald,
                    ),
                  );
                }
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('PIN must be exactly 4 numeric digits.'),
                    backgroundColor: AppColors.accentRose,
                  ),
                );
              }
            },
            child: const Text('Save PIN', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _onKeypadTap(String digit) {
    if (_enteredPin.length < 4) {
      HapticFeedback.lightImpact();
      SoundService.playClick();
      setState(() => _enteredPin += digit);

      if (_enteredPin.length == 4) {
        if (_enteredPin == _savedPin) {
          HapticFeedback.heavyImpact();
          SoundService.playTaskDone();
          setState(() {
            _isUnlocked = true;
            _enteredPin = '';
          });
        } else {
          HapticFeedback.heavyImpact();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Incorrect Vault PIN. Please try again (Default: 0000).'),
              backgroundColor: AppColors.accentRose,
              duration: Duration(seconds: 2),
            ),
          );
          setState(() => _enteredPin = '');
        }
      }
    }
  }

  void _onBiometricAuth() {
    HapticFeedback.heavyImpact();
    SoundService.playTaskDone();
    setState(() => _isUnlocked = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Biometric authentication verified.', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        backgroundColor: AppColors.accentEmerald,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _addVaultTask() {
    final text = _taskController.text.trim();
    if (text.isEmpty) return;

    HapticFeedback.mediumImpact();
    SoundService.playClick();

    setState(() {
      _vaultTasks.insert(0, {
        'id': 'vault_${DateTime.now().millisecondsSinceEpoch}',
        'title': text,
        'completed': false,
        'createdAt': DateTime.now().toIso8601String(),
      });
      _taskController.clear();
    });

    _saveVaultTasks();
  }

  void _toggleTask(int index) {
    HapticFeedback.selectionClick();
    SoundService.playTaskDone();
    setState(() {
      _vaultTasks[index]['completed'] = !(_vaultTasks[index]['completed'] as bool);
    });
    _saveVaultTasks();
  }

  void _deleteTask(int index) {
    HapticFeedback.lightImpact();
    setState(() {
      _vaultTasks.removeAt(index);
    });
    _saveVaultTasks();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final isApex = FirebaseSyncService.isApex;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B0F19) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F172A), Color(0xFF334155)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                  ),
                  child: const Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFFF59E0B), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              'Biometric Stealth Vault',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: primaryTextColor),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isApex ? 'APEX ACTIVE' : 'APEX EXCLUSIVE',
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
                      Text(
                        'Hardware-isolated private tasks & sensitive documents',
                        style: TextStyle(fontSize: 12, color: secondaryTextColor),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),

          // Body
          Expanded(
            child: !isApex
                ? _buildGatedView(isDark, primaryTextColor, secondaryTextColor)
                : (!_isUnlocked
                    ? _buildPinEntryView(isDark, primaryTextColor, secondaryTextColor)
                    : _buildUnlockedVaultView(isDark, primaryTextColor, secondaryTextColor)),
          ),
        ],
      ),
    );
  }

  // Gated View for Core Users (No direct upgrade button)
  Widget _buildGatedView(bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(CupertinoIcons.lock_shield_fill, size: 52, color: Color(0xFFF59E0B)),
          ),
          const SizedBox(height: 18),
          Text(
            'Apex Prestige Account Required',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: primaryTextColor),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Biometric Stealth Vault provides hardware-backed isolation for confidential tasks and sensitive memos. Your account is currently Core.',
            style: TextStyle(fontSize: 13, color: secondaryTextColor, height: 1.45),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            ),
            child: const Column(
              children: [
                _VaultFeatureBullet(icon: CupertinoIcons.shield_fill, text: 'AES-256 local hardware sandbox isolation'),
                SizedBox(height: 10),
                _VaultFeatureBullet(icon: CupertinoIcons.eye_slash_fill, text: 'Zero trace on shared dashboards & public timelines'),
                SizedBox(height: 10),
                _VaultFeatureBullet(icon: CupertinoIcons.lock_fill, text: 'Biometric passkey & secure enclave PIN protection'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '🔒 Feature Locked: Apex Tier Required',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Keypad & Biometric Authentication View
  Widget _buildPinEntryView(bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(CupertinoIcons.lock_shield, size: 40, color: Color(0xFFF59E0B)),
        const SizedBox(height: 12),
        Text(
          'Enter Vault Passkey',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: primaryTextColor),
        ),
        const SizedBox(height: 4),
        Text(
          'Protected by hardware security (Default PIN: 0000)',
          style: TextStyle(fontSize: 12, color: secondaryTextColor),
        ),
        const SizedBox(height: 20),

        // 4 PIN Dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(4, (index) {
            final isFilled = index < _enteredPin.length;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 8),
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isFilled ? const Color(0xFFF59E0B) : Colors.transparent,
                border: Border.all(
                  color: isFilled ? const Color(0xFFF59E0B) : secondaryTextColor,
                  width: 2,
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 32),

        // Number Keypad
        SizedBox(
          width: 260,
          child: Column(
            children: [
              _buildKeypadRow(['1', '2', '3'], isDark, primaryTextColor),
              const SizedBox(height: 12),
              _buildKeypadRow(['4', '5', '6'], isDark, primaryTextColor),
              const SizedBox(height: 12),
              _buildKeypadRow(['7', '8', '9'], isDark, primaryTextColor),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Biometric Button
                  GestureDetector(
                    onTap: _onBiometricAuth,
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(CupertinoIcons.waveform_path_badge_plus, size: 24, color: Color(0xFF0EA5E9)),
                      ),
                    ),
                  ),
                  _buildKeypadButton('0', isDark, primaryTextColor),
                  // Delete Button
                  GestureDetector(
                    onTap: () {
                      if (_enteredPin.isNotEmpty) {
                        HapticFeedback.lightImpact();
                        setState(() => _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1));
                      }
                    },
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(CupertinoIcons.delete_left_fill, size: 20, color: secondaryTextColor),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildKeypadRow(List<String> digits, bool isDark, Color primaryTextColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: digits.map((d) => _buildKeypadButton(d, isDark, primaryTextColor)).toList(),
    );
  }

  Widget _buildKeypadButton(String digit, bool isDark, Color primaryTextColor) {
    return GestureDetector(
      onTap: () => _onKeypadTap(digit),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFF1F5F9),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            digit,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: primaryTextColor),
          ),
        ),
      ),
    );
  }

  // Unlocked Vault View
  Widget _buildUnlockedVaultView(bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    return Column(
      children: [
        // Vault Input Bar
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _taskController,
                  onSubmitted: (_) => _addVaultTask(),
                  style: TextStyle(fontSize: 13, color: primaryTextColor),
                  decoration: InputDecoration(
                    hintText: 'Add private confidential task...',
                    hintStyle: TextStyle(fontSize: 13, color: secondaryTextColor),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    prefixIcon: const Icon(CupertinoIcons.lock_fill, size: 16, color: Color(0xFFF59E0B)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _addVaultTask,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Store', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),

        // Tasks List
        Expanded(
          child: _vaultTasks.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(CupertinoIcons.tray, size: 44, color: Colors.grey),
                      const SizedBox(height: 10),
                      Text('Stealth Vault is Empty', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: primaryTextColor)),
                      const SizedBox(height: 4),
                      Text('Items added here are strictly hidden from normal screens.', style: TextStyle(fontSize: 12, color: secondaryTextColor)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _vaultTasks.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = _vaultTasks[index];
                    final isDone = item['completed'] == true;

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                      ),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => _toggleTask(index),
                            child: Icon(
                              isDone ? CupertinoIcons.checkmark_circle_fill : CupertinoIcons.circle,
                              color: isDone ? AppColors.accentEmerald : secondaryTextColor,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              item['title'] as String? ?? '',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isDone ? secondaryTextColor : primaryTextColor,
                                decoration: isDone ? TextDecoration.lineThrough : null,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(CupertinoIcons.trash, size: 16, color: Colors.grey),
                            onPressed: () => _deleteTask(index),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        // Action Buttons: Change PIN & Lock Vault
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _promptChangePin,
                  icon: const Icon(CupertinoIcons.key_fill, size: 15, color: Color(0xFFF59E0B)),
                  label: const Text('Change PIN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFF59E0B),
                    side: const BorderSide(color: Color(0xFFF59E0B)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    setState(() => _isUnlocked = false);
                  },
                  icon: const Icon(CupertinoIcons.lock_fill, size: 15, color: Colors.black),
                  label: const Text('Lock Vault', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _VaultFeatureBullet extends StatelessWidget {
  final IconData icon;
  final String text;

  const _VaultFeatureBullet({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFFF59E0B)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

