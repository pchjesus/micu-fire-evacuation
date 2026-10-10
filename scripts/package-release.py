"""Build a verifiable review ZIP from a clean Git checkout, without operational data."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
release = f'fire_evacuation_prototype_v{version}_RC'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=root, text=True).strip()

commit = git('rev-parse', 'HEAD')
if not re.fullmatch(r'[0-9a-f]{40}', commit):
    raise RuntimeError('Source Git commit cannot be determined.')
if git('status', '--porcelain'):
    raise RuntimeError('Working tree is not clean; commit or isolate changes before packaging.')

paths = [root / name for name in (
    'index.html', 'style.css', 'build-info.js', 'storage.js', 'audit.js', 'audit-model.js',
    'script.js', 'personnel.js', 'history.js',
    'README.md', 'TEST_REPORT.md', 'package.json', 'package-lock.json', '.gitignore',
    f'CHANGELOG_v{version}.md', f'RELEASE_REPORT_v{version}.md',
)]
for directory in ('vendor', 'domain', 'ui', 'data', 'tests', 'scripts', 'docs'):
    paths.extend(p for p in (root / directory).rglob('*')
                 if p.is_file() and '__pycache__' not in p.parts)
paths.extend(p for p in (root / 'artifacts' / f'v{version}').glob('*')
             if p.suffix in {'.png', '.pdf'} or p.name in {'automated-tests.txt', 'workbook-verification.json'})
payloads = {str(p.relative_to(root)): p.read_bytes() for p in sorted(set(paths))}
marker = b'const revision = null;'
assert payloads['build-info.js'].count(marker) == 1
payloads['build-info.js'] = payloads['build-info.js'].replace(marker, ("const revision = '"+commit+"';").encode('ascii'))
manifest = {name: hashlib.sha256(data).hexdigest() for name, data in payloads.items()}
output = root / 'dist' / f'{release}.zip'
output.parent.mkdir(exist_ok=True)
prefix = release + '/'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, data in payloads.items():
        archive.writestr(prefix + name, data)
    archive.writestr(prefix + 'SHA256SUMS.json', json.dumps(manifest, indent=2, ensure_ascii=False))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for name, expected in manifest.items():
        assert hashlib.sha256(archive.read(prefix + name)).hexdigest() == expected
    assert commit.encode('ascii') in archive.read(prefix + 'build-info.js')
print(output)
print(f'{output.stat().st_size:,} bytes; {len(manifest)} files verified')
print('Source Git SHA:', commit)
print('ZIP SHA256:', hashlib.sha256(output.read_bytes()).hexdigest())
