// functions.js: function play externalized 

define(["jquery"], function ($) {

    const ext = 'db_ext_guided_tour';
    const arrowHeadSize = 20;
    const styles = {
        err: 'background-color:red; color:white; text-align:center; padding:2px; margin-top:3px;',
        nextButton: 'float:right; height:auto; margin-top:10px;',
        arrowLeft: function (col, height, offset) {
            return `<div 
                style="border-color: rgba(0,0,0,0) ${col} rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; border-width:${arrowHeadSize}px; position:absolute; left:-40px; top:${height / 2 - arrowHeadSize / 2 + offset}px">
            </div>`;
        },
        arrowRight: function (col, height, offset) {
            return `<div 
                style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0) ${col}; border-style:solid; border-width:${arrowHeadSize}px; position:absolute; right:-40px; top:${height / 2 - arrowHeadSize / 2 + offset}px">
            </div>`;
        },
        arrowBottom: function (col, width, offset) {
            return `<div 
               style="border-color: ${col} rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; border-width:${arrowHeadSize}px; position:absolute; left:${width / 2 - arrowHeadSize / 2 + offset}px; bottom:-40px;">
            </div>`;
        },
        arrowTop: function (col, width, offset) {
            return `<div 
                style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) ${col} rgba(0,0,0,0); border-style:solid; border-width:${arrowHeadSize}px; position:absolute; left:${width / 2 - arrowHeadSize / 2 + offset}px; top:-40px;">
            </div>`;
        }
    }


    function isScrolledIntoView(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }




    //    =========================================================================================
    function play(ownId, layout, tooltipNo, reset, enigma, tours, tooltipsCache, licensed) {
        //=========================================================================================
        const rootContainer = '#qv-page-container'; /*layout.pParentContainer */
        const finallyScrollTo = '#sheet-title';
        const opcty = layout.pOpacity || 0.1;

        const isLast = tooltipNo >= (tooltipsCache[ownId].length - 1);
        console.log(`${ownId} Play tour, tooltip ${tooltipNo} (isLast ${isLast}, licensed ${licensed})`);

        if (reset) {  // end of tour

            function quitTour(fadeSpeed) {
                // unfade all cells, remove the current tooltip and reset the tours counter
                $('.cell').fadeTo('fast', 1, () => { });
                //$(rootContainer).fadeTo('fast', 1, () => { });
                $(`#${ownId}_tooltip`).fadeTo(fadeSpeed, 0, () => { $(`#${ownId}_tooltip`).remove() });
                tours[ownId] = -1;
                tooltipsCache[ownId] = null;
                enigma.getField(layout.pTourField).then((fld) => fld.clear());

            }

            if (isLast) {
                if (!licensed) {
                    // after the last item of a tour, show databridge ad for a second
                    $(`#${ownId}_tooltip`).children().css('opacity', 0);
                    $(`#${ownId}_text`).after(`<div style="position:absolute; top:35%; color:${$('#' + ownId + '_next').css('color')}; width:100%; left:-3px; text-align:center; font-size:medium;">
                        Tour sponsored by <a href="https://www.databridge.ch" target="_blank" style="color:${$('#' + ownId + '_next').css('color')};">data/\\bridge</a>
                        </div>`);
                }
                function delay(time) {
                    return new Promise(resolve => setTimeout(resolve, time));
                }

                try {
                    if (!isScrolledIntoView(finallyScrollTo)) {
                        document.querySelector(finallyScrollTo).scrollIntoView({ behavior: "smooth" });  // scroll to the top
                    }
                }
                catch (err) { }
                delay(licensed ? 1 : 1000).then(() => quitTour('slow'));

            } else {
                quitTour('fast');
            }




        } else {
            // increase the tours counter and highlight next object

            const prevElem = tooltipsCache[ownId][tours[ownId]] ? tooltipsCache[ownId][tours[ownId]] : null;
            tours[ownId] = tooltipNo;
            const currElem = tooltipsCache[ownId][tooltipNo] ? tooltipsCache[ownId][tooltipNo] : null;

            if (prevElem) {
                // fadeout the previous element (if it is not identical to the current)
                if (prevElem[0].qText != currElem[0].qText) {
                    if (prevElem[0].qText.indexOf('#') > -1 || prevElem[0].qText.indexOf('.') > -1 || prevElem[0].qText.indexOf('=') > -1 || prevElem[0].qText.indexOf(' ') > -1 || prevElem[0].qText.indexOf('=') > -1) {
                        $(`.cell ${prevElem[0].qText}`).fadeTo('fast', opcty, () => { }); // try with css selector
                    } else {
                        $(`.cell [tid="${prevElem[0].qText}"]`).fadeTo('fast', opcty, () => { }); // try with [tid="..."] selector
                    }
                }
                $(`#${ownId}_tooltip`).remove();
            }

            if (currElem) {
                // for better readability of code get the hypercube page into variables
                var qObjId = currElem[0].qText;
                var html = currElem[1].qText;
                var width = currElem[layout.pWidthFromDim] ?
                    (currElem[layout.pWidthFromDim].qNum == NaN || currElem[layout.pWidthFromDim].qText == undefined ? layout.pDefaultWidth : currElem[layout.pWidthFromDim].qNum)
                    : layout.pDefaultWidth;
                var bgColor = currElem[layout.pBgColorFromDim] ?
                    (currElem[layout.pBgColorFromDim].qText == undefined ? layout.pBgColor : currElem[layout.pBgColorFromDim].qText)
                    : layout.pBgColor;
                var fontColor = currElem[layout.pFontColorFromDim] ?
                    (currElem[layout.pFontColorFromDim].qText == undefined ? layout.pFontColor : currElem[layout.pFontColorFromDim].qText)
                    : layout.pFontColor;
                var orientation = 'r';
                var dims;
                var selector;
                var knownObjId;

                if (qObjId.indexOf('#') > -1 || qObjId.indexOf('.') > -1 || qObjId.indexOf('=') > -1 || qObjId.indexOf(' ') > -1 || qObjId.indexOf('=') > -1) {
                    // css selector format
                    console.log(ownId + ' CSS selector format:', qObjId);
                    selector = qObjId;
                    knownObjId = $(`${qObjId}`).length;
                } else {
                    // qlik object id format
                    console.log(ownId + ' Qlik object:', qObjId);
                    selector = `[tid="${qObjId}"]`;
                    knownObjId = $(`[tid="${qObjId}"]`).length;
                }


                function renderTooltip() {
                    if (knownObjId == 0) {
                        // target object does not exist, place object in the moddle
                        $('.cell').fadeTo('fast', opcty, () => { });
                        //$(rootContainer).fadeTo('fast', opcty, () => { });
                        dims = {
                            left: $(rootContainer).width() / 2,
                            top: $(rootContainer).height() / 2
                        }

                    } else {

                        // target object exists
                        $(selector).fadeTo('fast', 1, () => { });
                        $('.cell').not(selector).fadeTo('fast', opcty, () => { });
                        //$(rootContainer + '>*').not(`#${ownId}_tooltip`).fadeTo('fast', opcty, () => { });
                        //$(selector).fadeTo('fast', 1, () => { });
                        dims = $(selector).offset(); // this already sets left and top 
                        dims.top -= $(rootContainer).position().top;
                        dims.left -= $(rootContainer).position().left;
                        dims.height = $(selector).height();
                        dims.width = $(selector).width();

                    }

                    // add the tooltip div
                    $(rootContainer).append(`
                    <div class="lui-tooltip" id="${ownId}_tooltip" style="display:none;width:${width}px;position:absolute;background-color:${bgColor};color:${fontColor};font-size:${layout.pFontSize || '11pt;'}">
                        <span style="opacity:0.6;">${tooltipNo + 1}/${tooltipsCache[ownId].length}</span>
                        <span class="lui-icon  lui-icon--close" style="float:right;cursor:pointer;" id="${ownId}_quit"></span>
                        ${knownObjId == 0 ? '<br/><div style="' + styles.err + '">Object <strong>' + qObjId + '</strong> not found!</div>' : '<br/>'}
                        ${knownObjId > 1 ? '<br/><div style="' + styles.err + '"><strong>' + qObjId + '</strong> selects ' + knownObjId + ' objects!</div>' : '<br/>'}
                        <div style="margin-top:10px" id="${ownId}_text">
                        ${html}
                        </div>
                        <a class="lui-button" style="${styles.nextButton}color:${fontColor};" id="${ownId}_next">${isLast ? layout.pTextDone : layout.pTextNext}</a>
                        <div class="lui-tooltip__arrow"></div>
                    </div>`);

                    // register click trigger for "X" (quit) and Next/Done button
                    $(`#${ownId}_quit`).click(() => play(ownId, layout, tooltipNo, true, enigma, tours, tooltipsCache, licensed));
                    $(`#${ownId}_next`).click(() => play(ownId, layout, tooltipNo + 1, isLast, enigma, tours, tooltipsCache, licensed));

                    // now that it's rendered, the browser knows the height of the tooltip
                    dims.reqHeight = $(`#${ownId}_tooltip`).height() + arrowHeadSize;
                    dims.reqWidth = $(`#${ownId}_tooltip`).width() + arrowHeadSize;
                    if (knownObjId == 0) {
                        // adjust the positioning of tooltip to the center of parent div
                        $(`#${ownId}_tooltip`)
                            .css('left', dims.left - dims.reqWidth / 2)
                            .css('top', dims.top - dims.reqHeight / 2);

                    } else {
                        dims.freeSpaceL = dims.left;
                        dims.freeSpaceR = $(rootContainer).width() - (dims.left + dims.width);
                        dims.freeSpaceT = dims.top;
                        dims.freeSpaceB = $(rootContainer).height() - (dims.top + dims.height);

                        // decide between Left or Right positioning, depending where there is more free space left.
                        // if not enough free space to the left or right, then try "tb?" (top or bottom)
                        orientation = dims.freeSpaceR > dims.freeSpaceL ? (dims.freeSpaceR > dims.reqWidth ? 'r' : 'tb?') : (dims.freeSpaceL > dims.reqWidth ? 'l' : 'tb?');

                        // if it is top or bottom orientation, decide depending on where there is more space left (above or below)
                        if (orientation == 'tb?') orientation = dims.freeSpaceT > dims.freeSpaceB ? (dims.freeSpaceT > dims.reqHeight ? 't' : 't!') : (dims.freeSpaceB > dims.reqHeight ? 'b' : 'b!');

                        //console.log('orientation', orientation, dims);

                        // move to right position and append the arrowhead

                        if (orientation == 'l') {
                            dims.reqHeight -= arrowHeadSize; // arrow will be to the right
                            $(`#${ownId}_tooltip`)
                                .css('left', dims.left - dims.reqWidth - layout.pOffsetLeft)
                                .css('top', Math.max(dims.top + dims.height / 2 - dims.reqHeight / 2, 0));
                            const offsetTop = Math.min(dims.top + dims.height / 2 - dims.reqHeight / 2, 0);
                            $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowRight(bgColor, dims.reqHeight, offsetTop - arrowHeadSize / 2));
                        }
                        if (orientation == 'r') {
                            dims.reqHeight -= arrowHeadSize; // arrow will be to the left
                            $(`#${ownId}_tooltip`)
                                .css('left', dims.left + dims.width + arrowHeadSize)
                                .css('top', Math.max(dims.top + dims.height / 2 - dims.reqHeight / 2, 0));
                            const offsetTop = Math.min(dims.top + dims.height / 2 - dims.reqHeight / 2, 0);
                            $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowLeft(bgColor, dims.reqHeight, offsetTop - arrowHeadSize / 2));
                        }

                        if (orientation == 't' || orientation == 't!') {
                            dims.reqWidth -= arrowHeadSize; // arrow will be at the buttom
                            $(`#${ownId}_tooltip`)
                                .css('left', Math.max(dims.left + dims.width / 2 - dims.reqWidth / 2, 0))
                                .css('top', orientation == 't!' ? 0 : (dims.top - dims.reqHeight - layout.pOffsetTop));
                            const offsetLeft = Math.min(dims.left + dims.width / 2 - dims.reqWidth / 2, 0);
                            $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowBottom(bgColor, dims.reqWidth, offsetLeft - arrowHeadSize / 2));
                        }

                        if (orientation == 'b' || orientation == 'b!') {
                            dims.reqWidth -= arrowHeadSize; // arrow will be at the top
                            $(`#${ownId}_tooltip`).css('left', Math.max(dims.left + dims.width / 2 - dims.reqWidth / 2, 0));
                            const offsetLeft = Math.min(dims.left + dims.width / 2 - dims.reqWidth / 2, 0);
                            if (orientation == 'b!')
                                $(`#${ownId}_tooltip`).css('bottom', dims.reqHeight)
                            else
                                $(`#${ownId}_tooltip`).css('top', dims.top + dims.height + arrowHeadSize);
                            $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowTop(bgColor, dims.reqWidth, offsetLeft - arrowHeadSize / 2));
                        }
                    }
                    $(`#${ownId}_tooltip`).show();
                }

                if (knownObjId) {
                    if (!isScrolledIntoView(selector)) {
                        document.querySelector(selector).scrollIntoView({ behavior: "smooth" }); // scroll to the element
                        var interval;
                        interval = setInterval(function () {
                            if (isScrolledIntoView(selector)) {
                                clearInterval(interval);
                                renderTooltip();
                            }
                        }, 200);
                    } else {
                        renderTooltip();
                    }
                } else {
                    renderTooltip();
                }
            }
        }
    }

    function patternize(hn, d) {
        return d.indexOf('*') == -1 ? hn
            : ([
                hn.substr(0, d.indexOf('*')),
                d.substr(-1) == '*' ? '' : hn.substr(1 - d.length + d.indexOf('*'))
            ].join(d.indexOf('*') == -1 ? '' : '*'));
    }

    function hx(s) {
        var x = 0;
        for (var j = 0; j < s.length; j++) {
            x = ((x << 5) - x) + s.charCodeAt(j)
            x |= 0;
        }
        return Math.abs(x);
    }

    function hm(h, e) {
        const o = hx(h);
        const u = hx(e);
        var cmap = [];
        var n;
        var i;
        for (n = 0; n < h.length; n++) for (i = 11; i <= 36; i++) if (cmap.length < 0x130)
            cmap.push((Math.E.toString().substr(2, 8) * h.charCodeAt(n) + o + u).toString(i));
        return cmap.join('');
    }

    function isLicensed(h, l, c) {
        const m = hm(h, ext);
        const r = l && c && h && (m.substr(Math.sqrt(parseInt(c, 8) - 0x6AC) || 1e6, 7) == (l * 1).toString(36));
        return r || false;
    }

    return {

        play: function (ownId, layout, tooltipNo, reset, enigma, tours, tooltipsCache, licensed) {
            play(ownId, layout, tooltipNo, reset, enigma, tours, tooltipsCache, licensed);
        },

        hm: function (h, e) {
            return hm(h, e);
        },

        isLicensed: function (h, l, c) {
            return isLicensed(h, l, c);
        },

        patternize: function (hn, d) {
            return patternize(hn, d)
        },

        chkLicenseJSON: function (lstr) {
            var r = false;
            try {
                const j = JSON.parse(lstr);
                for (const d in j) {
                    const h = patternize(location.hostname, d);
                    const m = hm(h, ext);
                    r = isLicensed(h, j[d][0], j[d][1])
                }
            }
            catch (err) { };
            return r;
        },

        leonardoMsg: function (ownId, title, detail, ok, cancel, inverse) {
            // This html was found on https://qlik-oss.github.io/leonardo-ui/dialog.html
            if ($('#msgparent_' + ownId).length > 0) $('#msgparent_' + ownId).remove();

            var html = '<div id="msgparent_' + ownId + '">' +
                '  <div class="lui-modal-background"></div>' +
                '  <div class="lui-dialog' + (inverse ? '  lui-dialog--inverse' : '') + '" style="width: 400px;top:80px;">' +
                '    <div class="lui-dialog__header">' +
                '      <div class="lui-dialog__title">' + title + '</div>' +
                '    </div>' +
                '    <div class="lui-dialog__body">' +
                detail +
                '    </div>' +
                '    <div class="lui-dialog__footer">';
            if (cancel) {
                html +=
                    '  <button class="lui-button  lui-dialog__button' + (inverse ? '  lui-button--inverse' : '') + '" ' +
                    '   onclick="$(\'#msgparent_' + ownId + '\').remove();">' +
                    cancel +
                    ' </button>'
            }
            if (ok) {
                html +=
                    '  <button class="lui-button  lui-dialog__button  ' + (inverse ? '  lui-button--inverse' : '') + '" id="msgok_' + ownId + '">' +
                    ok +
                    ' </button>'
            };
            html +=
                '     </div>' +
                '  </div>' +
                '</div>';

            $("#qs-page-container").append(html);
            // fix for Qlik Sense > July 2021, the dialog gets rendered below the visible part of the screen
            if ($('#msgparent_' + ownId + ' .lui-dialog').position().top > 81) {
                $('#msgparent_' + ownId + ' .lui-dialog').css({
                    'top': (-$('#msgparent_' + ownId + ' .lui-dialog').position().top + 100) + 'px'
                });
            }
        }
    }
})
