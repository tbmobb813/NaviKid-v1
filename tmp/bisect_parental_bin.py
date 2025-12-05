#!/usr/bin/env python3
import re, subprocess, os
path = "stores/__tests__/parentalStore.test.ts"
text = open(path).read()
tests = re.findall(r"it\(\s*['\"](.*?)['\"]", text)
print(f"Found {len(tests)} tests in {path}")
if not tests:
    print('No tests found')
    raise SystemExit(1)

low = 1
high = len(tests)
first_fail = None
# binary search for first failing prefix
while low <= high:
    mid = (low + high) // 2
    subset = tests[:mid]
    import re
    escaped = [re.escape(t) for t in subset]
    regex = "^(" + "|".join(escaped) + ")$"
    print(f"\nRunning prefix up to test {mid} (1..{mid})\n")
    env = os.environ.copy()
    env['BABEL_DISABLE_MODULE_RESOLVER']='1'
    cmd = ["npx","jest","stores/__tests__/parentalStore.test.ts","-i","--runInBand","--detectOpenHandles","-t",regex]
    rc = subprocess.run(cmd, env=env).returncode
    print(f"Jest return code: {rc}")
    if rc == 0:
        low = mid + 1
    else:
        first_fail = mid
        high = mid - 1

if first_fail is None:
    print('\nNo failing prefix found; failures may be due to interactions not captured by prefix runs.')
    raise SystemExit(0)
else:
    print(f"\nFirst failing prefix ends at test index {first_fail}: \"{tests[first_fail-1]}\"")
    raise SystemExit(2)
