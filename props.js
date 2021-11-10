// props.js: Extension properties (accordeon menu) externalized

define(["jquery", "./functions"], function ($, functions) {

    var pickList = [];
    var pickList2 = [];

    const bgColorPickers = '#079B4A';

    function subSection(labelText, itemsArray) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
		const labelHash = btoa(labelText).split('=')[0];
		ret.items[labelHash] = {
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
                }, subSection('Select A Specific Tour', {
                    e:{
                        label: "If you have multiple tours in your data model, you may want to filter the right one by making below selection",
                        component: "text"
                    }, f:{
                        label: 'Select in field',
                        type: 'string',
                        ref: 'pTourField',
                        expression: 'optional'
                    }, g:{
                        label: 'Select this value',
                        type: 'string',
                        ref: 'pTourSelectVal',
                        expression: 'optional'
                    }
                }), subSection('Button Text & Color', {
                    a:{
                        label: 'Text for Tour Start',
                        type: 'string',
                        ref: 'pTextStart',
                        defaultValue: 'Start Tour',
                        expression: 'optional'
                    }, b:{
                        type: "boolean",
                        defaultValue: true,
                        ref: "pShowIcon",
                        label: "Show play icon"
                    }, c:{
                        label: 'Background-color of button',
                        type: 'string',
                        ref: 'pExtensionBgColor',
                        expression: 'optional'
                    }, d:{
                        label: 'Font-color of button',
                        type: 'string',
                        ref: 'pExtensionFontColor',
                        expression: 'optional'
                    }
                }), subSection('Tooltips Texts & Colors', {
                    h:{
                        label: 'Text for Next button',
                        type: 'string',
                        ref: 'pTextNext',
                        defaultValue: 'Next',
                        expression: 'optional'
                    }, i:{
                        label: 'Text for Done button',
                        type: 'string',
                        ref: 'pTextDone',
                        defaultValue: 'Done',
                        expression: 'optional'
                    }, j:{
                        label: 'Default tooltip backgr-color',
                        type: 'string',
                        ref: 'pBgColor',
                        defaultValue: 'rgba(0,0,0,0.9)',
                        expression: 'optional'
                    }, k:{
                        label: 'Dynamic backgr-color from dim',
                        component: "dropdown",
                        ref: "pBgColorFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }, l:{
                        label: 'Default tooltip font color',
                        type: 'string',
                        ref: 'pFontColor',
                        defaultValue: '#e0e0e0',
                        expression: 'optional'
                    }, m:{
                        label: 'Dynamic font-color from dim',
                        component: "dropdown",
                        ref: "pFontColorFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }
                }), subSection('Advanced Settings', {
                    n:{
                        label: 'Font Size',
                        type: 'string',
                        ref: 'pFontSize',
                        defaultValue: '11pt',
                        expression: 'optional'
                    }, o:{
                        label: 'Default tooltip width (px)',
                        type: 'number',
                        ref: 'pDefaultWidth',
                        defaultValue: 250,
                        expression: 'optional'
                    }, p:{
                        label: 'Dynamic tooltip width from dim',
                        component: "dropdown",
                        ref: "pWidthFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    }, q:{
                        label: 'Opacity of inactive objects',
                        type: 'number',
                        ref: 'pOpacity',
                        component: "slider",
						defaultValue: 0.1,
                        min: 0.1,
						max: 1,
						step: 0.1
                    }, r:{
                        label: 'Offset when top (px)',
                        type: 'number',
                        ref: 'pOffsetTop',
                        defaultValue: 10,
                        expression: 'optional'
                    }, s:{
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
                })
            ]
        },

        licensing: function (app) {
            return [
                {
                    type: "array",
                    ref: "licenses",
                    label: "List Items",
                    itemTitleRef: "label",
                    allowAdd: true,
                    allowRemove: true,
                    addTranslation: "Add License",
                    items: [
                        {
                            type: "string",
                            ref: "label",
                            label: "Domain"
                        }, {
                            type: "number",
                            ref: "pLicNo",
                            label: "License"
                        }, {
                            type: "number",
                            ref: "pCheckSum",
                            label: "Check Sum"
                        }, {
                            label: function (arg) {
                                const isLicensed = functions.isLicensed(arg.pLicNo, arg.pCheckSum, arg.label.length, arg.label);
                                return isLicensed ? (String.fromCharCode(0x2713) + ' licensed') : (String.fromCharCode(0x274C) + 'not licensed')
                            },
                            component: 'text'
                        }
                    ]
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
                    label: "This extension is free of charge by data/\\bridge, Qlik OEM partner and specialist for Mashup integrations.",
                    component: "text"
                }, {
                    label: "Use as is. No support without a maintenance subscription.",
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
