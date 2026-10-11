/* ============================================================
   paint-select-grid · 二维相册上的涂抹多选
   移植自 Offblink/Prism —— PhotoAdapter.bindPaint / paintAt
   语义：网格只是排布，选择按一维照片序列走 —— 锚点到笔尖的整段翻转。
   ============================================================ */
var grid = document.getElementById('grid');
var cells = [].slice.call(grid.querySelectorAll('.ps-cell'));
var selBtn = document.getElementById('selBtn');
var cancelBtn = document.getElementById('cancelBtn');
var countEl = document.getElementById('count');
var delBtn = document.getElementById('delBtn');
var emptyEl = document.getElementById('empty');
var hintEl = document.getElementById('hint');

var SELECT = false;      // 选择模式：开着才涂抹（点按才不会误当"进调色"）
var selected = new Set(); // 选中格的下标（数组下标，删除后不复用）
var stroke = null;        // 本笔 {anchor, painting, x, y, dir, modeDecided, applied, last, pid}
var pressTimer = null;    // 长按计时：非选择模式里按住 500ms 进选择模式
var hintTimer = null;

var LONG_PRESS = 500;
var TOUCH_SLOP = 10; // px，Android ViewConfiguration.getScaledTouchSlop() 的网页对应

function hint(msg) {
  hintEl.textContent = msg;
  hintEl.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(function () { hintEl.classList.remove('show'); }, 1700);
}

function syncChrome() {
  countEl.textContent = '已选 ' + selected.size;
  delBtn.disabled = selected.size === 0;
  emptyEl.hidden = cells.length > 0;
}

/** 把第 i 格设成 on；状态没变返回 false（本笔的 strokeApplied 只记真动过的） */
function apply(i, on) {
  if (selected.has(i) === on) return false;
  if (on) selected.add(i);
  else selected.delete(i);
  cells[i].classList.toggle('on', on);
  return true;
}

function setSelect(on) {
  SELECT = on;
  grid.classList.toggle('sel', on);
  cancelBtn.hidden = !on;
  selBtn.hidden = on;
  countEl.hidden = !on;
  if (!on) {
    selected.clear();
    cells.forEach(function (c) { c.classList.remove('on'); });
    hint('已退出选择');
  } else {
    hint('选择模式：按住拖动涂抹');
  }
  syncChrome();
}

/**
 * 涂抹落点：锚点 ↔ 笔尖的整段按本笔方向翻转。
 * 方向只在起涂那一刻定一次（锚点已选 = 这笔取消），整笔不翻转 —— 回拖的撤销
 * 不靠改方向，靠下面那段「甩出区间就地回滚」。
 */
function paintAt(x, y) {
  var el = document.elementFromPoint(x, y);
  var cell = el && el.closest ? el.closest('.ps-cell') : null;
  if (!cell) return;
  var cur = cells.indexOf(cell);
  if (cur < 0 || cur === stroke.last) return;

  if (!stroke.modeDecided) {
    stroke.modeDecided = true;
    stroke.dir = !selected.has(stroke.anchor);
  }
  stroke.last = cur;

  var lo = Math.min(stroke.anchor, cur);
  var hi = Math.max(stroke.anchor, cur);
  var i;
  // 区间内：本笔没动过的按方向涂；动过的跳过（幂等，来回甩不翻来翻去）
  for (i = lo; i <= hi; i++) {
    if (stroke.applied.has(i)) continue;
    if (apply(i, stroke.dir)) stroke.applied.add(i);
  }
  // 区间外：本笔碰过但被回拖甩出去的 → 撤销。只碰本笔动过的，
  // 之前就选好的不在 stroke.applied 里，天然不受影响
  var out = [];
  stroke.applied.forEach(function (k) { if (k < lo || k > hi) out.push(k); });
  for (i = 0; i < out.length; i++) {
    stroke.applied.delete(out[i]);
    apply(out[i], !stroke.dir);
  }
  syncChrome();
}

/* ---------- 手势 ---------- */

grid.addEventListener('pointerdown', function (e) {
  if (e.button !== undefined && e.button !== 0) return; // 只认主键
  var cell = e.target.closest ? e.target.closest('.ps-cell') : null;
  if (!cell) return;
  var idx = cells.indexOf(cell);
  if (idx < 0) return;

  stroke = { anchor: idx, painting: false, x: e.clientX, y: e.clientY,
             dir: false, modeDecided: false, applied: new Set(), last: -1, pid: e.pointerId };

  // 非选择模式：按住不放 = 长按进选择模式并勾住它（Prism onPick）；一动就掐掉
  if (!SELECT) {
    pressTimer = setTimeout(function () {
      pressTimer = null;
      setSelect(true);
      apply(idx, true);
      syncChrome();
      stroke = null; // 长按这笔到此为止，抬手后再按才是涂抹
      hint('已进入选择模式');
      if (navigator.vibrate) navigator.vibrate(8);
    }, LONG_PRESS);
  }
});

grid.addEventListener('pointermove', function (e) {
  if (!stroke) return;
  var dx = e.clientX - stroke.x;
  var dy = e.clientY - stroke.y;
  if (!stroke.painting) {
    if (dx * dx + dy * dy <= TOUCH_SLOP * TOUCH_SLOP) return;
    // 起涂了：先掐掉挂起的长按，否则拖一半它会当成「长按进选择」把刚涂的翻回去
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    if (!SELECT) { stroke = null; return; } // 非选择模式的拖动是滚动，不接管
    stroke.painting = true;
    // 抓住指针：笔尖划出网格也继续收 move，收笔同理
    try { grid.setPointerCapture(e.pointerId); } catch (err) { /* 指针已消逝 */ }
  }
  paintAt(e.clientX, e.clientY);
});

function finishStroke(e) {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  if (!stroke) return;
  var wasPainting = stroke.painting;
  var anchor = stroke.anchor;
  var pid = stroke.pid;
  stroke = null; // 先清再放捕获：release 会同步触发事件重入本函数
  try { grid.releasePointerCapture(pid); } catch (err) { /* 已自动释放 */ }
  if (wasPainting) return; // 这是一次涂抹，收笔即止
  // 没动 = 点按：选择模式里就地翻选，否则是「进调色」
  if (SELECT) {
    apply(anchor, !selected.has(anchor));
    syncChrome();
  } else {
    hint('单击 = 进调色（demo 未接）');
  }
}

grid.addEventListener('pointerup', finishStroke);
grid.addEventListener('pointercancel', finishStroke);
grid.addEventListener('lostpointercapture', finishStroke);
grid.addEventListener('contextmenu', function (e) { e.preventDefault(); }); // 涂抹途中不弹右键/选字菜单

/* ---------- 顶栏与底栏 ---------- */

selBtn.addEventListener('click', function () { setSelect(true); });
cancelBtn.addEventListener('click', function () { setSelect(false); });
delBtn.addEventListener('click', function () {
  var n = selected.size;
  if (!n) return;
  cells = cells.filter(function (c, i) {
    if (selected.has(i)) { c.remove(); return false; }
    return true;
  });
  selected.clear();
  syncChrome();
  hint('已删除 ' + n + ' 张');
  if (!cells.length) setSelect(false);
});

syncChrome();
