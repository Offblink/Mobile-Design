// nav-pill-bar：点击 tab 时把胶囊指示器弹射到目标项中心（曲线由 CSS 的 --spring 决定）
var nav = document.getElementById('nav');
var pill = document.getElementById('pill');

function movePill(item) {
  pill.style.transform = 'translateX(' + (item.offsetLeft + item.offsetWidth / 2 - pill.offsetWidth / 2) + 'px)';
}

nav.addEventListener('click', function (e) {
  var it = e.target.closest('.md3-navitem');
  if (!it) return;
  nav.querySelectorAll('.md3-navitem').forEach(function (n) { n.classList.remove('on'); });
  it.classList.add('on');
  movePill(it);
});

// 初始定位到 active 项（否则 CSS 里的硬编码值与实际布局有偏差）
movePill(nav.querySelector('.md3-navitem.on'));
