/* bottom-sheet：打开 / 关闭 / 整层拖拽下滑关闭（点遮罩或「打开章节」都能关）
   手势方 = Spore-Mobile sheetDrag（2026-10-08 自 StringPhone 实战回灌后的定稿）：
   - >2px 才算拖（点按语义保留）；松手 ≥96px 或（≥24px 且 >0.55px/ms）关闭，
     否则 .3s var(--damped) 弹回；
   - 起笔排除按钮/开关/输入——点按职责保留，因此绝不「吞 click」；
   - style.css 里 .ios-sheet 必须 touch-action:none：不设，浏览器会在 touch
     拖动时发 pointercancel 腰斩拖拽（=拖不动），抢走的手势还会穿透滚背后页面
     （桌面鼠标测不出来，必须 touch 验）；
   - 关闭/重开两头 cssText 清内联 + closeSeq 序号防旧定时器拆新弹层；
     window pointerup/pointercancel 兜底防「指针在窗外抬起」留死笔。 */
const veil = document.getElementById('iosVeil');
const sheet = document.getElementById('iosSheet');

const DRAG_MIN = 96, FLING_MIN = 24, FLING_V = 0.55;
let drag = null, closeSeq = 0;

document.getElementById('iosOpenSheet').onclick = () => {
  closeSeq++;
  veil.classList.add('ios-show');
  sheet.classList.add('ios-show');
  // 清残留：上一轮拖拽/关闭的内联样式会让 spring 弹起起跳
  sheet.style.cssText = '';
  veil.style.cssText = '';
};

const close = () => {
  if (!sheet.classList.contains('ios-show')) return;
  closeSeq++;
  const seq = closeSeq;
  veil.classList.remove('ios-show');              // 遮罩淡出（类 transition）
  sheet.style.transition = 'transform .3s var(--damped)';
  sheet.style.transform = 'translateY(110%)';      // 内联接管，从当前位置顺指尖滑出
  sheet.classList.remove('ios-show');              // 类基态同为 110%，无跳变
  setTimeout(() => {
    if (seq !== closeSeq) return;                  // 320ms 内重开过 → 别拆新弹层
    sheet.style.cssText = '';
    veil.style.cssText = '';
  }, 320);
};
document.getElementById('iosCloseSheet').onclick = close;
veil.onclick = close;

/* 面板内开关占位的切换 */
document.querySelectorAll('.ios-sw').forEach(s =>
  s.addEventListener('click', () => s.classList.toggle('ios-on'))
);

/* ---- 整层拖拽下滑关闭 ---- */
function dragEnd(commit) {
  const dy = Math.max(0, drag.y - drag.y0);
  drag = null;
  if (commit) {
    close();                                       // 复用关闭：seq 防重开 + cssText 清理
    return;
  }
  if (dy <= 0) {
    // 拖下去又拽回原点松手：清掉跟手期内联，不动弹层
    sheet.style.transition = '';
    sheet.style.transform = '';
    return;
  }
  sheet.style.transition = 'transform .3s var(--damped)';
  sheet.style.transform = 'translateY(0)';
  sheet.addEventListener('transitionend', (ev) => {
    if (ev.propertyName !== 'transform') return;
    // 回基态：内联残留会让下一轮弹起/滑下起跳
    sheet.style.transition = '';
    sheet.style.transform = '';
  }, { once: true });
}

function dragStart(e) {
  if (drag || !sheet.classList.contains('ios-show')) return;
  // 弹起过渡还在飞先定格：动画优先级高于内联 transform，不定格拖不动
  if (sheet.getAnimations) sheet.getAnimations().forEach(a => a.finish());
  drag = { id: e.pointerId, y0: e.clientY, y: e.clientY, t: performance.now(), v: 0, moved: false };
  try { sheet.setPointerCapture(e.pointerId); } catch (err) {}
  e.preventDefault();
}

function dragMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const now = performance.now();
  const dy = Math.max(0, e.clientY - drag.y0);
  drag.v = (e.clientY - drag.y) / Math.max(1, now - drag.t);
  drag.y = e.clientY;
  drag.t = now;
  if (!drag.moved) {
    if (dy <= 2) return;                           // <2px 不算拖，点按语义保留
    drag.moved = true;
    sheet.style.transition = 'none';               // 拖动期 1:1 跟手
    sheet.style.transform = 'translateY(0)';
  }
  sheet.style.transform = 'translateY(' + dy + 'px)';
  e.preventDefault();
}

function dragUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dy = Math.max(0, drag.y - drag.y0);
  const moved = drag.moved;
  const flick = moved && dy >= FLING_MIN && drag.v > FLING_V;
  if (!moved) { drag = null; return; }
  dragEnd(dy >= DRAG_MIN || flick);
}

function dragCancel() {
  if (drag && drag.moved) dragEnd(false);           // 系统抢走指针 → 弹回，别留半开状态
  else drag = null;
}

sheet.addEventListener('pointerdown', (e) => {
  if (!sheet.classList.contains('ios-show')) return;
  if (e.target.closest && e.target.closest('button, input, .ios-sw')) return;
  dragStart(e);
});
sheet.addEventListener('pointermove', dragMove);
sheet.addEventListener('pointerup', dragUp);
sheet.addEventListener('pointercancel', dragCancel);
sheet.addEventListener('lostpointercapture', dragCancel);
// 收尾安全网：指针在窗外抬起也要收尾（id 判重，重复触发无害）
window.addEventListener('pointerup', dragUp);
window.addEventListener('pointercancel', dragCancel);
