## Special Modes of Guided Tour Extension

 [back](../README.md)

There are 5 modes (some are premium features and need a license) 
 * Click to run tour (standard)
 * Move mouse over objects (premium) 
 * Auto-launch tour always (standard)
 * Auto-launch tour once (premium)
 * Auto-launch tooltips once (premium)

### Move mouse over objects
requires a license

The **Mouse-over mode** adds a switch icon into the tour button, when it is turned on, the respective tooltip shows when the user moves the mouse over the object
that the tooltip belongs to. The mouseover events can be disabled (unregistered) by turning the same switch off again. 

### Auto-launch tour always

This mode will open a tour (in Analysis mode) once per user and session. It does not record that the user has opened the tour, so the next time the user refreshes 
the page or comes back another time, the tour will auto-start again.

Note: you can also start the tour by hand with a click on the tour object.

### Auto-launch tour once (premium)
requires a license

This mode will open a tour (in Analysis mode) once per user (actually, per browser, because it remembers that the tour started in the local
browser storage). The extension compares the last tour visit of the user with a cutoff date set by the application. If that date at a later point of time
is increased (newer) and is after the last visit, the tour will restart again. That way you can present "What's new" easily.

You have to use a cutoff-date in form of a variable 
...

Note: you can also start the entire tour with a click on the tour object and the manual start of the tour is not recorded to the local storage

### Auto-launch tooltips once (premium)
requires a license

Similar like Auto-launch tour once this mode shows a tooltip only once, but every tooltip's open-time is recorded separately in the local browser's storage. 
That way, you can add new tooltips to the tour to only point out new objects in the app. If you want a certain tooltip to show again, increase the timestamp
of that tooltip in the data model.

You have to use an additional column in the tour data table with individual timestamps to make this mode work:
 * add a timestamp column with a 14-digit timestamp (text in format YYYYMMDDhhmmss e.g. 20211207150000) to the data model
 * add this new column as a dimension in the "Dimensions" section of the extension settings
 * Go to the properties section "Auto-launch Settings (Obj)" and in the dropdown "Timestamp field for every object" choose the dimension you just added. 

Note: you can also start the entire tour with a click on the tour object and the manual start of the tour is not recorded to the local storage
