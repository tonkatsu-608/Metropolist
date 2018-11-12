/*
    polygons = [Polygon, Polygon, Polygon, ..., Polygon]
    Polygon {
        index: Int,
        area: Float,
        site: [x, y],
        buildings: Int,
        center: [x, y],
        simulation: Object,
        bounds: [width, height],
        children: [Item, Item, Item, ..., Item],
        vertices : [[x1, y1], [x2, y2], ..., [xn, yn]],
        type : one of ['rich', 'medium', 'poor', 'plaza'],
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
        offset: Int,
        parent: Polygon,
        orientation: Float,
        symbol: one of ['symbolCircle', 'symbolCross', 'symbolDiamond', 'symbolSquare', 'symbolStar', 'symbolTriangle', 'symbolWye']
    }
 */
$(document).ready(function () {
    $('#render').click( function() {
        newGraphics();
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
    N: 20, // quantity of polygons
    SIGN: Math.random() < 0.5 ? -1 : 1, // make positive or negative 1
    stack: [],
    simulations: [],
    isDragSelected: false,
    DRAGGED_SUBJECT: null,
    canvas: d3.select("canvas").node(),
    width () { return this.canvas.width; },
    height () { return this.canvas.height; },
    context () { return this.canvas.getContext("2d"); },
    COLOR: d3.scaleOrdinal().range(d3.schemeCategory20), // random color
    DISTRICT_TYPES: ['rich', 'medium','poor','plaza'], // four types of districts
    SYMBOL_TYPES: ['symbolCircle', 'symbolCross', 'symbolDiamond', 'symbolSquare', 'symbolTriangle', 'symbolWye']

};
state.graphics = new Graphics();

// 1. Add more shapes of buildings
// 2. Correct boundary collision
// 3. Make city looks more likes a city
/*=====================================================================================================
                                     Constructor Functions
======================================================================================================*/
function Graphics() {
    this.clippingCircle = {
        cx: state.width() / 2,
        cy: state.height() / 2,
        r: Math.min(state.width(), state.height()) / 2
    };
    this.sites = makeSites(this.clippingCircle);
    // this.sites = d3.range(state.N).map( s => [Math.random() * state.width(), Math.random() * state.height()] );
    this.voronoi = d3.voronoi().extent([[20, 20], [state.width() - 20, state.height() - 20]]);
    this.diagram = this.voronoi( this.sites );
    this.links = this.diagram.links();
    this.polygons = makePolygons(this.diagram);
    this.clusters = this.polygons.map( makeCluster );
}

// make sites
function makeSites(clippingCircle) {
    return d3.range(state.N).map( () => {
        let len = (clippingCircle.r - 50) * Math.sqrt(Math.random()),
            angle = Math.random() * 2 * Math.PI;

        return [
            clippingCircle.cx + len * Math.cos(angle),
            clippingCircle.cy + len * Math.sin(angle)
        ];
    });
}

// make polygons(districts)
function makePolygons(diagram) {
    let edges = diagram.edges;
    return diagram.cells.map(function(cell, index) {
        let polygon = {};
        let vertices = cell.halfedges.map(function(i) {
            let vertex = cellHalfedgeStart(cell, edges[i]);
            polygon.site = {x: cell.site.data[0], y: cell.site.data[1]};
            return vertex;
        });
        polygon.index = index;
        polygon.children = null;
        polygon.vertices = vertices;
        polygon.bounds = bounds(vertices);
        polygon.area = d3.polygonArea(vertices);
        polygon.type = state.DISTRICT_TYPES[Math.floor(Math.random() * 4)];
        polygon.center = {x: d3.polygonCentroid(vertices)[0], y: d3.polygonCentroid(vertices)[1]};
        return polygon;
    });
}

// make clusters(buildings)
function makeCluster(poly) {
    let number = 0;
    let width = poly.bounds.width;
    let height = poly.bounds.height;
    switch (poly.type){
        case 'rich':
            number = Math.round(Math.random() * Math.round(height / 35) + 5);
            break;
        case 'medium':
            number = Math.round(Math.random() * Math.round(height / 25) + 5);
            break;
        case 'poor':
            number = Math.round(Math.random() * Math.round(height / 20) + 5);
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
                d.width = Math.round(Math.random() * 10 + width / 10);
                d.height = Math.round(Math.random() * 10 + height / 10);
                break;
            case 'medium':
                d.width = Math.round(Math.random() * 10 + width / 20);
                d.height = Math.round(Math.random() * 10 + height / 20);
                break;
            case 'poor':
                d.width = Math.round(Math.random() * 10 + width / 30);
                d.height = Math.round(Math.random() * 10 + height / 30);
                break;
            case 'plaza':
                d.width = Math.round(Math.random() * 10 + width / number / 2);
                d.height = Math.round(Math.random() * 10 + height / number / 2);
                break;
            default:
                d.width = Math.round(Math.random() * 10 + poly.bounds.width / number);
                d.height = Math.round(Math.random() * 10 + poly.bounds.width / number);
        }
        d.radius = Math.sqrt(2) * (d.width + d.height) / 2;
        d.offset = {x: Math.round(Math.random() * d.width) / 2, y: Math.round(Math.random() * d.height / 2)};
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
    .on("contextmenu", d3.contextMenu(menu));

d3.select("body")
    .on("keydown", onKeyDown);

// render graphic
function render() {
    state.context().clearRect(0, 0, state.width(), state.height());
    // drawLink();
    drawPaths( 2, 'black');
    drawSites('black');

    // draw clusters
    for(let k = 0; k <  state.graphics.polygons.length; k ++) {
        for (let i = 0; i < state.graphics.clusters[k].length; i ++) {
            let d = state.graphics.clusters[k][i];
            state.context().save();
            state.context().translate(d.x, d.y);
            state.context().rotate(d.orientation);
            state.context().translate( -(d.x), -(d.y));
            state.context().beginPath();
            // state.context().arc(d.x, d.y, d.radius / 2, 0, 2 * Math.PI);

            state.context().rect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
            state.context().globalCompositeOperation = 'destination-over';
            state.context().rect(d.x - d.offset.x , d.y - d.offset.y, d.width - d.offset.x, d.height - d.offset.y);

            // state.context().fillStyle = state.COLOR(k);
            state.context().fillStyle = "#98948b";
            state.context().fill();
            state.context().strokeStyle = "#000";
            state.context().lineWidth = 3;
            state.context().stroke();
            state.context().closePath();
            state.context().restore();
        }
    }
    // draw dragging circle
    if(state.isDragSelected && state.DRAGGED_SUBJECT){
        let d = state.DRAGGED_SUBJECT;
        state.context().save();
        state.context().clearRect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
        state.context().translate(d.x, d.y);
        state.context().rotate(d.orientation);
        state.context().translate( -(d.x), -(d.y));
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
        makeSimulations(state.graphics.polygons[i], state.graphics.polygons[i].children);
    }
}

// render every n ticks;
function onTick(n) {
    let tickCount = 0;

    return () => {
        tickCount++;

        if( tickCount % n === 0 ) {
            render();
            tickCount = 0;
        }else{
            console.log("tick");
            tickCount = 0;
        }
    }
}

function newGraphics() {
    state.N = $('#sites').val();
    state.simulations.forEach(s => s.stop());
    state.graphics = new Graphics();
    startSimulations();
}

// make simulations in using d3.forceSimulation
function makeSimulations(polygon, cluster) {
    let collision = Math.sqrt(polygon.area / polygon.children.length) / Math.sqrt(2) / 2;
    let distance = Math.max(polygon.bounds.width, polygon.bounds.height) / 2;
    state.simulations[polygon.index] = d3.forceSimulation(cluster)
        .force("center", d3.forceCenter(polygon.center.x, polygon.center.y))
        .force("myForce", myForce().distanceMin(collision).distanceMax(distance).iterations(4))
        .force("collide", d3.forceCollide(d => d.radius).iterations(2))
        // .force("collide", rectCollide().size(function (d) { return [d.radius * 2, d.radius * 2] }).iterations(2))
        .force("polygonCollide", forceCollidePolygon(polygon).radius(10))
        // .on("tick", () => Math.random() < .1 ? render() : 'render' );
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

// custom collision among buildings
function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)
                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index > node.index) {
                    var x = xi - xCenter(data)
                    var y = yi - yCenter(data)
                    var xd = Math.abs(x) - xSize
                    var yd = Math.abs(y) - ySize

                    if (xd < 0 && yd < 0) {
                        var l = Math.sqrt(x * x + y * y)
                        var m = masses[data.index] / (mass + masses[data.index])

                        if (Math.abs(xd) < Math.abs(yd)) {
                            node.vx -= (x *= xd / l * strength) * m;
                            data.vx += x * (1 - m);
                        } else {
                            node.vy -= (y *= yd / l * strength) * m;
                            data.vy += y * (1 - m);
                        }
                    }
                }
                return
            }
            return x0 > xi + xSize || y0 > yi + ySize || x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
            ? (size = typeof _ === 'function' ? _ : constant(_), force)
            : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force
}

// custom force
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

// custom force of polygon collision
// inspired from http://bl.ocks.org/larsenmtl/39a028da44db9e8daf14578cb354b5cb
function forceCollidePolygon(polygon, radius){
    var nodes, n, iterations = 1;

    // took from d3-force/src/collide.js
    if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

    function force(){
        for(let l = 0; l < iterations; l++) {
            for(let k = 0; k < nodes.length; k++) {
                let node = nodes[k],
                    point = { x: node.x , y: node.y },
                    polyPoints = polygon.vertices,
                    center = polygon.center,
                    radius = node.radius,
                    inter = false,
                    vectors = [],
                    distances = [],
                    minDistance = 0,
                    indexOfNearestSegment = 0;

                // we loop over polygon's edges to check collisions
                for(let j = 0; j < polyPoints.length; j++) {
                    let n = (j+1) < polyPoints.length ? (j+1) : 0;
                    let segment1 = { x: polyPoints[j][0], y: polyPoints[j][1] };
                    let segment2 = { x: polyPoints[n][0], y: polyPoints[n][1] };
                    let vector = pointToSegment(point, segment1, segment2);
                    let d = distToSegment(point, vector);

                    vectors.push(vector)
                    distances.push(d);
                    minDistance = Math.min(...distances)
                    indexOfNearestSegment = distances.indexOf(minDistance);

                    // set min distance between the point and its nearest polygon segment
                    if( d < 30) {
                        let dvx = Math.abs(point.x - vector.x) / (d);
                        let dvy = Math.abs(point.y - vector.y) / (d);
                        node.vx += Math.sign(point.x - vector.x) * dvx;
                        node.vy += Math.sign(point.y - vector.y) * dvy;
                    }

                    // boundary detection
                    if (minDistance <= radius) {
                        let dvx = Math.abs(point.x - vectors[indexOfNearestSegment].x) / (minDistance);
                        let dvy = Math.abs(point.y - vectors[indexOfNearestSegment].y) / (minDistance);
                        node.vx = 0;
                        node.vy = 0;
                        node.vx += Math.sign(point.x - vectors[indexOfNearestSegment].x) * dvx;
                        node.vy += Math.sign(point.y - vectors[indexOfNearestSegment].y) * dvy;
                    }

                    // check whether point is intersecting with polygon bounds
                    inter = getLineIntersection(segment1.x, segment1.y, segment2.x, segment2.y, center.x, center.y, point.x, point.y);
                    if (inter) {
                        // d.x = (d.x + inter.x) * .5;
                        // d.y = (d.y + inter.y) * .5;
                        node.x = inter.x;
                        node.y = inter.y;
                        break;
                    }
                }

                // set point orientation
                let nearestSegment = {
                    p1: polyPoints[indexOfNearestSegment] || polyPoints[0],
                    p2: polyPoints[indexOfNearestSegment + 1] || polyPoints[0]
                };
                node.orientation = Math.atan2(nearestSegment.p2[1] - nearestSegment.p1[1], nearestSegment.p2[0] - nearestSegment.p1[0]);
            }
        }
        return;
    }

    force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.initialize = function(_) {
        n = (nodes = _).length;
    };

    force.radius = function(_) {
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
    // return (Math.random() - 0.5) * 1e-6;
    return 0;
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
    let l2 = dist2(v, w);

    if (l2 === 0) return dist2(p, v);

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

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

// get bounds of a specific polygon
function bounds( polygon ) {
    let xs = polygon.map( p => p[0] ),
        ys = polygon.map( p => p[1] ),
        minX = Math.min.apply( null, xs ),
        maxX = Math.max.apply( null, xs ),
        minY = Math.min.apply( null, ys ),
        maxY = Math.max.apply( null, ys );

    return { width : maxX - minX, height : maxY - minY };
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
    try { sbj = state.simulations[I].find(d3.event.x, d3.event.y); } catch {}
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
    render();
}

function dragended() {
    if (!d3.event.active) state.simulations[d3.event.subject.parent.index].alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
    state.DRAGGED_SUBJECT = null;
}

function makePointInside() {
    let center = d3.event.subject.parent.center;
    let polyPoints = d3.event.subject.parent.vertices;

    for(let j = 0; j < polyPoints.length; j++) {
        let n = (j + 1) < polyPoints.length ? (j + 1) : 0;
        let segment1 = {x: polyPoints[j][0], y: polyPoints[j][1]};
        let segment2 = {x: polyPoints[n][0], y: polyPoints[n][1]};
        // check whether point is intersecting with polygon bounds
        let inter = getLineIntersection(segment1.x, segment1.y, segment2.x, segment2.y, center.x, center.y, d3.event.x, d3.event.y);
        if (inter) {
            d3.event.subject.fx = inter.x;
            d3.event.subject.fy = inter.y;
            break;
        } else {
            d3.event.subject.fx = d3.event.x;
            d3.event.subject.fy = d3.event.y;
        }
    }
}
/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
// draw centers/sites
function drawSites(color) {
    state.context().save();
    state.context().beginPath();
    for (let i = 0, n = state.graphics.polygons.length; i < n; ++i) {
        let site = state.graphics.polygons[i].center;
        state.context().moveTo(site.x + 2.5, site.y);
        state.context().arc(site.x, site.y, 2.5, 0, 2 * Math.PI, false);
    }
    state.context().fillStyle = color;
    state.context().fill();
    state.context().strokeStyle = "#fff";
    state.context().stroke();
    state.context().closePath();
    state.context().restore();
}

// draw links among sites
function drawLink() {
    state.context().beginPath();
    for (let i = 0, n = state.graphics.links.length; i < n; ++i) {
        let link = state.graphics.links[i];
        state.context().moveTo(link.source[0], link.source[1]);
        state.context().lineTo(link.target[0], link.target[1]);
    }
    state.context().strokeStyle = "rgba(0,0,0,0.2)";
    state.context().stroke();
}

// draw paths
function drawPaths(width, color) {
    state.context().save();
    state.context().beginPath();

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
                p2 = vertices[k];
            lineCreator([p1, [(p1[0] + p2[0])/2 + 10 * state.SIGN, (p1[1] + p2[1])/2 + 10 * state.SIGN],  p2]);
        }
    }
    state.context().lineWidth = width;
    state.context().strokeStyle = color;
    state.context().stroke();
    state.context().closePath();
    state.context().restore();
}
/*=====================================================================================================
                                        Key Functions
======================================================================================================*/
function onKeyDown() {
    if(d3.event.keyCode === 13){
        if($('#sites').val() !== ""){
            newGraphics();
        }
    }
}