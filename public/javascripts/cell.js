/*=====================================================================================================
                                           Functions
======================================================================================================*/
function Cell(column, row, rotate, scale, sides, radius) {
    this.column  = column || 6;
    this.row = row || 6;
    this.rotate = rotate || 15;
    this.scale = scale || 0.7;
    this.sides = sides || 4;
    this.radius = radius || 400;
    this.activeItem = null;
    this.result = null;
    this.rec = this.drawRec();
    this.polygon = this.drawPolygon();
}

Cell.prototype.drawRec = function(){
    var path = new CompoundPath({
        children: [],
        strokeColor: 'black',
        selected: false,
        center: view.center,
    });
    var width_per_rectangle = paper.view.bounds.width / this.column;
    var height_per_rectangle = paper.view.bounds.height / this.row;
    for (var i = 0; i < this.column; i++) {
        for (var j = 0; j < this.row; j++) {
            var aRect = new paper.Path.Rectangle(paper.view.bounds.left + i * width_per_rectangle, paper.view.bounds.top + j * height_per_rectangle, width_per_rectangle, height_per_rectangle);
            aRect.rotate(this.rotate);
            aRect.scale(this.scale);
            path.addChild(aRect);
        }
    }
    return path;
};

Cell.prototype.drawPolygon = function(){
    var polygon = new Path.RegularPolygon({
        center: view.center,
        sides: this.sides,
        radius: this.radius,
    });
    return polygon;
};

Cell.prototype.intersect = function () {
    this.result = this.rec['intersect'](this.polygon);
    this.result.selected = true;
    this.result.strokeWidth = 10;
    this.result.strokeColor = 'red'
    this.result.fillColor = 'powderblue';
    return this.result;
};

var cell = new Cell();
var result = cell.intersect();

function onFrame(event) {
    // result.rotate(3, view.center);
}

$('#render').click(function () {
    repaint();
    var cell = new Cell($('#column').val(), $('#row').val(), $('#rotate').val(), ($('#scale').val())/10, $('#sides').val(), $('#radius').val());
    cell.intersect();
});

function onMouseDown(event) {
    var hitResult = cell.polygon.parent.hitTest(event.point);
    cell.activeItem = hitResult && hitResult.item;
}

function onMouseDrag(event) {
    if (cell.activeItem){
        cell.activeItem.position = event.point;
    }
}

function onMouseUp() {
    cell.activeItem = null;
    cell.rec.position = view.center;
}

function repaint() {
    paper.project.activeLayer.removeChildren();
    paper.view.draw();
}

// $('#column').on('change', function () {
//     console.log("column: " + column);
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });
// $('#row').on('change', function () {
//     console.log("row: " + row)
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });
// $('#rotate').on('change', function () {
//     console.log("rotate: " + rotate)
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });
// $('#scale').on('change', function () {
//     console.log("scale: " + scale)
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });
//
// $('#sides').on('change', function () {
//     console.log("sides: " + sides)
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });
// $('#radius').on('change', function () {
//     console.log("radius: " + radius)
//     var cell = new Cell(column, row, rotate, scale, sides, radius);
// });