/* tab-bar-solid：点击切换活动 tab（与源 demo 同款交互） */
const tabs = document.getElementById('iosTabs');
tabs.addEventListener('click', e => {
  const t = e.target.closest('.ios-tab');
  if (!t) return;
  tabs.querySelectorAll('.ios-tab').forEach(x => x.classList.remove('ios-on'));
  t.classList.add('ios-on');
});
