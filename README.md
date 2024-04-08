# Chart Proof-of-Concept

## Summary

Click and drag or use the arrow keys to navigate around the chart. Zoom using the mouse wheel or `[shift] + [arrow up/down]`.

Clicking a location pin will display information about the place. Hold `[shift]` and click to place your own pins on the chart. User-created pins can be renamed in the dialog.

Thanks to [Tolkien Gateway](https://tolkiengateway.net/wiki/Main_Page) for help with locating and describing places.

If you're looking through the source code, start with the app entry point [here](https://github.com/patrick-mcgreal-dev/chart/blob/master/src/app.ts).

## App performance

Several technical decisions were made to maximise app performance:

- All draw operations take place in a web worker to free up the main UI thread.
- The `window.requestAnimationFrame` function is used to draw at the highest possible framerate.
- The map image is cropped before drawing to avoid drawing off-screen content.

## Controls

Keyboard control routing is handled by the [control router](https://github.com/patrick-mcgreal-dev/chart/blob/master/src/control-router.ts) object.

This object makes it simple to switch between control states, such as context menus.

## Next steps

- Zooming with a trackpad doesn't work nicely—ideally we want to be able to pinch and zoom.
- Although the chart will load and operate at any size, it would be nice to support dynamic window resizing.
- Pin label overlapping: pin labels should switch sides when overlapping occurs.