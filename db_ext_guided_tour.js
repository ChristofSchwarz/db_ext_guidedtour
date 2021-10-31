define(["qlik", "jquery", "./props"], function (qlik, $, props) {

    'use strict';
    const rootContainer = '#qs-page-container';
    var tours = {};  // global variable to remember all active tours 
    // it contains later one entry per extension and the number it shows is the active tooltip (0..n) or -1 if no tooltip is open
    var tooltipsCache = {};


    const styles = {
        err: 'background-color:red; color:white; text-align:center; padding:2px; margin-top:3px;',
		startTour: 'cursor:pointer; text-align:center; font-size:large;',
        nextButton: 'float:right; height:auto; margin-top:10px;',
        arrowLeft: function (col, height) {
            return `<div 
			style="border-color: rgba(0,0,0,0) ${col} rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; border-width:20px; position:absolute; left:-40px; top:${height / 2 - 10}px">
			</div>`;
        },
        arrowRight: function (col, height) {
            return `<div 
			style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0) ${col}; border-style:solid; border-width:20px; position:absolute; right:-40px; top:${height / 2 - 10}px">
			</div>`;
        },
        arrowBottom: function (col, width) {
            return `<div 
			style="border-color: ${col} rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; border-width:20px; position:absolute; left:${width / 2 - 10}px; bottom:-40px;">
			</div>`;
        },
        arrowTop: function (col, width) {
            return `<div 
			style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) ${col} rgba(0,0,0,0); border-style:solid; border-width:20px; position:absolute; left:${width / 2 - 10}px; top:-40px;">
			</div>`;
        }
    }

    function play(ownId, layout, tourElements, tooltipNo, reset, enigma) {

        const isLast = tooltipNo >= (tourElements.length - 1);
        console.log(`${ownId} Play tour, tooltip ${tooltipNo} (isLast ${isLast})`);

        if (reset) {  // end of tour

            function quitTour(fadeSpeed) {
                // unfade all cells, remove the current tooltip and reset the tours counter
                $('.cell').fadeTo('fast', 1, () => { });
                $(`#${ownId}_tooltip`).fadeTo(fadeSpeed, 0, () => { $(`#${ownId}_tooltip`).remove() });
                tours[ownId] = -1;
                tooltipsCache[ownId] = null;
                enigma.getField(layout.pTourField).then((fld)=> fld.clear());
            }
            
            if (isLast) {
				// after the last item of a tour, show databridge ad for a second
                $(`#${ownId}_tooltip`).children().css('opacity', 0);
                $(`#${ownId}_text`).after(`<div style="position:absolute; top:35%; color:${$('#'+ownId+'_next').css('color')}; width:100%; left:-3px; text-align:center; font-size:medium;">
					Tour sponsored by <a href="https://www.databridge.ch" target="_blank" style="color:${$('#'+ownId+'_next').css('color')};">data/\\bridge</a>
					</div>`);
                function delay(time) {
                    return new Promise(resolve => setTimeout(resolve, time));
                }
                delay(1000).then(() => quitTour('slow'));
            } else {
                quitTour('fast');
            }
	



        } else {
            // increase the tours counter and highlight next object

            const prevElem = tourElements[tours[ownId]] ? tourElements[tours[ownId]] : null;
            tours[ownId] = tooltipNo;
            const currElem = tourElements[tooltipNo] ? tourElements[tooltipNo] : null;

            if (prevElem) {
                // fadeout the previous element (if it is not identical to the current)
                if (prevElem[0].qText != currElem[0].qText) $(`[tid="${prevElem[0].qText}"]`).fadeTo('fast', 0.1, () => { })
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
                const unknownObjId = $(`[tid="${qObjId}"]`).length == 0;
                if (unknownObjId) {
                    // target object does not exist, place object in the moddle
                    $('.cell').fadeTo('fast', 0.1, () => { });
                    dims = {
                        left: $(rootContainer).width() / 2,
                        top: $(rootContainer).height() / 2
                    }

                } else {
                    // target object exists
                    $(`[tid="${qObjId}"]`).fadeTo('fast', 1, () => { });
                    $('.cell').not(`[tid="${qObjId}"]`).fadeTo('fast', 0.1, () => { });
                    dims = $(`[tid="${qObjId}"]`).offset(); // this already sets left and top 
                    dims.top -= $(rootContainer).position().top;
                    dims.left -= $(rootContainer).position().left;
                    dims.height = $(`[tid="${qObjId}"]`).height();
                    dims.width = $(`[tid="${qObjId}"]`).width();

                }

                // add the tooltip div
                $(rootContainer).append(`
				<div class="lui-tooltip" id="${ownId}_tooltip" style="display:none;width:${width}px;position:absolute;background-color:${bgColor};color:${fontColor};">
				  <span style="opacity:0.6;">${tooltipNo + 1}/${tourElements.length}</span>
				  <span class="lui-icon  lui-icon--close" style="float:right;cursor:pointer;" id="${ownId}_quit"></span>
				  ${unknownObjId ? '<br/><div style="' + styles.err + '">Object id <strong>' + qObjId + '</strong> not found!</div>' : '<br/>'}
				  <div style="margin-top:10px" id="${ownId}_text">
				  ${html}
				  </div>
				  <a class="lui-button" style="${styles.nextButton}color:${fontColor};" id="${ownId}_next">${isLast ? layout.pTextDone : layout.pTextNext}</a>
				  <div class="lui-tooltip__arrow"></div>
				</div>`);

                // register click trigger for "X" (quit) and Next/Done button
                $(`#${ownId}_quit`).click(() => play(ownId, layout, tourElements, tooltipNo, true, enigma));
                $(`#${ownId}_next`).click(() => play(ownId, layout, tourElements, tooltipNo + 1, isLast, enigma));

                dims.reqHeight = $(`#${ownId}_tooltip`).height(); // now that it's rendered, the browser knows the height of the tooltip
                dims.reqWidth = $(`#${ownId}_tooltip`).width();
                if (unknownObjId) {
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

                    // console.log('orientation', orientation, dims);

                    // move to right position and append the arrowhead

                    if (orientation == 'l') {
                        $(`#${ownId}_tooltip`)
                            .css('left', dims.left - dims.reqWidth - layout.pOffsetLeft)
                            .css('top', dims.top + dims.height / 2 - dims.reqHeight / 2);
                        $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowRight(bgColor, dims.reqHeight));
                    }
                    if (orientation == 'r') {
                        $(`#${ownId}_tooltip`)
                            .css('left', dims.left + dims.width)
                            .css('top', dims.top + dims.height / 2 - dims.reqHeight / 2);
                        $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowLeft(bgColor, dims.reqHeight));
                    }

                    if (orientation == 't' || orientation == 't!') {
                        $(`#${ownId}_tooltip`)
                            .css('left', dims.left + dims.width / 2 - dims.reqWidth / 2)
                            .css('top', orientation == 't!' ? 0 : (dims.top - dims.reqHeight - layout.pOffsetTop));
                        $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowBottom(bgColor, dims.reqWidth));
                    }

                    if (orientation == 'b' || orientation == 'b!') {
                        $(`#${ownId}_tooltip`).css('left', dims.left + dims.width / 2 - dims.reqWidth / 2);
                        if (orientation == 'b!')
                            $(`#${ownId}_tooltip`).css('bottom', dims.reqHeight)
                        else
                            $(`#${ownId}_tooltip`).css('top', dims.top + dims.height);
                        $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(styles.arrowTop(bgColor, dims.reqWidth));
                    }
                }
                $(`#${ownId}_tooltip`).show();

            }
        }
    }

    return {
        initialProperties: {
            showTitles: false,
            disableNavMenu: true,
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: []/*,
                qInitialDataFetch: [{
                    qWidth: 5,
                    qHeight: 2000
                }] */
            }
        },

        definition: {
            type: "items",
            component: "accordion",
            items: [
                {
                    uses: "dimensions",
                    min: 2,
                    max: 5
                }, {
                    uses: "sorting"
                }, {
                    uses: "settings"
                }, {
                    label: 'Extension Settings',
                    type: 'items',
                    items: props.presentation()
                }, {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about($)
                }
            ]
        },
        snapshot: {
            canTakeSnapshot: false
        },
        resize: function ($element, layout) {

            const ownId = this.options.id;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel

            // is a tour currently ongoing?
            if (Object(tours).hasOwnProperty(ownId) && tours[ownId] > -1) {
                // console.log('resize', tours);
                play(ownId, layout, tooltipsCache[ownId], tours[ownId], false, enigma)
            }
            return qlik.Promise.resolve();
        },

        paint: async function ($element, layout) {

            var self = this;
            const ownId = this.options.id;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel;

            // onsole.log(ownId, 'layout', layout);
            if (!Object(tours).hasOwnProperty(ownId)) tours[ownId] = -1;

            $element.html(`
				<div id="${ownId}_parent" style="height:100%;display:flex;justify-content:center;align-items:center;${layout.pExtensionFontColor.length > 0 ? ('color:' + layout.pExtensionFontColor) : ''}">
					<div id="${ownId}_start" style="${styles.startTour}">
						<span class="lui-icon  lui-icon--large  lui-icon--play" style="cursor:pointer;${!layout.pShowIcon ? 'display:none;' : ''}" id="${ownId}_play"></span> 
						${layout.pTextStart}
					</div>
				</div>
			`);
			if (layout.pExtensionBgColor.length > 0) {
				$(`[tid="${ownId}"] .qv-inner-object`).css('background-color', layout.pExtensionBgColor);
			}

            $(`#${ownId}_start`).click(function () {
                console.log(ownId, 'Clicked Tour Start');
                enigma.evaluate(`Sum({1} $Field='${layout.pTourField}') & Chr(10) & 
					Sum({1} DISTINCT [${layout.pTourField}]='${layout.pTourSelectVal}') & Chr(10) & [${layout.pTourField}]`)
                    .then((res) => {
                        const fieldExists = res.split('\n')[0];
                        const valExists = res.split('\n')[1];
                        const currVal = res.split('\n')[2];
                        //console.log(ownId, 'fieldExists', fieldExists, 'valExists', valExists, 'currVal', currVal);

                        function getDataAndPlay() {
                            self.backendApi.getData([{ qTop: 0, qLeft: 0, qWidth: 5, qHeight: 2000 }])
                                .then(function (hcube) {
                                    tooltipsCache[ownId] = hcube[0].qMatrix;
                                    console.log(ownId, 'tooltipsCache', tooltipsCache);
                                    play(ownId, layout, tooltipsCache[ownId], 0, false, enigma)
                                })
                                .catch((err) => alert('getData error ' + JSON.stringify(err)));;
                        }

                        if (fieldExists == '0') {
                            alert(`No such field "${layout.pTourField}" in data model.`);
                        }
                        else if (valExists == '0') {
                            alert(`Field "${layout.pTourField}" has no such value "${layout.pTourSelectVal}".`);
                        }
                        else if (currVal == layout.pTourSelectVal) {
                            // field has already the right selection, just play the tour
                            //console.log(`Field ${layout.pTourField} has already selection ${layout.pTourSelectVal}`);
                            getDataAndPlay();
                        } else {
                            // make selection then play the tour
                            enigma.getField(layout.pTourField)
                                .then((fld) => {
                                    fld.select({ qMatch: layout.pTourSelectVal, qSoftLock: false })
                                        .then((fs) => getDataAndPlay())
                                        .catch((err) => alert('select error ' + JSON.stringify(err)));
                                })
                                .catch((err) => alert('getField error ' + JSON.stringify(err)));
                        }
                    })
                    .catch((err) => alert('evaluate error ' + JSON.stringify(err)));
            });

            return qlik.Promise.resolve();

        }
    };
});
