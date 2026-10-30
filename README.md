# mobile-design

**自家签名交互 + 三套移动端设计语言的纯静态组件库** —— Blinvo Design、Material 3 Expressive（Android）、iOS 原生 UI、iOS 26 Liquid Glass。

纯 HTML/CSS/JS，**零构建、零依赖、无需服务器**：双击任意 `index.html` 就能在浏览器里看效果（`file://` 直接可用）。

| Blinvo Design | Android · Material 3 Expressive | iOS · 原生（无玻璃） | iOS 26 · Liquid Glass |
| :---: | :---: | :---: | :---: |
| ![Blinvo Design](docs/screenshots/blinvo-design.png) | ![Android](docs/screenshots/android-m3.png) | ![iOS](docs/screenshots/ios-native.png) | ![Glass](docs/screenshots/liquid-glass.png) |

## 为什么是这四个

- **Blinvo Design**：自家签名交互，不从任何现成设计语言借来——整页缩放转场，以及二维相册 / 一维列表两版涂抹多选。
- **Material 3 Expressive**：弹簧动效（spatial 回弹 / effects 临界阻尼双轨）、35 种形状、48 色角色、强调字重排版、新组件替换（ButtonGroup、FloatingActionButtonMenu、形状形变装载器）。
- **iOS 原生**：HIG 骨架——大标题、inset grouped 列表、内嵌分隔线、实心栏 + 发丝线、单一强调色。刻意**全程 0 个 `backdrop-filter`**。
- **Liquid Glass**：两层纪律（玻璃只属于浮在内容上的控件层，内容层永远不透明）、Regular/Clear 变体、35% 压暗层、scroll-edge 渐隐带、滚动最小化 Tab 条、Reduce Transparency 不透明回退。

## 快速开始

```bash
git clone <this-repo>
```

双击 `index.html` 打开组件总览，点任意卡片进入单组件 demo。或部署到任意静态托管（GitHub Pages 直接可用）。

## 组件清单

### `components/blinvo-design/` — 3 个

自家签名交互，源自本机自有项目，不属于任何设计语言家族。

| 组件 | 说明 |
|---|---|
| `zoom-transition` | 缩放展示：点缩略图/相册入口整页放大进入，返回缩回原格 |
| `paint-select-grid` | 涂抹多选 · 相册网格：锚点到笔尖整段翻转，斜拖跨行全选 |
| `paint-select-list` | 涂抹多选 · 列表：长按卡片进多选，折返换段 + 贴边自动滚动连选 |

### `components/android-m3/` — 6 个

| 组件 | 说明 |
|---|---|
| `spring-switch` | M3 开关：knob 弹簧位移、轨道色临界阻尼不回弹 |
| `button-group` | 连接式分段按钮（替代 SegmentedButton） |
| `fab-menu` | 圆角方块 FAB 展开为弹簧菜单（替代堆叠小 FAB） |
| `morph-loader` | 形状形变装载器（替代圆形 spinner） |
| `nav-pill-bar` | 底部导航 + 弹射平移的胶囊指示器 + 页面平移切页 |
| `expressive-card` | Hero moment 卡片：形变 + 色移 + 强调字重同帧联动 |

### `components/ios-native/` — 6 个

| 组件 | 说明 |
|---|---|
| `large-title-header` | 状态栏 + 导航行 + 34pt 大标题 |
| `segmented-control` | 白色 thumb 弹性滑动的分段控件 |
| `ios-switch` | 51×31 系统绿开关 |
| `inset-grouped-list` | 圆角分组卡 + 图标方块 + 57px 内嵌分隔线 |
| `tab-bar-solid` | 实心 Tab 栏（非玻璃的正确画法） |
| `bottom-sheet` | 从触发处弹起的实心面板 + 纯色遮罩 |

### `components/liquid-glass/` — 5 个

| 组件 | 说明 |
|---|---|
| `glass-toolbar` | 浮动玻璃工具条，唯一着色按钮；含 Reduce Transparency / 反例演示开关 |
| `glass-tab-bar` | 玻璃底栏，向下滚动最小化、回滚展开 |
| `glass-fab` | 玻璃圆形操作钮 |
| `clear-variant-bar` | 压在照片上的 Clear 玻璃 + 35% 压暗层 |
| `scroll-edge` | 内容撞向玻璃条时的渐隐带 |

## Agent Skills（实现配方）

`skills/` 放可直接交给编码 Agent 的落地配方：不是静态组件，不进 `index.html` 画廊，但和组件共用同一套 token 与动效纪律。

| Skill | 内容 |
|---|---|
| [`android-letter-directory`](skills/android-letter-directory/SKILL.md) | 通讯录式 A–Z/# 分组列表 + 27 槽字母索引 + 吸顶字母条 + 可编辑详情表格；含 M3 尺寸/颜色/动效规格、REST 契约、实现骨架、7 个实测坑与验收清单 |

## 项目结构

```
mobile-design/
├── index.html                 # 组件总览
├── shared/
│   ├── tokens.css             # 设计 token：弹簧曲线、M3 角色色、iOS 调色、Glass 配方
│   ├── frame.css              # demo 页舞台（手机外壳 + 说明栏）
│   └── glass.css              # 玻璃基础类（Regular/Clear/35% 压暗/无障碍回退）
├── components/
│   ├── blinvo-design/<name>/  # index.html + style.css (+ script.js)
│   ├── android-m3/<name>/
│   ├── ios-native/<name>/
│   └── liquid-glass/<name>/
├── skills/
│   └── android-letter-directory/
│       └── SKILL.md           # 通讯录式列表 + 可编辑表格的 Agent 实现配方
└── docs/screenshots/
```

**每个组件一个目录、一个 demo 页**：组件的样式与行为只依赖自己的 `style.css`/`script.js` 和 `shared/` 三个文件，拷走即用。

## 约定

- **动效双轨**：位移/尺寸/形变走 `--spring`（约 10% 回弹）；颜色/透明度走 `--damped`（临界阻尼，绝不回弹）。**唯一例外**：页面级转场 `zoom-transition` 走 `fast_out_slow_in`（进 280ms / 出 240ms）——整页缩放回弹越过 100% 再回落读起来像故障。
- **无障碍**：`shared/tokens.css` 内置 `prefers-reduced-motion` 降级；Liquid Glass 组件支持 `body.reduce-transparency` 不透明回退。
- **file:// 安全**：不用 ES modules、不用 `fetch`、不引 CDN——所以没有服务器也能跑。

## 设计依据

设计规则提取自三个开源 Agent Skill，代码为原创实现：

- [hamen/material-3-skill](https://github.com/hamen/material-3-skill)（MIT）— Material 3 token/组件/合规
- [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill) — Apple HIG 与 Liquid Glass 规则
- [ivan-magda/mobile-design-skills](https://github.com/ivan-magda/mobile-design-skills)（MIT）— iOS 26 / M3 Expressive 生成工艺与反模式清单

**Blinvo Design 不在上述来源里**——它不提取设计规则，而是把本机自有项目的交互原样移植成 Web：

| 组件 | 源头 | 对应实现 |
|---|---|---|
| `zoom-transition` | [Offblink/Prism](https://github.com/Offblink/Prism) | `Ui.rectOnScreen` / `Ui.zoomIn` / `Ui.shrinkFinish` |
| `paint-select-grid` | [Offblink/Prism](https://github.com/Offblink/Prism) | `PhotoAdapter.bindPaint` / `paintAt` |
| `paint-select-list` | [Offblink/Spore-Mobile](https://github.com/Offblink/Spore-Mobile) | `assets/web/record.js` 长按进多选 / `paintTo` / 边界自动滚动 |

## License

[MIT](LICENSE)
