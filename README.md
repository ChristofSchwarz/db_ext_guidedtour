# GuidedTour Extension for Qlik Sense Client

## About
This extension allows to make a sequence of colored tooltips (text bubbles) which highlight certain objects on a worksheet. 
 ![screenshot](https://raw.githubusercontent.com/ChristofSchwarz/pics/master/guidedtour.gif "Animation")


## How to set up
To render, it requires a data table loaded by data manager or load script with at least 2 colums, supported are up to 5 columns. Add those in the exact 
below sequence to the extension object under "Dimensions" (you can stop after the 2nd if not needed):

1. Qlik objectId
2. Text for tooltip (can contain html tags, good for formatting or hyperlinks)
3. Width in pixels (250 is the default; the height will be dynamically determined)
4. Background-color (in css format: #0a0b1c, rgb(45,45,45), rgba(0,0,0,0.25) ...)
5. Text-color (in css format)

The extenion has general settings for the parameters 3, 4 and 5, in case you would like all tooltips to show in same width and same colors. In that case, you need 
only 2 dimensions. But if you want to style tooltips individually for different objects, you need those colums 3, 4, and 5

Hint: You can omit a column but not change the position, for example if you don't care about the width but want to set a background-color, provide 4 columns: 
objectId, tooltipText, =Null(), tooltipBgColor

Note: It has no expression (measure). However, the tour will, at start, select a configurable value in a configurable field (the "Tour-Id"). That way, you can 
add multiple tours to the datamodel and the correct one will start. 
Support of Multi-language

Like any other object, the dimension could be dynamically be calculated, that allows for example the text of the tooltip in different languages, based on a 
variable. E.g. the 2nd dimension is `=tooltip.$(vLanguage)` and the variable `vLanguage` has values like "en" or "fr", it picks a different field.

