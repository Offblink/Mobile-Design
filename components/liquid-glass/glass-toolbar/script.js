/* 玻璃工具条 demo：Reduce Transparency 回退 + 反例（玻璃铺到内容上）两个开关 */
(function () {
  var rt = document.getElementById('ctlRT'),
      anti = document.getElementById('ctlAnti');

  /* 系统辅助功能 → 不透明回退，回退 CSS 在 shared/glass.css */
  rt.addEventListener('click', function () {
    this.classList.toggle('on');
    document.body.classList.toggle('reduce-transparency');
  });

  /* 反例开关：本组件本地 class，反例样式在本目录 style.css（仅 demo 用） */
  anti.addEventListener('click', function () {
    this.classList.toggle('on');
    document.body.classList.toggle('anti-content');
  });
})();
