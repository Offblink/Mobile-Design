/* segmented-control：点击切换分段（与源 demo 同款交互） */
const seg = document.getElementById('iosSeg');
const thumb = document.getElementById('iosThumb');
const now = document.getElementById('iosSegNow');

seg.addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  const btns = [...seg.querySelectorAll('.ios-seg-btn')];
  const i = btns.indexOf(e.target);
  btns.forEach((b, j) => b.classList.toggle('ios-dim', j !== i));
  thumb.style.transform = 'translateX(calc(' + i + ' * (100% + 1.6px)))';
  if (now) now.textContent = btns[i].textContent;
});
