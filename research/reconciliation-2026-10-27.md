# Original inventory reconciliation

Reviewed on 2026-10-27. All 57 public leads are accounted for in the [machine-readable reconciliation](reconciliation-2026-10-27.json). Private collection IDs and article text are excluded.

- 11 leads were already represented by selected resources or an exact listing. Project coverage does not imply every upstream artifact was audited.
- 3 leads were admitted in this batch as 5 resources: three Webreel browser-demo recipes, llm-explain, and Remotion Agent Skills.
- 43 leads remain deferred, with a reason and candidate ID for each. Of these, Battle-of-Austerlitz-Film and opus-video-prompts received fresh source review; the other 41 received scope triage only.
- The candidate ledger has 48 records: 46 original uncovered leads plus 2 additional Webreel examples; 5 accepted and 43 deferred.

The catalog now has 16 projects, 43 resources and 47 evidence records. Its 33 core resources are 4 films/scenes, 6 map presets, 11 shot recipes and 12 visual styles. Frameworks, workflows and related lists are counted separately. All new admissions are source-reviewed, not render-tested.

## Decisions requiring follow-up

Battle-of-Austerlitz-Film contains film source, but its inspected README, root listing and package manifest did not establish reuse permission. Ask for or locate a license before treating it as a reusable template. The prompt anthology needs original-author and completeness checks per prompt. Article and social-post leads remain candidates until their primary artifacts can be identified. The original 3b1b/manim implementation is distinct from Manim Community and has not been marked as a duplicate.

## Next review batch

Prioritize concrete artifacts in ThreeUI, Amicro, Anatomy and the original article leads. Locate editable files, record primary-source evidence and dependency/asset terms, then decide whether each is a video recipe, a supporting workflow, or outside this list's scope. Deferred means further work is needed, not that the project lacks useful code.
