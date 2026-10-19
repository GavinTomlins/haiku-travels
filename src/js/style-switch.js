// Style variants for review: ?style=a|b|c|d in the URL wins, then the remembered choice.
(function () {
  var valid = { a: 1, b: 1, c: 1, d: 1 };
  var fromUrl = new URLSearchParams(location.search).get("style");
  var chosen = null;
  try { chosen = localStorage.getItem("ht-style"); } catch (e) {}
  if (fromUrl && valid[fromUrl]) { chosen = fromUrl; try { localStorage.setItem("ht-style", chosen); } catch (e) {} }
  if (chosen && valid[chosen]) document.documentElement.setAttribute("data-style", chosen);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-set-style]");
    if (!b) return;
    var s = b.getAttribute("data-set-style");
    if (!valid[s]) return;
    document.documentElement.setAttribute("data-style", s);
    try { localStorage.setItem("ht-style", s); } catch (e2) {}
    e.preventDefault();
  });
})();
