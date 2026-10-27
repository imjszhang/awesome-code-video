# Awesome Code Video [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> 用代码制作视频：可复用的视觉风格、镜头配方与成片工程。

[English](README.md) · 简体中文

面向用 HTML、React、JavaScript、TypeScript 或 Python 制作视频的人，精选适合产品宣传、知识科普、数据叙事和旅行视频的资源。每项说明画面风格、适用场景，以及实际能拿来修改的部分。

英文版是主版本。本版覆盖首批 63 个可复用单元：28 个成片或场景工程、6 个地图镜头、14 个镜头配方、15 个风格文件。2026-10-27 核对了上游文档和目录，尚未逐项安装或试渲染；适用视频类型是本清单的整理建议。

## Contents

- [如何选择](#如何选择)
- [成片与场景工程](#成片与场景工程)
- [参数化地图镜头](#参数化地图镜头)
- [可复用镜头配方](#可复用镜头配方)
- [视觉风格文件](#视觉风格文件)
- [视频制作框架](#视频制作框架)
- [视频动效辅助工具](#视频动效辅助工具)
- [制作工作流](#制作工作流)
- [相关清单](#相关清单)
- [复用边界](#复用边界)

## 如何选择

| 想做的视频 | 可以从哪里开始 | 实际复用的内容 |
| --- | --- | --- |
| 知识库、笔记或 SaaS 产品宣传 | Ink Press | 完整工程、分镜、字卡与音效时间点 |
| 历史故事、人物解读、知识科普 | Paper-Cut 或白板风格 | 分层场景代码，或生成新片所用的风格约束 |
| 自然科学竖屏短片 | Butterfly Life | 成片示例、绘图代码与渲染流程 |
| 城市介绍、旅行路线、地点说明 | map-motion | 地图镜头的参数文件 |
| 软件功能演示 | video-shotcraft | 界面入场、搜索筛选、运镜和收尾配方 |
| 开发者或游戏主题短片 | ASCII / CRT 或 Claude Quest | 终端风格规范，或像素游戏影片工程 |

**工程**可以作为新作品的代码起点；**镜头**需要接入自己的时间轴；**风格文件**可交给编程助手生成新作品。三者需要的改造工作不同。

## 成片与场景工程

- [Ink Press](https://github.com/Vincentwei1021/video-shotcraft/tree/main/template) - 纸底、墨字、琥珀色的编辑出版风产品宣传片，适合笔记、研究管理、SaaS 和桌面软件。提供 36.2 秒、10 镜头的 Remotion 工程；更换产品截图、元素切片、页面坐标、文案和品牌信息，并按新页面调整取景。[样片与镜头画廊](https://vincentwei1021.github.io/video-shotcraft/)。
- [Paper-Cut：五层纸片场景](https://github.com/HeiGeAi/Paper-Cut/tree/main/examples/five-layer-motion) - 纸张纹理、撕边、半调印刷与分层视差，适合历史、人物和概念说明。提供 20 秒无声 HyperFrames / GSAP 场景，包含纸片组装、炸开、碰撞与重新落版；更换图片时必须重新调整分层蒙版，不能直接沿用原图坐标。
- [Butterfly Life](https://github.com/kuhnhomeuk-cell/procedural-film/tree/main/examples/butterfly-life) - 用程序绘图表现生命阶段变化，适合自然科学与过程演化科普。提供 32 秒、17 镜头的竖屏影片源码、配乐、规划文档与渲染工具；更换主题通常需要改写主体绘制和镜头内容。
- [Claude Quest](https://github.com/kuhnhomeuk-cell/procedural-film/tree/main/examples/claude-quest-v2) - NES 像素平台游戏、CRT 显示效果与芯片音乐，适合游戏风故事、升级闯关隐喻和技术趣味短片。可复用游戏运行式影片、记录的操作轨迹和复古引擎；角色、关卡与剧情的调整需要编码。
- [等距水波槽图解](https://github.com/wheresryan22/anatomy/tree/main/examples/ripple-tank) - 等距实验装置配 SVG 结构与 WebGL 水波，适合波的干涉与实验原理讲解。复用 Node 构建脚本、明暗主题页面和频率/间距控制，调整模型、标注与操作序列；还需浏览器录制或可控视频时间轴，并自行配音。示例输出 HTML，不直接输出 MP4。

- [播客音频可视化](https://github.com/remotion-dev/remotion/tree/main/packages/template-audiogram) - 波形与同步字幕，适合播客片段、访谈摘录。替换音频、字幕数据和可视化参数；时长随音频计算，使用前核对 Remotion 授权。
- [代码变换讲解](https://github.com/remotion-dev/remotion/tree/main/packages/template-code-hike) - 语法高亮、代码 token 衔接与标注，适合编程教学和重构演示。替换代码、主题、注释和节奏；使用前核对 Remotion 授权。
- [逐词高亮字幕](https://github.com/remotion-dev/remotion/tree/main/packages/template-tiktok) - 粗体描边、当前词高亮与弹入字幕，适合口播和社交科普。替换视频、字幕、字体和位置，按语言调整转写设置并核对 Remotion 授权。

- [客户证言：霓虹分屏](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/testimonial/Testimonial.tsx) - 可主题切换的 Remotion 客户证言成片，含居中、分屏和编辑排版，站点主预览变体是 Neon Split。复用 Testimonial.tsx，替换引言、客户和行动号召。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [提案：深色高管风](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/proposal/Proposal.tsx) - 用于范围、时间线和报价演示的 Remotion 提案成片，列出的主预览变体是 Dark Executive。复用 Proposal.tsx，替换文案和数字。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [活动：霓虹倒计时](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/event/Event.tsx) - 用于活动主视觉、嘉宾卡片和倒计时的 Remotion 成片，列出的主预览变体是 Neon Countdown。复用 Event.tsx，替换活动名称、日程和嘉宾。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [讲解：深色电影感](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/explainer/Explainer.tsx) - 用于产品走查和功能拆解的 Remotion 讲解成片，列出的主预览变体是 Dark Cinematic。复用 Explainer.tsx，替换步骤和文案。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [案例：霓虹聚焦](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/casestudy/CaseStudy.tsx) - 用于前后对比和结果标注的 Remotion 案例成片，列出的主预览变体是 Neon Spotlight。复用 CaseStudy.tsx，替换客户故事和指标。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [课程宣传：深色总览](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/coursepromo/CoursePromo.tsx) - 用于课程大纲、讲师和总览版式的 Remotion 成片，列出的主预览变体是 Dark Overview。复用 CoursePromo.tsx，替换大纲和讲师信息。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [回顾：霓虹时间线](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/recap/Recap.tsx) - 用于仪表盘、卡片和项目时间线的 Remotion 回顾成片，列出的主预览变体是 Neon Timeline。复用 Recap.tsx，替换里程碑和指标。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [教程：深色分步](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/tutorial/Tutorial.tsx) - 用于编号步骤、卡片序列和分屏演示的 Remotion 教程成片，列出的主预览变体是 Dark Numbered Steps。复用 Tutorial.tsx，替换步骤和界面。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [KPI 计数器](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/kpi-counter/KpiCounter.tsx) - 独立的 Remotion 场景，在错开的卡片上滚动 KPI 数字。README 写明 1920×1080、4 秒，KpiCounter.tsx 为 30 fps、120 帧。复用组件和类型化参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [生长柱状图](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/bar-chart-anim/BarChartAnim.tsx) - 独立的 Remotion 场景，柱形按数据序列生长。README 写明 1920×1080、5 秒。复用 BarChartAnim.tsx 及其参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [故障文字](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/glitch-text/GlitchText.tsx) - 独立的 Remotion 标题场景，故障文字先错位再稳定。README 写明 1920×1080、4 秒。复用 GlitchText.tsx 及其参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [Logo 虚化揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-blur-reveal/LogoBlurReveal.tsx) - 独立的 Remotion 场景，Logo 从虚化中变清晰。README 写明 1920×1080、4 秒。复用 LogoBlurReveal.tsx 及其参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [打字机](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/typewriter/Typewriter.tsx) - 独立的方形 Remotion 场景，带光标逐字打出文案。README 写明 1080×1080、约 3.3 秒。复用 Typewriter.tsx 及其参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [竞速柱状图](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/racing-chart/RacingChart.tsx) - 独立的 Remotion 场景，柱形随数值变化重新排序。README 写明 1920×1080、7 秒。复用 RacingChart.tsx 及其参数，并保留 MIT 声明。链接的 GIF 是动画预览，不是 MP4 成片；Remotion 运行时许可另行适用。
- [Unspar 产品演示](https://github.com/vincentsch/explainroo/tree/main/examples/unspar-demo) - explainroo 产品演示示例，含 script.md、scenes.js 和 video.json，为干净的 YouTube 尺寸 Unspar 走查。复用该示例结构，替换产品、品牌和脚本。仓库为 MIT，但站点托管的 MP4 不在仓库内，不标记为可再分发。
- [API 做什么](https://www.explainroo.com/videos/what-an-api-does) - explainroo 已发布的 API 讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [复利如何运作](https://www.explainroo.com/videos/how-compound-interest-works) - explainroo 已发布的复利讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [ChatGPT 演示](https://www.explainroo.com/videos/chatgpt-demo) - explainroo 已发布的 ChatGPT 风格产品演示页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [从零到产品片头](https://github.com/specstoryai/zero-to-product-video-hero/tree/main/example) - Remotion 产品片头示例，场景组件在 example/src，并提交了 example/out/video.mp4。example/src/Root.tsx 注册为 1920×1080、30 fps；README 还描述了另一条更长的片头，此处未测量其时长。复用该示例并保留 MIT 声明。Remotion 运行时许可另行适用。
- [提示词生成视频](https://www.remotion.dev/templates/prompt-to-video) - Remotion 官方模板，用提示词生成竖屏故事、配图、旁白和时间线。复用模板仓库，并自行提供 OpenAI 与 ElevenLabs 凭证。该模板仓库没有 LICENSE 文件，条款待确认；预览只链到官方缩略图，不得复制。使用前核对 Remotion 许可。

## 参数化地图镜头

以下示例来自 [map-motion](https://github.com/SpaceZephyr/map-motion)。复制 JSON 示例后修改坐标、路线、标签和时间配置，再按项目说明渲染。所选地图模式可能需要 API Key 或对应数据。

| 示例 | 视觉风格 | 适合的视频 | 主要替换内容 |
| --- | --- | --- | --- |
| [地球俯冲定位](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/vlog_locate.json) | 从全球连续推近地点，叠加地名与坐标 | 旅行开场、城市介绍、事件地点交代 | 地点、坐标、地名、时长 |
| [夜景定位](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/vlog_locate_night.json) | 暗色地图与夜间城市定位 | 夜游、都市生活、科技感片头 | 坐标、标签、地图样式 |
| [徒步海拔路线](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/hike_elevation.json) | 路线推进与海拔剖面 | 户外游记、登山攻略 | 轨迹、高程、路线标签 |
| [多站公路旅行](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/road_trip.json) | 行程地图与里程叙事 | 自驾回顾、多城路线攻略 | 停靠点、路线、日期、文字 |
| [航线连接](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/flight.json) | 飞行弧线连接地图地点 | 航旅、跨国活动、全球业务介绍 | 起终点、路线、标签 |
| [区域辐射](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/radiate.json) | 中心向多地扩散连线 | 配送覆盖、影响范围、业务版图 | 中心点、目标点、说明 |

## 可复用镜头配方

以下镜头来自 [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)，附镜头卡及对应的 Remotion 演示实现。先在[画廊](https://vincentwei1021.github.io/video-shotcraft/)看动作，再调整素材、文字、颜色与尺寸，接入自己的视频时间轴。

- [巨字透出产品](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/opening/text-as-mask.md) - 产品画面从大字遮罩中透出，适合品牌开场和功能揭晓。
- [页面空间运镜](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/camera/space-camera-moves.md) - 页面倾斜、空间移动与结构拆解，适合软件界面和功能结构展示。
- [发牌式卡片入场](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/ui-entrance/deck-deal-flyin.md) - 卡片从牌堆分发到界面，适合收藏库、笔记和多功能汇聚。
- [搜索与筛选](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/interaction/type-and-filter.md) - 输入内容后列表响应，适合搜索、知识管理和 AI 助手功能演示。
- [纸感大字卡](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/typography/paper-title-card.md) - 纸底、衬线标题与短句停顿，适合价值主张、章节间隔和科普结论。
- [文档逐字显现](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/typography/document-typewriter-reveal.md) - 文档内容逐步书写展开，适合 AI 写作、周报和笔记整理演示。
- [图表实时变化](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/data/chart-live-moves.md) - 图表随叙事变化，适合数据解读、增长展示和研究结论。
- [界面变成品牌收尾](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/outro/ui-to-brand-morph.md) - 界面元素向品牌图形收束，适合产品宣传片尾。

以下 Webreel 示例通过脚本录制浏览器操作，均附本地演示页面和可编辑配置；用于新产品时需要同时适配页面与操作脚本。

- [自定义光标与按键提示](https://github.com/vercel-labs/webreel/tree/main/examples/custom-theme) - 代码编辑器界面配自定义 SVG 光标、暗色等宽按键提示，适合开发工具演示。复用本地页面和点击脚本，更换光标、提示样式、界面、选择器与节奏。
- [看板拖拽演示](https://github.com/vercel-labs/webreel/tree/main/examples/drag-and-drop) - 以看板卡片跨列拖拽展示工作流，适合任务管理工具与操作教程。复用示例页面和拖动步骤，调整卡片、选择器、目标位置和停顿。
- [竖屏菜单与滚动](https://github.com/vercel-labs/webreel/tree/main/examples/mobile-viewport) - 390 × 844 视口的竖屏浏览器演示，包含打开菜单、关闭菜单与滚动，适合移动网页介绍和上手教程。复用本地界面与操作序列，调整页面、选择器、尺寸和节奏。

以下网页动效组件用于视频时需要录制或时间轴适配。

- [错时逐行揭示](https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/main/registry/ui/text/text-reveal.tsx) - 多行文字从裁切遮罩下方依次滑入，适合标题、功能卖点和章节字卡。复用 React 组件及持续时间、行间延迟参数。原实现使用 Framer Motion 并由进入视口触发；用于视频需补浏览器录制，或将触发机制改成逐帧时间控制。

以下 HyperFrames 组件提供可编辑 HTML 与暂停状态的动画时间轴。

- [编辑出版风数据图表](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/data-chart) - 暖纸底、衬线标题、柱形生长与折线描绘，适合经营指标和数据科普。复用 15 秒 HTML/SVG 时间轴，替换数组、量程、标签及数据出处。
- [频道订阅提示条](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/yt-lower-third) - 滑入频道卡片与弹性订阅按钮，适合创作者介绍和订阅提示。复用 4.5 秒 HTML 叠加层与 GSAP 时间轴，替换头像、频道文字、数字及样式。

## 视觉风格文件

以下选自 [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar)，每项链接到具体 `STYLE.md`；[样片画廊](https://lemomo-ai.github.io/lemo-opuscar/)用于比较视觉效果。可复用的是配色、材质、构图和动作等风格约束，需要围绕新主题生成工程，不能作为换字即出的成片模板。

| 风格文件 | 画面特征 | 适合的视频 |
| --- | --- | --- |
| [瑞士动态排版](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/swiss-motion/STYLE.md) | 网格、大字、几何图形、单一强调色 | 概念科普、品牌宣言、设计教学 |
| [暗色科技发布](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/dark-keynote/STYLE.md) | 深色背景与聚焦产品的发布会感 | AI 工具、软件更新、科技产品发布 |
| [白板讲解](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/whiteboard/STYLE.md) | 线条与图解逐步建立 | 知识科普、方法论、教学 |
| [数据叙事](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/dataviz/STYLE.md) | 数字与图表组织信息 | 行业趋势、调查结果、年度回顾 |
| [等距信息图](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/iso-infographic/STYLE.md) | 等距场景、空间结构与流程关系 | 系统原理、工作流、供应链 |
| [字幕新闻](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/caption-news/STYLE.md) | 文字信息优先，适合静音观看 | AI 早报、热点摘要、资讯短视频 |
| [复古半调案卷](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/halftone-dossier/STYLE.md) | 印刷颗粒、资料拼贴、案卷气质 | 历史故事、人物研究、调查解读 |
| [中国水墨](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ink-wash/STYLE.md) | 水墨晕染与留白 | 文化故事、诗词、国风品牌 |
| [纸片立体书](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/paper-popup/STYLE.md) | 展开的纸张结构与立体层次 | 儿童科普、童话、温暖的产品故事 |
| [ASCII / CRT 终端](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ascii-crt/STYLE.md) | 字符图形与老式显示器 | 编程、开发者工具、计算机故事 |
| [蓝图工程制图](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/blueprint/STYLE.md) | 线稿、尺寸标记与技术图纸 | 工程原理、结构拆解、技术方案 |
| [16-bit 像素 RPG](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/pixel-rpg/STYLE.md) | 像素角色、地图与冒险叙事 | 游戏化科普、成长故事、复古短片 |
| [水彩笔触](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/watercolor/STYLE.md) | 暖纸底、半透明笔触与逐笔显现 | 自然、旅行、科学故事 |
| [工程爆炸拆解](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/teardown/STYLE.md) | 摄影棚质感、零件分层爆炸与微距运镜；需自备 CAD/PCB 素材 | 硬件发布、结构讲解 |
| [工程简报板](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/briefing-board/STYLE.md) | 实体白板、照片剪贴、磁吸标签与跟线运镜 | 工程比较、方案决策 |

## 视频制作框架

这些项目提供制作能力，具体视觉风格需要自行设计或搭配上面的模板。

- [Remotion](https://github.com/remotion-dev/remotion) - 用 React 组件编排和渲染视频，适合界面宣传片、动态排版与数据驱动内容；使用前查看其[商业许可条件](https://www.remotion.dev/docs/license)。
- [HyperFrames](https://github.com/heygen-com/hyperframes) - 将 HTML、CSS 和 JavaScript 动画制作成视频，适合网页技术栈与编程助手协作。
- [Motion Canvas](https://motioncanvas.io/) - 用 TypeScript 编排动画，适合图解和讲解型视频。
- [Manim Community](https://www.manim.community/) - 用 Python 制作数学与技术动画，适合公式、几何和概念推导；这里链接的是社区维护版。

## 视频动效辅助工具

用于构建视频画面的辅助工具，独立于可直接复用的成片模板。

- [Pretext](https://github.com/chenglou/pretext) - JavaScript/TypeScript 文字测量与多行排版库，可辅助制作动态标题、字幕和文字卡片。复用缓存测量、行宽和折行能力，搭配 DOM、Canvas 或 SVG；需加载目标字体，并自行接入动画时间线与视频渲染器。

## 制作工作流

- [guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) - 从真实产品组件、品牌与字体出发编排宣传片，适合希望根据产品本身设计视觉方向的场景；它提供流程而非固定成片模板。
- [OneTake](https://github.com/feitangyuan/onetake) - 连续运镜库、基础合成模板与案例拆解，适合有连贯变化的产品演示。免费仓库不含展示影片源码，采用非商业许可；商业授权另行提供。
- [llm-explain](https://github.com/Gohanwu42/llm-explain) - 讲解工作流，附 Python 与 FFmpeg 合成脚本，将本地静态图片、旁白和字幕合成 MP4 与同步 SRT，适合旁白驱动的概念图解。图片与音频需自行准备，再调整分镜清单。
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) - 官方编程助手指南，覆盖 Remotion 视频创建、预览与渲染，并提供字幕、地图和多媒体专项参考。适合自建 React 视频制作流程；视觉方向需自行设计，许可按 Remotion 条款核对。
- [六层视频制作母提示词](https://mp.weixin.qq.com/s/Ridr4JQc6eWOoYfkNfPAgQ) - 中文文章提供完整制作提示词，覆盖交付物、创作权限、制作参数、视觉规则、核心创意和审片迭代。适合用编程助手制作科普或产品影片时拟定任务；替换主题、规格与创意方向。它是制作指令，不是固定画风或可执行成片工程。

## 相关清单

- [Awesome Video as Code](https://github.com/voidforall/awesome-video-as-code) - 更广泛的编程助手视频工具、制作流程、案例与研究资源。
- [Awesome Video Skills](https://github.com/AaronAust1n/awesome-video-skills) - 更广泛的视频制作工具、框架、技能与自动化流程。

## 复用边界

- **素材替换仍需要适配。** 页面坐标、分层蒙版、镜头时值和主体绘图可能与原作品绑定。每项是否可直接使用，应以具体工程说明为准。
- **项目和素材各有授权。** 本目录的许可不改变第三方代码、音频、图片、字体或地图数据的许可；发布成片前查看上游说明。
- **展示成片不等于开放源码。** 例如 [OneTake](https://github.com/feitangyuan/onetake) 的免费仓库有运镜库和案例拆解，但展示影片不含源码，且采用非商业许可，不能按免费商用成片模板理解。

## Contributing

[目录维护指南](docs/catalog-maintenance.md)说明项目、资源、证据三层数据，以及查重、候选管理和引用检查命令。

欢迎补充有明确源码、参数文件或风格文档的资源，也欢迎修正链接与复用说明。请先阅读[贡献指南](contributing.md)，并优先同步英文主版。

## Footnotes

- [实际复用指南](docs/reuse-guide.md)与[筛选和核对说明](docs/selection.md)提供更详细的边界与来源说明，均以英文维护。
- 本仓库采用 Awesome 清单格式，不代表已被 Awesome 总目录收录。
