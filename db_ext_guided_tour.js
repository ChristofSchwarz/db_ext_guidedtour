define(["qlik", "jquery", "text!./styles.css", "./props", "./functions", "./license"], function
    (qlik, $, cssContent, props, functions, license) {

    'use strict';

    var guided_tour_global = {
        qext: {}, // extension meta-information
        hashmap: license.hashmap(location.hostname, 'db_ext_guided_tour'), // hash map for the license check
        activeTooltip: {},  // remember all active tours, contains later one entry per extension and the 
        // an integer shows the active tooltip (0..n) or -2 if tour is inactive, -1 (in hover-mode) if armed
        visitedTours: {},  // all extension-ids which will be started, are added to this object
        licensedObjs: {}, // list of all extension-ids which have a license
        tooltipsCache: {}, // the qHypercube result of each tour will be put here under the key of the objectId when started 
        noLicenseWarning: {} // in order not to suppress repeating license warnings , every extension id is added here once the warning was shown
    }
    const lStorageDefault = '{"openedAt":"18991231000000", "objectsOpened": {}}';
    function noLicenseMsg(mode) {
        return `The ${mode} mode would start now, if you had a license for the guided-tour extension.
                <br/><br/>Get in touch with <a href="mailto:insight-sales@databridge.ch">insight-sales@databridge.ch</a> '
                or choose a license-free mode of operation.`
    };

    $("<style>").html(cssContent).appendTo("head");

    $.ajax({
        url: '../extensions/db_ext_guided_tour/db_ext_guided_tour.qext',
        dataType: 'json',
        async: false,  // wait for this call to finish.
        success: function (data) { guided_tour_global.qext = data; }
    });

    function getActiveTour(ownId, currSheet, layout) {
        // returns the tour id which is currently active, or false if no tour is active
        var activeTour = false;
        for (const sheetId in guided_tour_global.activeTooltip) {
            for (const tourId in guided_tour_global.activeTooltip[sheetId]) {
                if (guided_tour_global.activeTooltip[sheetId][tourId] > -2) {
                    if (tourId == ownId) {
                        // console.log(ownId, `This tour is already active.`);
                    } else {
                        if (layout.pConsoleLog) console.log(ownId, `other tour ${tourId} is already active.`);
                    }
                    activeTour = tourId;
                }
            }
        }
        return activeTour;
    }

    function closeOtherTourObj(ownId, currSheet) {
        for (const sheetId in guided_tour_global.activeTooltip) {
            for (const tourId in guided_tour_global.activeTooltip[sheetId]) {
                if (sheetId != currSheet) {
                    $(`#${tourId}_tooltip`).remove(); // close tooltips from other sheets found open
                    guided_tour_global.activeTooltip[sheetId][tourId] = -2;
                } else {

                }
            }
        }
    }

    return {
        initialProperties: {
            showTitles: false,
            disableNavMenu: true,
            qHyperCubeDef: {
                qDimensions: []
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
                }, /*{
                    uses: "sorting"  // no more needed. 
                },*/ {
                    uses: "settings"
                }, /*{
					label: 'Tour Items',
					type: 'items',
					items: props.tourItems()
				},*/ {
                    label: 'Extension Settings',
                    type: 'items',
                    items: props.presentation(qlik.currApp(this), guided_tour_global)
                }, {
                    label: 'License',
                    type: 'items',
                    items: props.licensing(qlik.currApp(this))
                }, {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about(guided_tour_global.qext)
                }
            ]
        },
        snapshot: {
            canTakeSnapshot: false
        },

        resize: function ($element, layout) {

            const ownId = layout.qInfo.qId;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel
            const licensed = guided_tour_global.licensedObjs[ownId];
            const mode = qlik.navigation.getMode();
            const rootContainer = '#qv-page-container'; /*layout.pParentContainer */

            if (mode != 'edit') $('.guided-tour-picker').remove();
            if (layout.pConsoleLog) console.log(ownId, 'resize', layout, guided_tour_global);

            // if a tooltip is open, reposition it

            if ($(`#${ownId}_tooltip`).length > 0) {
                // get the target-selector from a html comment inside the tooltip
                const oldSelector = $(`#${ownId}_tooltip`).html().split('-->')[0].split('<!--')[1] || '';
                const oldOrient = $(`#${ownId}_tooltip`).attr("orient");
                const calcPositions = functions.findPositions2(oldSelector, rootContainer, `#${ownId}_tooltip`
                    , layout, $(`#${ownId}_tooltip`).css('background-color'), oldOrient);
                $(`#${ownId}_tooltip`)
                    .css('left', calcPositions.left).css('right', calcPositions.right)  // left or right
                    .css('top', calcPositions.top).css('bottom', calcPositions.bottom)  // top or bottom
                    .attr('orient', calcPositions.orient);
                $('.guided-tour-arrowhead').remove(); // the arrowhead may have changed toother edge; remove the old
                if (calcPositions.arrow) $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(calcPositions.arrow);  // arrowhead

            }

            return qlik.Promise.resolve();
        },

        paint: function ($element, layout) {

            var self = this;
            const ownId = layout.qInfo.qId;
            guided_tour_global.isSingleMode = document.location.href.split('?')[0].split('/').indexOf('single') > -1;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel;
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const mode = qlik.navigation.getMode();
            if (layout.pConsoleLog) console.log(ownId, 'paint', layout, guided_tour_global);
            if (qlik.navigation.getMode() != 'edit') $('.guided-tour-picker').remove();
            const lStorageKey = app.id + '|' + ownId;
            const objFieldName = layout.qHyperCube.qDimensionInfo[0] ? layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0].replace('=', '') : null;

            //console.log(ownId, 'layout', layout);
            // add sheet to activeTooltip object
            if (!Object(guided_tour_global.activeTooltip).hasOwnProperty(currSheet)) {
                guided_tour_global.activeTooltip[currSheet] = {};
            }
            // add this extension id to activeTooltip object
            if (!Object(guided_tour_global.activeTooltip[currSheet]).hasOwnProperty(ownId)) {
                guided_tour_global.activeTooltip[currSheet][ownId] = -2;  // initialize in the global guided_tour_global.activeTooltip array this tour. -2 is: not started
            }
            closeOtherTourObj();
            // console.log(guided_tour_global.activeTooltip);
            const switchPosition = $('#' + ownId + '_hovermode').is(':checked') ? 'checked' : '';

            $element.html(`
                <div id="${ownId}_parent" style="height:100%;display:flex;justify-content:center;align-items:center;color:${layout.pExtensionFontColor};background-color:${layout.pExtensionBgColor}">`
                + (layout.pLaunchMode == 'hover' ? `
                    <div class="lui-switch" style="margin-right:9px;">
                      <label class="lui-switch__label">
                        <input type="checkbox" class="lui-switch__checkbox" aria-label="Label" id="${ownId}_hovermode" ${switchPosition} />
                        <span class="lui-switch__wrap">
                          <span class="lui-switch__inner"></span>
                          <span class="lui-switch__switch"></span>
                        </span>
                      </label>
                    </div>
                    `: '') + `
                    <div id="${ownId}_start" style="${layout.pLaunchMode == 'hover' ? '' : 'cursor:pointer;'} text-align:center;${layout.pMoreStyles}">
                        <span class="lui-icon  lui-icon--large  ${getActiveTour(ownId, currSheet, layout) == ownId ? 'lui-icon--reload  guided-tour-rotate' : 'lui-icon--play'}" style="${!layout.pShowIcon || layout.pLaunchMode == 'hover' ? 'display:none;' : ''}" id="${ownId}_play"></span> 
                        ${layout.pTextStart}
                    </div>
                    <!--div id="${ownId}_test" style="${layout.pLaunchMode == 'hover' ? '' : 'cursor:pointer;'} text-align:center;${layout.pMoreStyles}">
                        TEST
                    </div-->
                    
                </div>
            `);

            $(`[tid="${ownId}"] .qv-inner-object`).css('background-color', layout.pExtensionBgColor); // set bg-color in Sense Client

            guided_tour_global.licensedObjs[ownId] = license.chkLicenseJson(layout.pLicenseJSON, 'db_ext_guided_tour');
            const licensed = guided_tour_global.licensedObjs[ownId];

            //    ---------------------------------------------------
            if (layout.pLaunchMode == 'click') {
                //---------------------------------------------------
                // Standard-Mode ... plays entire tour on click, no auto-launch nor mouse-over

                $(`#${ownId}_start`).click(function () {
                    if (!getActiveTour(ownId, currSheet, layout)) {
                        functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                            .then(function (hcube) {
                                guided_tour_global.tooltipsCache[ownId] = hcube;
                                functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                            })
                            .catch(function () { });
                    }
                })
                //---------------------------------------------------
            } else if (layout.pLaunchMode == 'hover') {
                //---------------------------------------------------

                $(`#${ownId}_hovermode`).click(function () {
                    if (!licensed) {
                        $(`#${ownId}_hovermode`).prop('checked', false);
                        functions.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg('Mouse-over'), null, 'OK');
                    } else {
                        const hoverModeSwitch = $(`#${ownId}_hovermode`).is(':checked');
                        if (hoverModeSwitch == true) {
                            // switch to "on"
                            functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                .then(function (hcube) {
                                    guided_tour_global.tooltipsCache[ownId] = hcube;
                                    guided_tour_global.tooltipsCache[ownId].forEach((tooltipDef, tooltipNo) => {
                                        const divId = tooltipDef[0].qText;
                                        $('[tid="' + divId + '"]').on('mouseover', function (elem) {
                                            // console.log(tooltipNo, tooltipDef[1].qText);
                                            if ($('#' + ownId + '_tooltip').length == 0) {  // tooltip is not yet open
                                                functions.play2(ownId, layout, tooltipNo, false, enigma, guided_tour_global, currSheet);
                                            }
                                        });
                                        $('[tid="' + divId + '"]').on('mouseout', function (elem) {
                                            // console.log(tooltipNo, 'Closing');
                                            $('#' + ownId + '_tooltip').remove();
                                        });
                                    });
                                    guided_tour_global.activeTooltip[currSheet][ownId] = -1; // set tour to "armed" 
                                })
                                .catch(function () { });

                        } else {
                            // switch to "off", unbind the events;
                            guided_tour_global.tooltipsCache[ownId].forEach((tooltipDef, tooltipNo) => {
                                const divId = tooltipDef[0].qText;
                                $('[tid="' + divId + '"]').unbind('mouseover');
                                $('[tid="' + divId + '"]').unbind('mouseout');
                            });
                            guided_tour_global.activeTooltip[currSheet][ownId] = -2;
                        }
                    }
                })

                //---------------------------------------------------
            } else if (layout.pLaunchMode == 'auto-always') {
                //---------------------------------------------------
                // Auto-lauch always ... plays entire tour automatically once per session
                if (mode == 'analysis' && !guided_tour_global.visitedTours[ownId] && !getActiveTour(ownId, currSheet, layout)) {
                    functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                        .then(function (hcube) {
                            guided_tour_global.tooltipsCache[ownId] = hcube;
                            functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                            guided_tour_global.visitedTours[ownId] = true;
                        })
                        .catch(function () { });
                }
                // on click, tour will be restarted.
                $(`#${ownId}_start`).click(function () {
                    if (!getActiveTour(ownId, currSheet, layout)) {
                        functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                            .then(function (hcube) {
                                guided_tour_global.tooltipsCache[ownId] = hcube;
                                functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                guided_tour_global.visitedTours[ownId] = true;
                            })
                            .catch(function () { });
                    }
                })
                //---------------------------------------------------
            } else if (layout.pLaunchMode == 'auto-once') {
                //---------------------------------------------------
                // Auto-lauch once ... plays entire tour automatically and remember per user
                // find out if it is the time to auto-start the tour
                if (mode == 'analysis' && !getActiveTour(ownId, currSheet, layout)) {
                    enigma.evaluate("=TimeStamp(Now(),'YYYYMMDDhhmmss')").then(function (serverTime) {
                        var lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                        if (serverTime >= layout.pRelaunchAfter
                            && layout.pRelaunchAfter > lStorageValue.openedAt) {
                            if (licensed) {
                                functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                    .then(function (hcube) {
                                        guided_tour_global.tooltipsCache[ownId] = hcube;
                                        functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                        lStorageValue.openedAt = serverTime + ''; // save as string
                                        window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageValue));
                                        if (layout.pConsoleLog) console.log(ownId, 'Stored locally: ', JSON.stringify(lStorageValue));
                                    });

                            } else {
                                if (layout.pConsoleLog) console.log(ownId, 'auto-once suppressed because no license');
                                if (!guided_tour_global.noLicenseWarning[ownId]) {
                                    functions.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg('Auto-launch Once'), null, 'OK');
                                }
                                guided_tour_global.noLicenseWarning[ownId] = true;
                            }
                            //guided_tour_global.visitedTours[ownId] = true;
                        } else {
                            if (layout.pConsoleLog) console.log(ownId, 'user already launched this tour.');
                        }
                    })
                } else {
                    if (layout.pConsoleLog) console.log(ownId, 'auto-once suppressed because ' + (mode != 'analysis' ? (mode + '-mode') : 'other tour active'));
                }
                // on click, tour will be restarted.
                $(`#${ownId}_start`).click(function () {
                    if (!getActiveTour(ownId, currSheet, layout)) {
                        functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                            .then(function (hcube) {
                                guided_tour_global.tooltipsCache[ownId] = hcube;
                                functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                enigma.evaluate("=TimeStamp(Now(),'YYYYMMDDhhmmss')").then(function (serverTime) {
                                    const lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                                    lStorageValue.openedAt = serverTime + ''; // save as string
                                    window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageValue));
                                    if (layout.pConsoleLog) console.log(ownId, 'Stored locally: ', JSON.stringify(lStorageValue));
                                })
                                //guided_tour_global.visitedTours[ownId] = true;
                            })
                            .catch(function () { });
                    }
                })
                //---------------------------------------------------
            } else if (layout.pLaunchMode == 'auto-once-p-obj') {
                //---------------------------------------------------
                // find out if auto-start of a tooltip is needed
                if (mode == 'analysis' && !getActiveTour(ownId, currSheet, layout)) {
                    if (licensed) {
                        const lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                        // function (ownId, enigma, backendApi, objFieldName, tourFieldName, tourFieldVal, timestampFieldName, lStorageVal)
                        // console.log(ownId, 'starting in mode auto-once-p-obj', layout.pTimestampFromDim, lStorageValue)
                        functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal
                            , layout.pTimestampFromDim, lStorageValue)
                            .then(function (hcube) {
                                guided_tour_global.tooltipsCache[ownId] = hcube;
                                if (guided_tour_global.tooltipsCache[ownId].length > 0) {
                                    functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet, lStorageKey, lStorageValue);
                                }
                            })
                            .catch(function () { });
                    } else {
                        if (layout.pConsoleLog) console.log(ownId, 'auto-once-p-obj suppressed because no license');
                        if (!guided_tour_global.noLicenseWarning[ownId]) {
                            functions.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg("Auto-launch Once Per Tooltip"), null, 'OK');
                        }
                        guided_tour_global.noLicenseWarning[ownId] = true;
                    }

                } else {
                    if (layout.pConsoleLog) console.log(ownId, 'auto-once-p-obj suppressed because ' + (mode != 'analysis' ? (mode + '-mode') : 'other tour active'));
                }
                // on click, tour will be restarted.
                $(`#${ownId}_start`).click(function () {
                    if (!getActiveTour(ownId, currSheet, layout)) {
                        functions.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                            .then(function (hcube) {
                                guided_tour_global.tooltipsCache[ownId] = hcube;
                                functions.play2(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                            })
                            .catch(function () { });
                    }
                })
            }

            return qlik.Promise.resolve();

        }
    };
});
