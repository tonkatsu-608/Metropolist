$(document).ready(function () {
    $('.sidenav').sidenav();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    $('#select').on('change', function () {
        if (this.checked) {
            isSelected = true;
            $('#switch').attr('disabled', 'disabled');
        } else {
            isSelected = false;
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

var canvas = d3.select("canvas")
    // .on("touchstart mousedown", mousedowned)
        .node(),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;

var isChecked = false;
var isSelected = false;
var state = {
    stack : [],
    points: []
};
var n = 30;

var color = d3.scaleOrdinal().range(d3.schemeCategory20);

var buildings = [];

function makeGraphics() {
    var sites = d3.range(n).map( d => [Math.random() * width, Math.random() * height] );
    var voronoi = d3.voronoi().extent([[-1, 1], [width + 1, height + 1]]);
    var diagram = voronoi( sites );
    var links = diagram.links();
    var polygons = diagram.polygons();
    var clusters = polygons.map( poly => makeDots( poly, 10, 10 ) );

    return {
        sites : sites,
        voronoi : voronoi,
        diagram : diagram,
        polygons : polygons,
        clusters : clusters,
        links : links
    }
}

var graphics = makeGraphics();

//undo functions
$('#undo').click(function () {
    sites = (state.stack && state.stack.length > 0) ? state.stack.pop() : sites;
    render();
});
$.Shortcut.on({
    "meta+Z": function () {
        sites = (state.stack && state.stack.length > 0) ? state.stack.pop() : sites;
        render();
    }
});
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
render();

d3.select(canvas)
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on('start.render drag.render end.render', render);

//render
function render() {
    context.clearRect(0, 0, width, height);

    let diagram = graphics.diagram;
    let links = graphics.links;
    let polygons = graphics.polygons;
    for(var i = 0, n = polygons.length; i < n; i ++) {
        let area = d3.polygonArea(polygons[i]);
        let points = graphics.clusters[i];
        for(var j = 0, m = points.length; j < m; j ++){
            points[j].parent = i;
            state.points.push(points[j])
            // draw points
            context.beginPath();
            drawPoint(points[j],area);
            context.fillStyle = color(i);
            context.fill();
            context.strokeStyle = "#000";
            context.stroke();
        }
    }

    //draw polygons
    context.beginPath();
    for(var i = 0, n = polygons.length; i < n; ++i) {
        drawCell(polygons[i]);
    }
    context.strokeStyle = "#000";
    context.stroke();

    // draw links
    // context.beginPath();
    // for (var i = 0, n = links.length; i < n; ++i) {
    //     drawLink(links[i]);
    // }
    // context.strokeStyle = "rgba(0,0,0,0.2)";
    // context.stroke();

    //draw sites
    // context.beginPath();
    // for (var i = 1, n = sites.length; i < n; ++i) {
    //     drawSite(sites[i]);
    // }
    // context.fillStyle = "#000";
    // context.fill();
    // context.strokeStyle = "#fff";
    // context.stroke();

    context.restore();
}
/*=====================================================================================================
                                         Drag Functions
======================================================================================================*/
function dragsubject() {
    var n = state.points.length,
        i,
        dx,
        dy,
        d2,
        s2 = 100,
        point,
        subject;

    for (i = 0; i < n; ++i) {
        point = state.points[i];
        dx = d3.event.x - point[0];
        dy = d3.event.y - point[1];
        d2 = dx * dx + dy * dy;
        if (d2 < s2) subject = point, s2 = d2;
    }
    console.log("subject:",subject);
    return subject;
}

function dragstarted() {
    console.log("dragstarted:",d3.event.subject)
    d3.event.subject.active = true;
}

function dragged() {
    console.log("dragged:",d3.event.subject)
    var point = d3.event.subject;
    var isInside = d3.polygonContains(graphics.polygons[point.parent], point);
    if(isInside){
        d3.event.subject[0] = d3.event.x;
        d3.event.subject[1] = d3.event.y;
    }else{

    }
    render();
}

function dragended() {
    console.log("dragended:",d3.event.subject)
    d3.event.subject.active = false;
}
/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
function drawSite(site) {
    context.moveTo(site[0] + 2.5, site[1]);
    context.arc(site[0], site[1], 2.5, 0, 2 * Math.PI, false);
}

function drawLink(link) {
    context.moveTo(link.source[0], link.source[1]);
    context.lineTo(link.target[0], link.target[1]);
}

function drawCell(cell) {
    if (!cell) return false;
    context.moveTo(cell[0][0], cell[0][1]);
    for (var j = 1, m = cell.length; j < m; ++j) {
        context.lineTo(cell[j][0], cell[j][1]);
    }
    context.closePath();
    return true;
}

function drawPoint(point,area) {
    // let r = Math.round(Math.random() * 5 + 5);
    // context.moveTo(point[0] + 2.5, point[1]);
    // context.arc(point[0], point[1], r, 0, 2 * Math.PI, false);
    let w = 0;
    if(area){
        if(area < 20000){
            w = Math.round(Math.random() * 5 + 5);
        }else{
            w = Math.round(Math.random() * 10 + 5);
        }

    }else{
        w = 10;
    }
    context.rect(point[0], point[1], 10, 10);
}

//mousedown
function mousedowned() {
    if(!isSelected){
        var node = d3.mouse(this);
        if(isChecked){
            var obj = diagram.find(node[0], node[1]);
            sites = sites.slice();
            sites.splice(obj.index, 1);
            state.stack.push(sites);
        }else{
            state.stack.push(sites);
            sites = sites.slice();
            sites.push(node)
        }
    }else{
        console.log("selected")
    }
    render();
}

function makeDots(polygon, numPoints, options) {

    options = Object.assign({
        // DEFAULT OPTIONS:
        maxIterations: numPoints * 50,
        distance: null, // by default: MIN(width, height) / numPoints / 4,
        edgeDistance: options.distance
    },options);

    numPoints = Math.floor(numPoints)

    // calculate bounding box

    let xMin = Infinity,
        yMin = Infinity,
        xMax = -Infinity,
        yMax = -Infinity

    polygon.forEach(p => {
        if (p[0]<xMin) xMin = p[0]
        if (p[0]>xMax) xMax = p[0]
        if (p[1]<yMin) yMin = p[1]
        if (p[1]>yMax) yMax = p[1]
    });

    let width = xMax - xMin
    let height = yMax - yMin

    // default options depending on bounds

    options.distance = options.distance || Math.min(width, height) / numPoints / 4
    options.edgeDistance = options.edgeDistance || options.distance

    // generate points

    let points = [];

    outer:
        for (let i=0; i<options.maxIterations; i++) {
            let p = [xMin + Math.random() * width, yMin + Math.random() * height]
            if (d3.polygonContains(polygon, p)) {
                // check distance to other points
                for (let j=0; j<points.length; j++) {
                    let dx = p[0]-points[j][0],
                        dy = p[1]-points[j][1]

                    if (Math.sqrt(dx*dx+dy*dy) < options.distance) continue outer;
                }
                // check distance to polygon edge
                for (let j=0; j<polygon.length-1; j++) {
                    if (distPointEdge(p, polygon[j], polygon[j+1]) < options.edgeDistance) continue outer;
                }
                points.push(p);
                if (points.length == numPoints) break;
            }
        }

    points.complete = (points.length >= numPoints)

    return points
}

function distPointEdge(p, l1, l2) {

    let A = p[0] - l1[0],
        B = p[1] - l1[1],
        C = l2[0] - l1[0],
        D = l2[1] - l1[1];

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;

    // alpha is proportion of closest point on the line between l1 and l2
    let alpha = -1;
    if (len_sq != 0) //in case of 0 length line
        alpha = dot / len_sq;

    // points on edge closest to p
    let X, Y;

    if (alpha < 0) {
        X = l1[0];
        Y = l1[1];
    }
    else if (alpha > 1) {
        X = l2[0];
        Y = l2[1];
    }
    else {
        X = l1[0] + alpha * C;
        Y = l1[1] + alpha * D;
    }

    let dx = p[0] - X;
    let dy = p[1] - Y;

    return Math.sqrt(dx * dx + dy * dy);
}

function chunkify(a, n, balanced) {

    if (n < 2)
        return [a];

    var len = a.length,
        out = [],
        i = 0,
        size;

    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(a.slice(i, i += size));
        }
    }

    else if (balanced) {
        while (i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
    }

    else {

        n--;
        size = Math.floor(len / n);
        if (len % size === 0)
            size--;
        while (i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));

    }

    return out;
}