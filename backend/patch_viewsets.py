import os
import re

files_to_patch = [
    'payments/views/disbursement.py',
    'payments/views/fee_policy.py',
    'payments/views/gateway.py',
    'hospitals/views/service.py',
    'hospitals/views/hospital.py',
    'logs/views.py',
    'notifications/views.py'
]

for filepath in files_to_patch:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Check if already patched
    if 'CacheInvalidationMixin' in content:
        continue
        
    # Import CacheInvalidationMixin
    if 'from core.mixins import CacheInvalidationMixin' not in content:
        import_stmt = 'from core.mixins import CacheInvalidationMixin\n'
        content = import_stmt + content
        
    # Replace ModelViewSet with CacheInvalidationMixin, viewsets.ModelViewSet
    # Note: Sometimes it's viewsets.ModelViewSet, sometimes ModelViewSet
    def repl(m):
        class_name = m.group(1)
        base = m.group(2)
        group_name = class_name.lower().replace('viewset', 's')
        if 'CacheInvalidationMixin' in base:
            return m.group(0)
        return f"class {class_name}(CacheInvalidationMixin, {base}):\n    cache_group = '{group_name}'\n"

    content = re.sub(r'class\s+(\w+)\s*\(\s*([^)]*ModelViewSet[^)]*)\s*\):(\s*)', repl, content)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Patching complete.")
