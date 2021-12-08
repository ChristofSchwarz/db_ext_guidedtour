// props.js: Extension properties (accordeon menu) externalized

define(["jquery", "./functions", "./license", "./picker"], function ($, functions, license, picker) {

    const ext = 'db_ext_guided_tour';

    function subSection(labelText, itemsArray, argKey, argVal) {
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
			show: function(arg){ return (argKey && argVal) ? (arg[argKey] == argVal) : true },
            items: itemsArray
        };
        return ret;
    }

    function getDimNames(props, indexOrLabel) {
        // returns the labels/field names of the Dimension in this qHyperCubeDef as an array of {value: #, label: ""}
        var opt = [{ value: "", label: "- not assigned -" }];
        var i = -1;
        for (const dim of props.qHyperCubeDef.qDimensions) {
            i++;
			var label = dim.qDef.qFieldLabels[0].length == 0 ? dim.qDef.qFieldDefs[0] : dim.qDef.qFieldLabels[0];
			if (label.substr(0,1) == '=') label = label.substr(1);
            if (i >= 2) opt.push({  // skip the first 2 dimensions
                value: indexOrLabel == 'label' ? label : i,
                label: label
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
                    label: "The first two dimensions are mandatory: object-id and text",
                    component: "text"
                }, {
                    label: 'Mode to launch tour',
                    type: 'string',
                    component: 'dropdown',
                    ref: 'pLaunchMode',
                    defaultValue: 'click',
                    options: [{
                        value: "click",
                        label: "Click to run tour"
                    }, {
                        value: "hover",
                        label: "Move mouse over objects \u2605"
                    }, {
                        value: "auto-always",
                        label: "Auto-launch tour (always)"
                    }, {
                        value: "auto-once",
                        label: "Auto-launch tour once \u2605"
                    }, {
                        value: "auto-once-p-obj",
                        label: "Auto-launch tooltips once \u2605"
                    }]
                }, {
                    label: "Note: Mouse-over mode only supports Sense object IDs, no other CSS-selectors.",
                    component: "text",
					show: function(arg) { return arg.pLaunchMode == 'hover' }
                }, {
					label: "\u26a0 You have to specify a timestamp field in the auto-launch settings",
					component: "text",
					show: function(arg) { return arg.pLaunchMode == 'auto-once-p-obj' && arg.pTimestampFromDim.length == 0 }
				}, {
                    label: "\u2605 Premium feature only with license",
                    component: "text"
                }, {
                    label: "Select objects for tour",
                    component: "button",
                    action: function (arg) {
						picker.pick(arg, enigma);
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
                    }, /*{
                        label: "Mouse-Over Mode \u2605",
                        type: "boolean",
                        component: "switch",
                        ref: "pHoverMode",
                        defaultValue: false,
                        trueOption: {
                            value: true,
                            translation: "On - Hover tooltips"
                        },
                        falseOption: {
                            value: false,
                            translation: "Off - Sequential Tour"
                        }
                    },*/ {
                        type: "boolean",
                        defaultValue: true,
                        ref: "pShowIcon",
                        label: "Show play icon",
                        show: function (arg) { return arg.pLaunchMode != 'hover' }
                    }, {
                        label: 'Font-color of button',
                        type: 'string',
                        ref: 'pExtensionFontColor',
                        expression: 'optional'
                    }, {
                        label: 'Background-color of button',
                        type: 'string',
                        ref: 'pExtensionBgColor',
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
                        label: 'Default tooltip font color',
                        type: 'string',
                        ref: 'pFontColor',
                        defaultValue: '#e0e0e0',
                        expression: 'optional'
                    }, {
                        label: 'Default tooltip backgr-color',
                        type: 'string',
                        ref: 'pBgColor',
                        defaultValue: 'rgba(0,0,0,0.9)',
                        expression: 'optional'
                    }, {
                        label: 'Default tooltip width (px)',
                        type: 'number',
                        ref: 'pDefaultWidth',
                        defaultValue: 250,
                        expression: 'optional'
                    }, {
                        label: 'More attributes in dimension',
                        component: "dropdown",
                        ref: "pAttrFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }, {
						type: "number",
						component: "slider",
						label: function(arg) { return 'ArrowHead Size ' + arg.pArrowHead + 'px' },
						ref: "pArrowHead",
						min: 8,
						max: 20,
						step: 4,
						defaultValue: 16
					}
                ]), subSection('Auto-launch Settings (Tour)\u2605', [
                    {
                        label: "These settings apply only if you have a licensed version.",
                        component: "text"
                    }, {
                        label: 'Relaunch once after',
                        type: 'string',
                        ref: 'pRelaunchAfter',
                        defaultValue: '18991231235959',
                        expression: 'optional'
                    }, {
                        label: "Format: YYYYMMDDhhmmss",
                        component: "text"
                    }, {
                        label: function (arg) { return 'Saved settings: ' + window.localStorage.getItem(app.id + '|' + arg.qInfo.qId) },
                        component: "text"
                    }, {
                        label: "Clear saved settings",
                        component: "button",
                        action: function (arg) {
                            window.localStorage.removeItem(app.id + '|' + arg.qInfo.qId);
							functions.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
                        }
                    }
                ], 'pLaunchMode', 'auto-once'  // only show settings section if pLaunchMode == 'auto-once'
				),  subSection('Auto-launch Settings (Obj)\u2605', [
                    {
                        label: "These settings apply only if you have a licensed version.",
                        component: "text"
                    }, {
                        label: 'Timestamp field for every object',
                        component: "dropdown",
                        ref: "pTimestampFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg, 'label'); }
                    }, {
                        label: "Format: YYYYMMDDhhmmss",
                        component: "text"
                    }, {
                        label: function (arg) { return 'Saved settings: ' + window.localStorage.getItem(app.id + '|' + arg.qInfo.qId) },
                        component: "text"
                    }, {
                        label: "Clear saved settings",
                        component: "button",
                        action: function (arg) {
                            window.localStorage.removeItem(app.id + '|' + arg.qInfo.qId);
							functions.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
                        }
                    }
                ], 'pLaunchMode', 'auto-once-p-obj'  // only show settings section if pLaunchMode == 'auto-once-p-obj'
				), subSection('Advanced Settings', [
                    {
                        label: function(arg) { return 'Opacity of inactive objects: ' + arg.pOpacity  },
                        type: 'number',
                        ref: 'pOpacity',
                        component: "slider",
                        defaultValue: 0.1,
                        min: 0.1,
                        max: 1,
                        step: 0.1,
						show: function(arg) { return arg.pLaunchMode != 'hover' }
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
                    }, {
						type: "boolean",
						defaultValue: false,
						ref: "pConsoleLog",
						label: "console.log debugging info"
					}
                ])
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
                    label: 'Test response for this hostname',
                    type: 'string',
                    ref: 'pTestHostname'
                }, {
                    label: "Check License",
                    component: "button",
                    action: function (arg) {

                        const ownId = arg.qInfo.qId;
                        resolveProperty(arg.pLicenseJSON, enigma).then(function (lstr) { 
                            const hostname = arg.pTestHostname ? (arg.pTestHostname.length > 0 ? arg.pTestHostname : location.hostname) : location.hostname;
                            const report = license.chkLicenseJson(lstr, 'db_ext_guided_tour', hostname, true);
                            functions.leonardoMsg(ownId, 'Result', report, null, 'OK');
							$('#msgparent_' + ownId + ' th').css('text-align','left');
                            // make window wider
                            if(report.length > 200) $('#msgparent_' + ownId + ' .lui-dialog').css('width', '700px');
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
