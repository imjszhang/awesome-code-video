#!/usr/bin/env python3
"""Extract real MP4 frames. Requires curl, ffprobe and ffmpeg on PATH.

Run from any directory; --id limits regeneration, --at selects a frame in seconds.
Downloads remain in ignored .cache/. Only small WebP posters and provenance ship.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import re
import struct
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def run(args, timeout=240):
    return subprocess.run(args, check=True, capture_output=True, timeout=timeout).stdout

def sparse_source(source, cache, direct):
    """Build a sparse MP4 containing metadata; return a verified range fetcher."""
    ranges = []
    def fetch(start, end):
        # Bound each network request so a large keyframe can be retried cheaply.
        if end-start+1 > 262144:
            chunks = [(pos, min(pos+262143,end)) for pos in range(start,end+1,262144)]
            with ThreadPoolExecutor(max_workers=4) as pool:
                parts = list(pool.map(lambda bounds: fetch(*bounds), chunks))
            if len({part[1] for part in parts}) != 1 or any(part[2] for part in parts):
                raise ValueError('Inconsistent source ranges')
            return b''.join(part[0] for part in parts), parts[0][1], False
        prefix = str(cache) + f'.{start}-{end}'
        body, header = Path(prefix + '.bytes'), Path(prefix + '.headers')
        if body.exists() and header.exists():
            cached = re.findall(r'content-range: bytes (\d+)-(\d+)/(\d+)', header.read_text(), re.I)
            if cached and body.stat().st_size != int(cached[-1][1])-int(cached[-1][0])+1:
                body.unlink()
        if not body.exists() or not header.exists():
            network = ['--noproxy', '*'] if direct and 'github' not in source else []
            run(['curl', *network, '--fail', '--location', '--silent', '--show-error', '--retry', '2',
                 '--connect-timeout', '15', '--max-time', '120', '--range', f'{start}-{end}',
                 '--dump-header', str(header), '--output', str(body), source], 400)
        data = body.read_bytes()
        matches = re.findall(r'content-range: bytes (\d+)-(\d+)/(\d+)', header.read_text(), re.I)
        if not matches:
            if start == 0 and data[4:8] == b'ftyp':
                cache.write_bytes(data)
                return data, len(data), True
            raise ValueError('Source did not honor byte ranges')
        actual_start, actual_end, total = map(int, matches[-1])
        if actual_start != start or len(data) != actual_end-start+1:
            body.unlink(missing_ok=True)
            raise ValueError('Invalid byte range response')
        with cache.open('r+b' if cache.exists() else 'w+b') as handle:
            handle.truncate(total)
            handle.seek(start)
            handle.write(data)
        ranges.append(dict(start=start, end=actual_end, sha256=hashlib.sha256(data).hexdigest()))
        return data, total, False
    head, total, full = fetch(0, 65535)
    if not full:
        offset = 0
        while offset + 8 <= total:
            header = head[offset:offset+16] if offset+16 <= len(head) else fetch(offset, min(offset+15,total-1))[0]
            size, kind = struct.unpack('>I4s', header[:8])
            if size == 1:
                size = struct.unpack('>Q', header[8:16])[0]
            if size == 0:
                size = total-offset
            if size < 8 or offset+size > total:
                raise ValueError('Invalid MP4 atom')
            if kind != b'mdat' and offset+size > len(head):
                if size > 16*1024*1024:
                    raise ValueError('Unexpectedly large metadata atom')
                fetch(offset, offset+size-1)
            offset += size
    return fetch, ranges, full

def generate(resource, at=None, direct=False):
    preview = resource['preview']
    source = preview['url']
    cache = ROOT / '.cache/preview-videos' / (hashlib.sha256(source.encode()).hexdigest() + '.mp4')
    cache.parent.mkdir(parents=True, exist_ok=True)
    full = cache.exists()
    fetch, ranges = None, []
    if not full:
        cache = cache.with_suffix('.sparse.mp4')
        fetch, ranges, full = sparse_source(source, cache, direct)
    info = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(cache)]))
    stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    duration = float(info['format']['duration'])
    timestamp = round(at if at is not None else duration * .35, 3)
    if not 0 <= timestamp < duration:
        raise ValueError(f'Frame {timestamp}s outside duration {duration}s')
    if fetch and not full:
        packets = json.loads(run(['ffprobe', '-v', 'fatal', '-select_streams', 'v:0',
            '-read_intervals', f'{timestamp}%{min(duration, timestamp+1)}',
            '-show_packets', '-show_entries', 'packet=pos,size', '-of', 'json', str(cache)]))['packets']
        if not packets:
            raise ValueError('No packets at capture timestamp')
        fetch(min(int(p['pos']) for p in packets), max(int(p['pos'])+int(p['size']) for p in packets)-1)
    poster = ROOT / 'web/public/previews'   / (resource['id'] + '.webp')
    poster.parent.mkdir(parents=True, exist_ok=True)
    # Sparse inputs can report probe errors for intentionally absent frames.
    # All packets from the seek keyframe through the requested frame are present.
    run(['ffmpeg', '-v', 'error', '-y', '-analyzeduration', '1', '-probesize', '32',
         '-max_error_rate', '1', '-ss', str(timestamp), '-i', str(cache),
         '-frames:v', '1', '-vf', "scale=640:640:force_original_aspect_ratio=decrease,setsar=1",
         '-c:v', 'libwebp', '-quality', '82', str(poster)])
    if not poster.exists() or poster.stat().st_size == 0:
        raise ValueError('No frame was produced')
    return dict(resource_id=resource['id'], source_url=source,
                poster='/previews/' + poster.name, timestamp_seconds=timestamp,
                duration_seconds=duration, source_width=stream['width'], source_height=stream['height'],
                source_sha256=hashlib.sha256(cache.read_bytes()).hexdigest() if full else None,
                source_byte_ranges=sorted(ranges, key=lambda chunk: chunk['start']),
                poster_sha256=hashlib.sha256(poster.read_bytes()).hexdigest(),
                license=preview['license'], attribution=preview['attribution'])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id', action='append', help='Resource to regenerate (repeatable)')
    parser.add_argument('--direct', action='store_true', help='Bypass environment HTTP proxies for non-GitHub hosts')
    parser.add_argument('--at', type=float, help='Exact timestamp; requires one --id')
    args = parser.parse_args()
    if args.at is not None and (not args.id or len(args.id) != 1):
        parser.error('--at requires exactly one --id')
    resources_path = ROOT / 'data/resources.json'
    resources = json.loads(resources_path.read_text())
    targets = [r for r in resources if r.get('preview', {}).get('kind') == 'video'
               and r['preview']['url'].split('?')[0].lower().endswith('.mp4')
               and (not args.id or r['id'] in args.id)]
    if args.id and set(args.id) != {r['id'] for r in targets}:
        parser.error('Unknown MP4 resource id')
    manifest_path = ROOT / 'data/preview-posters.json'
    records = {r['resource_id']: r for r in json.loads(manifest_path.read_text())} if manifest_path.exists() else {}
    failed = []
    with ThreadPoolExecutor(max_workers=16) as pool:
        jobs = {}
        for resource in targets:
            previous = records.get(resource['id'], {})
            timestamp = args.at
            if timestamp is None and previous.get('source_url') == resource['preview']['url']:
                timestamp = previous['timestamp_seconds']
            jobs[pool.submit(generate, resource, timestamp, args.direct)] = resource
        for job in as_completed(jobs):
            resource = jobs[job]
            try:
                record = job.result()
                records[resource['id']] = record
                resource['preview']['poster'] = record['poster']
                print('OK', resource['id'], record['timestamp_seconds'], flush=True)
            except Exception as error:
                failed.append(resource['id'])
                detail = error.stderr.decode(errors='replace')[-500:] if isinstance(error, subprocess.CalledProcessError) else str(error)
                print('FAILED', resource['id'], detail, flush=True)
    manifest_path.write_text(json.dumps(sorted(records.values(), key=lambda r: r['resource_id']), ensure_ascii=False, indent=2) + '\n')
    resources_path.write_text(json.dumps(resources, ensure_ascii=False, indent=2) + '\n')
    print(f'Generated {len(targets)-len(failed)}/{len(targets)} posters', flush=True)
    if failed:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
