/* Sync theme with localStorage before React paints (avoids CSP unsafe-inline). */
(function () {
  try {
    var t = localStorage.getItem('nrna-theme');
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
