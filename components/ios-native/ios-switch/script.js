/* ios-switch：点击开关切换 on 态（与源 demo 同款交互） */
document.querySelectorAll('.ios-switch').forEach(s =>
  s.addEventListener('click', () => s.classList.toggle('ios-on'))
);
