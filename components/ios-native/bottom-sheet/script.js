/* bottom-sheet：打开 / 关闭（点遮罩或「打开章节」都能关），与源 demo 同款交互 */
const veil = document.getElementById('iosVeil');
const sheet = document.getElementById('iosSheet');

document.getElementById('iosOpenSheet').onclick = () => {
  veil.classList.add('ios-show');
  sheet.classList.add('ios-show');
};
const close = () => {
  veil.classList.remove('ios-show');
  sheet.classList.remove('ios-show');
};
document.getElementById('iosCloseSheet').onclick = close;
veil.onclick = close;

/* 面板内开关占位的切换 */
document.querySelectorAll('.ios-sw').forEach(s =>
  s.addEventListener('click', () => s.classList.toggle('ios-on'))
);

/* 整层面板可拖拽下滑关闭（.vc-logs 滚动区除外，区内仍正常滚动）：
   从面板任意处按下跟手位移，拖动超过 6px 进入拖拽态；
   松手超过面板 35% 或快速甩动（>0.5px/ms）即关，未过线 spring 回弹归位；
   拖拽态下吞掉随后的 click，避免误触按钮/开关 */
(function () {
  var startY = 0, dy = 0, t0 = 0, active = false, dragging = false;
  sheet.addEventListener('pointerdown', function (e) {
    if (!sheet.classList.contains('ios-show')) return;
    if (e.target.closest && e.target.closest('.vc-logs')) return;
    active = true; dragging = false;
    startY = e.clientY; dy = 0; t0 = Date.now();
  });
  sheet.addEventListener('pointermove', function (e) {
    if (!active) return;
    dy = e.clientY - startY;
    if (!dragging) {
      if (dy <= 6) return;               // 6px 阈值：点按不受影响
      dragging = true;
      sheet.style.transition = 'none';
      try { sheet.setPointerCapture(e.pointerId); } catch (err) {}
    }
    sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
  });
  function end() {
    if (!active) return;
    active = false;
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (dy > sheet.offsetHeight * 0.35 || dy / Math.max(1, Date.now() - t0) > 0.5) {
      close();
    } else {
      sheet.addEventListener('click', swallow, { capture: true, once: true });
    }
  }
  function swallow(ev) { ev.stopPropagation(); ev.preventDefault(); }
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
})();
