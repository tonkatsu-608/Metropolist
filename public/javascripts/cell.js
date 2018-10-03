/*=====================================================================================================
                                         Constructor Functions
======================================================================================================*/
function Cell(column, row, rotate, sides, radius) {
    this.column  = column || 8;
    this.row = row || 8;
    this.rotate = rotate || 0;
    this.sides = sides || 4;
    this.radius = radius || 400;
}

Cell.prototype.makeGrid = function(){
    var path = new CompoundPath({
        children: [],
        strokeColor: 'black',
        center: view.center,
    });
    var width = paper.view.bounds.width;
    var height = paper.view.bounds.height;
    var width_per_rectangle = width / this.column;
    var height_per_rectangle = height / this.row;

    for (var i = 0; i < this.column; i++) {
        for (var j = 0; j < this.row; j++) {
            var xOffset = width_per_rectangle * .02;
            var yOffset = height_per_rectangle * .02;
            var aRect = new paper.Path.Rectangle(
                paper.view.bounds.left + i * width_per_rectangle + xOffset,
                paper.view.bounds.top + j * height_per_rectangle + yOffset,
                width_per_rectangle - 2 * xOffset,
                height_per_rectangle - 2 * yOffset
            );
        aRect.rotate(this.rotate, view.center);
        path.addChild(aRect);
        }
    }
    return path;
};

Cell.prototype.makePolygon = function(){
    var polygon = new Path.RegularPolygon({
        center: view.center,
        sides: this.sides,
        radius: this.radius,
        // fillColor : 'tomato'
    });
    polygon.rotate(this.rotate, view.center)
    return polygon;
};

Cell.prototype.intersect = function(grid, poly) {
    this.grid = grid || this.makeGrid();
    this.poly = poly || this.makePolygon();
    var result = this.poly.divide(this.grid);

    result.selected = true;
    result.strokeWidth = 5;
    result.strokeColor = 'red'
    result.fillColor = 'powderblue';
    return result;
};

/*=====================================================================================================
                                          Main Functions
======================================================================================================*/
var cell = new Cell();
var result = cell.intersect();
$('#render').click(function () {
    paper.project.activeLayer.removeChildren();
    var cell = new Cell($('#column').val(), $('#row').val(), $('#rotate').val(), $('#sides').val(), $('#radius').val());
    cell.intersect();
});


function onKeyDown(event) {
    if (event.key == 'space') {
        $('#render').click()
    }
}