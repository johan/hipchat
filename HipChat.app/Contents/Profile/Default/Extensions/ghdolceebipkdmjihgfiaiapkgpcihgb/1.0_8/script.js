// ==UserScript==
// @match https://www.hipchat.com/chat
// ==/UserScript==

(function() { // for Chrome or Firefox+Greasemonkey
  if ('undefined' == typeof __WITH_JQUERY__) { // unsandbox, please!
    var src = arguments.callee.caller.toString(),
     script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.innerHTML = "const __WITH_JQUERY__ = true;\n("+ src +')();';
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  } else { // unsandboxed -- here we go!
    window.addEventListener('keyup',   keyup,   true);
    window.addEventListener('keydown', keydown, true);
  }
})();

// tab only sends events on keyup, for some reason, at least in Chrome
// have ctrl+shift?+tab switch back and forth between tabs
function keyup(e) {
  var key = e.keyCode
    , M   = e.metaKey, A = e.altKey, C = e.ctrlKey, S = e.shiftKey
    , now = $('#tabs > li').index($('#tabs > li.selected'))
    , tot = $('#tabs > li').length
    , tab = key === 9 && C ? (tot + now + (S ? -1 : 1)) % tot : null;
  if (tab !== null && (M || A)) return;
  window.$('#tabs > li:nth('+ tab +') a:nth(0)').click();
}

// have meta+<paragraph> go to the lobby and meta+1..n go to tab n
function keydown(e) {
  var key = e.keyCode
    , M   = e.metaKey, A = e.altKey, C = e.ctrlKey, S = e.shiftKey
    , now = $('#tabs > li').index($('#tabs > li.selected'))
    , tot = $('#tabs > li').length
    , tab = key === 192 ? 0
          : key < 49 || key > 57 ? null : key - 48;
  if ((tab === null) || !M || A || C || S) return;
  window.$('#tabs > li:nth('+ tab +') a:nth(0)').click();
}
