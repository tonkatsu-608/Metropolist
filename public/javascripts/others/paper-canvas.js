$(document).ready(function () {
    $('.sidenav').sidenav();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    $('#select').on('change', function () {
        if (this.checked) {
            isSelect = true;
            $('#switch').attr('disabled', 'disabled');
        } else {
            isSelect = false;
            $('#switch').removeAttr('disabled', 'disabled');
        }
    });
    $('#switch').on('change', function () {
        if (this.checked) {
            isChecked = true;
        } else {
            isChecked = false;
        }
    });
    $('nav').click( function(e) {
        $('#panel').addClass('hide');
    });
});

/*=====================================================================================================
                                         Prototype Functions
======================================================================================================*/
function Cell(path) {
    this.column  = 6 * Math.random() + 2;
    this.row = 6 * Math.random() + 2;
    this.rotate = 45 * Math.random();
    this.bounds = path.bounds || paper.view.bounds;
    this.center = path.site || view.center;
    // if(this.bounds.width > this.bounds.height){
    //     this.rotate = Math.random()* 15;
    // }else{
    //     this.rotate = Math.random()*(90-15)+15;
    // }
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

Cell.prototype.intersect = function(poly) {
    this.grid = this.makeGrid();
    this.poly = poly;
    var result = this.poly.divide(this.grid);
    result.strokeColor = new Color('black');
    result.fillColor = new Color('#98948B');
    return result;
};

var voronoi =  new Voronoi();
var sites = generateBeeHivePoints(view.size, true);
var bbox, selectedItem, result;
var oldSize = view.size;
var spotColor = new Color('#66635D');
var selected = false;
var isChecked = false;
var isSelect = false;
var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};
var manager = {
    stack : [sites],
    paths: [],
    cells: [],
    data: []
};

$('#undo').click(function () {
    sites = (manager.stack && manager.stack.length > 0) ? manager.stack.pop() : sites;
    renderDiagram();
});
// $('#redo').click(function () {
//     renderDiagram();
// });

$.Shortcut.on({
    "meta+Z": function () {
        sites = (manager.stack && manager.stack.length > 0) ? manager.stack.pop() : sites;
        renderDiagram();
    },
    // "meta+shift+Z": function () {
    //     renderDiagram();
    // }
});

/*=====================================================================================================
                                       Main Functions
======================================================================================================*/
onResize();
showNearestPoint();

var circle = new Path.Circle({
    center: view.center,
    radius: 10,
    fillColor: 'red'
});

function onFrame(e) {
    for(var i=0; i<project.activeLayer.children.length; i++ ){
        var n = project.activeLayer.children[i];
        if(n.center){
            //CompoundPath
            // n.fillColor = 'tomato';
        }else{
            //Path
            // n.fillColor = 'tomato';
        }
    }
}
/*=====================================================================================================
                                       Functions
======================================================================================================*/
function onMouseDown(event) {
    if(isSelect){
        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult){
            return;
        }else{
            switch (hitResult.item.value){
                case "red":
                    $('#selectDistrict').append('<option value="0" disabled>Choose district</option><option value="red" data-icon="images/red.jpeg" class="black-text" selected>red</option><option value="blue" data-icon="images/blue.jpeg" class="black-text">blue</option>').trigger('create');
                    if(hitResult.item.fillColor != 'red'){
                        hitResult.item.fillColor = 'red';
                    }else{
                        $('#selectDistrict').find('option[value="red"]').attr("selected", true);
                        $('#selectDistrict').find('option[value="blue"]').removeAttr("selected", true);
                    }
                    break;
                case "blue":
                    $('#selectDistrict').append('<option value="0" disabled>Choose district</option><option value="red" data-icon="images/red.jpeg" class="black-text">red</option><option value="blue" data-icon="images/blue.jpeg" class="black-text" selected>blue</option>').trigger('create');
                    if(hitResult.item.fillColor != 'blue'){
                        hitResult.item.fillColor = 'blue';
                    }else{
                        $('#selectDistrict').find('option[value="blue"]').attr("selected", true);
                        $('#selectDistrict').find('option[value="red"]').removeAttr("selected", true);
                    }
                    break;
                default:
                    $('#selectDistrict').append('<option value="0" disabled selected>Choose district</option><option value="red" data-icon="images/red.jpeg" class="black-text">red</option><option value="blue" data-icon="images/blue.jpeg" class="black-text">blue</option>').trigger('create');
            }
            $('#selectDistrict').change(function () {
                hitResult.item.value = this.value;
            });

            var x = hitResult.item.site.x;
            var y = hitResult.item.site.y;
            $('#panel').removeClass('hide').offset({ top : y, left : x });
        }
    }else{
        if(isChecked){
            var hitResult = project.hitTest(event.point, hitOptions);
            if (!hitResult){
                return;
            }else{
                var obj = project.hitTest(event.point, hitOptions);
                sites = sites.filter( function(s) {
                    return s != obj.item.site;
                } );
                manager.stack.push( sites );
            }
        }else{
            manager.stack.push( sites );
            sites = sites.slice();
            sites.push(event.point);
        }
        renderDiagram();
    }
}

function onMouseMove(event) {
    if(isSelect){
        project.activeLayer.selected = false;
        if (event.item){
            event.item.selected = true;
        }
    }else{
        var nearestPoint = result.getNearestPoint(event.point);
        circle.position = nearestPoint;
    }
}

function renderDiagram() {
    project.activeLayer.children = [];
    var diagram = voronoi.compute(sites, bbox);
    if (diagram) {
        for (var i = 0, l = sites.length; i < l; i++) {
            var cell = diagram.cells[sites[i].voronoiId];
            if (cell) {
                var halfedges = cell.halfedges,
                    length = halfedges.length;
                if (length > 2) {
                    var points = [];
                    for (var j = 0; j < length; j++) {
                        v = halfedges[j].getEndpoint();
                        points.push(new Point(v));
                    }
                    createPath(points, sites[i]);
                }
            }
        }
    }
}

function removeSmallBits(path) {
    var averageLength = path.length / path.segments.length;
    var min = path.length / 20;
    for(var i = path.segments.length - 1; i >= 0; i--) {
        var segment = path.segments[i];
        var cur = segment.point;
        var nextSegment = segment.next;
        var next = nextSegment.point + nextSegment.handleIn;
        if (cur.getDistance(next) < min) {
            segment.remove();
        }
    }
}

function generateBeeHivePoints( size, loose ) {
    var points = [];
    var n = 60;
    while(n --) {
        var x = Math.random() * size.width;
        var y = Math.random() * size.height;
        points.push(new Point( x, y ));
    }
    return points;
}

function createPath(points, center) {
    var path = new Path();
    if (!selected) {
        path.fillColor = spotColor;
    } else {
        path.fullySelected = selected;
    }
    path.closed = true;

    for (var i = 0, l = points.length; i < l; i++) {
        var point = points[i];
        var next = points[(i + 1) == points.length ? 0 : i + 1];
        path.add({ point: point });
    }
    path.scale(0.97);
    removeSmallBits(path);
    path.site = center;
    manager.paths.push(path)
    var cell = new Cell(path);
    result = cell.intersect(path);
    manager.cells.push(result);
    return path;
}

function showNearestPoint() {
    var circle = new Path.Circle({
        center: view.center,
        radius: 10,
        fillColor: 'red',
    });
    var paths = new CompoundPath({
    });

    for(var i=0; i<manager.paths.length; i++){
        var n = manager.paths[i];
        paths.addChild(manager.paths[i])
    }
}

function onResize() {
    var margin = 20;
    bbox = {
        xl: margin,
        xr: view.bounds.width - margin,
        yt: margin,
        yb: view.bounds.height - margin
    };
    for (var i = 0, l = sites.length; i < l; i++) {
        sites[i] = sites[i] * view.size / oldSize;
    }
    oldSize = view.size;
    renderDiagram();
}

function onKeyDown(event) {
    if (event.key == 'space') {
        if(!selected){
            $('#switch').attr('disabled', 'disabled');
        }else{
            $('#switch').removeAttr('disabled', 'disabled');
        }
        selected = !selected;
        renderDiagram();
    }
}