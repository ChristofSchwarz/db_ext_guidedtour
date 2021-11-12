// props.js: Extension properties (accordeon menu) externalized

define(["jquery", "./functions"], function ($, functions) {

    var pickList = [];
    var pickList2 = [];
    const ext = 'db_ext_guided_tour';
    const bgColorPickers = '#079B4A';

    function subSection(labelText, itemsArray) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
		var hash = 0;
        for (var j = 0; j < labelText.length; j++) {
            hash = ((hash << 5) - hash) + labelText.charCodeAt(j)
            hash |= 0;
        }
        ret.items[hash] = {
            label: labelText,
            type: 'items',
            items: itemsArray
        };
        return ret;
    }

    function getDimNames(props) {
        // returns the labels/field names of the Dimension in this qHyperCubeDef as an array of {value: #, label: ""}
        var opt = [{ value: "", label: "- not assigned -" }];
        var i = -1;
        for (const dim of props.qHyperCubeDef.qDimensions) {
            i++;
            if (i >= 2) opt.push({  // skip the first 2 dimensions
                value: i,
                label: dim.qDef.qFieldLabels[0].length == 0 ? dim.qDef.qFieldDefs[0] : dim.qDef.qFieldLabels[0]
            });
        }
        return opt;
    }

    function checkSortOrder(arg) {
        const sortByLoadOrder = arg.qHyperCubeDef.qDimensions[0] ?
            (arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByExpression == 0
                && arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByNumeric == 0
                && arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByAscii == 0) : false;
        const interSort = arg.qHyperCubeDef.qInterColumnSortOrder.length > 0 ? (arg.qHyperCubeDef.qInterColumnSortOrder[0] == 0) : false;
        //console.log('qSortCriterias', arg.qHyperCubeDef.qInterColumnSortOrder[0], sortByLoadOrder, interSort);
        return !sortByLoadOrder || !interSort;
    }

    async function resolveProperty(prop, enigma) {
        // takes care of a property being either a constant or a expression, which needs to be evaluated
        var ret;
        if (prop.qStringExpression) {
            ret = await enigma.evaluate(prop.qStringExpression.qExpr);
            //console.log('was expression: ', ret);
        } else {
            //console.log(prop,' was constant');
            ret = prop;
        }
        return ret;
    }

    return {
        presentation: function (app) {
            const enigma = app.model.enigmaModel;
            return [
                {
                    label: "WARNING: The sort order is not the load order! Tour items may show in different sequence.",
                    component: "text",
                    show: function (arg) { return checkSortOrder(arg); }
                }, {
                    label: "See how to fix it",
                    component: "link",
                    url: '../extensions/db_ext_guided_tour/correctsortorder.html',
                    show: function (arg) { return checkSortOrder(arg); }
                }, {
                    label: "The first two dimensions are mandatory: object-id and text",
                    component: "text"
                }, {
                    label: "Select objects for tour",
                    component: "button",
                    action: function (arg) {
                        const ownId = arg.qInfo.qId;
                        $('.guided-tour-picker').remove(); // remove previous divs
                        $('.cell').not(`[tid="${arg.qInfo.qId}"]`).find('.qv-inner-object')  // add divs overlaying every Sense object
                            .prepend(`<div style="position:absolute; z-index:100; background-color:${bgColorPickers}; 
                            cursor:pointer; color:white; border-radius: 10px; padding: 0 10px;" 
                            class="guided-tour-picker">PICK</div>`);

                        $('.guided-tour-picker').click((me) => {
                            var parent = me.currentTarget;
                            // go up the parents tree until the level where the class contains 'cell'
                            var i = 0;
                            while (!parent.classList.contains('cell') && i < 6) {
                                i++;
                                parent = parent.parentElement;
                            }

                            if (parent.classList.contains('cell') && parent.attributes.hasOwnProperty('tid')) {
                                var objId = parent.attributes["tid"].value;
                                console.log(ownId, 'Picked object Id ' + objId);
                                pickList.push(objId);
                                pickList2.push(objId);
                                enigma.getObject(objId).then((obj) => {
                                    //get more info about the object (type and title)
                                    pickList[pickList.length - 1] += `,"${obj.layout.visualization} ${obj.layout.title}"`;
                                });
                                // highlight for some milliseconds the currently clicked picker and the DONE picker
                                $(`[tid="${objId}"] .guided-tour-picker`).css('background-color', 'orange');
                                $(`[tid="${ownId}"] .guided-tour-picker`).css('background-color', 'orange');
                                $(`[tid="${ownId}"] .guided-tour-picks`).html('(' + pickList.length + ')');
                                setTimeout(() => {
                                    $(`[tid="${objId}"] .guided-tour-picker`).css('background-color', bgColorPickers);
                                    setTimeout(() => {
                                        $(`[tid="${ownId}"] .guided-tour-picker`).css('background-color', bgColorPickers);
                                    }, 400);
                                }, 400);

                            } else {
                                console.error('Object Id not found while going ' + i + ' parent levels up', parent);
                            }

                        })

                        $(`[tid="${ownId}"] .qv-inner-object`)  // the current extension object gets different onclick event
                            .prepend(`<div style="position:absolute; z-index:100; background-color:${bgColorPickers}; 
                            cursor:pointer; color:white; border-radius: 10px; padding: 0 10px;" 
                            class="guided-tour-picker">DONE <span class="guided-tour-picks"></span></div>`);

                        $(`[tid="${ownId}"] .guided-tour-picker`).click((me) => {
                            console.log('Those are the objectIds you picked:');
                            console.log(pickList.join('\n'));
                            functions.leonardoMsg(ownId, 'Picked Objects',
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
                                <textarea class="lui-textarea" style="height:140px;font-size:11pt;margin:10px 0;" id="${ownId}_textarea">${pickList.join('\n')}</textarea>
                                <button class="lui-button" onclick="document.getElementById('${ownId}_textarea').select();document.execCommand('copy');">Copy to clipboard</button>`,
                                'Close', null, false);
                            $(`#${ownId}_opt1`).click(() => { $(`#${ownId}_textarea`).html(pickList.join('\n')); });
                            $(`#${ownId}_opt2`).click(() => { $(`#${ownId}_textarea`).html(pickList2.join('\n')); });
                            $(`#msgok_${ownId}`).click(() => { $(`#msgparent_${ownId}`).remove(); pickList = []; pickList2 = []; });
                            $('.guided-tour-picker').remove();
                        })

                    }
                }, subSection('Select A Specific Tour', [
                    {
                        label: "If you have multiple tours in your data model, you may want to filter the right one by making below selection",
                        component: "text"
                    }, {
                        label: 'Select in field',
                        type: 'string',
                        ref: 'pTourField',
                        expression: 'optional'
                    }, {
                        label: 'Select this value',
                        type: 'string',
                        ref: 'pTourSelectVal',
                        expression: 'optional'
                    }
                ]), subSection('Button Text & Color', [
                    {
                        label: 'Text for Tour Start',
                        type: 'string',
                        ref: 'pTextStart',
                        defaultValue: 'Start Tour',
                        expression: 'optional'
                    }, {
                        type: "boolean",
                        defaultValue: true,
                        ref: "pShowIcon",
                        label: "Show play icon"
                    }, {
                        label: 'Background-color of button',
                        type: 'string',
                        ref: 'pExtensionBgColor',
                        expression: 'optional'
                    }, {
                        label: 'Font-color of button',
                        type: 'string',
                        ref: 'pExtensionFontColor',
                        expression: 'optional'
                    }, {
                        label: 'More styling',
                        type: 'string',
                        ref: 'pMoreStyles',
						defaultValue: 'font-size:large;',
                        expression: 'optional'
                    }
                ]), subSection('Tooltips Texts & Colors', [
                    {
                        label: 'Text for Next button',
                        type: 'string',
                        ref: 'pTextNext',
                        defaultValue: 'Next',
                        expression: 'optional'
                    }, {
                        label: 'Text for Done button',
                        type: 'string',
                        ref: 'pTextDone',
                        defaultValue: 'Done',
                        expression: 'optional'
                    }, {
                        label: 'Default tooltip backgr-color',
                        type: 'string',
                        ref: 'pBgColor',
                        defaultValue: 'rgba(0,0,0,0.9)',
                        expression: 'optional'
                    }, {
                        label: 'Dynamic backgr-color from dim',
                        component: "dropdown",
                        ref: "pBgColorFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }, {
                        label: 'Default tooltip font color',
                        type: 'string',
                        ref: 'pFontColor',
                        defaultValue: '#e0e0e0',
                        expression: 'optional'
                    }, {
                        label: 'Dynamic font-color from dim',
                        component: "dropdown",
                        ref: "pFontColorFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }
                ]), subSection('Auto-launch Tour \u2605', [
                    {
                    label: "These settings apply only if you have a licensed version.",
                    component: "text"
                }, {
                        label: 'Automatically show this tour',
                        type: 'string',
						component: 'dropdown',
                        ref: 'pAutoLaunch',
						defaultValue: 'no',
						options: [{
							value: "no",
							label: "No auto-launch"
						}, {
							value: "once",
							label: "Launch once per user"
						},{
							value: "always",
							label: "Always auto-launch"
						}]
                    }, {
                        label: 'Relaunch once after',
                        type: 'string',
                        ref: 'pRelaunchAfter',
                        defaultValue: '189912312359',
                        expression: 'optional',
						show: function(arg) { return arg.pAutoLaunch == 'once'}
                    }, {
						label: "Format: YYYYMMDDhhmm",
						component: "text",
						show: function(arg) { return arg.pAutoLaunch == 'once'}
					}, {
						label: function(arg) { return 'Saved settings: ' + window.localStorage.getItem(app.id + '|' + arg.qInfo.qId) },
						component: "text",
						show: function(arg) { return arg.pAutoLaunch == 'once'}
					}, {
						label: "Clear saved settings",
						component: "button",
						action: function (arg) {
							window.localStorage.removeItem(app.id + '|' + arg.qInfo.qId);
							functions.leonardoMsg(arg.qInfo.qId,'Success','Removed local item',null,'OK');
						}
					}
                ]), subSection('Advanced Settings', [
                    {
                        label: 'Font Size',
                        type: 'string',
                        ref: 'pFontSize',
                        defaultValue: '11pt',
                        expression: 'optional'
                    }, {
                        label: 'Default tooltip width (px)',
                        type: 'number',
                        ref: 'pDefaultWidth',
                        defaultValue: 250,
                        expression: 'optional'
                    }, {
                        label: 'Dynamic tooltip width from dim',
                        component: "dropdown",
                        ref: "pWidthFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }, {
                        label: 'Opacity of inactive objects',
                        type: 'number',
                        ref: 'pOpacity',
                        component: "slider",
                        defaultValue: 0.1,
                        min: 0.1,
                        max: 1,
                        step: 0.1
                    }, {
                        label: 'Offset when top (px)',
                        type: 'number',
                        ref: 'pOffsetTop',
                        defaultValue: 10,
                        expression: 'optional'
                    }, {
                        label: 'Offset when left (px)',
                        type: 'number',
                        ref: 'pOffsetLeft',
                        defaultValue: 15,
                        expression: 'optional'
                    } /*, {
                        label: 'Selector for parent container',
                        type: 'string',
                        ref: 'pParentContainer',
                        defaultValue: '#qv-page-container',
                        expression: 'optional'
                    }*/
                ]), {
                    label: "\u2605 Premium feature only with license",
                    component: "text"
                }
            ]
        },

        licensing: function (app) {
            const enigma = app.model.enigmaModel;
            return [
                {
                    type: "string",
                    ref: "pLicenseJSON",
                    label: "License String",
                    component: "textarea",
                    rows: 5,
                    maxlength: 4000,
                    expression: 'optional'
                }, {
                    label: "Contact data/\\bridge",
                    component: "link",
                    url: 'https://www.databridge.ch/contact-us'
                }, {
                    label: "Check License",
                    component: "button",
                    action: function (arg) {

                        const ownId = arg.qInfo.qId;
                        resolveProperty(arg.pLicenseJSON, enigma).then((lstr) => {
                            console.log('License String', lstr);
                            var report = '';
                            try {
                                const j = JSON.parse(lstr);
                                console.log('License JSON', j);
                                for (const d in j) {
                                    const applicable = d == functions.patternize(location.hostname, d);
                                    const m = functions.hm(d, ext);
                                    r = functions.isLicensed(d, j[d][0], j[d][1]);
                                    report += (`<tr><td>${d}</td><td>${applicable}</td><td>${j[d][0]}</td><td>${j[d][1]}</td><td>${r}</td></tr>`);
                                }
								if (report=='')
									functions.leonardoMsg(ownId, 'Error', "This isn't a valid license.", null, 'OK')
								else
                                	functions.leonardoMsg(ownId, 'Result',
                                    '<table><tr style="text-align:left;"><th>Domain</th><th>Applies?</th><th>License No.</th><th>CheckSum</th><th>Valid?</th></tr>'
                                    + report + '</table>', null, 'OK');
                            }
                            catch (err) {
                                functions.leonardoMsg(ownId, 'Error', "This isn't a valid license.", null, 'OK');
                            };
                        });
                    }
                }
            ]
        },

        about: function (qext) {
            return [
                {
                    label: function (arg) { return 'Installed extension version ' + qext.version },
                    component: "link",
                    url: '../extensions/db_ext_guided_tour/db_ext_guided_tour.qext'
                }, {
                    label: "This extension is available either licensed or free of charge by data/\\bridge, Qlik OEM partner and specialist for Mashup integrations.",
                    component: "text"
                }, {
                    label: "Without license you may use it as is. Licensed customers get support.",
                    component: "text"
                }, {
                    label: "",
                    component: "text"
                }, {
                    label: "About Us",
                    component: "link",
                    url: 'https://www.databridge.ch'
                }, {
                    label: "More",
                    component: "button",
                    action: function (arg) {
                        console.log(arg);
                        window.open('https://insight.databridge.ch/items/guided-tour-extension', '_blank');
                    }
                }
            ]
        }
    }
});
