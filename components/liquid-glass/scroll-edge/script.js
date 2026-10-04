/* scroll-edge demo：内容越贴近玻璃工具条，顶部渐隐带越实 */
(function () {
  var sc = document.getElementById('sc'),
      edge = document.getElementById('edge');

  function onScroll() {
    /* 顶部最实 0.95，滚过 90px 完全淡出 */
    edge.style.opacity = Math.max(0, 1 - sc.scrollTop / 90) * 0.95;
  }

  sc.addEventListener('scroll', onScroll);
  /* 页面加载即执行一次：保证顶部初始就是 0.95，不等第一次滚动 */
  onScroll();
})();
