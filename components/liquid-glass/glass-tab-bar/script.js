/* 玻璃 Tab 条 demo：滚动最小化/展开（apple tab-bars 行为）+ tab 切换 */
(function () {
  var sc = document.getElementById('sc'),
      tabbar = document.getElementById('tabbar'),
      lastY = 0;

  function onScroll() {
    var y = sc.scrollTop;
    /* 向下滚过 140px → 最小化；回滚或近顶 → 展开 */
    if (y > 140 && y > lastY + 2) {
      tabbar.classList.add('compact');
    } else if (y < lastY - 2 || y < 80) {
      tabbar.classList.remove('compact');
    }
    lastY = y;
  }
  sc.addEventListener('scroll', onScroll);
  onScroll();

  /* tab 切换：整组只有一个 active（缩放 1.12 + 色加深由 CSS 给） */
  Array.prototype.forEach.call(tabbar.querySelectorAll('.lg-tab'), function (t) {
    t.addEventListener('click', function () {
      Array.prototype.forEach.call(tabbar.querySelectorAll('.lg-tab'), function (x) {
        x.classList.remove('on');
      });
      t.classList.add('on');
    });
  });
})();
