define(["qlik", "jquery", "./props", "./functions", "./license"], function (qlik, $, props, functions, license) {

    'use strict';

    var tours = {};  // global variable to remember all active tours 
    // it contains later one entry per extension and the number it shows is the active tooltip (0..n) or -1 if no tooltip is open
    var tooltipsCache = {};
    var licensedObjs = {};
    var visitedTours = {};
    var qext;

    $.ajax({
        url: '../extensions/db_ext_guided_tour/db_ext_guided_tour.qext',
        dataType: 'json',
        async: false,  // wait for this call to finish.
        success: function (data) { qext = data; }
    });

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
                }, {
                    uses: "sorting"
                }, {
                    uses: "settings"
                }, {
                    label: 'Extension Settings',
                    type: 'items',
                    items: props.presentation(qlik.currApp(this))
                }, {
                    label: 'License',
                    type: 'items',
                    items: props.licensing(qlik.currApp(this))
                }, {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about(qext)
                }
            ]
        },
        snapshot: {
            canTakeSnapshot: false
        },

        resize: function ($element, layout) {

            const ownId = this.options.id;
            const app = qlik.currApp(this);
            console.log('app', app);
            const enigma = app.model.enigmaModel
            const licensed = licensedObjs[ownId];
            const mode = qlik.navigation.getMode();
            if (mode != 'edit') $('.guided-tour-picker').remove();

            // is a tour currently ongoing?
            if (Object(tours).hasOwnProperty(ownId) && tours[ownId] > -1) {
                // console.log('resize', tours);
                functions.play(ownId, layout, tours[ownId], false, enigma, tours, tooltipsCache, licensed)
            }
            return qlik.Promise.resolve();
        },

        paint: async function ($element, layout) {

            var self = this;
            const ownId = this.options.id;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel;
            const mode = qlik.navigation.getMode();
			console.log(ownId, 'paint', layout);
            if (qlik.navigation.getMode() != 'edit') $('.guided-tour-picker').remove();
            const lStorageKey = app.id + '|' + ownId;
            var lStorageVal = JSON.parse(window.localStorage.getItem(lStorageKey) || '{"openedAt":"100000000000"}');

            //console.log(ownId, 'layout', layout);

            if (!Object(tours).hasOwnProperty(ownId)) tours[ownId] = -1;  // initialize in the global tours array this tour. -1 is: not started
            const switchPosition = $('#' + ownId + '_hovermode').is(':checked') ? 'checked' : '';

            $element.html(`
                <div id="${ownId}_parent" style="height:100%;display:flex;justify-content:center;align-items:center;${layout.pExtensionFontColor.length > 0 ? ('color:' + layout.pExtensionFontColor) : ''}">`
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
                        <span class="lui-icon  lui-icon--large  lui-icon--play" style="${!layout.pShowIcon ? 'display:none;' : ''}" id="${ownId}_play"></span> 
                        ${layout.pTextStart}
                    </div>
                </div>
            `);

            $(`[tid="${ownId}"] .qv-inner-object`).css('background-color', layout.pExtensionBgColor);

            licensedObjs[ownId] = license.chkLicenseJson(layout.pLicenseJSON, 'db_ext_guided_tour');
            const licensed = licensedObjs[ownId];

            function handleClick(hoverMode, registerOrNot) {

                var otherTourActive = false;
                for (const tour in tours) {
                    //console.log('tour',tour,tour==ownId,'active',tours[tour] > -1);
                    if (tour != ownId && tours[tour] > -1) {
                        otherTourActive = true;
                    }
                }
                if (!otherTourActive) {
                    console.log(ownId, 'Tour Start');
                    const askEnigma = [
                        "Sum({1} $Field='" + layout.pTourField + "')",
                        "Sum({1} DISTINCT [" + layout.pTourField + "]='" + layout.pTourSelectVal + "')",
                        "[" + layout.pTourField + "]",
                        "TimeStamp(Now(),'YYYYMMDDhhmm')"].join(" & CHR(10) & ");
                    console.log('askEnigma', askEnigma)
                    enigma.evaluate(askEnigma).then(function (res) {
                        const fieldExists = res.split('\n')[0];
                        const valExists = res.split('\n')[1];
                        const currVal = res.split('\n')[2];
                        lStorageVal.openedAt = res.split('\n')[3];

                        window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageVal));
                        console.log(ownId, 'Stored locally ', lStorageKey, JSON.stringify(lStorageVal));
                        //console.log(ownId, 'fieldExists', fieldExists, 'valExists', valExists, 'currVal', currVal);

                        function getDataAndPlay() {
                            self.backendApi.getData([{ qTop: 0, qLeft: 0, qWidth: 5, qHeight: 2000 }])
                                .then(function (hcube) {
                                    tooltipsCache[ownId] = hcube[0].qMatrix;
                                    //console.log(ownId, 'tooltipsCache', tooltipsCache);
                                    if (hoverMode) {
                                        //alert('Coming soon...');
                                        console.log(hcube[0].qMatrix);
                                        tooltipsCache[ownId].forEach((tooltipDef, tooltipNo) => {
                                            const divId = tooltipDef[0].qText;
                                            if (registerOrNot == 'register') {
                                                $('[tid="' + divId + '"]').on('mouseover', function (elem) {
                                                    console.log(tooltipNo, tooltipDef[1].qText);
                                                    if ($('#' + ownId + '_tooltip').length == 0) {  // tooltip is not yet open
                                                        functions.play(ownId, layout, tooltipNo, false, enigma, tours, tooltipsCache, licensed);
                                                    }
                                                });
                                                $('[tid="' + divId + '"]').on('mouseout', function (elem) {
                                                    console.log(tooltipNo, 'Closing');
                                                    $('#' + ownId + '_tooltip').remove();
                                                });
                                            } else {
                                                $('[tid="' + divId + '"]').unbind('mouseover');
                                                $('[tid="' + divId + '"]').unbind('mouseout');
                                                enigma.getField(layout.pTourField).then((fld) => {
                                                    fld.clear()
                                                });
                                            }
                                        })

                                    } else {
                                        // start tour at 1st tooltip
                                        functions.play(ownId, layout, 0, false, enigma, tours, tooltipsCache, licensed);
                                    }
                                })
                                .catch((err) => functions.leonardoMsg(ownId, 'backendApi.getData Error', JSON.stringify(err), null, 'OK'));
                        }

                        if (layout.pTourField.length > 0 && fieldExists == '0') {
                            functions.leonardoMsg(ownId, 'Bad config', `No such field "${layout.pTourField}" in data model.`, null, 'OK');
                        }
                        else if (layout.pTourField.length > 0 && valExists == '0') {
                            functions.leonardoMsg(ownId, 'Bad config', `Field "${layout.pTourField}" has no such value "${layout.pTourSelectVal}".`, null, 'OK');
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
                                        .catch((err) => functions.leonardoMsg(ownId, 'Field Select Error', JSON.stringify(err), null, 'OK'));
                                })
                                .catch((err) => functions.leonardoMsg(ownId, 'enigma.getField Error', JSON.stringify(err), null, 'OK'));
                        }
                    })
                        .catch(function (err) {
                            functions.leonardoMsg(ownId, 'enigma.evaluate Error', JSON.stringify(err), null, 'OK');
                            console.log('askEnigma', askEnigma);
                        });
                } else {
                    console.log(ownId, 'Button clicked but other tour is active.');
                }

            }

            $(`#${ownId}_start`).click(function () {
                console.log(ownId, 'clicked on tour start');
                if (layout.pLaunchMode != 'hover') {
					handleClick(false)
				}
            });


            $(`#${ownId}_hovermode`).click(() => {
                if (!licensed) {
                    $(`#${ownId}_hovermode`).prop('checked', false);
                    functions.leonardoMsg(ownId, 'Error', 'You have no license for mouse-over mode, sorry. Get in touch with csw@databridge.ch', null, 'OK')
                } else {
                    const hoverModeSwitch = $(`#${ownId}_hovermode`).is(':checked');
                    if (hoverModeSwitch == true) {
                        handleClick(true, 'register');
                    } else {
                        // unregister events
                        handleClick(true, 'unregister');
                        console.log('Unregistering events');
                    }
                }
            })

				
            if (layout.pLaunchMode == 'auto-always'
                && mode == 'analysis'
                && !visitedTours[ownId]) {
                tours[ownId] = 0; // mark the tour as open on 1st tooltip (index 0)
                $(`#${ownId}_start`).trigger('click');  // trigger a click.
                visitedTours[ownId] = true;
            }


            if (layout.pLaunchMode == 'auto-once'
                && mode == 'analysis') {
                enigma.evaluate("Timestamp(Now(),'YYYYMMDDhhmm')") // get server time
                    .then(function (currentTime) {
                        if (currentTime >= layout.pRelaunchAfter
                            && layout.pRelaunchAfter > lStorageVal.openedAt) {
                            if (licensed) {
                                tours[ownId] = 0; // mark the tour as open on 1st tooltip (index 0)
                                $(`#${ownId}_start`).trigger('click');  // trigger a click.
                                visitedTours[ownId] = true;
                            } else {
                                console.log(ownId, 'Auto-launch of tour supressed because no license');
                            }
                        }
                    })
            }


            return qlik.Promise.resolve();

        }
    };
});
