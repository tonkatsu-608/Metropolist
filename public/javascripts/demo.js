var text = new PointText({
    position: view.center + [0, 200],
    fillColor: 'black',
    justification: 'center',
    fontSize: 20
});

var originals = new Group({ insert: true }); // Don't insert in DOM.

var square = new Path.Rectangle({
    position: view.center,
    size: 300,
    parent: originals,
    fillColor: 'black',
});

// Make a ring using subtraction of two circles:
var inner = new Path.Circle({
    center: view.center,
    radius: 100,
    parent: originals,
    fillColor: 'black'
});

var outer = new Path.Circle({
    center: view.center,
    radius: 140,
    parent: originals,
    fillColor: 'black'
});

var ring = outer.subtract(inner);

var operations = ['intersect'];
var colors = ['black'];
var curIndex = -1;
var operation, result, activeItem;

// Change the mode every 3 seconds:
setInterval(setMode, 3000);

// Set the initial mode:
setMode();

function setMode() {
    curIndex++;
    if (curIndex == operations.length * 2)
        curIndex = 0;
    operation = operations[curIndex % operations.length];
}

function onMouseDown(event) {
    var hitResult = originals.hitTest(event.point);
    activeItem = hitResult && hitResult.item;
}

function onMouseDrag(event) {
    if (activeItem)
        activeItem.position = event.point;
}

function onMouseUp() {
    activeItem = null;
    square.position = view.center;
}

function onFrame(event) {
    if (activeItem != ring) {
        // Move the ring around:
        var offset = new Point(140, 80) * [Math.sin(event.count / 60), Math.sin(event.count / 40)];
        ring.position = view.center + offset;
    }

    // Remove the result of the last path operation:
    if (result)
        result.remove();

    // Perform the path operation on the ring:
    console.log("operation: " + operation)
    if (curIndex < operations.length) {
        result = square[operation](ring);
        text.content = 'square.' + operation + '(ring)';
    } else {
        result = ring[operation](square);
        text.content = 'ring.' + operation + '(square)';
    }
    result.selected = true;
    result.fillColor = colors[curIndex % colors.length];
    result.moveBelow(text);

    // If the result is a group, color each of its children differently:
    if (result instanceof Group) {
        for (var i = 0; i < result.children.length; i++) {
            result.children[i].fillColor = colors[i];
        }
    }
};

function onResize() {
    text.position = view.center + [0, 200];
    square.position = view.center;
}


/*=====================================================================================================
                                       First Version
======================================================================================================*/
// var originals = new Group({ insert: false }); // Don't insert in DOM.
// var activeItem, result;
//
// // //Rectangles in grid
// var path = new CompoundPath({
//     children: [],
//     strokeColor: 'black',
//     selected: false,
//     center: view.center,
// });
//
// var drawGridRects = function(num_rectangles_wide, num_rectangles_tall, boundingRect) {
//     var width_per_rectangle = boundingRect.width / num_rectangles_wide;
//     var height_per_rectangle = boundingRect.height / num_rectangles_tall;
//     for (var i = 0; i < num_rectangles_wide; i++) {
//         for (var j = 0; j < num_rectangles_tall; j++) {
//             var aRect = new paper.Path.Rectangle(boundingRect.left + i * width_per_rectangle, boundingRect.top + j * height_per_rectangle, width_per_rectangle, height_per_rectangle);
//             // console.log(aRect)
//             aRect.rotate(45);
//             aRect.scale(0.7)
//             path.addChild(aRect);
//         }
//     }
// }
// drawGridRects(6, 6, paper.view.bounds)
//
// // RegularPolygon
// var polygon = new Path.RegularPolygon({
//     center: view.center,
//     sides: 7,
//     radius: 300,
//     fillColor: 'white',
//     parent: originals
// });
//
// function onFrame(event) {
//     if (activeItem != polygon) {
//         // var offset = new Point(view.center) * [Math.sin(event.count / 120), Math.sin(event.count / 80)];
//         // polygon.position = view.center + offset;
//     }
//     if (result){
//         result.remove();
//     }
//     result = path['intersect'](polygon);
//     result.selected = true;
//     result.strokeWidth = 10;
//     result.strokeColor = 'red'
//     result.fillColor = 'powderblue';
// }
// function onMouseDown(event) {
//     var hitResult = originals.hitTest(event.point);
//     activeItem = hitResult && hitResult.item;
// }
//
// function onMouseDrag(event) {
//     if (activeItem){
//         activeItem.position = event.point;
//     }
// }
//
// function onMouseUp() {
//     activeItem = null;
//     path.position = view.center;
// }

////////////////////////////////////////////////

// function onFrame(event) {
//     result.rotate(3, view.center);
// }
//
// function onMouseDown(event) {
//     var hitResult = cell.polygon.parent.hitTest(event.point);
//     cell.activeItem = hitResult && hitResult.item;
// }
//
// function onMouseDrag(event) {
//     if (cell.activeItem){
//         cell.activeItem.position = event.point;
//     }
// }
//
// function onMouseUp() {
//     cell.activeItem = null;
//     cell.rec.position = view.center;
// }

// for (var i = 0; i < this.column; i++) {
//     for (var j = 0; j < this.row; j++) {
//         var aRect = new paper.Path.Rectangle(paper.view.bounds.left + i * width_per_rectangle, paper.view.bounds.top + j * height_per_rectangle, width_per_rectangle, height_per_rectangle);
//         aRect.rotate(this.rotate, view.center);
//         path.addChild(aRect);
//     }
// }

// var from = new Point(width/2, 0);
// var to = new Point(width/2, height);
// var path1 = new Path.Line(from, to);
// var from = new Point(0, height/2);
// var to = new Point(width, height/2);
// var path2 = new Path.Line(from, to);
// path.addChild(path1);
// path.addChild(path2);


// for (var i = 0; i <= this.column; i++) {
//     var xPos = paper.view.bounds.left + i * width_per_rectangle;
//     var topPoint = new paper.Point(xPos, paper.view.bounds.top);
//     var bottomPoint = new paper.Point(xPos, paper.view.bounds.bottom);
//     var aLine = new paper.Path.Line(topPoint, bottomPoint);
//     path.addChild(aLine);
// }
// for (var i = 0; i <= this.row; i++) {
//     var yPos = paper.view.bounds.top + i * height_per_rectangle;
//     var leftPoint = new paper.Point(paper.view.bounds.left, yPos);
//     var rightPoint = new paper.Point(paper.view.bounds.right, yPos);
//     var aLine = new paper.Path.Line(leftPoint, rightPoint);
//     path.addChild(aLine);
// }