import os

files_to_check = [
    'mobile_app/lib/features/auth/auth_screen.dart',
    'mobile_app/lib/features/auth/auth_modal_sheet.dart',
    'mobile_app/lib/features/auth/google_sign_in_sheet.dart',
    'mobile_app/lib/services/firebase_sync_service.dart',
    'mobile_app/lib/providers/auth_provider.dart',
    'mobile_app/lib/features/focus/deep_focus_screen.dart',
    'mobile_app/lib/core/widgets/designer_loader.dart',
    'mobile_app/lib/features/dashboard/loading_showcase_sheet.dart',
    'mobile_app/lib/features/dashboard/app_icon_picker_sheet.dart',
    'mobile_app/lib/services/app_icon_service.dart',
    'mobile_app/lib/features/dashboard/dashboard_screen.dart',
    'mobile_app/lib/features/music/focus_music_sheet.dart',
    'mobile_app/lib/features/super_hub/super_hub_screen.dart',
    'mobile_app/lib/features/connections/connections_screen.dart',
    'mobile_app/lib/core/widgets/designer_pull_to_refresh.dart',
    'mobile_app/lib/features/projects/projects_screen.dart',
    'mobile_app/lib/features/tasks/task_schedule_screen.dart',
    'mobile_app/lib/services/festive_service.dart',
    'mobile_app/lib/core/widgets/app_brand_logo.dart',
    'mobile_app/lib/features/tasks/ai_schedule_optimizer_sheet.dart',
    'mobile_app/lib/features/super_hub/stealth_vault_sheet.dart',
    'mobile_app/lib/features/analytics/analytics_sheet.dart',
    'mobile_app/lib/providers/theme_provider.dart',
    'mobile_app/lib/services/apex_tier_service.dart',
    'mobile_app/lib/models/task_model.dart',
    'mobile_app/lib/features/tasks/task_table_view.dart',
    'mobile_app/lib/features/dashboard/apex_benefits_sheet.dart',
    'mobile_app/lib/features/tasks/add_task_bottom_sheet.dart',
    'mobile_app/lib/providers/project_provider.dart',
]

def check_file(path):
    if not os.path.exists(path):
        return f"File does not exist: {path}"
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Simple bracket matching
    stack = []
    in_string = False
    string_char = ''
    in_single_comment = False
    in_multi_comment = False

    i = 0
    line_no = 1
    col_no = 1
    while i < len(code):
        c = code[i]
        if c == '\n':
            line_no += 1
            col_no = 0
            if in_single_comment:
                in_single_comment = False
        col_no += 1

        if in_single_comment:
            i += 1
            continue
        if in_multi_comment:
            if c == '*' and i + 1 < len(code) and code[i+1] == '/':
                in_multi_comment = False
                i += 2
                continue
            i += 1
            continue

        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == string_char:
                in_string = False
            i += 1
            continue

        # Check comment starts
        if c == '/' and i + 1 < len(code):
            if code[i+1] == '/':
                in_single_comment = True
                i += 2
                continue
            elif code[i+1] == '*':
                in_multi_comment = True
                i += 2
                continue

        # Check string starts
        if c in ("'", '"'):
            in_string = True
            string_char = c
            i += 1
            continue

        if c in '({[':
            stack.append((c, line_no, col_no))
        elif c in ')}]':
            if not stack:
                return f"Unmatched closing '{c}' at {line_no}:{col_no}"
            top, tl, tc = stack.pop()
            expected = {'(': ')', '{': '}', '[': ']'}[top]
            if c != expected:
                return f"Mismatched bracket: expected '{expected}' (opened at {tl}:{tc}), got '{c}' at {line_no}:{col_no}"

        i += 1

    if stack:
        top, tl, tc = stack[-1]
        return f"Unclosed '{top}' opened at {tl}:{tc}"
    return "OK"

for f in files_to_check:
    res = check_file(f)
    print(f"[{res}] {f}")

