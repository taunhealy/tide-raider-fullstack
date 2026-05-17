import os
import sys

# Force output to use utf-8
sys.stdout.reconfigure(encoding='utf-8')

log_path = os.path.join("tmp_err.txt")
if os.path.exists(log_path):
    try:
        with open(log_path, "r", encoding="utf-16-le", errors='ignore') as f:
            content = f.read()
        print("--- TMP_ERR CONTENTS ---")
        print(content[-5000:])
    except Exception as e:
        print(f"Error reading log file: {e}")
else:
    print("tmp_err.txt not found")
