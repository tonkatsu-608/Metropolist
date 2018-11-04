/*
    polygons = [Polygon, Polygon, Polygon, ..., Polygon]
    Polygon {
        index: Int,
        area: Float,
        type : string in ['rich', 'medium','poor','plaza'],
        vertices : [[x1, y1], [x2, y2], ..., [xn, yn]],
        children: [Item, Item, Item, ..., Item],
        buildings: Int,
        site: [x, y],
        center: [x, y],
        simulation: Object
    }
    clusters = [Item, Item, Item, ..., Item]
    Item {
        width: Int,
        height: Int,
        radius: Int,
        x: Float,
        y: Float,
        vx: Float,
        vy: Float,
        parent: Polygon,
        orientation: Float
    }
 */
$(document).ready(function () {
    $('#render').click( function(e) {
        state.N = $('#sites').val();
        state.graphics = new Graphics();
        startSimulations();
    });
    $('#dragSwitch').on('change', function () {
        if (this.checked) {
            state.isDragSelected = true;
        } else {
            state.isDragSelected = false;
        }
    });
});

var state = {
    canvas: d3.select("canvas").node(),
    context () {
        return this.canvas.getContext("2d");
    },
    width () {
        return this.canvas.width;
    },
    height () {
        return this.canvas.height;
    },
    N: 20, // quantity of polygons
    stack: [],
    simulations: [],
    isDragSelected: false,
    DRAGGED_SUBJECT: null,
    COLOR: d3.scaleOrdinal().range(d3.schemeCategory20), // random color
    DISTRICT_TYPES: ['rich', 'medium','poor','plaza'], // four types of districts
}
state.graphics = new Graphics();
/*=====================================================================================================
                                     Constructor Functions
======================================================================================================*/
function Graphics() {
    this.sites = d3.range(state.N).map( d => [Math.random() * state.width(), Math.random() * state.height()] );
    this.voronoi = d3.voronoi().extent([[2,2], [state.width()-2, state.height()-2]]);
    this.diagram = this.voronoi( this.sites );
    this.links = this.diagram.links();
    this.polygons = makePolygons(this.diagram);
    this.clusters = this.polygons.map( makeCluster );
}

// make polygons(districts)
function makePolygons(diagram) {
    let edges = diagram.edges;
    let polygons =  diagram.cells.map(function(cell, index) {
        let polygon = {};
        let vertices = cell.halfedges.map(function(i) {
            let vertex = cellHalfedgeStart(cell, edges[i]);
            polygon.site = {x: cell.site.data[0], y: cell.site.data[1]};
            return vertex;
        });
        polygon.index = index;
        polygon.vertices = vertices;
        polygon.children = null;
        polygon.area = d3.polygonArea(vertices);
        polygon.type = state.DISTRICT_TYPES[Math.floor(Math.random() * 4)];
        polygon.center = {x: d3.polygonCentroid(vertices)[0], y: d3.polygonCentroid(vertices)[1]};
        return polygon;
    });
    return polygons;
}

// make clusters(buildings)
function makeCluster(poly) {
    let number = 0;
    switch (poly.type){
        case 'rich':
            number = Math.round(Math.random() * 5 + 5);
            break;
        case 'medium':
            number = Math.round(Math.random() * 5 + 10);
            break;
        case 'poor':
            number = Math.round(Math.random() * 5 + 15);
            break;
        case 'plaza':
            number = Math.round(Math.random() * 1 + 2);
            break;
        default:
            number = Math.round(Math.random() * 10 + 10);
    }

    let dots = d3.range(number).map(function () {
        let d = {
            orientation: 0.0,
            parent: poly,
        };
        switch (poly.type){
            case 'rich':
                d.width = Math.round(Math.random() * 10 + 18);
                d.height = Math.round(Math.random() * 10 + 18);
                break;
            case 'medium':
                d.width = Math.round(Math.random() * 10 + 12);
                d.height = Math.round(Math.random() * 10 + 12);
                break;
            case 'poor':
                d.width = Math.round(Math.random() * 10 + 6);
                d.height = Math.round(Math.random() * 10 + 6);
                break;
            case 'plaza':
                d.width = Math.round(Math.random() * 30 + 30);
                d.height = Math.round(Math.random() * 30 + 30);
                break;
            default:
                d.width = Math.round(Math.random() * 10 + 10);
                d.height = Math.round(Math.random() * 10 + 10);
        }
        d.radius = Math.sqrt(2) * (d.width + d.height) / 2;
        return d;
    });
    poly.children = dots;
    return dots;
}
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
startSimulations();

// initialize drag event
d3.select(state.canvas)
    .call(d3.drag()
        .container(state.canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on('contextmenu', d3.contextMenu(menu));

// render graphic
function render() {
    state.context().clearRect(0, 0, state.width(), state.height());

    //// draw polygons
    // drawCell(2, 'red');

    //  draw paths
    drawPaths( 2, 'black');

    // // draw links
    // state.context().beginPath();
    // for (var i = 0, n = state.links.length; i < n; ++i) {
    //     drawLink(state.links[i]);
    // }
    // state.context().strokeStyle = "rgba(0,0,0,0.2)";
    // state.context().stroke();

    // draw foci/site
    state.context().save();
    state.context().beginPath();
    for (var i = 0, n = state.graphics.polygons.length; i < n; ++i) {
        drawSite(state.graphics.polygons[i].center);
    }
    state.context().fillStyle = "#000";
    state.context().fill();
    state.context().strokeStyle = "#fff";
    state.context().stroke();
    state.context().closePath();
    state.context().restore();

    // draw buildings
    for(let k = 0; k <  state.graphics.polygons.length; k ++) {
        for (let i = 0; i < state.graphics.clusters[k].length; i ++) {
            let d = state.graphics.clusters[k][i];
            //clicked part turn to circles
            state.context().save();
            state.context().translate(d.x, d.y);
            state.context().rotate(d.orientation);
            state.context().translate( -(d.x), -(d.y));
            state.context().beginPath();
            state.context().rect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
            state.context().fillStyle = state.COLOR(k);
            state.context().fill();
            state.context().strokeStyle = "#333";
            state.context().lineWidth = 2;
            state.context().stroke();
            state.context().closePath();
            state.context().restore();
        }
    }
    // draw circle
    if(state.isDragSelected && state.DRAGGED_SUBJECT){
        let d = state.DRAGGED_SUBJECT;
        state.context().save();
        state.context().clearRect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
        state.context().beginPath();
        state.context().moveTo(d.x + d.radius / 2, d.y);
        state.context().arc(d.x, d.y, d.radius / 2, 0, 2 * Math.PI);
        state.context().fillStyle = "#CBC5B9";
        state.context().fill();
        state.context().strokeStyle = "#000";
        state.context().lineWidth = 1.5;
        state.context().stroke();
        state.context().closePath();
        state.context().clip();
        state.context().restore();
    }
}
/*=====================================================================================================
                                     Additional Functions
======================================================================================================*/
// start simulations
function startSimulations() {
    for(let i = 0; i < state.graphics.polygons.length; i ++){
        makeSimulations(state.graphics.polygons[i], state.graphics.clusters[i]);
    }
}

// make simulations in using d3.forceSimulation
function makeSimulations(polygon, cluster) {
    let boundsPoint = bounds(polygon);
    let distance = Math.max(boundsPoint.width, boundsPoint.height) / 2;
    state.simulations[polygon.index] = d3.forceSimulation(cluster)
        .force("center", d3.forceCenter(polygon.center.x, polygon.center.y))
        .force("collide", d3.forceCollide(20).iterations(2))
        .force("polygonCollide", forceCollidePolygon(polygon).radius(10))
        .force("myForce", myForce().distanceMin(10).distanceMax(distance).iterations(1))
        .on("tick", render);
    polygon.simulation = state.simulations[polygon.index];
}

// set context menu
function menu(d) {
    let point = [d3.event.layerX, d3.event.layerY];
    let polygon = state.graphics.polygons.filter(poly => d3.polygonContains(poly.vertices, point))[0];
    let content =  [{
        title: 'Current Type: ' + polygon.type,
    },
        {
            divider: true
        },
        {
            title: 'Change type to Rich',
            action: function() {
                polygon.type = 'rich';
                remakeCluster(polygon);
            }
        },
        {
            title: 'Change type to Medium',
            action: function() {
                polygon.type = 'medium';
                remakeCluster(polygon);
            }
        },
        {
            title: 'Change type to Poor',
            action: function() {
                polygon.type = 'poor';
                remakeCluster(polygon);
            }
        },
        {
            title: 'Change type to Plaza',
            action: function() {
                polygon.type = 'plaza';
                remakeCluster(polygon);
            }
        }];
    return content;
};

// remake cluster after change its parent's type
function remakeCluster(polygon) {
    let item = makeCluster(polygon);
    state.graphics.clusters.splice(polygon.index, 1, item);
    makeSimulations(polygon, item);
}

// get bounds of a specific polygon
function bounds( polygon ) {
    let xs = polygon.vertices.map( p => p[0] );
    let ys = polygon.vertices.map( p => p[1] );
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
        for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = -node.radius;
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
        for(let l = 0; l < iterations; l++) {
            for(let k = 0; k < nodes.length; k++) {
                let node = nodes[k];
                let polyPoints = polygon.vertices;
                let center = polygon.center;
                //// change focus to the center of the triangle
                // if( state.DRAGGED_SUBJECT && state.DRAGGED_SUBJECT.parent.index === polygon.index) {
                //     center =  state.DRAGGED_SUBJECT;
                // }
                let point = { x: node.x , y: node.y };
                let distances = [];
                let x = node.x,
                    y = node.y,
                    inter = false;

                // we loop over polygon's edges to check collisions
                for(let j = 0; j < polyPoints.length; j++){
                    let n = (j+1) < polyPoints.length ? (j+1) : 0;
                    let segment1 = { x: polyPoints[j][0], y: polyPoints[j][1] };
                    let segment2 = { x: polyPoints[n][0], y: polyPoints[n][1] };
                    let vector = pointToSegment(point, segment1, segment2);
                    let d = distToSegment(point, vector);
                    distances.push(d);

                    // set point orientation
                    let indexOfNearestSegment = distances.indexOf(Math.min(...distances));
                    let nearestSegment = {
                        p1: polyPoints[indexOfNearestSegment] || polyPoints[0],
                        p2: polyPoints[indexOfNearestSegment + 1] || polyPoints[0]
                    };
                    node.orientation = Math.atan2(nearestSegment.p2[1] - nearestSegment.p1[1], nearestSegment.p2[0] - nearestSegment.p1[0]);

                    // set min distance between the point and its nearest polygon segment
                    if( d < 30 ) {
                        let dvx = Math.abs(point.x - vector.x) / (d);
                        let dvy = Math.abs(point.y - vector.y) / (d);

                        node.vx += Math.sign(point.x - vector.x) * dvx;
                        node.vy += Math.sign(point.y - vector.y) * dvy;
                    }

                    // check whether point is intersecting with polygon bounds
                    inter = getLineIntersection(segment1.x, segment1.y, segment2.x, segment2.y, center.x, center.y, x, y);
                    if (inter) {
                        // d.x = (d.x + inter.x) * .5;
                        // d.y = (d.y + inter.y) * .5;
                        node.x = inter.x;
                        node.y = inter.y;
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

function cellHalfedgeStart(cell, edge) {
    return edge[+(edge.left !== cell.site)];
}
/*=====================================================================================================
                                         Drag Functions
======================================================================================================*/
function dragsubject() {
    let sbj, I, isInside;
    let point = [d3.event.x, d3.event.y];
    for(let i = 0; i < state.graphics.polygons.length; i ++){
        isInside = d3.polygonContains(state.graphics.polygons[i].vertices, point);
        if(isInside){
            I = i;
            break;
        }
    }
    sbj = state.simulations[I].find(d3.event.x, d3.event.y);
    state.DRAGGED_SUBJECT = sbj;
    console.log("DRAGGED_SUBJECT: ",state.DRAGGED_SUBJECT);
    return sbj;
}

function dragstarted() {
    d3.contextMenu('close');
    if(!state.isDragSelected) {
        state.simulations[d3.event.subject.parent.index]
            .force("center", d3.forceCenter(d3.event.x, d3.event.y))
            .restart();
    }
    if (!d3.event.active) state.simulations[d3.event.subject.parent.index].alphaTarget(0.3).restart();
    makePointInside();
}

function dragged() {
    if(!state.isDragSelected) {
        state.simulations[d3.event.subject.parent.index]
            .force("center", d3.forceCenter(d3.event.x, d3.event.y))
            .restart();
    }
    makePointInside();
}

function dragended() {
    if (!d3.event.active) state.simulations[d3.event.subject.parent.index].alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
    state.DRAGGED_SUBJECT = null;
}

function makePointInside() {
    let point = [d3.event.subject.x, d3.event.subject.y];
    let isInside = d3.polygonContains(state.graphics.polygons[d3.event.subject.parent.index].vertices, point);
    if(!isInside){
        d3.event.subject.fx = null;
        d3.event.subject.fy = null;
    }else{
        d3.event.subject.fx = d3.event.x;
        d3.event.subject.fy = d3.event.y;
    }
}
/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
// draw sites
function drawSite(site) {
    state.context().moveTo(site.x + 2.5, site.y);
    state.context().arc(site.x, site.y, 2.5, 0, 2 * Math.PI, false);
}

// draw links among sites
function drawLink(link) {
    state.context().moveTo(link.source[0], link.source[1]);
    state.context().lineTo(link.target[0], link.target[1]);
}

// draw polygons
function drawCell(width, color) {
    state.context().save();
    state.context().beginPath();
    for(let i = 0, n = state.graphics.polygons.length; i < n; i ++) {
        let cell = state.graphics.polygons[i].vertices;
        state.context().moveTo(cell[0][0], cell[0][1]);
        for (var j = 1, m = cell.length; j < m; ++j) {
            state.context().lineTo(cell[j][0], cell[j][1]);
        }
        state.context().closePath();
    }
    state.context().lineWidth = width;
    state.context().strokeStyle = color;
    // state.context().setLineDash([5,10]);
    state.context().stroke();
    state.context().closePath();
    state.context().restore();
}

// draw paths
function drawPaths(width, color) {
    state.context().save();
    state.context().beginPath();

    let pathSet = new Set();
    let count = 0;
    for(let i = 0; i < state.graphics.polygons.length; i ++) {
        let lineCreator = d3.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; })
            .curve(d3.curveCatmullRom.alpha(0.5));
            // .curve(d3.curveBasis);
        lineCreator.context(state.context());

        let vertices = state.graphics.polygons[i].vertices;
        for(let j = 0; j < vertices.length; j ++) {
            let k = (j+1) < vertices.length ? (j+1) : 0,
                p1 = vertices[j],
                p2 = vertices[k],
                lineHash1 = lineToHash(p1, p2),
                lineHash2 = lineToHash(p2, p1);
            if(pathSet.has(lineHash1)){
                count += 1;
            }else{
                lineCreator([p1, p2]);
                state.context().closePath();
                pathSet.add(lineHash1);
                pathSet.add(lineHash2);
            }
        }
        // lineCreator(vertices); // Array: [[x, y], [x, y], ..., [x, y]
        // state.context().closePath();
    }
    console.log("size: ", pathSet.size, "| count: ", count)
    state.context().lineWidth = width;
    state.context().strokeStyle = color;
    state.context().stroke();
    state.context().restore();
}

function pointToHash(point) {
    let x = Math.floor(point[0] * 1000);
    let y = Math.floor(point[1] * 1000);
    return x + y;
}

function lineToHash(point1, point2) {
    return pointToHash(point1) + pointToHash(point2);
}