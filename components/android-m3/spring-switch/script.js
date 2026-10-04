// spring-switch：点击/键盘切换 on 态，动效全部由 CSS 的双弹簧曲线驱动
document.querySelectorAll('.md3-sw').forEach(function (sw) {
  function flip() {
    var on = sw.classList.toggle('on');
    sw.setAttribute('aria-checked', String(on));
  }
  sw.addEventListener('click', flip);
  sw.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  });
});
