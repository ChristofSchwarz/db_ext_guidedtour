define(["qlik", "jquery", "./props", "./functions"], function (qlik, $, props, functions) {

    'use strict';

    var tours = {};  // global variable to remember all active tours 
    // it contains later one entry per extension and the number it shows is the active tooltip (0..n) or -1 if no tooltip is open
    var tooltipsCache = {};

    const styles = {
        startTour: 'cursor:pointer; text-align:center; font-size:large;',
    }

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
                    items: props.presentation()
                }, {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about($, qext)
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
                functions.play(ownId, layout, tooltipsCache[ownId], tours[ownId], false, enigma, tours, tooltipsCache)
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
            $(`[tid="${ownId}"] .qv-inner-object`).css('background-color', layout.pExtensionBgColor);

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
                                    functions.play(ownId, layout, tooltipsCache[ownId], 0, false, enigma, tours, tooltipsCache)
                                })
                                .catch((err) => alert('getData error ' + JSON.stringify(err)));;
                        }

                        if (layout.pTourField.length > 0 && fieldExists == '0') {
                            alert(`No such field "${layout.pTourField}" in data model.`);
                        }
                        else if (layout.pTourField.length > 0 && valExists == '0') {
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
