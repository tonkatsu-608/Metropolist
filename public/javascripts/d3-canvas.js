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
var isChecked = false,
    isSelected = false;
var state = {
    stack : [],
    points: []
};
const tau = 2 * Math.PI,
    N = 30, //sites num
    W = 10; //building size
const CLUSTERS_PER_CELL = () =>  Math.round(Math.random() * 25 + 5);//buildings num for each district
const color = d3.scaleOrdinal().range(d3.schemeCategory20);
const scale = d3.scaleLinear()
    .domain([0,100])
    .range([0,90]);
const graphics = makeGraphics();

for(let i = 0, poly = graphics.polygons; i < poly.length; i ++) {
    let area = d3.polygonArea(graphics.polygons[i]);
    let points = graphics.clusters[i];

    // delete graphics.polygons[i].data;
    for(let j = 0, m = points.length; j < m; j ++){
        graphics.clusters[i][j].parent = i;
        state.points.push(graphics.clusters[i][j]);
    }

    //// Shrink Polygons
    // console.log("before: ",poly[i])
    // for(let k = 0; k < poly[i].length; k ++){
    //     poly[i][k] = poly[i][k].map(p => scale(p))
    // }
    // console.log("after: ",poly[i])

}
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
const simulations = [];
for(let i = 0, poly = graphics.polygons; i < poly.length; i ++){
    let boudnsPoint = bounds(poly[i]);
    let distance = Math.max(boudnsPoint.width, boudnsPoint.height) / 2;
    if(graphics.foci[i][1] > height * 0.5){
        graphics.foci[i][1] -= graphics.foci[i][1] / 15;
    }
    simulations[i] = d3.forceSimulation(graphics.clusters[i])
        .force("center", d3.forceCenter(graphics.foci[i][0], graphics.foci[i][1]))
        .force("repulsion", d3.forceManyBody().strength(-10).distanceMin(10).distanceMax(distance))
        .force("collide", d3.forceCollide(W).iterations(2))
        .force('polygonCollide', forceCollidePolygon(poly[i]).radius(W).iterations(4))
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
    for(let k = 0; k <  graphics.polygons.length; k ++) {
        for (let i = 0; i < graphics.clusters[k].length; i++) {
            let d = graphics.clusters[k][i];
            let polyPoints = graphics.polygons[k];
            let L = polyPoints.length;
            d.x = Math.max(W, Math.min(width - W, d.x));
            d.y = Math.max(W, Math.min(height - W, d.y));
            // // change focus to the center of the triangle
            // let center = d3.polygonCentroid(polyPoints);
            // let x = d.x,
            //     y = d.y,
            //     inter = false;
            // for (let j = 0; j < L; j++) {
            //     let f = j,
            //         s = (j + 1) < L ? (j + 1) : 0,
            //         inter = getLineIntersection(polyPoints[f][0], polyPoints[f][1],
            //             polyPoints[s][0], polyPoints[s][1], center[0], center[1], x, y);
            //     if (inter) {
            //         d.x = inter.x;
            //         d.y = inter.y;
            //         break;
            //     }
            // }
            context.beginPath();
            // context.rect(x - W/2, y - W/2, W, W);
            context.moveTo(d.x + W, d.y);
            context.arc(d.x, d.y, W, 0, 2 * Math.PI);
            context.fillStyle = color(k);
            context.fill();
            context.strokeStyle = "#333";
            context.stroke();
        }
    }

    //draw polygons
    context.beginPath();
    for(let i = 0, n = graphics.polygons.length; i < n; i ++) {
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

    // draw foci
    context.beginPath();
    for (var i = 0, n = graphics.foci.length; i < n; ++i) {
        drawSite(graphics.foci[i]);
    }
    context.fillStyle = "#000";
    context.fill();
    context.strokeStyle = "#fff";
    context.stroke();

    context.restore();
}
/*=====================================================================================================
                                         Drag Functions
======================================================================================================*/
function dragsubject() {
    var sbj, I, isInside;
    var point = [d3.event.x, d3.event.y];
    for(let i = 0, poly = graphics.polygons; i < graphics.polygons.length; i ++){
        isInside = d3.polygonContains(poly[i], point);
        if(isInside){
            I = i;
            break;
        }
    }
    sbj = simulations[I].find(d3.event.x, d3.event.y);
    sbj.parent = I;
    console.log("sbj: ",sbj)
    return sbj;
}

function dragstarted() {
    simulations[d3.event.subject.parent]
        .force("center", d3.forceCenter(d3.event.x, d3.event.y))
        .restart();
    if (!d3.event.active) simulations[d3.event.subject.parent].alphaTarget(0.3).restart();
    // if (!d3.event.active) simulations.forEach(s => s.alphaTarget(0.3).restart());
    // d3.event.subject.fx = Math.max(R, Math.min(width - R, d3.event.subject[0]));
    // d3.event.subject.fy = Math.max(R, Math.min(height - R, d3.event.subject[1]));
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
}

function dragged() {
    simulations[d3.event.subject.parent]
        .force("center", d3.forceCenter(d3.event.x, d3.event.y))
        .restart();
    // d3.event.subject.fx = Math.max(R, Math.min(width - R, d3.event.x));
    // d3.event.subject.fy = Math.max(R, Math.min(height - R, d3.event.y));
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
}

function dragended() {
    if (!d3.event.active) simulations[d3.event.subject.parent].alphaTarget(0);
    // if (!d3.event.active) simulations.forEach(s => s.alphaTarget(0));
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
function makeGraphics() {
    var sites = d3.range(N).map( d => [Math.random() * width, Math.random() * height] );
    var voronoi = d3.voronoi().extent([[2,2], [width-2, height-2]]);
    var diagram = voronoi( sites );
    var links = diagram.links();
    var polygons = diagram.polygons();
    var clusters = polygons.map( poly => makeDots( poly, CLUSTERS_PER_CELL(), 10 ) );
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

// get bounds of a specific polygon
function bounds( polygon ) {
    let xs = polygon.map( p => p[0] );
    let ys = polygon.map( p => p[1] );
    // var minX = xs.reduce( (acc, val) => Math.min( (acc, val ), Infinity ));
    // var maxX = xs.reduce( (acc, val) => Math.max( (acc, val), -Infinity ));
    // var minY = ys.reduce( (acc, val) => Math.min( (acc, val), Infinity ));
    // var maxY = ys.reduce( (acc, val) => Math.max( (acc, val), -Infinity ));
    let minX = Math.min.apply( null, xs );
    let maxX = Math.max.apply( null, xs );
    let minY = Math.min.apply( null, ys );
    let maxY = Math.max.apply( null, ys );
    return { width : maxX - minX, height : maxY - minY };
}

// inspired from http://bl.ocks.org/larsenmtl/39a028da44db9e8daf14578cb354b5cb
function forceCollidePolygon(polygon, radius){
    var nodes, n, iterations = 1,
        max=Math.max,
        min=Math.min;
    var absub = function(a,b){ return max(a,b)-min(a,b); };
    var center= d3.polygonCentroid(polygon);

    // took from d3-force/src/collide.js
    if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

    // took from d3-force/src/constant.js
    function constant(x){
        return function() {
            return x;
        };
    }
    // took from d3-force/src/jiggle.js
    function jiggle() {
        return (Math.random() - 0.5) * 1e-6;
    }

    // adapted from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
    function intersection(p0, p1, p2, p3) {
        var s1 = [ p1[0] - p0[0], p1[1] - p0[1]];
        var s2 = [ p3[0] - p2[0], p3[1] - p2[1]];
        // intersection compute
        var s, t;
        s = -s1[1] * (p0[0] - p2[0]) + s1[0] * (p0[1] - p3[1]);
        t =  s2[0] * (p0[1] - p2[1]) - s2[1] * (p0[0] - p3[0]);
        s = s / (-s2[0] * s1[1] + s1[0] * s2[1]);
        t = t / (-s2[0] * s1[1] + s1[0] * s2[1]);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            // intersection coordinates
            return {
                x:p0[0] + (t * s1[0]),
                y:p0[1] + (t * s1[1])
            };
        }
        return false;
    }

    function velocity( dist ) {
        return Math.sqrt( dist );
    }

    function force(){
        for(var l = 0; l < iterations; l++) {
            for(var k = 0; k < nodes.length; k++) {
                var node = nodes[k];
                var r  = radius(node);
                var px = (node.x >= center[0]?1:-1);
                var py = (node.y >= center[1]?1:-1);
                var t = [ node.x + px*r, node.y + py*r];

                // we loop over polygon's edges to check collisions
                for(var j = 0; j < polygon.length; j++){
                    var n = (j+1) < polygon.length ? (j+1):0;
                    var p1 = polygon[j];
                    var p2 = polygon[n];
                    var i = intersection(p1, p2, center, t);
                    if(i){
                        // give a small velocity at the opposite of the collision point
                        // this can be tweaked
                        node.vx = -px*10/Math.sqrt(absub(i.x, t[0]) + jiggle());
                        node.vy = -py*10/Math.sqrt(absub(i.y, t[1]) + jiggle());
                        break;
                    }
                }
            }
        }
        return;
    }

    force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.initialize = function(_){
        n = (nodes = _).length;
    };

    force.radius = function(_){
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), force) : radius;
    };
    return force;
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