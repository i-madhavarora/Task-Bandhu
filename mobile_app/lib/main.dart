import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/adaptive_nav_bar.dart';
import 'features/auth/auth_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/projects/projects_screen.dart';
import 'features/super_hub/super_hub_screen.dart';
import 'features/tasks/add_task_bottom_sheet.dart';
import 'features/tasks/task_schedule_screen.dart';
import 'providers/audio_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/project_provider.dart';
import 'providers/task_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/workspace_provider.dart';
import 'core/widgets/designer_loader.dart';
import 'services/app_icon_service.dart';
import 'services/firebase_sync_service.dart';
import 'services/sound_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseSyncService.loadSession();
  await SoundService.init();
  await DesignerLoader.loadSavedStyle();
  final appIconService = AppIconService();
  await appIconService.init();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(TaskBandhuApp(appIconService: appIconService));
}

class TaskBandhuApp extends StatelessWidget {
  final AppIconService appIconService;
  const TaskBandhuApp({super.key, required this.appIconService});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => WorkspaceProvider()),
        ChangeNotifierProvider(create: (_) => TaskProvider()),
        ChangeNotifierProvider(create: (_) => ProjectProvider()),
        ChangeNotifierProvider(create: (_) => AudioProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider.value(value: appIconService),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Task Bandhu',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: Consumer<AuthProvider>(
              builder: (context, auth, _) {
                return auth.isLoggedIn ? const MainAppShell() : const AuthScreen();
              },
            ),
          );
        },
      ),
    );
  }
}

class MainAppShell extends StatefulWidget {
  const MainAppShell({super.key});

  @override
  State<MainAppShell> createState() => _MainAppShellState();
}

class _MainAppShellState extends State<MainAppShell> with SingleTickerProviderStateMixin {
  int _currentTabIndex = 0;
  late final AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _openAddTaskSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddTaskBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final screens = [
      DashboardScreen(onOpenNewTask: _openAddTaskSheet),
      const TaskScheduleScreen(),
      const ProjectsScreen(),
      const SuperHubScreen(),
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Base Ambient Mesh Background
          Container(
            decoration: BoxDecoration(
              gradient: isDark
                  ? const LinearGradient(
                      colors: [Color(0xFF070B16), Color(0xFF0D1527)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    )
                  : const LinearGradient(
                      colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
            ),
          ),

          // Liquid Glowing Ambient Orbs for Glassmorphism Refraction
          AnimatedBuilder(
            animation: _animController,
            builder: (context, _) {
              final t = _animController.value;
              return Stack(
                children: [
                  // Orb 1: Electric Indigo / Cyan (Top Right)
                  Positioned(
                    top: -60 + (30 * t),
                    right: -50 + (25 * (1 - t)),
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            (isDark ? const Color(0xFF6366F1) : const Color(0xFF818CF8)).withOpacity(isDark ? 0.22 : 0.28),
                            (isDark ? const Color(0xFF06B6D4) : const Color(0xFF38BDF8)).withOpacity(isDark ? 0.12 : 0.15),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Orb 2: Deep Violet / Pink (Middle Left)
                  Positioned(
                    top: 260 + (40 * (1 - t)),
                    left: -70 + (20 * t),
                    child: Container(
                      width: 260,
                      height: 260,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            (isDark ? const Color(0xFF8B5CF6) : const Color(0xFFA78BFA)).withOpacity(isDark ? 0.20 : 0.24),
                            (isDark ? const Color(0xFFEC4899) : const Color(0xFFF472B6)).withOpacity(isDark ? 0.10 : 0.12),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Orb 3: Emerald / Sky Blue (Bottom Right)
                  Positioned(
                    bottom: 80 + (30 * t),
                    right: -40 + (30 * t),
                    child: Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            (isDark ? const Color(0xFF0EA5E9) : const Color(0xFF38BDF8)).withOpacity(isDark ? 0.18 : 0.22),
                            (isDark ? const Color(0xFF10B981) : const Color(0xFF34D399)).withOpacity(isDark ? 0.10 : 0.14),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Heavy Gaussian Blur Diffusion Layer
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 45, sigmaY: 45),
                    child: Container(color: Colors.transparent),
                  ),
                ],
              );
            },
          ),

          // Primary Content Screens
          IndexedStack(
            index: _currentTabIndex,
            children: screens,
          ),

          // Truly Floating Nav Bar overlaying the stack with zero scaffold background
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: AdaptiveNavBar(
              currentIndex: _currentTabIndex,
              onTabSelected: (index) => setState(() => _currentTabIndex = index),
              onAddTap: _openAddTaskSheet,
            ),
          ),
        ],
      ),
    );
  }
}


