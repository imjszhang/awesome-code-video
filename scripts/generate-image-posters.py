#!/usr/bin/env python3
"""Bundle static upstream preview images. Requires Pillow and curl.

Animated GIF/WebP previews keep their upstream URL; the gallery uses a small
local still, so loading the gallery does not depend on upstream image hosts.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def capture(resource):
    source = resource['preview']['url']
    cache = ROOT / '.cache/image-previews' / hashlib.sha256(source.encode()).hexdigest()
    cache.parent.mkdir(parents=True, exist_ok=True)
    if not cache.exists():
        partial = cache.with_suffix('.'+resource['id']+'.part')
        subprocess.run(['curl','-fsSL','--retry','2','--continue-at','-','--connect-timeout','15','--max-time','180','-o',str(partial),source],check=True,capture_output=True,timeout=600)
        partial.replace(cache)
    with Image.open(cache) as original:
        frames = getattr(original, 'n_frames', 1)
        frame = int((frames-1)*.4)
        original.seek(frame)
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((640,640))
        path = ROOT / 'web/public/previews' / (resource['id']+'.webp')
        image.save(path,'WEBP',quality=82)
    return dict(resource_id=resource['id'],source_url=source,poster='/previews/'+path.name,
                source_sha256=hashlib.sha256(cache.read_bytes()).hexdigest(),frame_index=frame,frame_count=frames,
                poster_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                license=resource['preview']['license'],attribution=resource['preview']['attribution'])

def main():
    path=ROOT/'data/resources.json'
    resources=json.loads(path.read_text())
    targets=[r for r in resources if r.get('preview',{}).get('kind')=='thumb_link']
    manifest=ROOT/'data/image-preview-posters.json'
    records={r['resource_id']:r for r in json.loads(manifest.read_text())} if manifest.exists() else {}
    failed=[]
    with ThreadPoolExecutor(max_workers=12) as pool:
        jobs={pool.submit(capture,r):r for r in targets}
        for job in as_completed(jobs):
            r=jobs[job]
            try:
                record=job.result();records[r['id']]=record;r['preview']['poster']=record['poster']
                print('OK',r['id'],flush=True)
            except Exception as error:
                failed.append(r['id']);print('FAILED',r['id'],str(error),flush=True)
    manifest.write_text(json.dumps(sorted(records.values(),key=lambda r:r['resource_id']),ensure_ascii=False,indent=2)+'\n')
    path.write_text(json.dumps(resources,ensure_ascii=False,indent=2)+'\n')
    print('Completed',len(targets)-len(failed),'/',len(targets),flush=True)
    if failed:raise SystemExit(1)

if __name__=='__main__':main()
