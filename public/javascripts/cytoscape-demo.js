function Cell() {
    this.sides = Math.floor(5 * Math.random() + 3);
    this.column  = 5 * Math.random() + 2;
    this.row = 5 * Math.random() + 2;
    this.rotate = 0 * Math.random();
    this.bounds = this.makePolygon().bounds;
    this.center = this.makePolygon().center;
    this.grid = this.makeGrid();
    this.poly = this.makePolygon();
}

Cell.prototype.makePolygon = function () {
    var polygon = new Path.RegularPolygon({
        center: view.center,
        sides: this.sides,
        radius: 300,
    });
    return polygon;
}

Cell.prototype.makeGrid = function(){
    var grid = new CompoundPath({
        center: this.center,
    });
    var width = this.bounds.width;
    var height = this.bounds.height;
    var width_per_rectangle = width / this.column;
    var height_per_rectangle = height / this.row;

    for (var i = 0; i < this.column; i++) {
        for (var j = 0; j < this.row; j++) {
            var xOffset = width_per_rectangle * 0.01;
            var yOffset = height_per_rectangle * 0.01;
            var aRect = new paper.Path.Rectangle(
                this.bounds.left + i * width_per_rectangle + xOffset,
                this.bounds.top + j * height_per_rectangle + yOffset,
                width_per_rectangle - 2 * xOffset,
                height_per_rectangle - 2 * yOffset
            );
            aRect.rotate(this.rotate, this.center);
            grid.addChild(aRect);
        }
    }
    return grid;
};

Cell.prototype.intersect = function() {
    var result = this.poly.divide(this.grid);
    result.selected = false;
    // result.removeChildren(Math.floor(5 * Math.random()), Math.floor(15 * Math.random()))
    result.strokeColor = new Color('black');
    result.strokeWidth = 5;
    result.fillColor = new Color('#98948B');
    // for(var i = 0; i < result.children.length; i++){
    //     var n = result.children[i]
    //     console.log(n.area)
    // }
    return result;
};
var cell = new Cell();
var grid = cell.grid;
var result = cell.intersect();
var data = [];

/*=====================================================================================================
                                              Cytoscape
======================================================================================================*/






