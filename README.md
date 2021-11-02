# GuidedTour Extension for Qlik Sense Client

## About
This extension allows to make a sequence of colored tooltips (text bubbles) which highlight certain objects on a worksheet. 

 ![screenshot](https://github.com/ChristofSchwarz/pics/raw/master/GuidedTour.gif "Animation")


## How to set up
To render, it requires a data table loaded by data manager or load script with at least 2 colums: 

1. Qlik objectId
2. Text for tooltip (can contain html tags, good for formatting or hyperlinks)

Supported are up to 5 columns. So you can add columns with background-color, text-color, and/or tooltip width. You will find dropdowns in the properties of 
the extension to choose which dimension (3rd, 4th, 5th) will deliver which attribute. If the data table doesn't have a value (length zero or null) then the 
default setting for bg-color, text-color, and width kicks in.

Optionally, add those columns to the data model if you want any combination of the below params to change per tooltip. If you want all the same, just use the 
default settings in the Extension properties.

 * Background-color (in css format e.g.: `#0a0b1c`, `rgb(45,45,45)`, `rgba(0,0,0,0.25)`, `darkred` ...)
 * Text-color (in css format)
 * Width in pixels (250 is the default; the height will be dynamically determined)

The extension also allows to configure the texts for "Start Tour", "Next" and "Done" links.

## How to find out the object id

In the Qlik Sense client add `/options/developer` to your url and go to Edit Mode on a sheet. When you right-click on any object, you can see then "Developer" in the
context menu, and when you open, you will see the object id.

In addition, you can use also any css selector (#id, .class, tag-selectors) to point to any element. You may want to use the browser's development tools (F12) for that 
and need to have some experience with css selectors.

## Select a specific tour if you have multiple

You can use the Guided-Tour-Extension multiple times in your app. You would still use only one data-table in the datamodel, but you should then introduce a "tour 
identifier" field to group those tooltips that belong together.

This extension has no expression (measure) to add, so you don't need to handle with set-analysis or so. The tour extension will, when the user clicks Start, 
**select** a configurable value (say "Tour1") in a configurable field (say "Tour_Id"). That way, correct tour will start. 

Configure the field-name and the select-value in the Extension properties.

## Support of Multi-language

Like any other object, the dimension could be dynamically be calculated. That allows for example the text of the tooltip in different languages, based on a formula with a 
variable. E.g. the 2nd dimension is `=tooltip.$(vLanguage)` and the variable `vLanguage` has values like "en" or "fr", it picks a different fields `tooltip.en` or `tooltip.fr`

## Known limitations

 * In small-device mode of the Sense Client, the tooltips do not render nicely.
