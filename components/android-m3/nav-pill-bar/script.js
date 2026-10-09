// nav-pill-bar：点击 tab → 胶囊指示器弹射平移（曲线由 CSS 的 --spring 决定）
//               + 页面层同步平移切页（进场从侧边滑入、旧页反向滑出后隐藏）
var nav = document.getElementById('nav');
var pill = document.getElementById('pill');
var pages = [].slice.call(document.querySelectorAll('.md3-page'));
var current = 0; // 当前页下标
var turn = 0;    // 切页轮次：快速连点时，旧一轮的收尾动画不许再碰现在的页面

function movePill(item) {
  pill.style.transform = 'translateX(' + (item.offsetLeft + item.offsetWidth / 2 - pill.offsetWidth / 2) + 'px)';
}

function switchPage(idx) {
  if (idx === current || !pages[idx]) return;
  var dir = idx > current ? 1 : -1;
  var from = pages[current], to = pages[idx];
  var myTurn = ++turn;

  // 清残留：上一轮可能还挂在中间态（快速连点）
  pages.forEach(function (p) {
    if (p !== from && p !== to) {
      p.classList.remove('on', 'entering', 'leaving');
      p.style.transition = '';
      p.style.transform = '';
    }
  });

  // 新页：先关过渡瞬移到起点，再开过渡滑回 0 —— .on 让它 z 序盖住旧页（防层序反了）
  to.classList.remove('leaving');
  to.classList.add('on');
  to.style.transition = 'none';
  to.style.transform = 'translateX(' + dir * 72 + 'px)';
  void to.offsetWidth; // 强制重排让起点生效（同帧改动会被合并，滑入就看不见了）
  to.style.transition = '';
  to.classList.add('entering');
  to.style.transform = 'translateX(0)';

  // 旧页：反向滑出，.leaving 期间保持可见；滑完才隐藏
  from.classList.remove('on', 'entering');
  from.classList.add('leaving');
  from.style.transform = 'translateX(' + -dir * 72 + 'px)';

  var done = function () {
    from.removeEventListener('transitionend', done);
    clearTimeout(fallback);
    if (myTurn !== turn) return; // 已被新一轮取代，现在的页面不归我管
    from.classList.remove('leaving');
    from.style.transform = '';
    to.classList.remove('entering');
  };
  from.addEventListener('transitionend', done);
  var fallback = setTimeout(done, 700); // transitionend 不来时的兜底

  current = idx;
}

nav.addEventListener('click', function (e) {
  var it = e.target.closest('.md3-navitem');
  if (!it) return;
  var items = [].slice.call(nav.querySelectorAll('.md3-navitem'));
  items.forEach(function (n) { n.classList.remove('on'); });
  it.classList.add('on');
  movePill(it);
  switchPage(items.indexOf(it));
});

// 初始定位到 active 项（否则 CSS 里的硬编码值与实际布局有偏差）
movePill(nav.querySelector('.md3-navitem.on'));
