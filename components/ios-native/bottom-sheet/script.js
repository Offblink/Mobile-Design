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
