# Awesome Code Video [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> 用代码制作视频：可复用的视觉风格、镜头配方与成片工程。

[English](README.md) · 简体中文

**[访问 Awesome Code Video 官网 →](https://awesomecodevideo.com/)** · [搜索资源库](https://awesomecodevideo.com/library/) · [按使用场景浏览](https://awesomecodevideo.com/collections/)

在网站查看视觉预览，按框架和资源类型筛选，并获取源码链接与复用说明。

面向用 HTML、React、JavaScript、TypeScript 或 Python 制作视频的人，精选适合产品宣传、知识科普、数据叙事和旅行视频的资源。每项说明画面风格、适用场景，以及实际能拿来修改的部分。

英文版是主版本。本版覆盖首批 185 个可复用单元：115 个成片或场景工程、6 个地图镜头、37 个镜头配方、27 个风格文件。2026-10-28 核对了上游文档和目录，尚未逐项安装或试渲染；适用视频类型是本清单的整理建议。

仅收录公开可获取、可检查且许可明确允许复用的资源；不收录加密或账户绑定的模板源码、仅限非商业使用及授权不明确的项目。开源许可证中的版权声明不构成排除理由。

## Contents

- [如何选择](#如何选择)
- [成片与场景工程](#成片与场景工程)
- [参数化地图镜头](#参数化地图镜头)
- [可复用镜头配方](#可复用镜头配方)
- [视觉风格文件](#视觉风格文件)
- [视频制作框架](#视频制作框架)
- [视频动效辅助工具](#视频动效辅助工具)
- [制作工作流](#制作工作流)
- [生成式视频提示词](#生成式视频提示词)
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
- [叠加层模板](https://www.remotion.dev/templates/overlay) - Remotion 官方 overlay 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [Three.js 模板](https://www.remotion.dev/templates/three) - Remotion 官方 three 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [音乐可视化模板](https://www.remotion.dev/templates/music-visualization) - Remotion 官方 music-visualization 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [Hello World 模板](https://www.remotion.dev/templates/hello-world) - Remotion 官方 hello-world 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [录制器模板](https://www.remotion.dev/templates/recorder) - Remotion 官方 recorder 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [Skia 模板](https://www.remotion.dev/templates/skia) - Remotion 官方 skia 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。
- [Electron 模板](https://www.remotion.dev/templates/electron) - Remotion 官方 electron 模板页。预览仅为官方 OG PNG 缩略图，没有可热链的 MP4。模板条款待确认；Remotion 运行时许可另行适用。不要把 OG 图复制进目录。

- [客户证言：霓虹分屏](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/testimonial/Testimonial.tsx) - 可主题切换的 Remotion 客户证言成片，含居中、分屏和编辑排版，站点主预览变体是 Neon Split。复用 Testimonial.tsx，替换引言、客户和行动号召。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [提案：深色高管风](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/proposal/Proposal.tsx) - 用于范围、时间线和报价演示的 Remotion 提案成片，列出的主预览变体是 Dark Executive。复用 Proposal.tsx，替换文案和数字。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [活动：霓虹倒计时](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/event/Event.tsx) - 用于活动主视觉、嘉宾卡片和倒计时的 Remotion 成片，列出的主预览变体是 Neon Countdown。复用 Event.tsx，替换活动名称、日程和嘉宾。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [讲解：深色电影感](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/explainer/Explainer.tsx) - 用于产品走查和功能拆解的 Remotion 讲解成片，列出的主预览变体是 Dark Cinematic。复用 Explainer.tsx，替换步骤和文案。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [案例：霓虹聚焦](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/casestudy/CaseStudy.tsx) - 用于前后对比和结果标注的 Remotion 案例成片，列出的主预览变体是 Neon Spotlight。复用 CaseStudy.tsx，替换客户故事和指标。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [课程宣传：深色总览](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/coursepromo/CoursePromo.tsx) - 用于课程大纲、讲师和总览版式的 Remotion 成片，列出的主预览变体是 Dark Overview。复用 CoursePromo.tsx，替换大纲和讲师信息。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [回顾：霓虹时间线](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/recap/Recap.tsx) - 用于仪表盘、卡片和项目时间线的 Remotion 回顾成片，列出的主预览变体是 Neon Timeline。复用 Recap.tsx，替换里程碑和指标。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [教程：深色分步](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/tutorial/Tutorial.tsx) - 用于编号步骤、卡片序列和分屏演示的 Remotion 教程成片，列出的主预览变体是 Dark Numbered Steps。复用 Tutorial.tsx，替换步骤和界面。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [联盟评测：深色记分卡](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/affiliatereview/AffiliateReview.tsx) - 用于产品对比、记分卡和结论的 Remotion 联盟评测成片，列出的主预览变体是 Dark Scorecard。复用 AffiliateReview.tsx，替换产品、分数和行动号召。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [幕后：深色场景卡](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/behindthescenes/BehindTheScenes.tsx) - 用于过程走查和场景卡片的 Remotion 幕后成片，列出的主预览变体是 Dark Scene Cards。复用 BehindTheScenes.tsx，替换场景和收尾文案。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [提案：大胆路演](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/proposal/ProposalShowcase.tsx#L113) - 用于范围、时间线和报价演示的 Remotion 提案成片。通过 Bold Pitch 展示导出复用 Proposal.tsx，该导出使用 bold 主题和 pitch 版式。替换文案和数字。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [提案：霓虹路演](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/proposal/ProposalShowcase.tsx#L128) - 用于范围、时间线和报价演示的 Remotion 提案成片。通过 Neon Pitch 展示导出复用 Proposal.tsx，该导出使用 neon 主题和 pitch 版式。替换文案和数字。站点标明 CC-BY-NC-SA 4.0，GitHub 许可字段为空，主预览 MP4 不得镜像；Remotion 运行时许可另行适用。
- [KPI 计数器](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/kpi-counter/KpiCounter.tsx) - 独立的 Remotion 场景，在错开的卡片上滚动 KPI 数字。README 写明 1920×1080、4 秒，KpiCounter.tsx 为 30 fps、120 帧。复用组件和类型化参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [生长柱状图](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/bar-chart-anim/BarChartAnim.tsx) - 独立的 Remotion 场景，柱形按数据序列生长。README 写明 1920×1080、5 秒。复用 BarChartAnim.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [故障文字](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/glitch-text/GlitchText.tsx) - 独立的 Remotion 标题场景，故障文字先错位再稳定。README 写明 1920×1080、4 秒。复用 GlitchText.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Logo 虚化揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-blur-reveal/LogoBlurReveal.tsx) - 独立的 Remotion 场景，Logo 从虚化中变清晰。README 写明 1920×1080、4 秒。复用 LogoBlurReveal.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [打字机](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/typewriter/Typewriter.tsx) - 独立的方形 Remotion 场景，带光标逐字打出文案。README 写明 1080×1080、约 3.3 秒。复用 Typewriter.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [竞速柱状图](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/racing-chart/RacingChart.tsx) - 独立的 Remotion 场景，柱形随数值变化重新排序。README 写明 1920×1080、7 秒。复用 RacingChart.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [星空](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/starfield/Starfield.tsx) - 独立的 Remotion 场景，星星如慢速曲速飞行般掠过。README 写明 1920×1080、5 秒，Starfield.tsx 为 30 fps、150 帧。复用 Starfield.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [社交短片画框](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/social-reel/SocialReel.tsx) - 独立的 Remotion 场景，用账号、说明和进度条组成短片式画框。README 写明 1920×1080、5 秒，SocialReel.tsx 为 30 fps、150 帧。复用 SocialReel.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Logo 描边绘制](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-stroke-draw/LogoStrokeDraw.tsx) - 独立的 Remotion 场景，先描出 Logo 轮廓再填充。README 写明 1920×1080、3.67 秒，LogoStrokeDraw.tsx 为 30 fps、110 帧。复用 LogoStrokeDraw.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [动态文字堆叠](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/kinetic-word-stack/KineticWordStack.tsx) - 独立的 Remotion 场景，词语冲入并堆成一块。README 写明 1920×1080、4 秒，KineticWordStack.tsx 为 30 fps、120 帧。复用 KineticWordStack.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [霓虹招牌闪烁](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/neon-sign/NeonSign.tsx) - 独立的方形 Remotion 场景，文字像霓虹灯管一样闪烁点亮。README 写明 1080×1080、约 3.33 秒，NeonSign.tsx 为 30 fps、100 帧。复用 NeonSign.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [烟花爆发](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/fireworks-burst/FireworksBurst.tsx) - 独立的方形 Remotion 场景，烟花按节奏绽开。README 写明 1080×1080、3.67 秒，FireworksBurst.tsx 为 30 fps、110 帧。复用 FireworksBurst.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [生长折线图](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/line-chart-anim/LineChartAnim.tsx) - 独立的 Remotion 场景，折线沿坐标轴画向数据序列。README 写明 1920×1080、5 秒，LineChartAnim.tsx 为 30 fps、150 帧。复用 LineChartAnim.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [乱码揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/scramble-text/ScrambleText.tsx) - 独立的 Remotion 标题场景，字符先随机跳动再锁定成标题。README 写明 1920×1080、5 秒，ScrambleText.tsx 为 30 fps、150 帧。复用 ScrambleText.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [散景循环](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/bokeh-circles/BokehCircles.tsx) - 独立的 Remotion 场景，失焦光斑循环漂动。README 写明 1920×1080、5 秒，BokehCircles.tsx 为 30 fps、150 帧。复用 BokehCircles.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [网格波浪循环](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/loop-grid-wave/LoopGridWave.tsx) - 独立的 Remotion 场景，点阵按波浪起伏循环。README 写明 1920×1080、3 秒，LoopGridWave.tsx 为 30 fps、90 帧。复用 LoopGridWave.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [像素 K 线](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/pixel-candlestick-ohlc/PixelCandlestickOhlc.tsx) - 独立的 Remotion 场景，用复古像素 K 线播放价格数据。README 写明 1920×1080、6 秒，PixelCandlestickOhlc.tsx 为 30 fps、180 帧。复用 PixelCandlestickOhlc.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [像素马赛克转场](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/pixel-mosaic-transition/PixelMosaicTransition.tsx) - 独立的 Remotion 场景，画面先碎成像素块再重新拼合。README 写明 1920×1080、3 秒，PixelMosaicTransition.tsx 为 30 fps、90 帧。复用 PixelMosaicTransition.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [滴灌填充仪表](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/pourover-drip-fill-gauge/PouroverDripFillGauge.tsx) - 独立的 Remotion 场景，仪表按滴逐格填充到目标百分比。README 写明 1920×1080、6 秒，PouroverDripFillGauge.tsx 为 30 fps、180 帧。复用 PouroverDripFillGauge.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [像素打字机引文](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/pixel-typewriter-quote/PixelTypewriterQuote.tsx) - 独立的 Remotion 场景，用复古像素字体把引文打到画面上。README 写明 1920×1080、6 秒，PixelTypewriterQuote.tsx 为 30 fps、180 帧。复用 PixelTypewriterQuote.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [翻页](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/flip-page-transition/FlipPageTransition.tsx) - 独立的 Remotion 场景，翻页从一场切到下一场。README 写明 1920×1080、4 秒，FlipPageTransition.tsx 为 30 fps、120 帧。复用 FlipPageTransition.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [碎裂揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/shatter-reveal/ShatterReveal.tsx) - 独立的 Remotion 场景，覆盖层碎成碎片，露出后面的画面。README 写明 1920×1080、4 秒，ShatterReveal.tsx 为 30 fps、120 帧。复用 ShatterReveal.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [镜头抖动](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/camera-shake/CameraShake.tsx) - 独立的 Remotion 场景，给画面加上手持冲击式抖动。README 写明 1920×1080、4 秒，CameraShake.tsx 为 30 fps、120 帧。复用 CameraShake.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [视差横移](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/parallax-pan/ParallaxPan.tsx) - 独立的 Remotion 场景，分层平面以不同速度横移。README 写明 1920×1080、4 秒，ParallaxPan.tsx 为 30 fps、120 帧。复用 ParallaxPan.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [挥手问好](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/wave-hello/WaveHello.tsx) - 独立的方形 Remotion 场景，一只手在挥手问好。README 写明 1080×1080、3 秒，WaveHello.tsx 为 30 fps、90 帧。复用 WaveHello.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [像素瀑布](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/pixel-waterfall-cycle/PixelWaterfallCycle.tsx) - 独立的竖屏 Remotion 场景，像素瀑布循环流动。README 写明 1080×1920、6 秒，PixelWaterfallCycle.tsx 为 30 fps、180 帧。复用 PixelWaterfallCycle.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Logo 对开揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-split-reveal/LogoSplitReveal.tsx) - 独立的 Remotion 场景，两块面板分开，露出中间的 Logo。README 写明 1920×1080、4 秒，LogoSplitReveal.tsx 为 30 fps、120 帧。复用 LogoSplitReveal.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Logo 遮罩擦除](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-mask-wipe/LogoMaskWipe.tsx) - 独立的 Remotion 场景，斜向遮罩擦过，露出 Logo。README 写明 1920×1080、约 3.33 秒，LogoMaskWipe.tsx 为 30 fps、100 帧。复用 LogoMaskWipe.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [片尾卡](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/end-card/EndCard.tsx) - 独立的 Remotion 场景，片尾卡留有行动号召和链接位置。README 写明 1920×1080、5 秒，EndCard.tsx 为 30 fps、150 帧。复用 EndCard.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [卡片翻转](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/card-flip-transition/CardFlipTransition.tsx) - 独立的 Remotion 场景，整帧像卡片一样翻到下一场。README 写明 1920×1080、4 秒，CardFlipTransition.tsx 为 30 fps、120 帧。复用 CardFlipTransition.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [雪花粒子](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/particle-snow/ParticleSnow.tsx) - 独立的方形 Remotion 场景，分层雪花缓缓落下。README 写明 1080×1080、5 秒，ParticleSnow.tsx 为 30 fps、150 帧。复用 ParticleSnow.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [四色标题](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/four-tone-mono-titler/FourToneMonoTitler.tsx) - 独立的 Remotion 场景，标题块在四种色调间切换。README 写明 1920×1080、4 秒，FourToneMonoTitler.tsx 为 30 fps、120 帧。复用 FourToneMonoTitler.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Logo 弹落](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-bounce-drop/LogoBounceDrop.tsx) - 独立的 Remotion 场景，Logo 落下后以弹跳稳住。README 写明 1920×1080、3 秒，LogoBounceDrop.tsx 为 30 fps、90 帧。复用 LogoBounceDrop.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [滑动擦除](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/slide-wipe/SlideWipe.tsx) - 独立的 Remotion 场景，定向滑动把旧画面推出。README 写明 1920×1080、4 秒，SlideWipe.tsx 为 30 fps、120 帧。复用 SlideWipe.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [圆形擦除](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/transition-circle-wipe/TransitionCircleWipe.tsx) - 独立的 Remotion 场景，圆形从中心扩大并替换画面。README 写明 1920×1080、3 秒，TransitionCircleWipe.tsx 为 30 fps、90 帧。复用 TransitionCircleWipe.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [墨水扩散](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/ink-spread-transition/InkSpreadTransition.tsx) - 独立的 Remotion 场景，墨渍扩散铺满画面并进入下一场。README 写明 1920×1080、4 秒，InkSpreadTransition.tsx 为 30 fps、120 帧。复用 InkSpreadTransition.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [章节标题卡](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/chapter-title/ChapterTitle.tsx) - 独立的 Remotion 场景，用于段落切换的编号章节卡。README 写明 1920×1080、5 秒，ChapterTitle.tsx 为 30 fps、150 帧。复用 ChapterTitle.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [文字遮罩揭示](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/text-mask-reveal/TextMaskReveal.tsx) - 独立的 Remotion 场景，文字从遮罩线后向上滑出。README 写明 1920×1080、3.67 秒，TextMaskReveal.tsx 为 30 fps、110 帧。复用 TextMaskReveal.tsx 及其参数，并保留 MIT 声明。链接的预览是官方 Cloudflare R2 MP4（只热链，不复制进本仓库）；Remotion 运行时许可另行适用。
- [Unspar 产品演示](https://github.com/vincentsch/explainroo/tree/main/examples/unspar-demo) - explainroo 产品演示示例，含 script.md、scenes.js 和 video.json，为干净的 YouTube 尺寸 Unspar 走查。复用该示例结构，替换产品、品牌和脚本。仓库为 MIT，但站点托管的 MP4 不在仓库内，不标记为可再分发。
- [API 做什么](https://www.explainroo.com/videos/what-an-api-does) - explainroo 已发布的 API 讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [复利如何运作](https://www.explainroo.com/videos/how-compound-interest-works) - explainroo 已发布的复利讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [ChatGPT 演示](https://www.explainroo.com/videos/chatgpt-demo) - explainroo 已发布的 ChatGPT 风格产品演示页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [工单之后发生什么](https://www.explainroo.com/videos/what-happens-to-a-support-ticket) - explainroo 已发布的支持工单讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [单点登录做什么](https://www.explainroo.com/videos/what-single-sign-on-does) - explainroo 已发布的单点登录讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [冰箱如何让食物保持低温](https://www.explainroo.com/videos/how-a-fridge-keeps-food-cold) - explainroo 已发布的冰箱制冷讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [手机电池为什么会损耗](https://www.explainroo.com/videos/why-phone-batteries-wear-out) - explainroo 已发布的手机电池老化讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [为什么有闰年](https://github.com/vincentsch/explainroo/tree/main/examples/leap-years) - explainroo 讲解示例，含 script.md、scenes.js 和 video.json，标题为 Why we have leap years，editorial 主题、YouTube 尺寸。复用该示例结构，替换主题和脚本。仓库为 MIT，但站点托管的 MP4 不在仓库内，不标记为可再分发。
- [如何跨接启动汽车](https://www.explainroo.com/videos/how-to-jump-start-a-car) - explainroo 已发布的跨接启动汽车讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [如何做手冲咖啡](https://www.explainroo.com/videos/how-to-make-pour-over-coffee) - explainroo 已发布的手冲咖啡讲解示例页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [Claude 演示](https://www.explainroo.com/videos/claude-demo) - explainroo 已发布的 Claude 风格产品演示页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [Gmail 演示](https://www.explainroo.com/videos/gmail-demo) - explainroo 已发布的 Gmail 风格产品演示页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [Vroni 产品演示](https://www.explainroo.com/videos/vroni-product-demo) - explainroo 已发布的 Vroni 产品演示页，配有站点托管 MP4。公开 examples 目录没有该 slug 的 script.md 或 scenes.js，应改编 explainroo 工作流，不要把成片当成已包含的源码。仓库为 MIT；托管 MP4 不标记为可再分发。
- [explainroo 如何制作一条视频](https://www.explainroo.com/videos/how-explainroo-makes-a-video) - 站点托管的 explainroo 元演示，展示从编程助手到脚本再到渲染的流程。仓库为 MIT；托管 MP4 按不可再分发处理（只热链）。
- [从零到产品片头](https://github.com/specstoryai/zero-to-product-video-hero/tree/main/example) - Remotion 产品片头示例，场景组件在 example/src，并提交了 example/out/video.mp4。example/src/Root.tsx 注册为 1920×1080、30 fps；README 还描述了另一条更长的片头，此处未测量其时长。复用该示例并保留 MIT 声明。Remotion 运行时许可另行适用。
- [提示词生成视频](https://www.remotion.dev/templates/prompt-to-video) - Remotion 官方模板，用提示词生成竖屏故事、配图、旁白和时间线。复用模板仓库，并自行提供 OpenAI 与 ElevenLabs 凭证。该模板仓库没有 LICENSE 文件，条款待确认；预览只链到官方缩略图，不得复制。使用前核对 Remotion 许可。
- [Firecrawl 病毒式复刻](https://github.com/heygen-com/hyperframes/blob/main/docs/examples.mdx#L75) - HyperFrames 展示片，托管在 HeyGen 静态 CDN（viral-clone 复刻）。清单链接指向 docs/examples.mdx 里该片的记录；MP4 仍在 CDN 上。框架为 Apache-2.0；托管 MP4 是否可再分发待确认，只热链，不标记为可再分发。不作为本地渲染测试。
- [Linear Loops 病毒式复刻](https://github.com/heygen-com/hyperframes/blob/main/docs/examples.mdx#L120) - HyperFrames 展示片，托管在 HeyGen 静态 CDN（viral-clone 复刻）。清单链接指向 docs/examples.mdx 里该片的记录；MP4 仍在 CDN 上。框架为 Apache-2.0；托管 MP4 是否可再分发待确认，只热链，不标记为可再分发。不作为本地渲染测试。
- [开幕之夜](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L24) - HyperFrames 首页展示片（开幕之夜 / 颁奖预告）。托管在 HeyGen 静态 CDN 的 card/ MP4。框架为 Apache-2.0；托管成片是否可再分发待确认，只热链，不标记为可再分发。优先用 card/，不用体积更大的 hq/。
- [从 Remotion 到 HyperFrames](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L58) - HyperFrames 首页展示片（从 Remotion 到 HyperFrames / 3D 体素）。使用 HeyGen CDN 的 card/ MP4。不可再分发，只热链。不是本地渲染测试。
- [最后的饭团](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L31) - HyperFrames 首页展示片（漫画）。使用 HeyGen CDN 的 card/ MP4。不可再分发，只热链。不是本地渲染测试。
- [ReVideo 字符扰乱模板预览](https://github.com/midrender/revideo/tree/main/packages/template) - 来自 ReVideo（midrender）模板包的 GIF 动画预览。MIT。GIF 不是 MP4 成片；packages/examples/assets/example.mp4 只是很小的占位文件，未收录。
- [ReVideo 示例包预览](https://github.com/midrender/revideo/tree/main/packages/examples) - MIT 许可的 ReVideo 示例包，packages/examples/assets 下有一条可热链的小 MP4。与已收录的 scramble.gif 模板预览不是同一素材。

- [这段素材能否写成代码](https://github.com/motion-canvas/examples/tree/master/examples/asset-code) - Motion Canvas 官方示例（Could This Asset Be Code）。源码在 motion-canvas/examples（MIT）。预览是 README 中的 YouTube 嵌入，不可再分发。
- [Motion Canvas 一周年](https://github.com/motion-canvas/examples/tree/master/examples/anniversary) - Motion Canvas 官方周年示例。源码在 motion-canvas/examples（MIT）。预览是 YouTube 嵌入，不可再分发。
- [平滑视差](https://github.com/motion-canvas/examples/tree/master/examples/smooth-parallax) - Motion Canvas 官方 Smooth Parallax 示例。源码在 motion-canvas/examples（MIT）。预览是 YouTube 嵌入，不可再分发。
- [延迟光照](https://github.com/motion-canvas/examples/tree/master/examples/deferred-lighting) - Motion Canvas 官方 Deferred Lights 示例。源码在 motion-canvas/examples（MIT）。预览是 YouTube 嵌入，不可再分发。
- [Theatre.js 弹跳方块演示](https://github.com/AriaMinaei/theatre-example-bouncing-box) - Theatre.js 社区教程演示 GIF（弹跳方块）。核心仓库为 Apache-2.0；示例仓库没有 SPDX，只热链，不可再分发。GIF 不是 MP4。
- [OpenMotion 功能展示](https://github.com/jsongo/open-motion/blob/main/assets/feature-showcase.gif) - 仓库 README 中的功能展示 GIF（品牌、仪表盘、缓动）。MIT，可再分发。GIF 不是 MP4。
- [OpenMotion 媒体展示](https://github.com/jsongo/open-motion/blob/main/assets/media-showcase.gif) - 仓库 README 中的媒体展示 GIF（视频、音频）。MIT，可再分发。GIF 不是 MP4。
- [Cow](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L49) - HyperFrames 首页展示卡片片（cow）。HeyGen CDN 的 card/ MP4。不可再分发，只热链。
- [1969 年报纸界面](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L28) - HyperFrames 首页展示卡片片（1969 年报纸界面）。HeyGen CDN 的 card/ MP4。不可再分发，只热链。
- [背景移除发布](https://github.com/heygen-com/hyperframes/blob/main/docs/snippets/film-rows.jsx#L33) - HyperFrames 首页展示卡片片（VFX 背景移除发布）。HeyGen CDN 的 card/ MP4。不可再分发，只热链。



- [产品发布](https://github.com/zz41354899/SwiftClip/blob/main/remotion/ProductLaunch.tsx) - Remotion 场景：标题和图标淡入，随后是蓝色副标题和候补名单按钮。Root.tsx 将 ProductLaunch 登记为 1920×1080、30 fps、450 帧（15 秒）。复用 remotion/ProductLaunch.tsx 及其标题参数，并保留 MIT 声明。目录只链接仓库 public/thumbnails 里的 JPEG 缩略图；SwiftClip 没有为该场景提供可热链的 MP4。Remotion 运行时许可另行适用。2026-10-29 仅做源码审阅，没有本地渲染测试。
- [代码揭示](https://github.com/zz41354899/SwiftClip/blob/main/remotion/CodeReveal.tsx) - Remotion 场景：磨砂代码卡片滑入，并显示一小段带语法色的代码。Root.tsx 将 CodeReveal 登记为 1920×1080、30 fps、300 帧（10 秒）。复用 remotion/CodeReveal.tsx，并保留 MIT 声明。目录只链接仓库 public/thumbnails 里的 JPEG 缩略图；SwiftClip 没有为该场景提供可热链的 MP4。Remotion 运行时许可另行适用。2026-10-29 仅做源码审阅，没有本地渲染测试。
- [数据可视化](https://github.com/zz41354899/SwiftClip/blob/main/remotion/DataViz.tsx) - Remotion 场景：系统负载卡片出现，进度条填充到 75%。Root.tsx 将 DataViz 登记为 1920×1080、30 fps、600 帧（20 秒）。复用 remotion/DataViz.tsx，并保留 MIT 声明。目录只链接仓库 public/thumbnails 里的 JPEG 缩略图；SwiftClip 没有为该场景提供可热链的 MP4。Remotion 运行时许可另行适用。2026-10-29 仅做源码审阅，没有本地渲染测试。

下面 6 条是 nexu-io html-video 的原创模板，Apache-2.0，NOTICE 有标明。可播放预览热链自 Open Design 镜像（jsDelivr），没有在本地渲染。

- [故障标题帧](https://github.com/nexu-io/html-video/tree/main/templates/frame-glitch-title) - HyperFrames 标题卡，带 RGB 错位、扫描线和色差。templates/NOTICE.md 将其标为 html-video 原创模板，Apache-2.0，与本清单里其他故障文字片段不是同一上游。复用 templates/frame-glitch-title，替换标题和副标题。规格默认 1920×1080、60 fps，时长可变，约 3 到 8 秒。可播放预览是 Open Design 镜像里的 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。
- [报刊风数据图帧](https://github.com/nexu-io/html-video/tree/main/templates/frame-data-chart-nyt) - 带衬线标题和描线的编辑风动态图表，是 html-video 的原创 Apache-2.0 模板。画面受报刊数据图启发，不是本清单已收 HyperFrames data-chart 块的分叉。复用 templates/frame-data-chart-nyt，替换标题和数据。规格默认 1920×1080、60 fps，时长可变，约 5 到 20 秒。可播放预览是 Open Design 镜像 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。
- [漏光电影帧](https://github.com/nexu-io/html-video/tree/main/templates/frame-light-leak-cinema) - 带胶片颗粒和漏光叠层的电影感画面。templates/NOTICE.md 将其标为 html-video 原创模板，Apache-2.0。复用 templates/frame-light-leak-cinema，替换标题。规格默认 1920×1080、60 fps，时长可变，约 4 到 10 秒。可播放预览是 Open Design 镜像 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。
- [液态背景主视觉](https://github.com/nexu-io/html-video/tree/main/templates/frame-liquid-bg-hero) - 流动液态渐变上的主视觉卡片，居中标题，可选行动号召。templates/NOTICE.md 将其标为 html-video 原创模板，Apache-2.0。复用 templates/frame-liquid-bg-hero，替换文案。规格默认 1920×1080、60 fps，时长可变，约 4 到 12 秒。可播放预览是 Open Design 镜像 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。
- [Logo 结尾帧](https://github.com/nexu-io/html-video/tree/main/templates/frame-logo-outro) - 结尾卡片：拼合 Logo、加辉光并露出品牌语。templates/NOTICE.md 将其标为 html-video 原创模板，Apache-2.0。复用 templates/frame-logo-outro，替换品牌名和标语。规格默认 1920×1080、60 fps，时长可变，约 3 到 10 秒。可播放预览是 Open Design 镜像 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。
- [光标打字特效](https://github.com/nexu-io/html-video/tree/main/templates/vfx-text-cursor) - 带发光光标和光条的打字机画面。templates/NOTICE.md 将其标为 html-video 原创模板，Apache-2.0。复用 templates/vfx-text-cursor，替换打出的文字。规格默认 1920×1080、60 fps，时长可变，约 3 到 10 秒。可播放预览是 Open Design 镜像 MP4（jsDelivr），按 Apache-2.0 热链；2026-10-28 做过 HEAD，没有在本地渲染。


下面 4 条是在上述 6 个原创模板之后补充的 html-video 帧。瑞士网格、动态字体、暖颗粒是 templates/NOTICE.md 点名的 HyperFrames 示例分叉。Bold Poster 是另一份 Apache-2.0 模板，不是这类分叉。它们的可播放预览是 Open Design 在 GitHub raw 上的 MP4，不是 jsDelivr，没有在本地渲染。

- [瑞士网格](https://github.com/nexu-io/html-video/tree/main/templates/frame-swiss-grid) - 结构化网格上的 HyperFrames 画面，适合企业幻灯片和以字体为主的标题。templates/NOTICE.md 将 frame-swiss-grid 标为 heygen-com/hyperframes registry/examples/swiss-grid 的直接分叉，Apache-2.0。复用 templates/frame-swiss-grid，替换文案。规格默认 1920×1080、30 fps，时长可变，约 3 到 30 秒（默认 10 秒）。可播放预览是 Open Design 的 GitHub raw MP4，按 Apache-2.0 热链；2026-10-29 做过 HEAD，没有在本地渲染。短环不是完整成片。
- [动态字体](https://github.com/nexu-io/html-video/tree/main/templates/frame-kinetic-type) - 粗体动态字体宣传，适合有力的开场和陈述标题。templates/NOTICE.md 将 frame-kinetic-type 标为 heygen-com/hyperframes registry/examples/kinetic-type 的直接分叉，Apache-2.0。复用 templates/frame-kinetic-type，替换文案。规格默认 1920×1080、30 fps，时长可变，约 3 到 30 秒（默认 15 秒）。可播放预览是 Open Design 的 GitHub raw MP4，按 Apache-2.0 热链；2026-10-29 做过 HEAD，没有在本地渲染。短环不是完整成片。
- [暖颗粒](https://github.com/nexu-io/html-video/tree/main/templates/frame-warm-grain) - 带颗粒质感的奶油色编辑画面，适合生活方式品牌和杂志式开场。templates/NOTICE.md 将 frame-warm-grain 标为 heygen-com/hyperframes registry/examples/warm-grain 的直接分叉，Apache-2.0。复用 templates/frame-warm-grain，替换文案。规格默认 1920×1080、30 fps，时长可变，约 3 到 30 秒（默认 10 秒）。可播放预览是 Open Design 的 GitHub raw MP4，按 Apache-2.0 热链；2026-10-29 做过 HEAD，没有在本地渲染。短环不是完整成片。
- [粗体海报](https://github.com/nexu-io/html-video/tree/main/templates/frame-bold-poster) - 编辑风海报画面，有红线、巨大展示字符和倾斜的标题行。template.html-video.yaml 许可为 Apache-2.0，并把设计说明归于 Zara Zhang 的 frontend-slides（MIT）；templates/NOTICE.md 没有把它列为 heygen-com/hyperframes 分叉。复用 templates/frame-bold-poster，替换标题。规格默认 1920×1080、60 fps，时长可变，约 4 到 6 秒。可播放预览是 Open Design 的 GitHub raw MP4，按 Apache-2.0 热链；2026-10-29 做过 HEAD，没有在本地渲染。短环不是完整成片。

下面两条是 Open Design 技能，交付的是 HTML 成片工程。目录预览是 example.html 页面，不是视频文件。

- [8-bit 轨道 HyperFrames 视频模板](https://github.com/nexu-io/open-design/tree/main/skills/8-bit-orbit-video-template) - 复古像素、多场景的 HyperFrames HTML 技能。文档中的流程保持三个短场景，每段停留不超过 3 秒，源在 assets/template.html。仓库为 Apache-2.0。目录预览只有仓库内的 example.html 页面（嵌入），该目录没有提交 MP4。example.html 指向一份托管样片，做过 HEAD，但没有当作可播放的目录预览，也没有本地渲染测试。技能目录没有自带字体文件。
- [阅读年报视频模板](https://github.com/nexu-io/open-design/tree/main/skills/weread-year-in-review-video-template) - 竖屏 9:16 的 HyperFrames 技能，做年度阅读报告（模板视口 1080×1920；技能说明写的是 12 个场景）。视觉受阅读应用年报界面启发。它不是微信读书或 WeRead 的官方模板，也不表示存在合作关系。复用 skills/weread-year-in-review-video-template。仓库 LICENSE 为 Apache-2.0；技能没有打包字体文件（只点名 Songti SC、PingFang SC 等系统中文字体），也没有单独的素材许可，因此这些条款仍未知。目录预览只有 example.html（嵌入）。技能目录没有提交 MP4。2026-10-28 仅做源码审阅，没有本地渲染测试。

- [Kinetic Tech](https://github.com/motiontemplates/385712/tree/main/template) - 金属字体、琥珀色光效与空间动效，适合科技讲解和产品发布。公开版 0.2.7-open-beta 为 1920 × 1080、60fps 横屏工程，提供可编辑源码、参数、动作音效和 Chrome/Playwright + FFmpeg 渲染入口；替换文字与素材，调整场景和节奏。公开版不同于官网新版及竖屏版，第三方素材许可需另行核对。

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
- [三维旋转木马](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/ui-entrance/carousel-3d.md) - Video-shotcraft 画廊配方 carousel-3d，附 gallery-media 发行版 MP4。Apache-2.0，可再分发（需保留署名）。热链发行资源，不复制进目录。不是本地渲染测试。
- [三维终端](https://github.com/Vincentwei1021/video-shotcraft/blob/main/gallery/source/terminal-3d.md) - Video-shotcraft 画廊配方 terminal-3d，附 gallery-media 发行版 MP4。Apache-2.0，可再分发（需保留署名）。热链发行资源，不复制进目录。不是本地渲染测试。
- [径向波纹](https://github.com/Vincentwei1021/video-shotcraft/blob/main/gallery/source/radial-wave.md) - Video-shotcraft 画廊配方 radial-wave，附 gallery-media 发行版 MP4。Apache-2.0，可再分发（需保留署名）。热链发行资源，不复制进目录。不是本地渲染测试。

以下 Webreel 示例通过脚本录制浏览器操作，均附本地演示页面和可编辑配置；用于新产品时需要同时适配页面与操作脚本。

- [自定义光标与按键提示](https://github.com/vercel-labs/webreel/tree/main/examples/custom-theme) - 代码编辑器界面配自定义 SVG 光标、暗色等宽按键提示，适合开发工具演示。复用本地页面和点击脚本，更换光标、提示样式、界面、选择器与节奏。
- [看板拖拽演示](https://github.com/vercel-labs/webreel/tree/main/examples/drag-and-drop) - 以看板卡片跨列拖拽展示工作流，适合任务管理工具与操作教程。复用示例页面和拖动步骤，调整卡片、选择器、目标位置和停顿。
- [竖屏菜单与滚动](https://github.com/vercel-labs/webreel/tree/main/examples/mobile-viewport) - 390 × 844 视口的竖屏浏览器演示，包含打开菜单、关闭菜单与滚动，适合移动网页介绍和上手教程。复用本地界面与操作序列，调整页面、选择器、尺寸和节奏。
- [Hello World 浏览器演示](https://github.com/vercel-labs/webreel/tree/main/examples/hello-world) - Webreel 示例，把脚本化的浏览器流程（hello-world）录成 MP4。复用该示例工程，许可为 Apache-2.0。预览使用文档站公开的 MP4（examples/*/videos 里的文件是 Git LFS 指针）。
- [表单填写演示](https://github.com/vercel-labs/webreel/tree/main/examples/form-filling) - Webreel 示例，把脚本化的浏览器流程（form-filling）录成 MP4。复用该示例工程，许可为 Apache-2.0。预览使用文档站公开的 MP4（examples/*/videos 里的文件是 Git LFS 指针）。
- [键盘快捷键演示](https://github.com/vercel-labs/webreel/tree/main/examples/keyboard-shortcuts) - Webreel 示例，把脚本化的浏览器流程（keyboard-shortcuts）录成 MP4。复用该示例工程，许可为 Apache-2.0。预览使用文档站公开的 MP4（examples/*/videos 里的文件是 Git LFS 指针）。
- [页面滚动演示](https://github.com/vercel-labs/webreel/tree/main/examples/page-scrolling) - Webreel 示例，把脚本化的浏览器流程（page-scrolling）录成 MP4。复用该示例工程，许可为 Apache-2.0。预览使用文档站公开的 MP4（examples/*/videos 里的文件是 Git LFS 指针）。
- [修饰键点击捕捉](https://github.com/vercel-labs/webreel/tree/main/examples/modifier-clicks) - Webreel 文档站公开示例视频（modifier-clicks）。许可 Apache-2.0。热链 apps/docs/public 副本（不要用 examples/*/videos 里的 Git LFS 指针）。MIME 常为 application/octet-stream，但文件头是合法的 ftyp。
- [截图捕捉演示](https://github.com/vercel-labs/webreel/tree/main/examples/screenshots) - Webreel 文档站公开示例视频（screenshots）。许可 Apache-2.0。热链 apps/docs/public 副本（不要用 examples/*/videos 里的 Git LFS 指针）。MIME 常为 application/octet-stream，但文件头是合法的 ftyp。
- [共享步骤演示](https://github.com/vercel-labs/webreel/tree/main/examples/shared-steps) - Webreel 文档站公开示例视频（shared-steps）。许可 Apache-2.0。热链 apps/docs/public 副本（不要用 examples/*/videos 里的 Git LFS 指针）。MIME 常为 application/octet-stream，但文件头是合法的 ftyp。

以下网页动效组件用于视频时需要录制或时间轴适配。

- [错时逐行揭示](https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/main/registry/ui/text/text-reveal.tsx) - 多行文字从裁切遮罩下方依次滑入，适合标题、功能卖点和章节字卡。复用 React 组件及持续时间、行间延迟参数。原实现使用 Framer Motion 并由进入视口触发；用于视频需补浏览器录制，或将触发机制改成逐帧时间控制。

以下 HyperFrames 组件提供可编辑 HTML 与暂停状态的动画时间轴。

- [编辑出版风数据图表](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/data-chart) - 暖纸底、衬线标题、柱形生长与折线描绘，适合经营指标和数据科普。复用 15 秒 HTML/SVG 时间轴，替换数组、量程、标签及数据出处。
- [频道订阅提示条](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/yt-lower-third) - 滑入频道卡片与弹性订阅按钮，适合创作者介绍和订阅提示。复用 4.5 秒 HTML 叠加层与 GSAP 时间轴，替换头像、频道文字、数字及样式。

以下静音短环来自 [ali-abassi/remotion-templates](https://github.com/ali-abassi/remotion-templates) 的 `site/previews`。该仓库没有 SPDX / LICENSE，再分发未确认，只热链。这些是很短的静音循环，不是完整成片。

- [数据条形竞赛](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/dataviz-bar-race.mp4) - ali-abassi/remotion-templates 的静音预览（数据条形竞赛），来自 site/previews。许可待确认，不可再分发，只热链。短静音循环不是完整成片。
- [代码产品 API 响应](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/code-product-demos-api-response.mp4) - Remotion 模板静音预览（代码产品 API 响应）。许可待确认，不可再分发，只热链。
- [浏览器地址栏缩放](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/browser-chrome-address-bar-zoom.mp4) - Remotion 模板静音预览（浏览器地址栏缩放）。许可待确认，不可再分发，只热链。
- [光标点击涟漪](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/cursor-demos-click-ripple.mp4) - Remotion 模板静音预览（光标点击涟漪）。许可待确认，不可再分发，只热链。
- [Logo 片头 — 极光绽放](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/logo-sting-aurora-bloom.mp4) - ali-abassi/remotion-templates 中 logo-sting 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [下三分之一 — 横条](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/lower-third-bar-rule.mp4) - ali-abassi/remotion-templates 的静音下三分之一短环预览。相对已收录的数据可视化、代码、浏览器和光标家族，这是新的家族。
- [等距场景 — 应用生态](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/isometric-scenes-app-ecosystem.mp4) - ali-abassi/remotion-templates 的静音等距场景短环预览。本批只增加这一家族，不灌入其余约 990 条预览。
- [图表动画 — 箱线图](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/chart-animations-box-plot.mp4) - ali-abassi/remotion-templates 中 chart-animations 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [编辑标题 — 突发新闻条](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/editorial-headlines-breaking-strip.mp4) - ali-abassi/remotion-templates 中 editorial-headlines 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [讲解图示 — 前后对比系统](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/explainer-diagrams-before-after-system.mp4) - ali-abassi/remotion-templates 中 explainer-diagrams 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [3D 设备舞台 — 微距细节](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/3d-device-stages-macro-detail.mp4) - ali-abassi/remotion-templates 中 3d-device 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [应用引导 — 资料设置](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/app-onboarding-profile-setup.mp4) - ali-abassi/remotion-templates 中 app-onboarding 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。
- [电影片尾 — 演职员表](https://github.com/ali-abassi/remotion-templates/blob/main/site/previews/cinematic-credits-end-credits.mp4) - ali-abassi/remotion-templates 中 cinematic-credits 家族的静音短环预览（site/previews）。上游没有 SPDX，按不可再分发处理。

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
| [全息 HUD](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/hologram-hud/STYLE.md) | 全息 HUD 风格说明与样片；演示片 CC BY 4.0，署名 LemoLab | 界面与数据演示 |
| [浮世绘](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ukiyoe/STYLE.md) | 浮世绘风格说明与样片；演示片 CC BY 4.0，署名 LemoLab | 文化风格短片 |
| [装饰艺术](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/art-deco/STYLE.md) | 装饰艺术风格说明与样片；演示片 CC BY 4.0，署名 LemoLab | 品牌与风格短片 |
| [积木玩具](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/brick-toy) | 乐高积木玩具视觉风格；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 玩具、产品与趣味短片 |
| [孔版印刷](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/risograph) | Risograph 孔版印刷视觉风格；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 印刷、海报与独立出版风格短片 |
| [彩色玻璃](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/stained-glass) | 彩色玻璃视觉风格；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 风格短片 |
| [木刻版画](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/woodcut) | 木刻版画视觉风格；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 印刷与版画风格短片 |
| [玻璃产品](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/glass-product) | 暗场摄影棚里的透明与磨砂玻璃，条形灯扫过，并有慢速爆炸视图；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 产品材质与发布短片 |
| [一线成画](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/one-line) | 暖纸上一条不中断的墨线，场景靠变形衔接而不是硬切；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 叙事与讲解短片 |
| [世纪中叶卡通](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/midcentury-toon) | 扁平套色、几何人物和有限动画，适合步骤说明；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 跟做教程与说明短片 |
| [黑板](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/chalkboard/STYLE.md) | 深墨绿色板面，粉笔按笔顺自己写出，镜头正对黑板；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 课堂讲解短片 |
| [红色剪纸](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/papercut-red/STYLE.md) | 接合的中国红色剪纸，细节靠镂空而不是描边，人物按 12 fps 步进；演示片在 web 发行标签上，CC BY 4.0，署名 LemoLab | 民俗与叙事短片 |

## 视频制作框架

这些项目提供制作能力，具体视觉风格需要自行设计或搭配上面的模板。

- [Remotion](https://github.com/remotion-dev/remotion) - 用 React 组件编排和渲染视频，适合界面宣传片、动态排版与数据驱动内容；使用前查看其[商业许可条件](https://www.remotion.dev/docs/license)。
- [HyperFrames](https://github.com/heygen-com/hyperframes) - 将 HTML、CSS 和 JavaScript 动画制作成视频，适合网页技术栈与编程助手协作。
- [Motion Canvas](https://motioncanvas.io/) - 用 TypeScript 编排动画，适合图解和讲解型视频。
- [Manim Community](https://www.manim.community/) - 用 Python 制作数学与技术动画，适合公式、几何和概念推导；这里链接的是社区维护版。
- [html-video](https://github.com/nexu-io/html-video) - 面向编程助手的 HTML 到本地 MP4 层，带模板库和统一渲染适配接口。目前真正接好的引擎是 HyperFrames（无头 Chromium 加 FFmpeg）；Remotion、Motion Canvas、Revideo、Manim 在文档里仍是路线图，这里不能当成已经可渲染。仓库为 Apache-2.0，文档写有 21 个模板；本清单收录这个框架、NOTICE 标明的 6 个原创模板、3 个 NOTICE 点名的 HyperFrames 分叉（瑞士网格、动态字体、暖颗粒），以及 Bold Poster（Apache-2.0，设计说明出自 MIT 的 frontend-slides，不是 HyperFrames 分叉）。其余 HyperFrames 示例分叉仍不收录。预览是仓库 hero PNG（缩略图链接），按 Apache-2.0 热链。2026-10-28 仅做源码审阅，没有本地渲染测试。

## 视频动效辅助工具

用于构建视频画面的辅助工具，独立于可直接复用的成片模板。

- [Pretext](https://github.com/chenglou/pretext) - JavaScript/TypeScript 文字测量与多行排版库，可辅助制作动态标题、字幕和文字卡片。复用缓存测量、行宽和折行能力，搭配 DOM、Canvas 或 SVG；需加载目标字体，并自行接入动画时间线与视频渲染器。

## 制作工作流

- [guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) - 从真实产品组件、品牌与字体出发编排宣传片，适合希望根据产品本身设计视觉方向的场景；它提供流程而非固定成片模板。
- [llm-explain](https://github.com/Gohanwu42/llm-explain) - 讲解工作流，附 Python 与 FFmpeg 合成脚本，将本地静态图片、旁白和字幕合成 MP4 与同步 SRT，适合旁白驱动的概念图解。图片与音频需自行准备，再调整分镜清单。
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) - 官方编程助手指南，覆盖 Remotion 视频创建、预览与渲染，并提供字幕、地图和多媒体专项参考。适合自建 React 视频制作流程；视觉方向需自行设计，许可按 Remotion 条款核对。
- [六层视频制作母提示词](https://mp.weixin.qq.com/s/Ridr4JQc6eWOoYfkNfPAgQ) - 中文文章提供完整制作提示词，覆盖交付物、创作权限、制作参数、视觉规则、核心创意和审片迭代。适合用编程助手制作科普或产品影片时拟定任务；替换主题、规格与创意方向。它是制作指令，不是固定画风或可执行成片工程。

## 生成式视频提示词

可直接复制的文生视频和图生视频提示词，附带来源文件里的模型标签。它们不计入上面的 185 个可复用单元。这不是可以克隆后渲染的 Remotion、HyperFrames 或 Shotcraft 工程。模型名只是上游标注，不代表换一个生成器会得到同样结果。2026-10-28 仅做源码审阅，没有本地渲染测试。

- [A Decade of Refinement Glow-Up](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/a-decade-of-refinement-glow-up.json) - 可复制的 Seedance 2.0 提示词，做 15 秒身份锁定的形象转变：同一个人从普通街景走到迪拜屋顶的黑西装镜头。适合作为参考图转变简报。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Maverick | AI（https://x.com/RizwanAly07/status/2048948726623056366）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Animation transfer and camera tracking prompt](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/animation-transfer-and-camera-tracking-prompt.json) - 很短的 Seedance 2.0 提示词：把参考行走套到角色上，同时镜头保持锁定。适合做不换机位的动作迁移。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Olivio Sarikas（https://x.com/OlivioSarikas/status/2049093762077630628）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Beat-Synced Outfit Transformation Dance](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/beat-synced-outfit-transformation-dance.json) - Seedance 2.0 提示词：参考舞蹈进行到一半时按节拍换装，再由第二个角色把剩余步伐跳完。适合带参考图的舞蹈剪辑。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Kashberg（https://x.com/Kashberg_0/status/2049074008730247669）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Character Intro Motion Graphics Sequence](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/character-intro-motion-graphics-sequence.json) - 带时间轴的 Seedance 2.0 提示词：三个参考角色依次入场，带界面标注，最后合成队伍标题。适合风格化的角色亮相。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 KANA（https://x.com/KanaWorks_AI/status/2049281443956974029）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Cinematic Route Navigation Guide](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/cinematic-route-navigation-guide.json) - Seedance 2.0 提示词：5 秒步行路线引导，同一位向导，起始帧用街景图。场景序号和下一步方向是占位符。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Michael Guo（https://x.com/Michaelzsguo/status/2048966649982669053）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Cinematic Street Racing Sequence for Seedance 2](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/cinematic-street-racing-sequence-for-seedance-2.json) - 多镜头 Seedance 2.0 提示词：夜间街头赛车，包括驾驶员特写、氮气按钮和湿沥青上的低机位加速。适合作为电影感追逐简报。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Pierrick Chevallier | IA（https://x.com/CharaspowerAI/status/2039651574297792688）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Modern Rural Aesthetics Healing Short Film Video Prompt](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/modern-rural-aesthetics-healing-short-film-video-prompt.json) - 三镜头 Seedance 2.0 提示词：明亮农舍里的烹饪短片，包括清晨采摘、刀工和安静用餐。适合平静的食物与生活方式片段。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 John（https://x.com/johnAGI168/status/2021818021354848258）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Nightclub Flyer Atmospheric Animation](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/nightclub-flyer-atmospheric-animation.json) - Seedance 2.0 提示词：夜店海报上的人物和文字保持锁定，只让烟雾、轮廓光和闪光移动。JSON 的 aspect 是 16:9，提示词正文另写了 4:5。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Nash Deen（https://x.com/DeenNash_Fu/status/2048912067361452121）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Toaster Rocket Jumpscare](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/toaster-rocket-jumpscare.json) - Seedance 2.0 提示词：手持家庭录像风格，烤面包机把面包弹到天花板，老人被吓到。上游 prompt 字段把同一段话重复了两遍，本条按原文保留。提示词文本为 CC BY 4.0，来自 YouMind OpenLab，许可 https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts/blob/main/LICENSE，由 Open Design 镜像。作者 Marin（https://x.com/MarinMethod/status/2049140113343394003）。模型名只是上游标注。预览是上游缩略图。没有本地渲染测试。
- [Desk Hologram AR on Real Workspace](https://github.com/nexu-io/open-design/blob/main/prompt-templates/video/video-seedance-desk-hologram-ar-realdesk.json) - Apache-2.0 的 Seedance 2.0 提示词：竖屏桌面全息，一个全息角色站在真实的开发者键盘上，先锁定静帧再做成约 15 秒的单镜头。源提示词 3877 个字符，本条只收开头段落和文中标明的负面提示。Open Design / nexu-io（https://github.com/nexu-io/open-design）。模型名只是上游标注。预览是 Open Design 托管的 MP4。没有本地渲染测试。

## 相关清单

- [Awesome Video as Code](https://github.com/voidforall/awesome-video-as-code) - 更广泛的编程助手视频工具、制作流程、案例与研究资源。
- [Awesome Video Skills](https://github.com/AaronAust1n/awesome-video-skills) - 更广泛的视频制作工具、框架、技能与自动化流程。


## 复用边界

- **素材替换仍需要适配。** 页面坐标、分层蒙版、镜头时值和主体绘图可能与原作品绑定。每项是否可直接使用，应以具体工程说明为准。
- **项目和素材各有授权。** 本目录的许可不改变第三方代码、音频、图片、字体或地图数据的许可；发布成片前查看上游说明。

## Contributing

[目录维护指南](docs/catalog-maintenance.md)说明项目、资源、证据三层数据，以及查重、候选管理和引用检查命令。

欢迎补充有明确源码、参数文件或风格文档的资源，也欢迎修正链接与复用说明。请先阅读[贡献指南](contributing.md)，并优先同步英文主版。

## Footnotes

- [实际复用指南](docs/reuse-guide.md)与[筛选和核对说明](docs/selection.md)提供更详细的边界与来源说明，均以英文维护。
- 本仓库采用 Awesome 清单格式，不代表已被 Awesome 总目录收录。
