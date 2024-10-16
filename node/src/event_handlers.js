function event_handlers(args) {

  var { sel, popupMaker } = args;

  function set_popup_text(html) {
    document.querySelector(sel + " .popup-wrap").innerHTML = html;
  }
  
  function hide_popup() {
    document.querySelector(sel + " .popup-wrap").classList.remove("visible");
  }
  
  function show_popup() {
    document.querySelector(sel + " .popup-wrap").classList.add("visible");
  }
  
  /**
   * Position popup; it uses fixed positioning so use clientX, clientY
   */
  function position_popup(e) {
    var {clientX, clientY} = e;
    var popup = document.querySelector(sel + " .popup-wrap");
    popup.style.top = (clientY + 20) + "px"
    popup.style.left = clientX + "px";
    var px = clientX / window.innerWidth;
    if (popup.querySelector(".popup")) {
      popup.querySelector(".popup").style.left = (-px*200) + "px";
    }
  }

  return {
    "touchEndHandler" : function(e, data) {
      /*mobile/touch devices only. Attaching to touchend
      seems to cause less conflicts with the pan/zoom library*/

      /*Don't do anything for districts with no data*/
      if (!data.properties.cd_enroll) {return;}

      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      show_popup();
      position_popup(e.changedTouches[0])

      /*Remove any active hover classes*/
      document.querySelectorAll(sel + " .hover-active").forEach((el) => {
        el.classList.remove("hover-active");
      })

      /*Add hover class to this path*/
      this.classList.add("hover-active");
      return true;
    },
    "mouseEnterHandler": function(e, data) {
      /*Devices with a mouse only*/
      hide_popup()

      /*Don't do anything for districts with no data*/
      if (!data.properties.cd_enroll) {return;}
      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      show_popup();

      /*Add hover class to this path*/
      this.classList.add("hover-active");

    },
    "mouseMoveHandler": (e, data) => {
      position_popup(e)
    },
    "mouseLeaveHandler": function(e, data) {
      hide_popup()
      this.classList.remove("hover-active");
    },
    "windowTouchEndHandler": function(e) {
      /*Mobile/touch devices only. Attach this handler to the whole
      document and determine if we've clicked outside a relevant target*/
  
      /*Get list of target and all parents*/
      var parents = [];
      parents.push(e.target);
      var target = e.target;
      while (target.parentNode) {
        parents.push(target.parentNode);
        target = target.parentNode;
      }
      var in_path = false;
      var in_popup = false;
  
      /*If list has a district path or a popup, note that*/
      parents.forEach((el) => {
        if (el.tagName === "path") {
          if (el.classList.contains("district")) {
            in_path = true;
          }
        }
        if (el.tagName === "div") {
          if (el.classList.contains("popup")) {
            in_popup = true;
          }
        }
      });
  
      /*If we're not in a district path or a popup, the user
      has touched outside and we can hide any active popup*/
      if (!in_path && !in_popup) {
        hide_popup();
        document.querySelectorAll(sel + " .hover-active").forEach((el) => {
          el.classList.remove("hover-active");
        })
      }
    }

  }
}

export { event_handlers }