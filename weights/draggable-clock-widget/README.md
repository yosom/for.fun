# Draggable clock widget

A Pen created on CodePen.

Original URL: [https://codepen.io/lalacode/pen/BarJLyq](https://codepen.io/lalacode/pen/BarJLyq).

This is recreation of a widget from Timedash app (IOS, IPadOS)

I also added ability to drag elements to "customize" this widget using library "react-beautiful-dnd".
I wanted to try and learn some simple React-based library for drag and drop for some time now, and this is what came out of it.

The hardest challenge for drag is discoverability & that it is kinda invisible, so I did everything in my power to make it stand out: added lil shake animation, and written call to action for a "user".

As I later learned, you can edit widgets in the app, but I don't know how, maybe you can also do it by dragging, but app costs a dollar, and I didn't bother to check, my bad. You can tell me if that's the case in comments, I would appreciate that!

Another my enhancement is weather indicator: in the original app weather condition is communicated by color of the temp circle (yellow, blue, three different shades of gray and red) but i thought it will be more suiting to change background shape based on the weather, but for now I implemented only sunny and cloudy variants, as they are the most common.
There is no weather forecast, and no use of external API, as it wasn't the goal of the project. 
Still, I added some random element so weather would be either good or not so good on initial render, but if you want to change that state, just click it, and it would flip with some small animation. This can be considered a "Easter egg" of sorts & I like to click on all elements on other people's pens, so I needed to add this small feature, at least for myself.

Designed by branding & design studio TIN
https://tin.studio/timedash/
https://dutchdigital.design/cases/timedash-widget

This exact widget is Digi Date Weather: a digital clock combined with date and local weather.

Btw, I'm not associated with developers or designers of this app, just found screenshot with this combination of time day of the week and temperature on Pinterest.