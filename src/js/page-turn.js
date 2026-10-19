// Left and right arrow keys turn to the newer or older poem.
(function () {
  var prev = document.querySelector('a[rel="prev"]');
  var next = document.querySelector('a[rel="next"]');
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "ArrowLeft" && prev) location.href = prev.href;
    if (e.key === "ArrowRight" && next) location.href = next.href;
  });
})();
