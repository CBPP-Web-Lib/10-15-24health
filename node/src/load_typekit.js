function loadTypekit() {
  return new Promise((resolve, reject) => {
    var resolved = false;
    function resolveOnce() {
      if (!resolved) {resolve()}
      resolved = true;
    }
    var tpscript = document.createElement("script");
    tpscript.setAttribute("src", "//use.typekit.net/bwe8bid.js");
    tpscript.onload = function() {
      Typekit.load({
        active:resolveOnce()
      });
    }
    document.body.appendChild(tpscript);
    setTimeout(resolveOnce, 1000);
  });
}

export { loadTypekit }