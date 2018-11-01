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
    $('#dragSwitch').on('change', function () {
        if (this.checked) {
            state.isDragSelected = true;
        } else {
            state.isDragSelected = false;
        }
    });
});
var canvas = d3.select("canvas").node(),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;
var state = {
        N: 20, // quantity of polygons
        stack: [],
        isDragSelected: false,
        DRAGGED_SUBJECT: null,
        COLOR: d3.scaleOrdinal().range(d3.schemeCategory20), // random color
        DISTRICT_TYPES: ['rich', 'medium','poor','plaza'], // four types of districts
        simulations: [],
    }
var graphics = new Graphics(),
    polygons = graphics.polygons,
    clusters = graphics.clusters;
/*=====================================================================================================
                                     Constructor Functions
======================================================================================================*/
// initialize the graphics
function Graphics() {
    this.sites = d3.range(state.N).map( d => [Math.random() * width, Math.random() * height] );
    this.voronoi = d3.voronoi().extent([[2,2], [width-2, height-2]]);
    this.diagram = this.voronoi( this.sites );
    this.links = this.diagram.links();
    this.polygons = makePolygons(this.diagram);
    this.clusters = this.polygons.map( poly => makeCluster(poly));
}

function makePolygons(diagram) {
    let edges = diagram.edges;
    let polygons =  diagram.cells.map(function(cell, index) {
        let polygon = new Object();
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
        d = {
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
makeSimulations();
// initialize drag event
d3.select(canvas)
    .on('contextmenu', d3.contextMenu(menu))
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

// make simulations in using d3.forceSimulation
function makeSimulations() {
    for(let i = 0; i < polygons.length; i ++){
        let boudnsPoint = bounds(polygons[i]);
        let distance = Math.max(boudnsPoint.width, boudnsPoint.height) / 2;
        state.simulations[i] = d3.forceSimulation(clusters[i])
            .force("center", d3.forceCenter(polygons[i].center.x, polygons[i].center.y))
            .force("collide", d3.forceCollide(20).iterations(2))
            .force("polygonCollide", forceCollidePolygon(polygons[i]).radius(10).iterations(4))
            .force("myForce", myForce().distanceMin(10).distanceMax(distance).iterations(4))
            .on("tick", render)
        polygons[i].simulation = state.simulations[i];
    }
}

// render graphic
function render() {
    context.clearRect(0, 0, width, height);

    //draw polygons
    context.save();
    context.beginPath();
    for(let i = 0, n = polygons.length; i < n; i ++) {
        drawCell(polygons[i]);
    }
    context.lineCap = "round";
    context.lineWidth = 5;
    context.lineCap = "butt";
    context.strokeStyle = "#000";
    context.setLineDash([5,10]);
    context.stroke();
    context.closePath();
    context.restore();

    // // draw links
    // context.beginPath();
    // for (var i = 0, n = graphics.links.length; i < n; ++i) {
    //     drawLink(graphics.links[i]);
    // }
    // context.strokeStyle = "rgba(0,0,0,0.2)";
    // context.stroke();

    // draw foci/site
    context.save();
    context.beginPath();
    for (var i = 0, n = polygons.length; i < n; ++i) {
        drawSite(polygons[i].center);
    }
    context.fillStyle = "#000";
    context.fill();
    context.strokeStyle = "#fff";
    context.stroke();
    context.closePath();
    context.restore();

    // draw buildings
    for(let k = 0; k <  polygons.length; k ++) {
        for (let i = 0; i < clusters[k].length; i ++) {
            let d = clusters[k][i];
            let polyPoints = polygons[k].vertices;
            let center = polygons[k].center;
            // change focus to the center of the triangle
            // if( state.DRAGGED_SUBJECT && state.DRAGGED_SUBJECT.parent.index == polygons[k].index) {
            //     center =  state.DRAGGED_SUBJECT;
            // }
            let x = d.x,
                y = d.y,
                inter = false;
            for (let j = 0,L = polyPoints.length; j < L; j++) {
                let f = j,
                    s = (j + 1) < L ? (j + 1) : 0,
                    segment1 = { x: polyPoints[f][0], y: polyPoints[f][1] },
                    segment2 = { x: polyPoints[s][0], y: polyPoints[s][1] };

                // check whether point is intersecting with polygon bounds
                inter = getLineIntersection(segment1.x, segment1.y, segment2.x, segment2.y, center.x, center.y, x, y);
                if (inter) {
                    // d.x = (d.x + inter.x) * .5;
                    // d.y = (d.y + inter.y) * .5;
                    d.x = inter.x;
                    d.y = inter.y;
                    break;
                }
            }
            //clicked part turn to circles
            context.save();
            context.translate(d.x, d.y);
            context.rotate(d.orientation);
            context.translate( -(d.x), -(d.y));
            context.beginPath();
            context.rect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
            context.fillStyle = state.COLOR(k);
            context.fill();
            context.strokeStyle = "#333";
            context.lineWidth = 2;
            context.stroke();
            context.closePath();
            context.restore();
        }
    }
    // draw circle
    if(state.isDragSelected && state.DRAGGED_SUBJECT){
        let d = state.DRAGGED_SUBJECT;
        context.save();
        context.clearRect(d.x - d.width / 2, d.y - d.height / 2, d.width, d.height);
        context.beginPath();
        context.moveTo(d.x + d.radius / 2, d.y);
        context.arc(d.x, d.y, d.radius / 2, 0, 2 * Math.PI);
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
/*=====================================================================================================
                                         Drag Functions
======================================================================================================*/
function dragsubject() {
    let sbj, I, isInside;
    let point = [d3.event.x, d3.event.y];
    for(let i = 0; i < polygons.length; i ++){
        isInside = d3.polygonContains(polygons[i].vertices, point);
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
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
}

function dragged() {
    if(!state.isDragSelected) {
        state.simulations[d3.event.subject.parent.index]
            .force("center", d3.forceCenter(d3.event.x, d3.event.y))
            .restart();
    }
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
    render();
}

function dragended() {
    if (!d3.event.active) state.simulations[d3.event.subject.parent.index].alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
    state.DRAGGED_SUBJECT = null;
}
/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
// draw sites
function drawSite(site) {
    context.moveTo(site.x + 2.5, site.y);
    context.arc(site.x, site.y, 2.5, 0, 2 * Math.PI, false);
}

// draw links among sites
function drawLink(link) {
    context.moveTo(link.source[0], link.source[1]);
    context.lineTo(link.target[0], link.target[1]);
}

// draw polygons
function drawCell(cell) {
    if (!cell) return false;
    context.moveTo(cell.vertices[0][0], cell.vertices[0][1]);
    for (let j = 1, m = cell.vertices.length; j < m; ++j) {
        context.lineTo(cell.vertices[j][0], cell.vertices[j][1]);
    }
    context.closePath();
    return true;
}
/*=====================================================================================================
                                     Additional Functions
======================================================================================================*/
// set context menu
function menu(d) {
    let point = [d3.event.layerX, d3.event.layerY];
    let polygon = polygons.filter(poly => d3.polygonContains(poly.vertices, point))[0];
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

function remakeCluster(polygon) {
    let item = makeCluster(polygon);
    clusters.splice(polygon.index, 1, item);
    let boudnsPoint = bounds(polygon);
    let distance = Math.max(boudnsPoint.width, boudnsPoint.height) / 2;
    state.simulations[polygon.index] = d3.forceSimulation(item)
        .force("center", d3.forceCenter(polygon.center.x, polygon.center.y))
        .force("collide", d3.forceCollide(20).iterations(2))
        .force("polygonCollide", forceCollidePolygon(polygon).radius(10).iterations(4))
        .force("myForce", myForce().distanceMin(10).distanceMax(distance).iterations(4))
        .on("tick", render)
    polygon.simulation = state.simulations[polygon.index];
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
                if(!node.x || !node.y){
                    console.log(node);
                    return;
                }
                let polyPoints = polygon.vertices;
                let point = { x: node.x , y: node.y };
                let distances = [];

                // we loop over polygon's edges to check collisions
                for(let j = 0; j < polyPoints.length; j++){
                    let n = (j+1) < polyPoints.length ? (j+1) : 0;
                    let segment1 = { x: polyPoints[j][0], y: polyPoints[j][1] };
                    let segment2 = { x: polyPoints[n][0], y: polyPoints[n][1] };

                    // set polygon edge force
                    let vector = pointToSegment(point, segment1, segment2);
                    let d = distToSegment(point, vector);
                    distances.push(d);

                    if( d < 20 ) {
                        let dvx = Math.abs(point.x - vector.x) / (d);
                        let dvy = Math.abs(point.y - vector.y) / (d);

                        node.vx += Math.sign(point.x - vector.x) * dvx;
                        node.vy += Math.sign(point.y - vector.y) * dvy;
                    }
                    /*
                        Set item orientation
                        push all the distances into an array
                     */
                    // let indexOfNearestSegment = distances.indexOf(Math.min(...distances));
                    let indexOfNearestSegment = distances.indexOf(Math.min.apply(null, distances));
                    let nearestSegment = {
                        p1: polyPoints[indexOfNearestSegment],
                        p2: polyPoints[indexOfNearestSegment + 1] || polyPoints[0]
                    };

                    try{
                        node.orientation = Math.atan2(nearestSegment.p2[1] - nearestSegment.p1[1], nearestSegment.p2[0] - nearestSegment.p1[0]);
                    }catch(err) {

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