/* ============================================================
   zoom-transition · 整页缩放转场引擎
   移植自 Offblink/Prism：
     Ui.rectOnScreen(v)  → rectIn()   源元素的屏幕矩形
     Ui.zoomIn(...)      → zoomTo()   新页从矩形放大到全屏（280ms）
     Ui.shrinkFinish(...)→ goBack()   整页缩回矩形再收场（240ms）
   Prism 里新 Activity 的窗口背景是旧页的 PixelCopy 快照；网页里旧页本来就
   压在下面（.on 不卸载），效果等价，所以这里不需要截图那一步。
   ============================================================ */
var screenEl = document.querySelector('.screen');
var statusEl = document.getElementById('status');
var IDENTITY = 'translate(0px,0px) scale(1,1)'; // 不能写 none：none 与函数式 transform 不补间
var busy = false;                               // 转场中不接任何导航

var pCam = document.getElementById('p-cam');
var pGal = document.getElementById('p-gal');
var pEd = document.getElementById('p-ed');

/* 导航栈：{page, from} —— from 是放大进来的源元素，退场要缩回它 */
var stack = [{ page: pCam, from: null }];

/* ---------- 状态栏 ----------
   单根挂在 .screen 上，不随页面缩放（Android 系统栏由 SystemUI 画，不进 Activity 视图树）。
   颜色 = 盖住状态栏文字位置（y≈17）的那一页的前景色。转场期间逐帧判：
   源页贴底时新页要到最后一刻才够到顶，源页贴顶时又只盖住半条 —— 开场/收场翻都不对。 */
var STATUS_Y = 17;
var statusColors = {};
[].forEach.call(document.querySelectorAll('.zpage'), function (p) {
  statusColors[p.id] = getComputedStyle(p).getPropertyValue('--z-fg').trim();
});
var statusColor = '';

function syncStatus() {
  var top = screenEl.getBoundingClientRect().top;
  var pages = document.querySelectorAll('.zpage.on');
  var owner = null;
  for (var i = pages.length - 1; i >= 0; i--) {
    if (pages[i].getBoundingClientRect().top - top <= STATUS_Y) { owner = pages[i]; break; }
  }
  if (!owner) return;
  var c = statusColors[owner.id];
  if (c && c !== statusColor) {
    statusColor = c;
    statusEl.style.setProperty('--z-fg', c);
  }
}

var tracking = false;
function trackStatus() {
  syncStatus();
  if (busy) requestAnimationFrame(trackStatus);
  else tracking = false;
}
function armStatusTracking() {
  if (tracking) return;
  tracking = true;
  requestAnimationFrame(trackStatus);
}

/* ---------- 转场 ---------- */

/** 源元素相对屏幕的矩形 [x,y,w,h] */
function rectIn(el) {
  var s = screenEl.getBoundingClientRect();
  var r = el.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

/** 把整页映射进源矩形：origin 左上角 + 非等比 scale（宽高各自算，起始态是压扁的） */
function fit(r) {
  return 'translate(' + r.x + 'px,' + r.y + 'px) scale(' +
    (r.w / screenEl.clientWidth) + ',' + (r.h / screenEl.clientHeight) + ')';
}

/** transform 补间结束（transitionend 为主，超时兜底防止事件被吞时卡死） */
function whenDone(el, fn) {
  var settled = false;
  function settle() {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    el.removeEventListener('transitionend', onEnd);
    fn();
  }
  function onEnd(e) {
    if (e.target !== el || e.propertyName !== 'transform') return;
    settle();
  }
  var timer = setTimeout(settle, 900);
  el.addEventListener('transitionend', onEnd);
}

/** 从 fromEl 的位置放大进入 page，并压栈 */
function zoomTo(fromEl, page) {
  if (busy || stack[stack.length - 1].page === page) return;
  busy = true;
  var r = rectIn(fromEl);

  // 起点：先关过渡瞬移到源矩形，强制重排让起点生效（同帧改动会被浏览器合并）
  page.style.transition = 'none';
  page.style.transform = fit(r);
  page.classList.add('on');
  void page.offsetWidth;

  page.style.transition = 'transform var(--zoom-in) var(--zoom-ease)';
  page.style.transform = IDENTITY;
  armStatusTracking();

  whenDone(page, function () {
    // 收干净：不留 transform，避免长期挂着的层合成让文字发虚
    page.style.transition = '';
    page.style.transform = '';
    busy = false;
  });
  stack.push({ page: page, from: fromEl });
}

/** 顶层页缩回它的源元素后收场，并弹栈 */
function goBack() {
  if (busy || stack.length < 2) return;
  var top = stack.pop();
  busy = true;

  top.page.style.transition = 'none';
  top.page.style.transform = IDENTITY;
  void top.page.offsetWidth;

  top.page.style.transition = 'transform var(--zoom-out) var(--zoom-ease)';
  top.page.style.transform = fit(rectIn(top.from));
  armStatusTracking();

  whenDone(top.page, function () {
    top.page.classList.remove('on');
    top.page.style.transition = '';
    top.page.style.transform = '';
    busy = false;
  });
}

/* ---------- 接线 ---------- */

// 相机 → 相册：点左下角相册方块（Prism CameraActivity 打开相册那条）
var albumBtn = document.getElementById('albumBtn');
albumBtn.addEventListener('click', function () { zoomTo(albumBtn, pGal); });

// 相册 → 看图：点任意照片格（Prism PhotoAdapter.onOpen 把格子的 rect 传给 EditorActivity）
var grid = document.getElementById('grid');
var edPhoto = document.getElementById('edPhoto');
grid.addEventListener('click', function (e) {
  var cell = e.target.closest('.z-cell');
  if (!cell) return;
  // 把点中的那张「照片」带到看图页
  edPhoto.style.setProperty('--g', cell.style.getPropertyValue('--g'));
  zoomTo(cell, pEd);
});

document.getElementById('galBack').addEventListener('click', goBack);
document.getElementById('edBack').addEventListener('click', goBack);

syncStatus();
