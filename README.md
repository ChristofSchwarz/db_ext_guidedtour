# GuidedTour Extension for Qlik Sense Client

## About
This extension allows to make a sequence of colored tooltips (text bubbles) which highlight certain objects on a worksheet. 

 ![screenshot](https://github.com/ChristofSchwarz/pics/raw/master/GuidedTour.gif "Animation")


## How to set up
To render, it requires a data table loaded by data manager or load script with at least 2 colums. Supported are up to 5 columns. Add those in the exact 
below sequence to the extension object under "Dimensions" (you can skip 3, 4, and 5):

1. Qlik objectId
2. Text for tooltip (can contain html tags, good for formatting or hyperlinks)
3. Width in pixels (250 is the default; the height will be dynamically determined)
4. Background-color (in css format e.g.: `#0a0b1c`, `rgb(45,45,45)`, `rgba(0,0,0,0.25)`, `darkred` ...)
5. Text-color (in css format)

The extenion has general settings for the parameters 3, 4 and 5, in case you would like all tooltips to show in **same width** and **same colors**. In that case, you need 
only 2 dimensions. But if you want to style tooltips individually for different objects, you need those colums 3, 4, and 5

The extension allows to configure the texts for "Start Tour", "Next" and "Done" links.

**Hint**: You can omit a column but not change the position, for example if you don't care about the width but want to set a background-color, provide 4 columns: 
objectId, tooltipText, `=Null()`, tooltipBgColor  ... the formula =Null() creates the column in the right order, but doesn't provide a value

**Note**: This extension has no expression (measure) to add. However, if you wonder how you can use mulitple Guided Tour objects within your application for 
mulitpile tours, load the data together with an identifier for each tour. The tour extension will, when the user clicks Start, select a configurable value (say "Tour1") in 
a configurable field (say "Tour_Id"). That way, correct tour will start. 

## Support of Multi-language

Like any other object, the dimension could be dynamically be calculated. That allows for example the text of the tooltip in different languages, based on a formula with a 
variable. E.g. the 2nd dimension is `=tooltip.$(vLanguage)` and the variable `vLanguage` has values like "en" or "fr", it picks a different fields `tooltip.en` or `tooltip.fr`


