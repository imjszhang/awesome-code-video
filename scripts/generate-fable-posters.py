#!/usr/bin/env python3
"""Bundle Fable spotlight stills. Requires Pillow and curl.

The gallery keeps upstream preview URLs for provenance. Cards use these
local WebP stills so the page does not depend on pbs.twimg.com. Videos
are not downloaded.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GALLERY = ROOT / 'data/fable-52-gallery.json'
MANIFEST = ROOT / 'data/fable-52-posters.json'
CACHE = ROOT / '.cache/fable-posters'
OUT = ROOT / 'web/public/spotlight/fable-5-2'


def download(source: str, cache: Path) -> None:
    if cache.exists() and cache.stat().st_size > 0:
        return
    cache.parent.mkdir(parents=True, exist_ok=True)
    partial = cache.with_suffix('.part')
    subprocess.run(
        ['curl', '-fsSL', '--retry', '2', '--continue-at', '-', '--connect-timeout', '15', '--max-time', '180', '-o', str(partial), source],
        check=True,
        capture_output=True,
        timeout=600,
    )
    partial.replace(cache)


def capture(item: dict) -> dict:
    source = item['preview']
    cache = CACHE / hashlib.sha256(source.encode()).hexdigest()
    download(source, cache)
    with Image.open(cache) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((640, 640))
        path = OUT / f"{item['id']}.webp"
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, 'WEBP', quality=82)
    poster = f"/spotlight/fable-5-2/{path.name}"
    return {
        'id': item['id'],
        'source_url': source,
        'source_sha256': hashlib.sha256(cache.read_bytes()).hexdigest(),
        'poster': poster,
        'poster_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def main() -> None:
    gallery = json.loads(GALLERY.read_text())
    items = gallery['items']
    failed = []
    records = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        jobs = {pool.submit(capture, item): item for item in items}
        for job in as_completed(jobs):
            item = jobs[job]
            try:
                record = job.result()
                records[item['id']] = record
                print('OK', item['id'], flush=True)
            except Exception as error:
                failed.append(item['id'])
                print('FAILED', item['id'], str(error), flush=True)
    ordered = [records[item['id']] for item in items if item['id'] in records]
    MANIFEST.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n')
    print('Completed', len(ordered), '/', len(items), flush=True)
    if failed or len(ordered) != len(items):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
