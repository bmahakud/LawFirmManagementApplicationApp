#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import ctypes.util

if sys.platform == 'darwin':
    _orig_find_library = ctypes.util.find_library
    def _patched_find_library(name):
        for ext in ['.dylib', '.0.dylib', '.2.dylib', '-0.dylib']:
            p = f'/opt/homebrew/lib/lib{name}{ext}'
            if os.path.exists(p):
                return p
            clean_name = name.replace('-0', '').replace('-2', '')
            p2 = f'/opt/homebrew/lib/lib{clean_name}{ext}'
            if os.path.exists(p2):
                return p2
        return _orig_find_library(name)
    ctypes.util.find_library = _patched_find_library

    try:
        import cffi
        _orig_dlopen = cffi.FFI.dlopen
        def _patched_dlopen(self, name, flags=0):
            if isinstance(name, str) and not os.path.isabs(name):
                found = _patched_find_library(name)
                if found:
                    name = found
            return _orig_dlopen(self, name, flags)
        cffi.FFI.dlopen = _patched_dlopen
    except Exception:
        pass



def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
