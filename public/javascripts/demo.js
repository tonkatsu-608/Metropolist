// var column  = Math.floor(5 * Math.random() + 3);
// var row = Math.floor(5 * Math.random() + 3);
var column  = 7;
var row  = 7;

function Cell() {
    this.sides = Math.floor(10 * Math.random() + 3);
    this.column  = column;
    this.row = row;
    this.rotate = 0 * Math.random();
    this.bounds = this.makePolygon().bounds;
    this.center = view.center;
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
        center: view.center,
        strokeColor: 'white'
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
    result.selected = true;
    result.strokeWidth = 2;
    result.strokeColor = new Color('black');
    result.fillColor = new Color('#98948B');
    return result;
};

var cell = new Cell();
var grid = cell.grid;
var result = cell.intersect();
var paperNodes = [];
var paperlinks = [];
console.log(result.children)

for(var i = 0; i < result.children.length; i++){
    var n = result.children[i];
    var aNode = {
        index: n.index,
        x: n.bounds.centerX,
        y: n.bounds.centerY,
    };
    paperNodes.push(aNode);
}

for (var y = 0; y < 7; ++y) {
    for (var x = 0; x < 7; ++x) {
        if (y > 0) paperlinks.push({source: (y - 1) * 7 + x, target: y * 7 + x});
        if (x > 0) paperlinks.push({source: y * 7 + (x - 1), target: y * 7 + x});
    }
}
// console.log(paperNodes)
// console.log(paperlinks)
// var circle = new Path.Circle({
//     center: view.center,
//     radius: 3,
//     fillColor: 'red'
// });
// function onMouseMove(event) {
//     var nearestPoint = result.getNearestPoint(event.point);
//     circle.position = nearestPoint;
// }
/*=====================================================================================================
                                                D3
======================================================================================================*/
// var simulation = d3.forceSimulation(paperNodes)
//     .force("charge", d3.forceManyBody().strength(-100))
//     .force("link", d3.forceLink(paperlinks).strength(1).distance(30).iterations(10))
//     .on("tick", ticked);
//
// var canvas = document.querySelector("canvas"),
//     context = canvas.getContext("2d"),
//     width = view.bounds.width,
//     height = view.bounds.height;
//
// d3.select(canvas)
//     .call(d3.drag()
//         .container(canvas)
//         .subject(dragsubject)
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended));
//
// function ticked() {
//     context.clearRect(0, 0, width, height);
//     context.save();
//     context.translate(width / 2, height / 2);
//
//     context.beginPath();
//     paperlinks.forEach(drawLink);
//     context.strokeStyle = "#aaa";
//     context.stroke();
//
//     context.beginPath();
//     paperlinks.forEach(drawNode);
//     context.fill();
//     context.strokeStyle = "#fff";
//     context.stroke();
//     context.restore();
// }
//
// function dragsubject() {
//     return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2);
// }
//
// function dragstarted() {
//     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//     d3.event.subject.fx = d3.event.subject.x;
//     d3.event.subject.fy = d3.event.subject.y;
// }
//
// function dragged() {
//     d3.event.subject.fx = d3.event.x;
//     d3.event.subject.fy = d3.event.y;
// }
//
// function dragended() {
//     if (!d3.event.active) simulation.alphaTarget(0);
//     d3.event.subject.fx = null;
//     d3.event.subject.fy = null;
// }
//
// function drawLink(d) {
//     context.moveTo(d.source.x, d.source.y);
//     context.lineTo(d.target.x, d.target.y);
// }
//
// function drawNode(d) {
//     context.moveTo(d.x + 3, d.y);
//     context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
// }
/*=====================================================================================================
                                                D3
======================================================================================================*/
// var path = d3.geo.path(),
//     force = d3.layout.force().size([view.bounds.width, view.bounds.height]);
var nodes = [],
    links = [];

result.children.forEach(function(d) {
    var centroid = d.position;
    centroid.feature = d;
    nodes.push(centroid);
});

d3.geom.voronoi().links(nodes).forEach(function(link) {
    var dx = link.source.x - link.target.x,
        dy = link.source.y - link.target.y;
    link.distance = Math.sqrt(dx * dx + dy * dy);
    links.push(link);
});

force
    .gravity(0)
    .nodes(nodes)
    .links(links)
    .linkDistance(function(d) { return d.distance; })
    .start();

force.on("tick", function(e) {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
});
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

////////////////////d3-canvas.js////////////////////////////
// function dragsubject() {
//     var n = state.points.length,
//         i,
//         dx,
//         dy,
//         d2,
//         s2 = 100,
//         point,
//         subject;
//
//     for (i = 0; i < n; ++i) {
//         point = state.points[i];
//         dx = d3.event.x - point[0];
//         dy = d3.event.y - point[1];
//         d2 = dx * dx + dy * dy;
//         if (d2 < s2) subject = point, s2 = d2;
//     }
//     console.log("subject:",subject);
//     return subject;
// }
//
// function dragstarted() {
//     console.log("dragstarted:",d3.event.subject)
//     d3.event.subject.active = true;
// }
//
// function dragged() {
//     console.log("dragged:",d3.event.subject)
//     var point = d3.event.subject;
//     var isInside = d3.polygonContains(graphics.polygons[point.parent], point);
//     if(isInside){
//         d3.event.subject[0] = Math.max(W, Math.min(width - W, d3.event.x));
//         d3.event.subject[1] = Math.max(W, Math.min(height - W, d3.event.y));
//     }else{
//
//     }
//     render();
// }
//
// function dragended() {
//     console.log("dragended:",d3.event.subject)
//     d3.event.subject.active = false;
// }
// .force("charge", d3.forceManyBody().distanceMin(10).distanceMax(50))
// .force('attraction', d3.forceManyBody().strength(20).distanceMin(20).distanceMax(Math.round(Math.random() * 20 + 10)))
// .force("repulsion", d3.forceManyBody().strength(-20).distanceMin(20).distanceMax(distance))

// function chunkify(a, n, balanced) {
//     if (n < 2)
//         return [a];
//
//     var len = a.length,
//         out = [],
//         i = 0,
//         size;
//
//     if (len % n === 0) {
//         size = Math.floor(len / n);
//         while (i < len) {
//             out.push(a.slice(i, i += size));
//         }
//     }
//
//     else if (balanced) {
//         while (i < len) {
//             size = Math.ceil((len - i) / n--);
//             out.push(a.slice(i, i += size));
//         }
//     }
//
//     else {
//
//         n--;
//         size = Math.floor(len / n);
//         if (len % size === 0)
//             size--;
//         while (i < size * n) {
//             out.push(a.slice(i, i += size));
//         }
//         out.push(a.slice(size * n));
//
//     }
//
//     return out;
// }
