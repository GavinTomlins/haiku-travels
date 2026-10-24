// Copy and Share buttons for a poem. Built here, so pages without JavaScript
// (and feed readers) never show controls that cannot work.
(function () {
  var box = document.querySelector(".poem-actions");
  var poem = document.querySelector(".poem-large");
  if (!box || !poem) return;

  var lines = Array.prototype.map.call(poem.querySelectorAll(".line"), function (l) { return l.textContent; });
  var title = box.getAttribute("data-title");
  var author = box.getAttribute("data-author");
  var url = box.getAttribute("data-url");
  var text = lines.join("\n") + "\n\n— " + title + ", " + author + "\n" + url;

  function button(label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.textContent = label;
    box.appendChild(b);
    return b;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    var copy = button("Copy poem");
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(text).then(function () {
        copy.textContent = "Copied";
        setTimeout(function () { copy.textContent = "Copy poem"; }, 2000);
      });
    });
  }

  if (navigator.share) {
    var share = button("Share");
    share.addEventListener("click", function () {
      navigator.share({ title: title, text: lines.join("\n"), url: url }).catch(function () {});
    });
  }
})();
