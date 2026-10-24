// Click a postcard sketch to see it large; Esc, the close button or a click outside returns.
// Uses a native <dialog>, so Esc, focus trapping and returning focus come from the browser.
(function () {
  var images = document.querySelectorAll(".postcard img[data-zoom]");
  if (!images.length || typeof HTMLDialogElement !== "function") return;

  var dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Enlarged sketch");
  var close = document.createElement("button");
  close.type = "button";
  close.className = "lightbox-close";
  close.setAttribute("aria-label", "Close");
  close.textContent = "×";
  var figure = document.createElement("figure");
  figure.className = "lightbox-card";
  var big = document.createElement("img");
  big.decoding = "async";
  var caption = document.createElement("figcaption");
  figure.append(big, caption);
  dialog.append(close, figure);
  document.body.appendChild(dialog);

  images.forEach(function (img) {
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "zoom-trigger";
    trigger.setAttribute("aria-label", "Enlarge sketch: " + img.alt);
    // Wrap the whole <picture> (an <img> must stay inside its <picture>).
    var target = img.closest("picture") || img;
    target.parentNode.insertBefore(trigger, target);
    trigger.appendChild(target);
    trigger.addEventListener("click", function () {
      big.src = img.getAttribute("data-zoom");
      big.alt = img.alt;
      var cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
      caption.textContent = cap ? cap.textContent : "";
      caption.hidden = !cap;
      dialog.showModal();
    });
  });

  close.addEventListener("click", function () { dialog.close(); });
  // A click on the backdrop (the dialog itself, not the card) closes it.
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", function () { big.removeAttribute("src"); });
})();
