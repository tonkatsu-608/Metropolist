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
var voronoi =  new Voronoi();
var sites = generateBeeHivePoints(view.size, true);
var bbox, selectedItem;
var oldSize = view.size;
var spotColor = new Color('grey');
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
    stack : [ sites ],
    paths: []

};
onResize();

$('#undo').click(function () {
    sites = (manager.stack && manager.stack.length > 0) ? manager.stack.pop() : sites;
    renderDiagram();
    console.log("sites: " + sites.length);
});
// $('#redo').click(function () {
//     renderDiagram();
// });

$.Shortcut.on({
    "meta+Z": function () {
        sites = (manager.stack && manager.stack.length > 0) ? manager.stack.pop() : sites;
        renderDiagram();
        console.log("sites: " + sites.length);
    },
    // "meta+shift+Z": function () {
    //     renderDiagram();
    // }
});
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
                        console.log("fillColor red")
                    }else{
                        $('#selectDistrict').find('option[value="red"]').attr("selected", true);
                        console.log("selected red");
                        $('#selectDistrict').find('option[value="blue"]').removeAttr("selected", true);
                        console.log("removeAttr blue");
                    }
                    break;
                case "blue":
                    $('#selectDistrict').append('<option value="0" disabled>Choose district</option><option value="red" data-icon="images/red.jpeg" class="black-text">red</option><option value="blue" data-icon="images/blue.jpeg" class="black-text" selected>blue</option>').trigger('create');
                    if(hitResult.item.fillColor != 'blue'){
                        hitResult.item.fillColor = 'blue';
                        console.log("fillColor blue")
                    }else{
                        $('#selectDistrict').find('option[value="blue"]').attr("selected", true);
                        console.log("selected blue");
                        $('#selectDistrict').find('option[value="red"]').removeAttr("selected", true);
                        console.log("removeAttr red");
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
            var obj = project.hitTest(event.point, hitOptions);
            sites = sites.filter( function(s) {
                return s != obj.item.site;
            } );
            manager.stack.push( sites );
            renderDiagram();
        }else{
            manager.stack.push( sites );
            sites = sites.slice();
            sites.push(event.point);
            renderDiagram();
        }
        console.log("sites: " + sites.length);
    }
}

function onMouseMove(event) {
    if(isSelect){
        project.activeLayer.selected = false;
        if (event.item){
            event.item.selected = true;
        }
    }else{
        return;
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
    var min = path.length / 50;
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
    while( n-- ) {
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
        var vector = (next - point) / 200;
        path.add({
            point: point + vector,
            handleIn: -vector,
            handleOut: vector
        });
    }
    path.scale(0.97);
    removeSmallBits(path);
    path.site = center;
    return path;
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