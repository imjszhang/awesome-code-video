# Contributing

Thanks for helping people make videos with code. Suggest a resource through an issue or send a focused pull request.

## What belongs here

We curate reusable video projects, shot implementations, visual style recipes, and the frameworks needed to use them. A useful addition has accessible documentation and a concrete artifact: editable source, a scene specification, a reusable style file, or a working example.

General design inspiration, generic AI video generators, unexplained demo reels, affiliate links, and projects without enough information to evaluate reuse are outside this list's scope. Archived or deprecated resources do not belong in the main list.

## Before suggesting a resource

- Search the list and open issues for duplicates.
- Link to the original project and, when possible, the exact example, template, or style file.
- Explain what is reusable and what a user still needs to build or replace.
- Describe the visual style and the kind of video it suits.
- State whether you tried it yourself or reviewed its source and documentation. Do not present source review as a successful render test.
- Mention material limitations, such as noncommercial terms, paid dependencies, required services, or assets licensed separately.
- Disclose if you maintain, sell, or are affiliated with the resource. Self-submissions are welcome and use the same criteria.

## Editing the list

English in `README.md` is the primary edition. Keep the corresponding Chinese entry in `README.zh-CN.md` aligned when possible; otherwise mention the translation gap in your pull request.

Use the existing category and format:

```markdown
- [Project Name](https://example.com/project) - Concise explanation of the reusable artifact, visual style, and suitable video use.
```

Use official project names, sentence case descriptions, and a final period. Write an objective explanation rather than a marketing slogan. Prefer stable HTTPS links. Do not add tracking parameters, star-count badges, or claims that you have not verified. Keep one resource per pull request unless the changes are closely related.

Update any linked detail pages or resource data when an entry's scope, URL, or reuse limitations change. Do not copy third-party descriptions or media without permission.

## Checks

Use Node.js 24 or newer and run:

```sh
npm ci
npm run lint
```

The check uses `awesome-lint` 2.3.0. The only nonblocking finding is the upstream requirement for a repository to be at least 30 days old; it is printed explicitly while this list is new. Invalid Git history and all other lint findings still fail. This exception disappears naturally once the repository is old enough.

For the unmodified upstream check, run:

```sh
npm run lint:strict
```

Passing lint does not imply acceptance into the main Awesome index. That index has its own submission requirements and review process.

## Rights and conduct

By contributing original catalog text, you agree to make it available under this repository's CC0 dedication. Linked projects, examples, artwork, screenshots, audio, and other third-party materials retain their own licenses.

Be respectful, discuss the resource rather than the person, and keep suggestions relevant. Maintainers may decline entries that do not meet the curation criteria.
