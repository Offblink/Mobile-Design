// fab-menu：点 FAB 切换菜单开合，动效全由 CSS（stagger + 双弹簧）驱动
document.getElementById('fab').addEventListener('click', function () {
  document.getElementById('fabwrap').classList.toggle('open');
});
