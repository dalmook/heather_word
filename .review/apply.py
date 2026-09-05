"""One-time, integrity-checked transfer of the locally tested redesign.
Applies only to the isolated review branch. Never writes production data.
"""
from pathlib import Path
import base64, hashlib, json, lzma, os, shutil

if os.environ.get('GITHUB_REF') != 'refs/heads/redesign/commercial-20260905':
    raise SystemExit('Review branch required')
root = Path.cwd()
parts = sorted((root / '.review').glob('part-*.b64'))
if len(parts) != 17:
    raise SystemExit('Incomplete source transfer')
packed = base64.b64decode(''.join(p.read_text() for p in parts), validate=True)
expected = '583a5d6f8e3364e490ca8ebb93135027f90836377ddcad9c9800875cadfa0d26'
if hashlib.sha256(packed).hexdigest() != expected:
    raise SystemExit('Source transfer checksum mismatch')
changes = json.loads(lzma.decompress(packed))
staged = []
for name, digest, operations in changes:
    path = root / name
    if not path.resolve().is_relative_to(root) or name.startswith('.git'):
        raise SystemExit('Invalid source path')
    original = path.read_bytes() if path.exists() else b''
    if digest is not None and hashlib.sha256(original).hexdigest() != digest:
        raise SystemExit('Baseline changed: ' + name)
    if digest is None and path.exists():
        raise SystemExit('New file already exists: ' + name)
    lines = original.decode('utf-8').splitlines(keepends=True)
    for start, end, replacement in reversed(operations):
        lines[start:end] = [replacement]
    staged.append((path, ''.join(lines)))
for path, text in staged:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')
print('Applied', len(staged), 'reviewed source files; checksum', expected)
shutil.rmtree(root / '.review')
