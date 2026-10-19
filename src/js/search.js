// Client-side search over /search.json. Renders with textContent only.
(function () {
  var input = document.getElementById("q");
  var status = document.getElementById("search-status");
  var results = document.getElementById("search-results");
  if (!input || !results) return;
  var index = null;

  function norm(s) { return String(s || "").toLowerCase(); }

  function render(list, q) {
    results.replaceChildren();
    if (!q) { status.textContent = ""; return; }
    status.textContent = list.length === 1 ? "1 poem" : list.length + " poems";
    list.forEach(function (h) {
      var art = document.createElement("article");
      art.className = "haiku-card";
      var h3 = document.createElement("h3");
      h3.className = "haiku-card-title";
      var a = document.createElement("a");
      a.href = h.url; a.textContent = h.title;
      h3.appendChild(a);
      var poem = document.createElement("div");
      poem.className = "poem";
      h.text.split(" / ").forEach(function (line) {
        var span = document.createElement("span");
        span.className = "line"; span.textContent = line;
        poem.appendChild(span);
      });
      var meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = h.date + " · " + h.type + (h.location ? " · " + h.location : "");
      art.append(h3, poem, meta);
      results.appendChild(art);
    });
  }

  function search() {
    var q = norm(input.value.trim());
    if (!index) return;
    if (!q) { render([], ""); return; }
    var terms = q.split(/\s+/);
    var hits = index.filter(function (h) {
      var hay = norm([h.title, h.text, h.type, h.location, h.date, (h.tags || []).join(" ")].join(" "));
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
    render(hits, q);
  }

  fetch("/search.json").then(function (r) { return r.json(); }).then(function (data) {
    index = data;
    var initial = new URLSearchParams(location.search).get("q");
    if (initial) { input.value = initial; }
    search();
  }).catch(function () { status.textContent = "Search is unavailable right now."; });

  input.addEventListener("input", search);
  input.form.addEventListener("submit", function (e) { e.preventDefault(); search(); });
})();
