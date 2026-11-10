import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';
import '../calling/video_call_screen.dart';

class ConnectionsScreen extends StatefulWidget {
  const ConnectionsScreen({super.key});

  @override
  State<ConnectionsScreen> createState() => _ConnectionsScreenState();
}

class _ConnectionsScreenState extends State<ConnectionsScreen> {
  final _emailController = TextEditingController();
  final _searchController = TextEditingController();
  bool _isSubmitting = false;
  String _activeTab = 'connected'; // 'connected' | 'requests'

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await FirebaseSyncService.fetchConnections();
    await FirebaseSyncService.fetchConnectionRequests();
    if (mounted) setState(() {});
  }

  void _sendConnectionRequest() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter an email address to send a connection request.'),
          backgroundColor: AppColors.accentRose,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    final emailRegex = RegExp(r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$');
    if (!emailRegex.hasMatch(email)) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid email address (e.g. colleague@company.com).'),
          backgroundColor: AppColors.accentRose,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();
    SoundService.playClick();

    final result = await FirebaseSyncService.sendConnectionRequest(email);
    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      _emailController.clear();
      SoundService.playNotification();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  result['message'] ?? 'Connection request sent!',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.accentEmerald,
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(CupertinoIcons.exclamationmark_triangle_fill, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  result['message'] ?? 'Unable to send connection request.',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.accentRose,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  void _acceptRequest(Map<String, dynamic> request) async {
    HapticFeedback.heavyImpact();
    SoundService.playTaskDone();
    await FirebaseSyncService.acceptConnectionRequest(request);
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 Connected with ${request['fromName'] ?? request['fromEmail']}!'),
        backgroundColor: const Color(0xFF6366F1),
      ),
    );
  }

  void _declineRequest(String reqId) async {
    HapticFeedback.lightImpact();
    SoundService.playClick();
    await FirebaseSyncService.declineConnectionRequest(reqId);
    if (!mounted) return;
    setState(() {});
  }

  void _cancelRequest(String reqId) async {
    HapticFeedback.lightImpact();
    SoundService.playClick();
    await FirebaseSyncService.cancelConnectionRequest(reqId);
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Invitation cancelled.')),
    );
  }

  void _confirmRemoveConnection(Map<String, String> connection) {
    HapticFeedback.mediumImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text('Remove ${connection['name'] ?? 'Connection'}?'),
        content: const Text(
          'They will be removed from your connected teammates network and will no longer have access to assigned tasks.',
        ),
        actions: [
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () async {
              Navigator.pop(ctx);
              await FirebaseSyncService.removeConnection(connection['uid'] ?? '');
              if (mounted) setState(() {});
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);

    final connections = FirebaseSyncService.connections;
    final incoming = FirebaseSyncService.incomingRequests;
    final outgoing = FirebaseSyncService.outgoingRequests;
    final pendingCount = incoming.length;

    final searchQuery = _searchController.text.trim().toLowerCase();
    final filteredConnections = connections.where((c) {
      if (searchQuery.isEmpty) return true;
      final name = (c['name'] ?? '').toLowerCase();
      final email = (c['email'] ?? '').toLowerCase();
      return name.contains(searchQuery) || email.contains(searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B132B) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(CupertinoIcons.back, color: primaryTextColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Teammates Network',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: primaryTextColor,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(CupertinoIcons.person_2_fill, color: Colors.white, size: 13),
                const SizedBox(width: 5),
                Text(
                  '${connections.length} Connected',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: DesignerPullToRefresh(
          onRefresh: _loadData,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Info Banner Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                          : [const Color(0xFFEEF2FF), const Color(0xFFFFFFFF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: const Color(0xFF6366F1).withOpacity(0.35),
                      width: 1.2,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF38BDF8)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6366F1).withOpacity(0.4),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(CupertinoIcons.person_badge_plus_fill, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Connect & Collaborate',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: primaryTextColor,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Connect with colleagues by email. You can only assign connected teammates into Team Projects & Huddles!',
                              style: TextStyle(fontSize: 12, color: secondaryTextColor, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Connect by Email Card
                GlassCard(
                  borderRadius: 22,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(CupertinoIcons.paperplane_fill, size: 16, color: AppColors.primaryIndigo),
                          const SizedBox(width: 8),
                          Text(
                            'Invite Teammate by Email',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: primaryTextColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (_) => _isSubmitting ? null : _sendConnectionRequest(),
                              style: TextStyle(fontSize: 13, color: primaryTextColor),
                              decoration: InputDecoration(
                                hintText: 'colleague@company.com',
                                hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white38 : Colors.black38),
                                prefixIcon: const Icon(CupertinoIcons.mail, size: 17),
                                filled: true,
                                fillColor: isDark ? const Color(0xFF141E33) : const Color(0xFFF1F5F9),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: AppColors.primaryIndigo, width: 1.5),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : _sendConnectionRequest,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryIndigo,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                            child: _isSubmitting
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(CupertinoIcons.paperplane, size: 14),
                                      SizedBox(width: 6),
                                      Text('Send', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                                    ],
                                  ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Segmented Tabs Pill Bar
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141E33) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _activeTab = 'connected');
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              gradient: _activeTab == 'connected'
                                  ? const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)])
                                  : null,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: _activeTab == 'connected'
                                  ? [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 8, offset: const Offset(0, 2))]
                                  : null,
                            ),
                            child: Center(
                              child: Text(
                                'Connected (${connections.length})',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w800,
                                  color: _activeTab == 'connected' ? Colors.white : secondaryTextColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _activeTab = 'requests');
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              gradient: _activeTab == 'requests'
                                  ? const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)])
                                  : null,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: _activeTab == 'requests'
                                  ? [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 8, offset: const Offset(0, 2))]
                                  : null,
                            ),
                            child: Center(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Requests',
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w800,
                                      color: _activeTab == 'requests' ? Colors.white : secondaryTextColor,
                                    ),
                                  ),
                                  if (pendingCount > 0) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentRose,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        '$pendingCount',
                                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Tab Content
                if (_activeTab == 'connected') ...[
                  // Search Box
                  if (connections.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (_) => setState(() {}),
                        style: TextStyle(fontSize: 13, color: primaryTextColor),
                        decoration: InputDecoration(
                          hintText: 'Search teammates...',
                          hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white38 : Colors.black38),
                          prefixIcon: const Icon(CupertinoIcons.search, size: 17),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF141E33) : Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                          ),
                        ),
                      ),
                    ),

                  // Teammates List
                  if (connections.isEmpty)
                    GlassCard(
                      borderRadius: 22,
                      padding: const EdgeInsets.all(32),
                      child: Center(
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF6366F1).withOpacity(0.12),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(CupertinoIcons.person_3_fill, size: 36, color: Color(0xFF6366F1)),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No Teammates Connected Yet',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: primaryTextColor),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Invite colleagues using the email form above to collaborate seamlessly.',
                              style: TextStyle(fontSize: 12, color: secondaryTextColor),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredConnections.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final conn = filteredConnections[index];
                        final name = conn['name'] ?? 'Teammate';
                        final email = conn['email'] ?? '';
                        final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'T';

                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF141E33) : Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Avatar Squircle
                              Container(
                                width: 42,
                                height: 42,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF6366F1), Color(0xFF06B6D4)],
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF6366F1).withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Text(
                                    initial,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Name & Email
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: primaryTextColor,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      email,
                                      style: TextStyle(fontSize: 11.5, color: secondaryTextColor),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),

                              // Actions: 1-on-1 Video Meet & Remove
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Call Button
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: Container(
                                      padding: const EdgeInsets.all(7),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentCyan.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(CupertinoIcons.video_camera_solid, size: 16, color: AppColors.accentCyan),
                                    ),
                                    tooltip: 'Start Video Meet',
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        CupertinoPageRoute(
                                          builder: (_) => VideoCallScreen(
                                            roomName: '$name 1-on-1 Huddle',
                                            calleeName: name,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  const SizedBox(width: 8),

                                  // Remove Button
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: Container(
                                      padding: const EdgeInsets.all(7),
                                      decoration: BoxDecoration(
                                        color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(CupertinoIcons.trash, size: 14, color: secondaryTextColor),
                                    ),
                                    tooltip: 'Remove',
                                    onPressed: () => _confirmRemoveConnection(conn),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ] else ...[
                  // Requests Tab
                  // 1. Incoming Invitations
                  Row(
                    children: [
                      const Icon(CupertinoIcons.tray_arrow_down_fill, size: 15, color: Color(0xFF6366F1)),
                      const SizedBox(width: 6),
                      Text(
                        'Incoming Invitations (${incoming.length})',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: primaryTextColor),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (incoming.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF141E33) : Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                      ),
                      child: Column(
                        children: [
                          const Icon(CupertinoIcons.checkmark_seal_fill, size: 30, color: AppColors.accentEmerald),
                          const SizedBox(height: 8),
                          Text(
                            'All Caught Up!',
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: primaryTextColor),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'No pending invitations waiting for your response.',
                            style: TextStyle(fontSize: 11.5, color: secondaryTextColor),
                          ),
                        ],
                      ),
                    )
                  else
                    ...incoming.map((req) {
                      final fromName = req['fromName'] ?? 'Teammate';
                      final fromEmail = req['fromEmail'] ?? '';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF141E33) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF38BDF8)]),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                child: Text(
                                  fromName.substring(0, 1).toUpperCase(),
                                  style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    fromName,
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: primaryTextColor),
                                  ),
                                  Text(
                                    fromEmail,
                                    style: TextStyle(fontSize: 11, color: secondaryTextColor),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Wants to connect with you',
                                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF6366F1)),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ElevatedButton(
                                  onPressed: () => _acceptRequest(req),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    elevation: 0,
                                  ),
                                  child: const Text('Accept', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                                ),
                                const SizedBox(width: 6),
                                IconButton(
                                  icon: const Icon(CupertinoIcons.xmark, size: 16),
                                  color: AppColors.accentRose,
                                  onPressed: () => _declineRequest(req['id'] ?? ''),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),

                  const SizedBox(height: 20),

                  // 2. Outgoing Invitations
                  Row(
                    children: [
                      const Icon(CupertinoIcons.tray_arrow_up_fill, size: 15, color: Color(0xFF8B5CF6)),
                      const SizedBox(width: 6),
                      Text(
                        'Outgoing Pending (${outgoing.length})',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: primaryTextColor),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (outgoing.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF141E33) : Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                      ),
                      child: Center(
                        child: Text(
                          'No pending outgoing requests.',
                          style: TextStyle(fontSize: 12, color: secondaryTextColor),
                        ),
                      ),
                    )
                  else
                    ...outgoing.map((req) {
                      final toEmail = req['toEmail'] ?? '';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF141E33) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                        ),
                        child: Row(
                          children: [
                            const Icon(CupertinoIcons.clock_fill, size: 16, color: Color(0xFFF59E0B)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    toEmail,
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: primaryTextColor),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Waiting for their response...',
                                    style: TextStyle(fontSize: 11, color: secondaryTextColor),
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: () => _cancelRequest(req['id'] ?? ''),
                              style: TextButton.styleFrom(
                                foregroundColor: AppColors.accentRose,
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              ),
                              child: const Text('Cancel', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ),
                      );
                    }),
                ],

                const SizedBox(height: 60),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

