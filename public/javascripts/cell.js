/*=====================================================================================================
                                         Constructor Functions
======================================================================================================*/
function Cell(column, row, rotate, scale, sides, radius) {
    this.column  = column || 6;
    this.row = row || 6;
    this.rotate = rotate || 45;
    this.scale = scale/10 || 0.7;
    this.sides = sides || 4;
    this.radius = radius || 400;
}

Cell.prototype.drawRec = function(){
    var path = new CompoundPath({
        children: [],
        strokeColor: 'black',
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

Cell.prototype.intersect = function(rectangle, poly) {
    this.rectangle = rectangle || this.drawRec();
    this.poly = poly || this.drawPolygon();
    var result = this.rectangle['intersect'](this.poly);
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
    var cell = new Cell($('#column').val(), $('#row').val(), $('#rotate').val(), ($('#scale').val()),$('#sides').val(), $('#radius').val());
    cell.intersect();
});