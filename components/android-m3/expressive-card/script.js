// expressive-card：点 hero 卡（避开按钮）切换形变；「开始慢跑」是纯 CSS 压缩按钮
var hero = document.getElementById('hero');
hero.addEventListener('click', function (e) {
  if (e.target.classList.contains('md3-go')) return;
  hero.classList.toggle('morphed');
});
