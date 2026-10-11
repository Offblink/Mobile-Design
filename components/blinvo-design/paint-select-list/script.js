/* ============================================================
   paint-select-list · 一维列表上的涂抹多选
   移植自 Offblink/Spore-Mobile —— assets/web/record.js
   （多选手势 / paintTo / 边界自动滚动三段）
   入口是长按卡片，不是按钮；起笔只认单选框。
   ============================================================ */
var page = document.querySelector('.ps-page');
var topbar = document.querySelector('.ps-top');
var list = document.getElementById('list');
var rows = [].slice.call(list.querySelectorAll('.ps-row'));
var ptitle = document.getElementById('ptitle');
var backBtn = document.getElementById('backBtn');
var selCancel = document.getElementById('selCancel');
var batchbar = document.getElementById('batchbar');
var selCount = document.getElementById('selCount');
var bFav = document.getElementById('bFav');
var bMove = document.getElementById('bMove');
var bDel = document.getElementById('bDel');
var emptyEl = document.getElementById('empty');
var hintEl = document.getElementById('hint');

// ---------------------------------------------------------------- 多选模式状态
var selecting = false;   // 长按进入；取消按钮 / ‹ / 删空退出
var selected = new Set(); // 选中的行下标（删除后不复用）
var suppressClick = false; // 长按进模式或涂抹收笔后的那次 click 要吃掉
var hintTimer = null;

// ---------------------------------------------------------------- 多选手势
var HOLD_MS = 500; // 长按进多选的判定时长
var SLOP = 10;     // px：超过就算「动了」（滚动），不算长按
var holdTimer = 0; // 非 0 = 长按挂着
var holdRow = null;
var holdX = 0;
var holdY = 0;
var held = false;   // 本笔长按已触发（收笔的 click 要吃掉）
var paint = null;   // 本笔涂抹 {seg, prev, dx, dir, moved}

// ---------------------------------------------------------------- 边界自动滚动
// 笔尖贴到上/下缘 → 列表自己滚，滚过的行继续按当前方向涂。每帧 3→16px，越贴越快；
// 笔尖不动也滚：滚动期间没有 pointermove，靠 lastPt 持续 rowUnder 取行接着涂。
var EDGE = 90;      // px：上下各留这么高的滚动带
var AUTO_MIN = 3;   // px/帧：刚进带的保底速度
var AUTO_MAX = 16;  // px/帧：贴到最边上的上限
var autoRaf = 0;
var lastPt = { x: 0, y: 0 };

function hint(msg) {
  hintEl.textContent = msg;
  hintEl.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(function () { hintEl.classList.remove('show'); }, 1700);
}

function syncSelChrome() {
  ptitle.textContent = selecting ? '已选 ' + selected.size + ' 项' : '搜题记录';
  selCount.textContent = '已选 ' + selected.size;
  var none = selected.size === 0;
  bFav.disabled = bMove.disabled = bDel.disabled = none;
  emptyEl.hidden = rows.length > 0;
}

/** 单卡勾选：改集合 + 只刷这一格的 .on（不起整列表重绘，滚动位置不丢） */
function setRowSel(i, on) {
  if (selected.has(i) === on) return;
  if (on) selected.add(i);
  else selected.delete(i);
  rows[i].classList.toggle('on', on);
  syncSelChrome();
}

function setSelecting(on) {
  selecting = on;
  if (!on) {
    selected.clear();
    // 行上的 .on 只在进模式时回放：退多选不重绘会留勾 → 就地复位
    rows.forEach(function (r) { r.classList.remove('on'); });
    stopAuto();
    paint = null;
  }
  page.classList.toggle('sel', on);
  batchbar.hidden = !on;
  syncSelChrome();
}

/** 当前段起点 ↔ 笔尖卡 之间整段落选中/取消（段内重放，幂等） */
function paintRange(toIdx) {
  var a = Math.min(paint.seg, toIdx);
  var b = Math.max(paint.seg, toIdx);
  for (var i = a; i <= b; i++) if (rows[i]) setRowSel(i, paint.dir);
}

/** 笔尖挪到第 idx 行：中途折返（行号方向翻）即换向，新段从拐点起算 */
function paintTo(idx) {
  if (idx < 0 || idx === paint.prev) return;
  var d = idx > paint.prev ? 1 : -1;
  if (paint.dx && d !== paint.dx) {
    paint.dir = !paint.dir;
    paint.seg = paint.prev;
  }
  paint.dx = d;
  paint.prev = idx;
  paint.moved = true;
  paintRange(idx);
}

function rowUnder(x, y) {
  var el = document.elementFromPoint(x, y);
  return el && el.closest ? el.closest('.ps-row') : null;
}

/**
 * 笔尖高度 → 本帧滚动量（+ 下滚 / − 上滚 / 0 = 不在带里）；离边越近越快。
 * 边界取**浮层**的内缘而不是列表容器的上下缘：顶栏/底栏是压在列表上的浮层，
 * 带子伸到浮层底下的话 elementFromPoint 命中的是浮层不是卡片 —— 会只滚不选。
 */
function edgeDy(y) {
  var top = topbar.getBoundingClientRect().bottom;
  var lb = list.getBoundingClientRect();
  var bottom = batchbar.hidden ? lb.bottom : batchbar.getBoundingClientRect().top;
  function speed(depth) {
    return Math.round(AUTO_MIN + (AUTO_MAX - AUTO_MIN) * (1 - depth / EDGE));
  }
  if (y >= top && y < top + EDGE) return -speed(y - top);
  if (y > bottom - EDGE && y <= bottom) return speed(bottom - y);
  return 0;
}

function autoTick() {
  autoRaf = 0;
  if (!paint || !selecting) return;
  var dy = edgeDy(lastPt.y);
  if (!dy) return; // 出带了：等下一次 pointermove 再启动
  var before = list.scrollTop;
  list.scrollTop = before + dy;
  if (list.scrollTop === before) return; // 到顶/到底滚不动就停，别空转
  var over = rowUnder(lastPt.x, lastPt.y); // 滚了一行 → 笔尖下的行换了，接着涂
  if (over) paintTo(rows.indexOf(over));
  autoRaf = requestAnimationFrame(autoTick);
}

/** 每笔 pointermove 同步一次：进带就起滚动循环，出带/收笔就停 */
function autoSync(e) {
  lastPt.x = e.clientX;
  lastPt.y = e.clientY;
  var wanted = !!(paint && selecting && edgeDy(e.clientY));
  if (wanted && !autoRaf) {
    autoRaf = requestAnimationFrame(autoTick);
  } else if (!wanted && autoRaf) {
    cancelAnimationFrame(autoRaf);
    autoRaf = 0;
  }
}

function stopAuto() {
  if (autoRaf) {
    cancelAnimationFrame(autoRaf);
    autoRaf = 0;
  }
}

/* ---------------------------------------------------------------- 起笔 / 收笔 */

list.addEventListener('pointerdown', function (e) {
  if (!e.isPrimary) return; // 多指只认主指，别让第二根手指搅局
  suppressClick = false;
  var row = e.target.closest ? e.target.closest('.ps-row') : null;
  if (!row) return;

  if (e.target.closest('.ps-ck') && selecting) {
    // 涂抹起笔：首段方向看起笔格（起在已选上 = 本笔先取消）；seg = 起笔格
    var idx = rows.indexOf(row);
    if (idx < 0) return;
    paint = { seg: idx, prev: idx, dx: 0, dir: !selected.has(idx), moved: false };
    lastPt.x = e.clientX;
    lastPt.y = e.clientY;
    e.preventDefault(); // 这笔不给 WebView 当滚动
    return;
  }
  if (selecting) return; // 模式里卡片区域：点选交给 click，拖动留给滚动

  // 非模式：挂长按（越过 slop 即撤，别把滚动误判成长按）
  holdRow = row;
  holdX = e.clientX;
  holdY = e.clientY;
  held = false;
  holdTimer = setTimeout(function () {
    holdTimer = 0;
    held = true;
    setSelecting(true);
    setRowSel(rows.indexOf(holdRow), true);
    holdRow = null;
    if (navigator.vibrate) navigator.vibrate(8);
  }, HOLD_MS);
});

list.addEventListener('pointermove', function (e) {
  if (!e.isPrimary) return;
  if (holdTimer) {
    var dx = e.clientX - holdX;
    var dy = e.clientY - holdY;
    if (dx * dx + dy * dy > SLOP * SLOP) {
      clearTimeout(holdTimer);
      holdTimer = 0;
      holdRow = null; // 动了 = 滚动手势，长按作废
    }
    return;
  }
  if (paint && selecting) {
    autoSync(e);
    var over = rowUnder(e.clientX, e.clientY);
    if (over) paintTo(rows.indexOf(over));
    e.preventDefault();
  }
});

function endStroke() {
  stopAuto();
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = 0;
    holdRow = null;
  }
  if (paint) {
    if (paint.moved) {
      suppressClick = true; // 涂抹收笔那下别再触发 click
    } else {
      // 单选框上的轻点（没动）：就地翻选，吃掉随后的 click 防双翻
      setRowSel(paint.seg, !selected.has(paint.seg));
      suppressClick = true;
    }
    paint = null;
  }
  if (held) {
    suppressClick = true; // 长按进模式的那笔，收尾 click 不能把刚勾上的又翻回去
    held = false;
  }
}

// 收尾挂 window：指针划出列表（鼠标没有隐式捕获）也不会留下悬挂的长按/滚动定时器
window.addEventListener('pointerup', endStroke);
window.addEventListener('pointercancel', function () {
  endStroke();
  suppressClick = false; // cancel 后没有 click，别把标志留给下一笔
});
list.addEventListener('contextmenu', function (e) { e.preventDefault(); }); // 长按不该弹文字选择/右键菜单

/* ---------------------------------------------------------------- 行点击统一委托 */

list.addEventListener('click', function (e) {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  var row = e.target.closest ? e.target.closest('.ps-row') : null;
  if (!row) return;
  var idx = rows.indexOf(row);
  if (selecting) setRowSel(idx, !selected.has(idx));
  else hint('打开会话（demo 未接）');
});

/* ---------------------------------------------------------------- 出口与批量操作 */

backBtn.addEventListener('click', function () {
  if (selecting) setSelecting(false); // 与硬件返回同一条出口
  else hint('demo 到此为止（关页）');
});
selCancel.addEventListener('click', function () { setSelecting(false); });

bFav.addEventListener('click', function () { hint('收藏 ' + selected.size + ' 条 · demo 未接'); });
bMove.addEventListener('click', function () { hint('移入科目 ' + selected.size + ' 条 · demo 未接'); });
bDel.addEventListener('click', function () {
  var n = selected.size;
  if (!n) return;
  var keep = [];
  rows.forEach(function (r, i) {
    if (selected.has(i)) r.remove();
    else keep.push(r);
  });
  rows = keep;
  selected.clear();
  syncSelChrome();
  hint('已删除 ' + n + ' 条');
  if (!rows.length) setSelecting(false);
});

syncSelChrome();
