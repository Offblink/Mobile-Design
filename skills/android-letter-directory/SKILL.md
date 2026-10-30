---
name: android-letter-directory
description: 设计或实现通讯录式移动界面时查：A–Z/# 分组列表、右侧 27 槽字母索引、吸顶字母条、圆角分组卡片与内嵌分隔线、可编辑详情表格（失焦/回车/点空白回写）、新增/删除与失败重试。含 M3 尺寸/颜色/动效规格、RecyclerView + ItemDecoration + 自定义索引条实现骨架、7 个实测坑和验收清单。
---

# 通讯录式字母索引列表 + 可编辑详情表格

一套「像系统通讯录」的移动端信息架构：**分组列表**负责找人，**详情表格**负责改资料。
适合员工/客户/同学通讯录、门店列表、病历索引等「按名字找 → 看/改一条记录」的场景。

不适用：需要搜索优先、瀑布流、或一条记录有大量非结构化内容的产品。

参考实现：Android 原生（Java + RecyclerView + TableLayout + M3），同一套规格可平移到
Compose / SwiftUI / Web（`shared/tokens.css` 的 M3 角色色与双轨动效已对齐）。

## 1. 视觉规格

### 列表页

| 元素 | 规格 |
|---|---|
| 标题 | 24sp `sans-serif-medium`，`onSurface`；副标题 12sp `onSurfaceVariant`（「24 位员工 · 16 个分组」） |
| 行高 | 72dp；左右外边距 16dp；内边距 start 16dp / end 12dp |
| 头像 | 44dp 圆；有图圆裁，无图 = 姓氏首字 18sp，底 `primaryContainer`、字 `onPrimaryContainer` |
| 姓名 | 17sp `onSurface`，单行 ellipsize |
| 副标题 | 13sp `onSurfaceVariant`，最多一行（「部门 · 职位」） |
| 右箭头 | 16dp，`onSurfaceVariant`，alpha 0.45 |
| 分组卡片 | 同一字母共用一张卡：圆角 16dp，底 `surfaceContainerLow`；组首行圆上两角、组尾行圆下两角 |
| 行间分隔线 | 1dp `outlineVariant`，左起卡片内 73dp（= 16 内边距 + 44 头像 + 13 间距），让开头像；组尾不画 |
| 分组字母条 | 30dp 高，12sp，`letterSpacing 0.08`，底 `surface`、字 `onSurfaceVariant`，左内边距 20dp |
| 右侧索引条 | 宽 30dp，靠右，上 4dp / 下 108dp；A–Z + `#` 共 27 槽，槽高 = 可用高度 / 27 |
| 索引字母 | 11sp（且 ≤ 槽高 × 0.82）；当前组 `primary` 加粗；不可用字母 alpha 64；其余 `onSurfaceVariant` |
| 按压气泡 | 直径 44dp 圆，浮在索引条**左侧**，间隔 12dp；底 `primaryContainer`、字 20sp `onPrimaryContainer`；松手 300ms 淡出 |
| FAB | M3 FAB，右下 20dp；`primaryContainer` / `onPrimaryContainer` |
| 列表留白 | RecyclerView `paddingEnd 18dp`（给索引条）、`paddingBottom 104dp`（给 FAB） |

索引条画在 `FrameLayout` 里时，父容器必须 `clipChildren=false`，否则左侧气泡被裁掉。

### 详情页

| 元素 | 规格 |
|---|---|
| 顶栏 | 56dp：返回 48dp 触摸区 / 标题 17sp bold / 「保存」（新增模式）15sp `primary` / 删除图标 48dp |
| 头部 | 头像 96dp（无图首字 36sp，同配色）；姓名 22sp bold；副标题 13sp，最多两行 |
| 表格 | 7 行 × 2 列；字段列宽 88dp；格内 13sp；单元格最小高 44dp |
| 字段名格 | 只读，底 `surfaceContainerHigh`，字 `onSurfaceVariant`，居中 |
| 值格 | 可编辑，底 `surfaceContainerLowest`，字 `onSurface`，左内边距 10dp |
| 网格线 | 1dp `outlineVariant`；`TableLayout` 底色 = 线色，每格只留「右 + 下」1dp 外边距，首列补左、首行补上 |
| 提示 | 表格下 11sp `onSurfaceVariant`：「浅底格可直接编辑，改完按回车或点空白即保存」 |

### 页面切换

默认「平移分页」：进入从右滑入、旧页向左退出；返回是进页的反动作。
280ms，`fast_out_slow_in`，主题一处接管（`windowAnimationStyle`），别在每个 Activity 里各写一套。

## 2. 动效纪律（与 mobile-design 双轨一致）

- **位移 / 尺寸 / 形变** → 弹簧：Android `OvershootInterpolator(0.7f)`、350–400ms；Web `--spring`。
- **颜色 / 透明度** → 临界阻尼：直接 `setTextColor` / `setAlpha`，不做补间；Web `--damped`。
- 两者绝不共用一个动画对象。索引条只有颜色变化，所以高亮直切；气泡淡出属于透明度，可以单独做 300ms 淡出。

M3 角色色直接取本仓库 `shared/tokens.css`：
`primary #6750A4` · `primaryContainer #EADDFF` · `onPrimaryContainer #21005D` ·
`surface #FEF7FF` · `surfaceContainerLow #F3EDF7` · `surfaceContainerHigh #E6E0E9` ·
`onSurface #1D1B20` · `onSurfaceVariant #49454F` · `outlineVariant #CAC4D0`。
Android 里全部写成 `?attr/colorXxx`，深色模式自动成立。

## 3. 交互与状态

**列表**
- 组顺序 A→Z→`#`；组内用 `Collator(Locale.CHINA)` 按拼音排，不依赖服务端二进制序。
- 扁平化成 `[分组条, 行, 行, 分组条, …]` 两种 viewType；用 `firstInGroup/lastInGroup` 决定圆角与分隔线。
- 点字母：`scrollToPositionWithOffset(position, 0)`，并立刻把该字母设为高亮。
- 按住拖动：命中槽就回调；**没有成员的字母不可点**，但气泡照常显示；拖动期间 `requestDisallowInterceptTouchEvent(true)`。
- 吸顶条与右侧索引必须显示**同一个字母**：高亮只由 `ItemDecoration.onDrawOver` 的分段回调驱动，禁止在 `onScrolled` 里另算一套。
  - 边界：滑到组末时第一可见行可能只是上一组露出的一条缝（`top < 0`，字母条被下一个字母顶走）；此时高亮要跟「顶进来的下一个字母」走，否则右侧会高亮用户看不见的组。
- 加载中副标题写「加载中…」；空态写「还没有员工」；失败态写清原因 + 「点这里重试」（整块可点）。
- 从详情返回且数据未变时保留滚动位置，只有首次加载回顶部。

**详情**
- 编辑模式：失焦 / 键盘「完成」/ 点表格外空白 → 提交。
- 提交前用「上次服务端返回的快照」去重，没改不发请求。
- 成功用**服务端返回的整行**回填（不是本地值），并更新快照；失败回滚到快照并提示。
- 返回键：先提交再 `finish()`；有未保存内容时不允许静默丢弃。
- 新增模式：顶栏出现「保存」，姓名非空校验后 POST，成功后关闭详情并刷新列表。
- 删除：长按行或详情垃圾桶 → 二次确认 → DELETE → 返回列表刷新。
- 键盘：`IME_ACTION_DONE` 收起键盘并清焦点（清焦点触发提交）。

## 4. 服务端契约（REST/JSON）

统一信封 `{"code":200,"message":"success","data":...}`，业务错误也走 HTTP 200 + 非 200 的 `code`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/emps` | 全部记录（服务端按 `initial,name` 排序） |
| GET | `/api/emp/{id}` | 单条；不存在 → `code 404` |
| POST | `/api/emp` | 新增（姓名非空） |
| PUT | `/api/emp/{id}` | 整行更新（表格回写） |
| DELETE | `/api/emp/{id}` | 删除 |

```json
{"id":1,"name":"安然","initial":"A","empNo":"E1001","dept":"架构部","title":"后端工程师",
 "phone":"13800000001","email":"anran@corp.com","hireDate":"2018-07-02","avatarUrl":"avatars/anran.png"}
```

头像用相对路径 + 服务端静态映射（`/avatars/**`）；客户端拼基址后圆裁加载，失败退化首字圆底。

## 5. 实现骨架（Android 原生）

```
MainActivity              列表：加载/空态/失败重试、FAB、长按删除、返回刷新
EmployeeDetailActivity    详情/新增双模式：提交、回滚、删除、返回前 commit
ui/ContactAdapter         [分组条 + 行] 扁平列表；letter→position 映射；Collator 排序
ui/ContactDecoration      onDraw 分组圆角卡 + 内嵌分隔线；onDrawOver 吸顶字母条 + 分段回调
ui/LetterIndexBar         27 槽自绘索引条：命中/高亮/气泡/拖动
ui/InfoTableBinder        TableLayout 7×2；值→Map、快照去重、回滚、回填
data/Api                  HttpURLConnection + Gson；非 JSON 响应单独判错
```

关键片段（伪代码）：

```java
// 高亮唯一来源：装饰器回调 → 索引条
decoration.setOnSectionChangedListener(indexBar::setActiveLetter);
indexBar.setOnLetterSelectedListener(letter -> {
    Integer pos = adapter.positionOfLetter(letter);
    if (pos != null) {
        layoutManager.scrollToPositionWithOffset(pos, 0);
        indexBar.setActiveLetter(letter);
    }
});

// 失焦 / 回车 / 点空白 → 宿主提交
cell.setOnFocusChangeListener((v, hasFocus) -> {
    if (!hasFocus) listener.onCommitRequested();
});
cell.setOnEditorActionListener((v, actionId, e) -> {
    if (actionId == EditorInfo.IME_ACTION_DONE) { hideKeyboard(); v.clearFocus(); return true; }
    return false;
});

// Android 不会自动让 EditText 失焦：点表格外空白要主动清焦点
@Override public boolean dispatchTouchEvent(MotionEvent ev) {
    if (ev.getAction() == MotionEvent.ACTION_DOWN) {
        View focused = getCurrentFocus();
        if (focused instanceof EditText) {
            Rect r = new Rect();
            focused.getGlobalVisibleRect(r);
            if (!r.contains((int) ev.getRawX(), (int) ev.getRawY())) focused.clearFocus();
        }
    }
    return super.dispatchTouchEvent(ev);
}
```

拼音首字母：`android.icu.text.Transliterator("Han-Latin")` 输出带声调，先
`Normalizer.normalize(s, NFD).replaceAll("\\p{M}+","")` 再取首字母；**只有姓名真的变了才重算 `initial`**，
否则旧 ROM 没有 Han-Latin 时会把记录挪进 `#` 组。

## 6. 实测坑（都值得在 code review 时拦）

1. **汉字首字母取错**（「安然」→ N）：Han-Latin 产出 `ān`，`ā` 不是 ASCII，扫描 a–z 会跳到后面的辅音。
   先 NFD 去声调；并只在姓名变化时重算 initial。必须在设备端测（桌面 JVM 没有 `android.icu`）。
2. **首行整卡变灰**：行根 `clickable=true` 会获得焦点，吃到系统默认焦点高亮。
   必须同时 `focusable=false` + `defaultFocusHighlightEnabled=false`，只设后者不够。
3. **吸顶字母与右侧高亮不一致**：见 §3 的边界处理；判据是截图里两处字母必须相同。
4. **表格边框有粗有细 / 行间灰带**：相邻格各留 1dp 会叠成 2dp；用「容器底色当线，每格只留右+下边距」，
   单元格高度 `MATCH_PARENT`，让 `TableRow` 按行高重测。
5. **热部署窗口返回 HTML 错误页**：客户端直接 Gson 解析会 `MalformedJsonException`；
   先整体解析 JSON，失败就按「非 JSON 响应（HTTP xxx）」处理并允许重试，不要漏成崩溃。
6. **截图整屏发灰**：AVD 自动变暗会被 `screencap` 拍进去。取证前
   `adb shell svc power stayon true` + 延长息屏时间 + 点亮屏幕；同一张图灰度不一致才是真 bug。
7. **设备端单测起不来**：`AndroidJUnitRunner` 要显式依赖 `androidx.test:runner`，`ext:junit` 不保证带它。

## 7. 验收清单

- [ ] 27 槽索引条：点/拖跳组；无成员字母不可点；气泡跟手、松手淡出；索引条与吸顶条字母始终一致。
- [ ] 分组卡片：组首/组尾圆角正确；分隔线左起对齐头像；组尾无线；滑动不出现双线。
- [ ] 详情表格：改一格 → 失焦/回车/点空白 → 真值已写入服务端（用接口复核，不只看界面）。
- [ ] 姓名清空：新增被拦；编辑回滚到快照并给出提示。
- [ ] 新增/删除：列表数量与分组数同步变化；删除有二次确认。
- [ ] 服务端未起/重启中：列表给出可点重试的失败文案，不要求杀进程。
- [ ] 返回详情前已提交，不会丢最后一次编辑。
- [ ] 深色模式：所有颜色走 M3 角色，无硬编码色值。
