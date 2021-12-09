// functions.js: function play externalized 

define(["jquery", "./license"], function ($, license) {

    function isScrolledIntoView(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }


    function isQlikObjId(selector) {
        // returns true if the selector is a Qlik Object Id or false if it is a DOM selector (CSS)
        return selector.indexOf('#') == -1 && selector.indexOf('.') == -1 && selector.indexOf('=') == -1
            && selector.indexOf(' ') == -1;

    }

    function findPositions2(selector, rootContainer, tooltipSel, layout, bgColor) {

        // analyses and finds the best position for the given tooltip.

        const arrowHeadSize = layout.pArrowHead || 16;
        var leftOrRight = ['', 0];
        var topOrBottom = ['', 0];
        var arrowDiv = '';
        var orientation;
        const knownObjId = $(selector).length > 0;
		const screen = {
			width: $(rootContainer).width(),
			height: $(rootContainer).height()
		}

		// from the rendered tooltip the browser knows the height and width
		var tooltip = {
			width: $(tooltipSel).width(),
			height: $(tooltipSel).height(),
			left: '',
			right: '',
			top: '',
			bottom: ''
		}
		
        if (!knownObjId) {
            // css-selector of object doesn't exist in DOM, render the tooltip in the middle with no arrow
            tooltip.left = screen.width / 2 - tooltip.width / 2;
            tooltip.top = screen.height / 2 - tooltip.height / 2;

        } else {

            var target = $(selector).offset(); // this already sets left and top 
            target.height = $(selector).height();
            target.width = $(selector).width();
			target.right = screen.width - (target.left + target.width);
			target.bottom = screen.height - (target.top + target.height);
			

			var pointTo;
            // decide between Left or Right positioning, depending where there is more free space left.
            // if not enough free space to the left or right, then try "tb?" (top or bottom)
            orientation = target.right > target.left ?
                (target.right > tooltip.width ? 'r' : 'tb?')
                : (target.left > tooltip.width ? 'l' : 'tb?');

            // if it is top or bottom orientation, decide depending on where there is more space left (above or below)
            if (orientation == 'tb?') {
                orientation = target.top > target.bottom ? 't' : 'b';
			}
			
            if (orientation == 'l') {  // arrow will be to the right
                pointTo = { top: target.top + target.height / 2, left: target.left };
				tooltip.width += arrowHeadSize;
				tooltip.right = target.right + target.width + arrowHeadSize;
				tooltip.top = Math.min(Math.max(pointTo.top - tooltip.height / 2, 0), screen.height - tooltip.height - 10); // fix if bottom edge of tooltip would be below screen
                tooltip.arrow = `<div class="guided-tour-arrowhead"
						style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0) ${bgColor}; border-style:solid; 
						border-width:${arrowHeadSize}px; position:absolute; right:${-2 * arrowHeadSize}px; top:${pointTo.top - tooltip.top - arrowHeadSize}px">
					</div>`;
            }

            if (orientation == 'r') { // arrow will be to the left
                pointTo = { top: target.top + target.height / 2, left: target.left + target.width };
				tooltip.width += arrowHeadSize;
                tooltip.left = Math.min(target.left + target.width + arrowHeadSize, screen.width - tooltip.width - 15);
				tooltip.top = Math.min(Math.max(pointTo.top - tooltip.height / 2, 0), screen.height - tooltip.height - 10);
				tooltip.arrow = `<div class="guided-tour-arrowhead"
						style="border-color: rgba(0,0,0,0) ${bgColor} rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
						border-width:${arrowHeadSize}px; position:absolute; left:${-2 * arrowHeadSize}px; top:${pointTo.top - tooltip.top - arrowHeadSize}px">
					</div>`;
            }

            if (orientation == 't' || orientation == 't!') {  // arrow will be at the buttom
                pointTo = { top: target.top, left: target.left + target.width / 2 };
                tooltip.height += arrowHeadSize;
				tooltip.top = Math.max(target.top - tooltip.height - arrowHeadSize, 0);
				tooltip.left = Math.min(Math.max(pointTo.left - tooltip.width / 2, 0), screen.width - tooltip.width - 15);
				tooltip.arrow = `<div class="guided-tour-arrowhead"
					   style="border-color: ${bgColor} rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
					   border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; bottom:${-2 * arrowHeadSize}px;">
					</div>`;
            }

            if (orientation == 'b' || orientation == 'b!') {  // arrow will be at the top
                pointTo = { top: target.top + target.height, left: target.left + target.width / 2 };
                tooltip.height += arrowHeadSize;
				tooltip.left = Math.min(Math.max(pointTo.left - tooltip.width / 2, 0), screen.width - tooltip.width - 15);
				tooltip.bottom = Math.max(target.bottom - tooltip.height - arrowHeadSize, 0);
				tooltip.arrow = `<div class="guided-tour-arrowhead"
						style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) ${bgColor} rgba(0,0,0,0); border-style:solid; 
						border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; top:${-2 * arrowHeadSize}px;">
					</div>`;
            }
        }
		
		// $('#kulimuk').remove();
		// if (pointTo) $('#qv-page-container').append(`<div id="kulimuk" style="position:absolute;width:3px;height:3px;left:${pointTo.left}px;top:${pointTo.top}px;background-color:red;z-index:200;"></div>`);
   
        if (tooltip.left) tooltip.left += 'px';
		if (tooltip.right) tooltip.right += 'px';
		if (tooltip.top) tooltip.top += 'px';
		if (tooltip.bottom) tooltip.bottom += 'px';
		
		console.log('orientation', orientation, tooltip);
		
        return tooltip;
    }




    //    =========================================================================================
    function play2(ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal) {
        //=========================================================================================
        const arrowHeadSize = layout.pArrowHead || 16;
        const rootContainer = guided_tour_global.isSingleMode ? '#qv-stage-container' : '#qv-page-container';
        const finallyScrollTo = '#sheet-title';
        const opacity = layout.pLaunchMode == 'hover' ? 1 : (layout.pOpacity || 1);
        const licensed = guided_tour_global.licensedObjs[ownId];

        const isLast = tooltipNo >= (guided_tour_global.tooltipsCache[ownId].length - 1);
        if (layout.pConsoleLog) console.log(`${ownId} Play tour, tooltip ${tooltipNo} (isLast ${isLast}, licensed ${licensed}, lStorageKey ${lStorageKey})`);

        if (reset) {  // end of tour

            function quitTour(fadeSpeed) {
                // unfade all cells, remove the current tooltip and reset the tours counter
                if (opacity < 1) $('.cell').fadeTo('fast', 1, () => { });
                $(`#${ownId}_tooltip`).fadeTo(fadeSpeed, 0, () => { $(`#${ownId}_tooltip`).remove() });
                guided_tour_global.activeTooltip[currSheet][ownId] = -2;
                guided_tour_global.tooltipsCache[ownId] = null;
                // stop rotating the play icon
                $(`#${ownId}_play`).removeClass('lui-icon--reload').addClass('lui-icon--play').removeClass('guided-tour-rotate');
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
            // rotate the play icon
            $(`#${ownId}_play`).removeClass('lui-icon--play').addClass('lui-icon--reload').addClass('guided-tour-rotate');

            const prevElem = guided_tour_global.tooltipsCache[ownId][guided_tour_global.activeTooltip[currSheet][ownId]] ?
                guided_tour_global.tooltipsCache[ownId][guided_tour_global.activeTooltip[currSheet][ownId]] : null;
            guided_tour_global.activeTooltip[currSheet][ownId] = tooltipNo;
            const currElem = guided_tour_global.tooltipsCache[ownId][tooltipNo] ?
                guided_tour_global.tooltipsCache[ownId][tooltipNo] : null;

            if (prevElem) {
                $(`#${ownId}_tooltip`).remove();
            }

            if (currElem) {
                // for better readability of code get the hypercube page into variables
                var qObjId = currElem[0].qText;
                var html = currElem[1].qText;

                var tooltipStyle = `width:${layout.pDefaultWidth}px;color:${layout.pFontColor};background-color:${layout.pBgColor};`;

                var attr = {};
                try {
                    if (layout.pAttrFromDim && currElem[layout.pAttrFromDim]) attr = JSON.parse(currElem[layout.pAttrFromDim].qText);
                } catch (err) { };
                if (attr.css) tooltipStyle += attr.css;
                var fontColor;
                var bgColor;
                var orientation = 'r';
                var dims;
                var selector;
                var selectorFormat; // will be "qlik-object", "qlik-container" or "css"
                var fadeSelector; // the object that needs to be focussed (is the grand-grand-grand...parent of the selector when "qlik-container")
                var knownObjId;

                if (isQlikObjId(qObjId)) {
                    // qlik object id format
                    //console.log(ownId + ' Qlik object:', qObjId);
                    selectorFormat = 'qlik-object';
                    selector = guided_tour_global.isSingleMode ? `[data-qid="${qObjId}"]` : `[tid="${qObjId}"]`;
                    fadeSelector = selector;
                    knownObjId = $(selector).length;

                } else if (qObjId.indexOf('[data-itemid=') > -1) {
                    selectorFormat = 'qlik-container';
                    selector = qObjId;
                    fadeSelector = '[tid="' + $(selector).closest('.cell').attr('tid') + '"]';  // find the parent with class "cell"
                    knownObjId = $(qObjId).length;
                    $(selector).trigger('click'); // click on the tab in the container

                } else {
                    // css selector format
                    //console.log(ownId + ' CSS selector format:', qObjId);
                    selectorFormat = 'css';
                    selector = qObjId;
                    fadeSelector = null;
                    knownObjId = $(qObjId).length;
                }


                function renderTooltip() {

                    if (knownObjId == 0) {
                        // target object does not exist, place object in the middle
                        if (opacity < 1) $('.cell').fadeTo('fast', opacity, () => { });

                    } else {
                        // target object exists
                        if (opacity < 1) {
                            $(fadeSelector).fadeTo('fast', 1, () => { });
                            $('.cell').not(fadeSelector).fadeTo('fast', opacity, () => { });
                        }

                        // save the time this object was rendered if in auto-once mode
                        if (layout.pLaunchMode == 'auto-once-p-obj' && lStorageKey && lStorageVal) {
                            enigma.evaluate("Timestamp(Now(),'YYYYMMDDhhmmss')") // get server time
                                .then(function (serverTime) {
                                    lStorageVal.objectsOpened[qObjId] = serverTime;
                                    window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageVal));
                                    if (layout.pConsoleLog) console.log(ownId, 'Stored locally ', lStorageKey, JSON.stringify(lStorageVal));
                                });
                        }

                    }

                    // add the tooltip div

                    $(rootContainer).append(`
                    <div class="lui-tooltip  guided-tour-toolip-parent" id="${ownId}_tooltip" style="${tooltipStyle};display:none;position:absolute;">
					    <!--${selector}-->
                        <span style="opacity:0.6;">${tooltipNo + 1}/${guided_tour_global.tooltipsCache[ownId].length}</span>
                        <span class="lui-icon  lui-icon--close" style="float:right;cursor:pointer;${layout.pLaunchMode == 'hover' ? 'opacity:0;' : ''}" id="${ownId}_quit"></span>
                        ${knownObjId == 0 ? '<br/><div class="guided-tour-err">Object <strong>' + qObjId + '</strong> not found!</div>' : '<br/>'}
                        ${knownObjId > 1 ? '<br/><div class="guided-tour-err"><strong>' + qObjId + '</strong> selects ' + knownObjId + ' objects!</div>' : '<br/>'}
                        <div style="margin-top:10px" id="${ownId}_text">
                        ${html}
                        </div>
                        <a class="lui-button  guided-tour-next" style="${layout.pLaunchMode == 'hover' ? 'opacity:0;' : ''}" id="${ownId}_next">${isLast ? layout.pTextDone : layout.pTextNext}</a>
                        <div class="lui-tooltip__arrow"></div>
                    </div>`);

                    // get the current colors, because the attribute-dimension can overrule the first color and background-color style setting
                    fontColor = $(`#${ownId}_tooltip`).css('color');
                    bgColor = $(`#${ownId}_tooltip`).css('background-color');
                    $(`#${ownId}_next`).css('color', fontColor); // set the a-tag button's font color

                    // register click trigger for "X" (quit) and Next/Done button
                    $(`#${ownId}_quit`).click(() => play2(ownId, layout, tooltipNo, true, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal));
                    $(`#${ownId}_next`).click(() => play2(ownId, layout, tooltipNo + 1, isLast, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal));

                    const calcPositions = findPositions2(selector, rootContainer, `#${ownId}_tooltip`, layout, bgColor);

                    $(`#${ownId}_tooltip`)
                        .css('left', calcPositions.left).css('right',calcPositions.right)  // left or right
                        .css('top', calcPositions.top).css('bottom',calcPositions.bottom);  // top or bottom
                    if (calcPositions.arrow) $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(calcPositions.arrow);  // arrowhead

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

    function leonardoMsg(ownId, title, detail, ok, cancel, inverse) {
        //console.log('leonardoMsg', ownId, title, detail, ok, cancel, inverse);
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
    } // end function leonardoMsg



    return {

        play2: function (ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal) {
            play2(ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal);
        },

        leonardoMsg: function (ownId, title, detail, ok, cancel, inverse) {
            leonardoMsg(ownId, title, detail, ok, cancel, inverse);
        },

        findPositions2: function (selector, rootContainer, tooltipSel, layout, bgColor) {
            return findPositions2(selector, rootContainer, tooltipSel, layout, bgColor);
        },

        cacheHypercube: function (ownId, enigma, objFieldName, tourFieldName, tourFieldVal, timestampFieldName, lStorageVal) {
            return new Promise(async function (resolve, reject) {

                // get all relevant objects for the tour (a qMatrix from qHyperCube) into guided_tour_global
                // if provided, by making selections in object field about the right tour (tourFieldName = tourFieldVal)

                const askEnigma = [
                    `Sum({1} $Field='${(tourFieldName || '').replace(/'/g, "''")}')`,
                    `Sum({1} $Field='${(objFieldName || '').replace(/'/g, "''")}')`,
                    `Sum({1} $Field='${(timestampFieldName || '').replace(/'/g, "''")}')`,
                    `Sum({1} DISTINCT [${(tourFieldName || '').replace(/'/g, "''")}]='${(tourFieldVal || '').replace(/'/g, "''")}')`,
                    `TimeStamp(Now(),'YYYYMMDDhhmmss')`
                ].join(" & CHR(10) & ");
                //console.log('askEnigma', askEnigma)
                try {
                    const eval = await enigma.evaluate(askEnigma);
                    const tourFieldExists = eval.split('\n')[0];
                    const objFieldExists = eval.split('\n')[1];
                    const timestampFieldExists = eval.split('\n')[2];
                    const tourValExists = eval.split('\n')[3];
                    const serverTime = eval.split('\n')[4];

                    if (tourFieldName.length > 0 && tourFieldExists == '0') {
                        leonardoMsg(ownId, 'Bad config', `No such field "${tourFieldName}" in data model for tour id.`, null, 'OK');
                        //guided_tour_global.tooltipsCache[ownId] = false;
                        reject();
                    } else if (tourFieldName.length > 0 && tourValExists == '0') {
                        leonardoMsg(ownId, 'Bad config', `Field "${tourFieldName}" has no such value "${tourFieldVal}".`, null, 'OK');
                        //guided_tour_global.tooltipsCache[ownId] = false;
                        reject();
                    } else if (objFieldExists == '0') {
                        leonardoMsg(ownId, 'Bad config', `No such field "${objFieldName}" in data model for object id.`, null, 'OK');
                        //guided_tour_global.tooltipsCache[ownId] = false;
                        reject();
                    } else if (timestampFieldName != null && timestampFieldExists == '0') {
                        leonardoMsg(ownId, 'Bad config', `No such field "${timestampFieldName}" in data model for object timestamp.`, null, 'OK');
                        //guided_tour_global.tooltipsCache[ownId] = false;
                        reject();
                    } else {
                        // add set modifiers for selecting tour and the right objects (if provided)
                        var setMods = [];
                        if (tourFieldName) {
                            setMods.push(`[${tourFieldName}]={${tourFieldVal}}`);

                            if (timestampFieldName != null) {
                                // if timestampField is provided in the arguments, the qlikSearchFormula will be more sophisticated and
                                // include timestamps of previous visits of the user per object
                                var rememberedObjects = [];
                                var conditions = [];
                                for (var e in lStorageVal.objectsOpened) {
                                    rememberedObjects.push("'" + e.replace(/'/g, "''") + "'"); // build an array of all objects remembered in local storage
                                    //conditions.push(`'${serverTime}'>=[${timestampFieldName}] AND [${timestampFieldName}]>'${lStorageVal.objectsOpened[e]}'`);
                                    conditions.push(`[${timestampFieldName}]>'${lStorageVal.objectsOpened[e]}'`);
                                }
                                rememberedObjects = rememberedObjects.length > 0 ? (',' + rememberedObjects.join(',')) : '';
                                conditions = conditions.length > 0 ? (',' + conditions.join(',')) : '';
                                setMods.push(`[${objFieldName}]={"=Pick(WildMatch([${objFieldName}] ${rememberedObjects},'*') ${conditions},True())"}`
                                    + `*{"='${serverTime}'>=[${timestampFieldName}] AND Len([${timestampFieldName}])"}`);
                            }
                        }
                        const measureFormula = `Count({1${setMods.length > 0 ? ('<' + setMods.join(',') + '>') : ''}} [${objFieldName}])`;
                        console.log(ownId, 'adding this measure to hypercube', measureFormula);
                        // get the hypercube definitions of this extension (has only dimensions)
                        const thisExtension = await enigma.getObject(ownId);
                        var props = await thisExtension.getProperties();
                        // make copy of the object, so that following modifications do not impact extension settings
                        props = JSON.parse(JSON.stringify(props));
                        props.qInfo.qId = ('').concat(  // set a new guid
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
                            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
                        );
                        // set sort-order of dimension 0 to load-order
                        props.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias = [{
                            qSortByState: 0,
                            qSortByFrequency: 0,
                            qSortByNumeric: 0,
                            qSortByAscii: 0,
                            qSortByLoadOrder: 1,
                            qSortByExpression: 0
                        }];
                        // add a measure
                        props.qHyperCubeDef.qMeasures.push(
                            { qDef: { qDef: measureFormula } }
                        );

                        props.qHyperCubeDef.qInitialDataFetch = [{ qTop: 0, qLeft: 0, qWidth: 5, qHeight: 2000 }];
                        props.qHyperCubeDef.qInterColumnSortOrder = [];
                        for (var i = 0; i <= props.qHyperCubeDef.qDimensions.length; i++) props.qHyperCubeDef.qInterColumnSortOrder.push(i);
                        props.qHyperCubeDef.qSuppressZero = true;

                        const sessObj = await enigma.createSessionObject(props);
                        const sessObjLayout = await sessObj.getLayout();
                        const hcube = JSON.stringify(sessObjLayout.qHyperCube.qDataPages[0].qMatrix);
                        console.log(ownId, sessObjLayout.qHyperCube.qSize.qcy + ' tooltips found.');
                        await enigma.destroySessionObject(sessObj.id);
                        resolve(JSON.parse(hcube));
                    }

                }
                catch (err) {
                    leonardoMsg(ownId, 'Error in cacheHypercube function', JSON.stringify(err), null, 'OK');
                    //guided_tour_global.tooltipsCache[ownId] = false;
                    reject();
                };
            })
        }
    }
})
