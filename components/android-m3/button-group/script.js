// button-group：切换选中项，并同步下方统计数值
var bg = document.getElementById('bg');
var num = document.getElementById('num');
var lab = document.getElementById('lab');
var DATA = {
  '本周': ['12,480', '本周总步数 · 日均 1,783'],
  '本月': ['54,320', '本月总步数 · 日均 1,811'],
  '年度': ['612,904', '年度总步数 · 日均 1,677']
};

bg.addEventListener('click', function (e) {
  if (e.target.tagName !== 'BUTTON') return;
  bg.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
  e.target.classList.add('on');

  var d = DATA[e.target.textContent.trim()] || ['—', ''];
  num.classList.add('swap');
  setTimeout(function () {
    num.textContent = d[0];
    lab.textContent = d[1];
    num.classList.remove('swap');
  }, 120);
});
