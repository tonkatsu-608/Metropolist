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
    $('#isDraged').on('change', function () {
        if (this.checked) {
            isDraged = true;
        } else {
            isDraged = false;
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
var state = {
        stack : [],
    },
    isChecked = false,
    isSelected = false,
    isDraged = false,
    DRAGGED_SUBJECT = null;
const N = 30; // quantity of polygons
const DISTRICT_TYPES = ['rich', 'medium','poor','plaza']; // four types of districts
const COLOR = d3.scaleOrdinal().range(d3.schemeCategory20);
const graphics = makeGraphics();
// set (buildings||polygons)' properties
for(let i = 0, poly = graphics.polygons; i < poly.length; i ++) {
    // let area = d3.polygonArea(graphics.polygons[i]);
    for(let j = 0, m = graphics.clusters[i].length; j < m; j ++){
        graphics.clusters[i][j].parent = i;
        let R = 0;
        switch (poly[i].data.type){
            case 'rich': R = Math.round(Math.random() * 5 + 20);
                break;
            case 'medium': R = Math.round(Math.random() * 5 + 15);
                break;
            case 'poor': R = Math.round(Math.random() * 5 + 10);
                break;
            case 'plaza': R = Math.round(Math.random() * 20 + 30);
                break;
            default: R = Math.round(Math.random() * 10 + 10);
        }
        graphics.clusters[i][j].r = R;
    }
}
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
// make simulations in using d3.forceSimulation
const simulations = [];
for(let i = 0, poly = graphics.polygons; i < poly.length; i ++){
    let boudnsPoint = bounds(poly[i]);
    let distance = Math.max(boudnsPoint.width, boudnsPoint.height) / 2;
    simulations[i] = d3.forceSimulation(graphics.clusters[i])
        .force("center", d3.forceCenter(graphics.foci[i][0], graphics.foci[i][1]))
        .force("collide", d3.forceCollide(20).iterations(2))
        .force("polygonCollide", forceCollidePolygon(poly[i]).radius(10).iterations(4))
        .force("myForce", myForce().distanceMin(10).distanceMax(distance).iterations(4))
        .on("tick", render)
}
var menu = function(d) {
    var I, point = [d3.event.layerX, d3.event.layerY];
    for(let i = 0, poly = graphics.polygons; i < graphics.polygons.length; i ++){
        if(d3.polygonContains(poly[i], point)){
            I = i;
            break;
        }
    }

    var content =  [{
            title: 'Current Type: ' + graphics.polygons[I].data.type,
        },
        {
            divider: true
        },
        {
            title: 'Change type to Rich',
            action: function() {
                graphics.polygons[I].data.type = 'rich';
                console.log('rich');
                render();
            }
        },
        {
            title: 'Change type to Medium',
            action: function() {
                graphics.polygons[I].data.type = 'medium';
                console.log('medium');
                render();
            }
        },
        {
            title: 'Change type to Poor',
            action: function() {
                graphics.polygons[I].data.type = 'poor';
                console.log('poor');
                render();
            }
        },
        {
            title: 'Change type to Plaza',
            action: function() {
                graphics.polygons[I].data.type = 'plaza';
                console.log('plaza');
                render();
            }
        }];

    return content;
};

// initialize drag event
d3.select(canvas)
    .on('contextmenu', d3.contextMenu(menu))
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

// render canvas
function render() {
    context.clearRect(0, 0, width, height);

    //draw polygons
    context.beginPath();
    for(let i = 0, n = graphics.polygons.length; i < n; i ++) {
        drawCell(graphics.polygons[i]);
    }
    context.strokeStyle = "#000";
    context.stroke();
    context.closePath();

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
    context.closePath();

    // draw boxes
    for(let k = 0; k <  graphics.polygons.length; k ++) {
        for (let i = 0; i < graphics.clusters[k].length; i ++) {
            let d = graphics.clusters[k][i];
            let polyPoints = graphics.polygons[k];
            // change focus to the center of the triangle
            let center = d3.polygonCentroid(polyPoints);
            if( DRAGGED_SUBJECT && DRAGGED_SUBJECT.parent == k ) {
                center =  DRAGGED_SUBJECT;
            }
            let x = d.x,
                y = d.y,
                inter = false,
                distances = [];
            for (let j = 0,L = polyPoints.length; j < L; j++) {
                let f = j,
                    s = (j + 1) < L ? (j + 1) : 0,
                    segment1 = { x: polyPoints[f][0], y: polyPoints[f][1] },
                    segment2 = { x: polyPoints[s][0], y: polyPoints[s][1] },
                    point = { x: x, y: y };

                // push all the distances into an array
                distances.push(distToSegment(point, pointToSegment(point, segment1, segment2)));

                // check whether point is intersecting with polygon bounds
                inter = getLineIntersection(segment1.x, segment1.y, segment2.x, segment2.y, center[0], center[1], x, y);
                if (inter) {
                    // d.x = (d.x + inter.x) * .5;
                    // d.y = (d.y + inter.y) * .5;
                    d.x = inter.x;
                    d.y = inter.y;
                    break;
                }
            }
            let indexOfNearestSegment = distances.indexOf(Math.min(...distances));
            let nearestSegment = {
                p1: polyPoints[indexOfNearestSegment],
                p2: polyPoints[indexOfNearestSegment + 1] || polyPoints[0]
            };
            let rotation = Math.atan2(nearestSegment.p2[1] - nearestSegment.p1[1], nearestSegment.p2[0] - nearestSegment.p1[0]);

            //clicked part turn to circles
            context.save();
            context.translate(d.x, d.y);
            context.rotate(rotation);
            context.translate( -(d.x), -(d.y));
            context.beginPath();
            context.rect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r);
            context.fillStyle = COLOR(k);
            context.fill();
            context.strokeStyle = "#333";
            context.stroke();
            context.closePath();
            context.restore();
        }
    }
    // draw circle
    if(isDraged && DRAGGED_SUBJECT){
        let d = DRAGGED_SUBJECT;
        context.save();
        context.clearRect(d.x - d.r / 2, d.y - d.r / 2, d.r / 2, d.r / 2);
        context.beginPath();
        context.moveTo(d.x + Math.sqrt(2) * d.r / 2, d.y);
        context.arc(d.x, d.y, Math.sqrt(2) * d.r / 2, 0, 2 * Math.PI);
        context.fillStyle = "#CBC5B9";
        context.fill();
        context.strokeStyle = "#000";
        context.lineWidth = 1.5;
        context.stroke();
        context.closePath();
        context.clip();
        context.restore();
    }
}
//right click to change type
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
    DRAGGED_SUBJECT = sbj;
    console.log("DRAGGED_SUBJECT: ",DRAGGED_SUBJECT);
    return sbj;
}

function dragstarted() {
    d3.contextMenu('close');
    if(!isDraged) {
        simulations[d3.event.subject.parent]
            .force("center", d3.forceCenter(d3.event.x, d3.event.y))
            .restart();
    }
    if (!d3.event.active) simulations[d3.event.subject.parent].alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
}

function dragged() {
    if(!isDraged) {
        simulations[d3.event.subject.parent]
            .force("center", d3.forceCenter(d3.event.x, d3.event.y))
            .restart();
    }
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
    render();
}

function dragended() {
    if (!d3.event.active) simulations[d3.event.subject.parent].alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
    DRAGGED_SUBJECT = null;
}
/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
// draw sites
function drawSite(site) {
    context.moveTo(site[0] + 2.5, site[1]);
    context.arc(site[0], site[1], 2.5, 0, 2 * Math.PI, false);
}

// draw links among sites
function drawLink(link) {
    context.moveTo(link.source[0], link.source[1]);
    context.lineTo(link.target[0], link.target[1]);
}

// draw polygons
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
// initialize the graphics
function makeGraphics() {
    let sites = d3.range(N).map( d => [Math.random() * width, Math.random() * height] );
    let voronoi = d3.voronoi().extent([[2,2], [width-2, height-2]]);
    let diagram = voronoi( sites );
    let links = diagram.links();
    let polygons = diagram.polygons();
    polygons.filter(p => p.data.type = DISTRICT_TYPES[Math.floor(Math.random() * 4)]);
    let clusters = polygons.map( function(poly) {
        let CLUSTERS_PER_CELL = null;
        switch (poly.data.type){
            case 'rich': CLUSTERS_PER_CELL = Math.round(Math.random() * 5 + 5);
                break;
            case 'medium': CLUSTERS_PER_CELL = Math.round(Math.random() * 5 + 10);
                break;
            case 'poor': CLUSTERS_PER_CELL = Math.round(Math.random() * 5 + 15);
                break;
            case 'plaza': CLUSTERS_PER_CELL = Math.round(Math.random() * 1 + 2);
                break;
            default: CLUSTERS_PER_CELL = Math.round(Math.random() * 10 + 10);
        }
        return makeDots( poly, CLUSTERS_PER_CELL, 10 )
    });

    let foci = polygons.map( poly => d3.polygonCentroid(poly));
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

// self-defined custom force
function myForce() {
    var nodes,
        node,
        alpha,
        strength = constant(-12),
        strengths,
        distanceMin2 = 1,
        distanceMax2 = Infinity,
        theta2 = 0.81;

    function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        strengths = new Array(n);
        // for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
        for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = -node.r;
    }

    function force(_) {
        var i, n = nodes.length, tree = d3.quadtree(nodes, d3.x$1, d3.y$1).visitAfter(accumulate);
        for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    }

    function accumulate(quad) {
        var strength = 0, q, c, weight = 0, x, y, i;

        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
            for (x = y = i = 0; i < 4; ++i) {
                if ((q = quad[i]) && (c = Math.abs(q.value))) {
                    strength += q.value, weight += c, x += c * q.x, y += c * q.y;
                }
            }
            quad.x = x / weight;
            quad.y = y / weight;
        }

        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
            q = quad;
            q.x = q.data.x;
            q.y = q.data.y;
            do strength += strengths[q.data.index];
            while (q = q.next);
        }
        quad.value = strength;
    }

    function apply(quad, x1, _, x2) {
        if (!quad.value) return true;

        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y;

        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if (w * w / theta2 < l) {
            if (l < distanceMax2) {
                if (x === 0) x = jiggle(), l += x * x;
                if (y === 0) y = jiggle(), l += y * y;
                if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
                node.vx += x * quad.value * alpha / l;
                node.vy += y * quad.value * alpha / l;
            }
            return true;
        }

        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return;

        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }

        do if (quad.data !== node) {
            w = strengths[quad.data.index] * alpha / l;
            node.vx += x * w;
            node.vy += y * w;
        } while (quad = quad.next);
    }

    force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.initialize = function(_){
        n = (nodes = _).length;
        initialize();
    };

    force.distanceMin = function(_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
    };

    force.distanceMax = function(_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
    };

    force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
    };

    return force;
}

// inspired from http://bl.ocks.org/larsenmtl/39a028da44db9e8daf14578cb354b5cb
function forceCollidePolygon(polygon, radius){
    var nodes, n, iterations = 1;

    // took from d3-force/src/collide.js
    if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

    function force(){
        for(var l = 0; l < iterations; l++) {
            for(var k = 0; k < nodes.length; k++) {
                var node = nodes[k];
                var point = { x: node.x , y: node.y }

                // we loop over polygon's edges to check collisions
                for(var j = 0; j < polygon.length; j++){
                    var n = (j+1) < polygon.length ? (j+1):0;
                    var p1 = polygon[j];
                    var p2 = polygon[n];
                    var segment1 = {x: p1[0], y: p1[1]}
                    var segment2 = {x: p2[0], y: p2[1]}

                    let vector = pointToSegment(point, segment1, segment2);
                    let d = distToSegment(point, vector);

                    if( d < 20 ) {
                        let dvx = Math.abs(point.x - vector.x) / (d);
                        let dvy = Math.abs(point.y - vector.y) / (d);

                        node.vx += Math.sign(point.x - vector.x) * dvx;
                        node.vy += Math.sign(point.y - vector.y) * dvy;
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

// took from d3-force/src/jiggle.js
function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
}
// took from d3-force/src/constant.js
function constant(x){
    return function() {
        return x;
    };
}
function sqr(x) {
    return x * x;
}

function dist2(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function pointToSegment(p, v, w) {
    var l2 = dist2(v, w);

    if (l2 == 0) return dist2(p, v);

    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

    if (t < 0) return v;
    if (t > 1) return w;

    return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
}

function distToSegment(point, vector) {
    return Math.sqrt(dist2(point, vector));
}