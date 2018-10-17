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
var tau = 2 * Math.PI;
var N = 30;//sites num
var W = 10, R = 5;//building size
var CLUSTERS_PER_CELL = Math.round(Math.random() * 15 + 5);//buildings num for each district
var color = d3.scaleOrdinal().range(d3.schemeCategory20);

function makeGraphics() {
    var sites = d3.range(N).map( d => [Math.random() * width, Math.random() * height] );
    var voronoi = d3.voronoi().extent([[1,1], [width-1, height-1]]);
    var diagram = voronoi( sites );
    var links = diagram.links();
    var polygons = diagram.polygons();
    var clusters = polygons.map( poly => makeDots( poly, CLUSTERS_PER_CELL, 10 ) );
    var foci = polygons.map( poly => d3.polygonCentroid(poly));
    return {
        sites : sites,
        voronoi : voronoi,
        diagram : diagram,
        links : links,
        polygons : polygons,
        clusters : clusters,
        foci: foci
    }
}
var graphics = makeGraphics();
for(var i = 0, n = graphics.polygons.length; i < n; i ++) {
    let area = d3.polygonArea(graphics.polygons[i]);
    let points = graphics.clusters[i];
    // delete graphics.polygons[i].data;
    for(var j = 0, m = points.length; j < m; j ++){
        graphics.clusters[i][j].parent = i;
        state.points.push(graphics.clusters[i][j]);
    }
}
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
var simulations = [];
for(var i = 0, n = graphics.polygons.length; i < n; i ++){
    simulations[i] = d3.forceSimulation(graphics.clusters[i])
        .force("x", d3.forceX().strength(0.002))
        .force("y", d3.forceY().strength(0.002))
        .force("center", d3.forceCenter(graphics.foci[i][0], graphics.foci[i][1]))
        .force("charge", d3.forceManyBody().strength(-40).distanceMin(10).distanceMax(50))
        .force('attraction', d3.forceManyBody().strength(20).distanceMin(10).distanceMax(50))
        .force('repulsion', d3.forceManyBody().strength(-20).distanceMin(10).distanceMax(50))
        .force("collide", d3.forceCollide().radius(function(d) { return R; }).iterations(2))
        .on("tick", render)
}

d3.select(canvas)
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))

//render
function render() {
    context.clearRect(0, 0, width, height);
    context.save();

    //draw points
    for(var k = 0; k <  graphics.polygons.length; k ++) {
        for (var i = 0; i < graphics.clusters[k].length; i++) {
            var d = graphics.clusters[k][i];
            var polyPoints = graphics.polygons[k];
            var L = polyPoints.length;
            d.x = Math.max(R, Math.min(width - R, d.x));
            d.y = Math.max(R, Math.min(height - R, d.y));
            // change focus to the center of the triangle
            var center = d3.polygonCentroid(polyPoints);
            var x = d.x,
                y = d.y,
                inter = false;
            for (var j = 0; j < L; j++) {
                var f = j,
                    s = (j + 1) < L ? (j + 1) : 0,
                    inter = getLineIntersection(polyPoints[f][0], polyPoints[f][1],
                        polyPoints[s][0], polyPoints[s][1], center[0], center[1], x, y);
                if (inter) {
                    x = inter.x;
                    y = inter.y;
                    break;
                }
            }
            context.beginPath();
            context.rect(x - W/2, y - W/2, W, W);
            // context.moveTo(x + R, y);
            // context.arc(x, y, R, 0, 2 * Math.PI);
            context.fillStyle = color(k);
            context.fill();
            context.strokeStyle = "#333";
            context.stroke();
        }
    }

    //draw polygons
    context.beginPath();
    for(var i = 0, n = graphics.polygons.length; i < n; ++i) {
        drawCell(graphics.polygons[i]);
    }
    context.strokeStyle = "#000";
    context.stroke();

    // // draw links
    // context.beginPath();
    // for (var i = 0, n = graphics.links.length; i < n; ++i) {
    //     drawLink(graphics.links[i]);
    // }
    // context.strokeStyle = "rgba(0,0,0,0.2)";
    // context.stroke();
    //
    // draw foci
    // context.beginPath();
    // for (var i = 0, n = graphics.foci.length; i < n; ++i) {
    //     drawSite(graphics.foci[i]);
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
    var sbj, I, isInside;
    var point = [d3.event.x, d3.event.y];
    for(var i = 0, poly = graphics.polygons; i < graphics.polygons.length; i ++){
        isInside = d3.polygonContains(poly[i], point);
        if(isInside){
            I = i;
            break;
        }
    }
    sbj = simulations[I].find(d3.event.x, d3.event.y);
    sbj.parent = I;
    console.log("sbj:",sbj)
    return sbj;
}

function dragstarted() {
    console.log("dragstarted:",d3.event.subject)
    if (!d3.event.active) simulations.forEach(s => s.alphaTarget(0.3).restart());
    d3.event.subject.fx = Math.max(R, Math.min(width - R, d3.event.subject[0])) ;
    d3.event.subject.fy = Math.max(R, Math.min(height - R, d3.event.subject[1])) ;
}

function dragged() {
    console.log("dragged:",d3.event.subject)
    d3.event.subject.fx = Math.max(R, Math.min(width - R, d3.event.x));
    d3.event.subject.fy = Math.max(R, Math.min(height - R, d3.event.y));
}

function dragended() {
    console.log("dragended:",d3.event.subject)
    if (!d3.event.active) simulations.forEach(s => s.alphaTarget(0));
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
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

//mousedown
function mousedowned() {
    if(!isSelected){
        var node = d3.mouse(this);
        if(isChecked){
            var obj = graphics.diagram.find(node[0], node[1]);
            sites = sites.slice();
            sites.splice(obj.index, 1);
            state.stack.push(sites);
        }else{
            state.stack.push(sites);
            sites = sites.slice();
            sites.push(node)
        }
    }else{
        console.log("selected");
    }
    render();
}
/*=====================================================================================================
                                     Additional Functions
======================================================================================================*/
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
// source: http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
function getLineIntersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;
    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        var intX = p0_x + (t * s1_x);
        var intY = p0_y + (t * s1_y);
        return {
            x: intX,
            y: intY
        };
    }
    return false;
}