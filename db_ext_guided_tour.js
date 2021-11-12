define(["qlik", "jquery", "./props", "./functions"], function (qlik, $, props, functions) {

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
            if (qlik.navigation.getMode() != 'edit') $('.guided-tour-picker').remove();
            const lStorageKey = app.id + '|' + ownId;
            var lStorageVal = JSON.parse(window.localStorage.getItem(lStorageKey) || '{"openedAt":"100000000000"}');

            //console.log(ownId, 'layout', layout);

            if (!Object(tours).hasOwnProperty(ownId)) tours[ownId] = -1;

            $element.html(`
                <div id="${ownId}_parent" style="height:100%;display:flex;justify-content:center;align-items:center;${layout.pExtensionFontColor.length > 0 ? ('color:' + layout.pExtensionFontColor) : ''}">
                    <div id="${ownId}_start" style="cursor:pointer; text-align:center;${layout.pMoreStyles}">
                        <span class="lui-icon  lui-icon--large  lui-icon--play" style="cursor:pointer;${!layout.pShowIcon ? 'display:none;' : ''}" id="${ownId}_play"></span> 
                        ${layout.pTextStart}
                    </div>
                </div>
            `);

            $(`[tid="${ownId}"] .qv-inner-object`).css('background-color', layout.pExtensionBgColor);

            licensedObjs[ownId] = functions.chkLicenseJSON(layout.pLicenseJSON);
            const licensed = licensedObjs[ownId];

            $(`#${ownId}_start`).click(function () {

                var otherTourActive = false;
                for (const tour in tours) {
                    //console.log('tour',tour,tour==ownId,'active',tours[tour] > -1);
                    if (tour != ownId && tours[tour] > -1) {
                        otherTourActive = true;
                    }
                }
                if (!otherTourActive) {
                    console.log(ownId, 'Clicked Tour Start');
                    enigma.evaluate(`Sum({1} $Field='${layout.pTourField}') & Chr(10) & 
					Sum({1} DISTINCT [${layout.pTourField}]='${layout.pTourSelectVal}') 
					& Chr(10) & [${layout.pTourField}] 
					& Chr(10) & TimeStamp(Now(),'YYYYMMDDhhmm')`)
                        .then((res) => {
                            const fieldExists = res.split('\n')[0];
                            const valExists = res.split('\n')[1];
                            const currVal = res.split('\n')[2];
                            lStorageVal.openedAt = res.split('\n')[3];;
                            window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageVal));
                            console.log(ownId, 'Stored locally ', lStorageKey, JSON.stringify(lStorageVal));
                            //console.log(ownId, 'fieldExists', fieldExists, 'valExists', valExists, 'currVal', currVal);

                            function getDataAndPlay() {
                                self.backendApi.getData([{ qTop: 0, qLeft: 0, qWidth: 5, qHeight: 2000 }])
                                    .then(function (hcube) {
                                        tooltipsCache[ownId] = hcube[0].qMatrix;
                                        //console.log(ownId, 'tooltipsCache', tooltipsCache);
                                        functions.play(ownId, layout, 0, false, enigma, tours, tooltipsCache, licensed)
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
                        .catch((err) => functions.leonardoMsg(ownId, 'enigma.evaluate Error', JSON.stringify(err), null, 'OK'));
                } else {
                    console.log(ownId, 'Button clicked but other tour is active.');
                }

            });

            //console.log('ACTIVE TOURS:', tours);

            if (layout.pAutoLaunch == 'always' && mode == 'analysis' && !visitedTours[ownId]) {
                if (licensed) {
                    tours[ownId] = 0; // mark the tour as open on 1st tooltip (index 0)
                    $(`#${ownId}_start`).trigger('click');  // trigger a click.
                    visitedTours[ownId] = true;
                } else {
                    console.log(ownId, 'Auto-launch of tour supressed because no license');
                }
            }


            var currentTime = await enigma.evaluate("Timestamp(Now(),'YYYYMMDDhhmm')"); // get server time
            //console.log('localStorage is ', lStorageVal, 'currentTime', currentTime, 'relaunchAfter', layout.pRelaunchAfter);

            if (layout.pAutoLaunch == 'once' && mode == 'analysis'
                && currentTime >= layout.pRelaunchAfter && layout.pRelaunchAfter > lStorageVal.openedAt) {
                if (licensed) {
                    tours[ownId] = 0; // mark the tour as open on 1st tooltip (index 0)
                    $(`#${ownId}_start`).trigger('click');  // trigger a click.
                    visitedTours[ownId] = true;
                } else {
                    console.log(ownId, 'Auto-launch of tour supressed because no license');
                }
            }


            return qlik.Promise.resolve();

        }
    };
});
