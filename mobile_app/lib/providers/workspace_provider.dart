import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WorkspaceProvider extends ChangeNotifier {
  String _currentWorkspace = 'personal'; // 'personal' | 'team'

  String get currentWorkspace => _currentWorkspace;
  bool get isPersonal => _currentWorkspace == 'personal';
  bool get isTeam => _currentWorkspace == 'team';

  WorkspaceProvider() {
    _loadPreference();
  }

  Future<void> _loadPreference() async {
    final prefs = await SharedPreferences.getInstance();
    _currentWorkspace = prefs.getString('tb_mobile_workspace') ?? 'personal';
    notifyListeners();
  }

  Future<void> setWorkspace(String mode) async {
    if (_currentWorkspace == mode) return;
    _currentWorkspace = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('tb_mobile_workspace', mode);
  }

  void toggle() {
    setWorkspace(isPersonal ? 'team' : 'personal');
  }
}

