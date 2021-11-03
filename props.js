define([], function () {

    function subSection(labelText, itemsArray) {
        const ret = {
            component: 'expandable-items',
            items: [
                {
                    label: labelText,
                    type: 'items',
                    items: itemsArray
                }
            ]
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
        presentation: function () {
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
                ]), subSection('Button Colors & Texts', [
                    {
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
                        type: "boolean",
                        defaultValue: true,
                        ref: "pShowIcon",
                        label: "Show play icon"
                    }, {
                        label: 'Text for Tour Start',
                        type: 'string',
                        ref: 'pTextStart',
                        defaultValue: 'Start Tour',
                        expression: 'optional'
                    }
                ]), subSection('Tooltip Colors & Text', [
                    {
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
                    }, {
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
                    }
                ]), subSection('Advanced Settings', [
                    {
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
                ])
            ]
        },

        about: function ($, qext) {
            return [
                {
                    label: function(arg) { return 'Installed extension version ' + qext.version },
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
