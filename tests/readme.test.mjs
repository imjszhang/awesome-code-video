import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditReadmes, readEntries } from '../scripts/check-readme.mjs';

const resources = [
  { id: 'film', name: 'Example Film', kind: 'film', url: 'https://example.com/film', section: 'Film and Scene Templates', description: 'Editable film with [reference](https://example.com/docs).' },
  { id: 'style', name: 'Example Style', kind: 'style', url: 'https://example.com/style', section: 'Visual Style Templates', description: 'Art direction for a new video.' },
  { id: 'engine', name: 'Example Engine', kind: 'framework', url: 'https://example.com/engine', section: 'Frameworks and Renderers', description: 'Video rendering engine.' },
  { id: 'related', name: 'Related List', kind: 'collection', url: 'https://example.com/list', section: 'Related Lists', description: 'Broader resources.' },
];
const english = `# Example
The first edition contains 2 reusable examples, recipes, and styles.
## Contents
- [Film and Scene Templates](#film-and-scene-templates)
## Film and Scene Templates
An explanatory [link](https://example.com/film) can be repeated.
- [Example Film](https://example.com/film) - Editable film with [reference](https://example.com/docs).
## Visual Style Templates
- [Example Style](https://example.com/style) - Art direction for a new video.
## Frameworks and Renderers
- [Example Engine](https://example.com/engine) - Video rendering engine.
## Related Lists
- [Related List](https://example.com/list) - Broader resources.
`;
const chinese = `# 示例
本版覆盖首批 2 个可复用单元。
## Contents
- [视觉风格文件](#视觉风格文件)
## 成片与场景工程
- [示例影片](https://example.com/film) - 有编辑源码。
## 视觉风格文件
| 风格 | 用途 |
| --- | --- |
| [示例风格](https://example.com/style) | 教学 |
## 视频制作框架
- [示例引擎](https://example.com/engine) - 渲染视频。
## 相关清单
- [相关目录](https://example.com/list) - 更多资源。
## 复用边界
- [示例影片](https://example.com/film) - 这里只是重复提及，不是收录条目。
`;
const audit = (changes = {}) => auditReadmes({ resources, english, chinese, ...changes });

test('checks bilingual entries, ignores prose links and supporting resources in core count', () => {
  assert.deepEqual(audit(), { errors: [], summary: { catalog: 4, core: 2, english: 4, chinese: 4 } });
});

test('reports an English listing removed from the README', () => {
  const result = audit({ english: english.replace(/^- \[Example Film\].*\n/m, '') });
  assert(result.errors.some((error) => error.includes('Missing resource entry: film')));
});

test('reports wrong English section, name, and description', () => {
  const changed = english.replace('## Film and Scene Templates\n', '## Shot Recipes\n').replace('[Example Film]', '[Renamed Film]').replace('Editable film with', 'Changed film with');
  const result = audit({ english: changed });
  assert(result.errors.some((error) => error.includes('belongs in "Film and Scene Templates"')));
  assert(result.errors.some((error) => error.includes('Name differs')));
  assert(result.errors.some((error) => error.includes('Description differs')));
});

test('reports duplicate entries and untracked entries', () => {
  const changed = english.replace('## Visual Style Templates', '- [Example Film](https://example.com/film) - Editable film with [reference](https://example.com/docs).\n- [New](https://example.com/new) - New source.\n## Visual Style Templates');
  const result = audit({ english: changed });
  assert(result.errors.some((error) => error.includes('Duplicate resource entry')));
  assert(result.errors.some((error) => error.includes('Entry is not in')));
});

test('reports a missing Chinese table entry and a wrong Chinese section', () => {
  const changed = chinese.replace(/^\| \[示例风格\].*\n/m, '').replace('## 视频制作框架', '## 制作工作流');
  const result = audit({ chinese: changed });
  assert(result.errors.some((error) => error.includes('README.zh-CN.md: Missing resource entry: style')));
  assert(result.errors.some((error) => error.includes('engine belongs in')));
});

test('catches count drift in both language introductions', () => {
  const result = audit({ english: english.replace('contains 2', 'contains 30'), chinese: chinese.replace('首批 2', '首批 30') });
  assert.equal(result.errors.filter((error) => error.includes('Intro advertises 30')).length, 2);
});

test('fails a missing count, duplicate catalog URL, and unsupported section', () => {
  const result = audit({ resources: [...resources, { ...resources[0], id: 'duplicate', section: 'Unknown' }], english: english.replace('contains 2 reusable', 'has several reusable') });
  assert(result.errors.some((error) => error.includes('duplicate resource URL')));
  assert(result.errors.some((error) => error.includes('unsupported README section')));
  assert(result.errors.some((error) => error.includes('Missing recognizable')));
});

test('fenced example bullets are not treated as listings', () => {
  const markdown = '## Shot Recipes\n```markdown\n- [Fake](https://fake.example/) - A code example.\n```\n- [Real](https://real.example/) - A listing.\n';
  assert.deepEqual(readEntries(markdown).map((entry) => entry.name), ['Real']);
});

test('CLI checks an isolated root without rewriting files and exits nonzero on drift', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'code-video-readme-'));
  try {
    await fs.mkdir(path.join(root, 'data'));
    await fs.writeFile(path.join(root, 'data/resources.json'), JSON.stringify(resources));
    await fs.writeFile(path.join(root, 'README.md'), english);
    await fs.writeFile(path.join(root, 'README.zh-CN.md'), chinese);
    const script = new URL('../scripts/check-readme.mjs', import.meta.url);
    const valid = spawnSync(process.execPath, [script.pathname, '--root', root], { encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    const changed = english.replace('contains 2', 'contains 30');
    await fs.writeFile(path.join(root, 'README.md'), changed);
    const invalid = spawnSync(process.execPath, [script.pathname, '--root', root], { encoding: 'utf8' });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Intro advertises 30/);
    assert.equal(await fs.readFile(path.join(root, 'README.md'), 'utf8'), changed);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
