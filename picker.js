define(["jquery", "./functions"], function ($, functions) {
  var pickList = [];
  var pickList2 = [];
  const bgColorPickers = "#079B4A";
  //const bgColorPickers2 = "#9B4A07";
  function divPICK(classes, label) { return `<div 
     style="position:absolute; z-index:100; background-color:${bgColorPickers}; 
     cursor:pointer; color:white; border-radius: 10px; padding: 0 10px;height: 20px; line-height:20px;" 
     class="${classes}">${label}</div>`;
  }				

  return {
    pick: function (arg, enigma) {
      const ownId = arg.qInfo.qId;
      $(".guided-tour-picker").remove(); // remove previous divs

      $(".cell")
        .not(`[tid="${arg.qInfo.qId}"]`)
        .find(".qv-inner-object")
        .each(function (i) {
          // add divs overlaying every Sense object
          console.log(
            i,
            this.parentElement
          );
          // if the element is a container, skip it
          if (
            this.parentElement.attributes["tid"] &&
            this.parentElement.attributes["tid"].value != "qv-object-container"
          ) {
            $(this)
              .prepend(divPICK('guided-tour-picker', 'PICK'));
          }
        });
		
      // if an element inside a container was selected above (now has a PICK div), remove it again
      $(".cell .qv-object-container .guided-tour-picker").remove();

      // special care of container objects, add picker per tab (li-tag)
      $(".cell .qv-object-container li")
        .prepend(divPICK("guided-tour-picker-container", 'PICK'));

      function addToList(objId, tidOrCss) {
        console.log(ownId, "Picked object Id " + objId);
        pickList.push(objId);
        pickList2.push(objId);
        if (tidOrCss == "tid") {
          enigma.getObject(objId).then(function (obj) {
            pickList[pickList.length - 1] += `,"${obj.layout.visualization} ${obj.layout.title}"`;
          });
        } else {  // clicked of div which is over a container tab
			pickList[pickList.length - 1] += ',"container tab ' + $(`${objId} .lui-tab__text`).text() + '"';
		}
        // highlight for some milliseconds the currently clicked picker and the DONE picker
        const currPicker = tidOrCss == "tid"
            ? `[tid="${objId}"] .guided-tour-picker`
            : `${objId} .guided-tour-picker-container`;
        $(currPicker).css("background-color", "orange");
        $(`[tid="${ownId}"] .guided-tour-picker`).css("background-color", "orange");
        $(`[tid="${ownId}"] .guided-tour-picks`).html(
          "(" + pickList.length + ")"
        );
        setTimeout(function () {
          $(currPicker).css("background-color", bgColorPickers);
          setTimeout(function () {
            $(`[tid="${ownId}"] .guided-tour-picker`).css( "background-color", bgColorPickers);
          }, 400);
        }, 400);
      }

	  // if user clicked on a PICK div in a container tab
      $(".guided-tour-picker-container").click(function (me) {
        const myParentAttr =
          me.currentTarget.parentElement.attributes["data-itemid"];
        if (myParentAttr) {
          addToList(`[data-itemid="${myParentAttr.value}"]`, "css");
        }
      });

      $(".guided-tour-picker").click(function (me) {
        var parent = me.currentTarget;
        // go up the parents tree until the level where the class contains 'cell'
        var i = 0;
        while (!parent.classList.contains("cell") && i < 6) {
          i++;
          parent = parent.parentElement;
        }

        if (
          parent.classList.contains("cell") &&
          parent.attributes.hasOwnProperty("tid")
        ) {
          var objId = parent.attributes["tid"].value;
          addToList(objId, "tid");
        } else {
          console.error(
            "Object Id not found while going " + i + " parent levels up",
            parent
          );
        }
      });

	  // the current extension object gets different button DONE
      $(`[tid="${ownId}"] .qv-inner-object`) 
        .prepend(divPICK('guided-tour-picker', 'DONE'));

	  // the current extension object gets different onclick event
      $(`[tid="${ownId}"] .guided-tour-picker`).click(function (me) {
        console.log("Those are the objectIds you picked:");
        console.log(pickList.join("\n"));
        functions.leonardoMsg(
          ownId,
          "Picked Objects",
          `<label class="lui-radiobutton">
                <input class="lui-radiobutton__input" type="radio" name="${ownId}_cb" checked id="${ownId}_opt1">
                <div class="lui-radiobutton__radio-wrap">
                <span class="lui-radiobutton__radio"></span>
                <span class="lui-radiobutton__radio-text">Object IDs and type/title</span>
                </div>
            </label>
            <label class="lui-radiobutton">
                <input class="lui-radiobutton__input" type="radio" name="${ownId}_cb" id="${ownId}_opt2">
                <div class="lui-radiobutton__radio-wrap">
                <span class="lui-radiobutton__radio"></span>
                <span class="lui-radiobutton__radio-text">Just object IDs</span>
                </div>
            </label>
            <textarea class="lui-textarea" style="height:140px;font-size:11pt;margin:10px 0;" id="${ownId}_textarea">${pickList.join(
            "\n"
          )}</textarea>
             <button class="lui-button" onclick="document.getElementById('${ownId}_textarea').select();document.execCommand('copy');">Copy to clipboard</button>`,
          "Close",
          null,
          false
        );
		$(`#msgparent_${ownId} .lui-dialog`).css('width', '500px');
        $(`#${ownId}_opt1`).click(function () {
          $(`#${ownId}_textarea`).html(pickList.join("\n"));
        });
        $(`#${ownId}_opt2`).click(function () {
          $(`#${ownId}_textarea`).html(pickList2.join("\n"));
        });
        $(`#msgok_${ownId}`).click(function () {
          $(`#msgparent_${ownId}`).remove();
          pickList = [];
          pickList2 = [];
        });
        $(".guided-tour-picker").remove();
		$(".guided-tour-picker-container").remove();
      });
    },
  };
});
