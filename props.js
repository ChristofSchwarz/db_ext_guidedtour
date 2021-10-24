define([], function () {
    return {

        presentation: function () {
            return [ 
				{
                    label: "Add up to 5 dimension fields to this extension. The sequence of dims is: (1) ObjectID, (2) HTML-Text, (3) TooltipWidth in px, (4) BackgroundColor, (5) TextColor",
                    component: "text"
                }, {
                    label: "The first 2 dimensions are mandatory, 3 to 5 can be defined below instead.",
                    component: "text"
                }, {
                    label: 'Text for Tour Start',
                    type: 'string',
                    ref: 'pTextStart',
                    defaultValue: 'Start Tour',
                    expression: 'optional'
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
                }, {
                    label: 'Tour id field',
                    type: 'string',
                    ref: 'pTourField',
                    defaultValue: 'tourid',
                    expression: 'optional'
                }, {
                    label: 'Tour select value',
                    type: 'string',
                    ref: 'pTourSelectVal',
                    defaultValue: '1',
                    expression: 'optional'
                }, {
                    //type: 'items',
                    component: 'expandable-items',
                    items: [
                        {
                            label: 'Advanced Settings',
                            type: 'items',
                            items: [
                                {
                                    label: 'Default background-color',
                                    type: 'string',
                                    ref: 'pBgColor',
                                    defaultValue: 'rgba(0,0,0,0.9)',
                                    expression: 'optional'
                                }, {
                                    label: 'Default font color',
                                    type: 'string',
                                    ref: 'pFontColor',
                                    defaultValue: '#e0e0e0',
                                    expression: 'optional'
                                }, {
                                    label: 'Default tooltip width (px)',
                                    type: 'number',
                                    ref: 'pDefaultWidth',
                                    defaultValue: 250,
                                    expression: 'optional'
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
                                }
                            ]
                        }
                    ]
                }

            ]
        },

        about: function ($) {
            return [
                {
                    label: 'Extension version',
                    component: "link",
                    url: '../extensions/db_ext_sheetLinks/db_ext_guided_tour.qext'
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
                }
                /*docu: {
                    label: "Open Documentation",
                    component: "button",
                    action: function (arg) {
                        window.open('https://github.com/ChristofSchwarz/qs_ext_reloadreplace', '_blank');
                    }
                }*/
            ]
        }
    }
});