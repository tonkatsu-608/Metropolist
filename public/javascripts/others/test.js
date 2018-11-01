var viz = {
    size: {width: 960, height: 800},
    clusters: [{name: 'a'},{name:'b'},{name:'c'}],
    colors: d3.scale,
    polygons_params: {
        ta:4/9, // the height of the top middle segment (in proportion of height)
        tb:7/9 // the height of the 2 bottom left & right segments (in proportion of height)
    }
};

var svg = d3.select("svg")
    .attr("width",  viz.size.width)
    .attr("height", viz.size.height);


function initLayout(cluster){
    // this new scale helps us to have similar size in different clusters
    var scale = d3.scaleLinear()
        .domain(d3.extent(cluster.data.map(function(d){
            return d.size;
        })))
        .range([5, 30]);
    var radius = function(d){
        return scale(d.size) + 5;
    }

    var polygon = svg.append('polygon')
        .attr('points', cluster.polygon)
        .attr('stroke', '#000')
        .attr('fill', '#bbb')
        .attr('stroke-width', 2)
        .style('opacity', 0.3);

    var bubbles = svg.append('g').attr('class', 'bubbles '+cluster.name)
        .selectAll('.bubble')
        .data(cluster.data).enter()
        .append('circle')
        .attr('class', 'bubble')
        .attr('r', function(d){ return scale(d.size);})
        .attr('stroke-width', 2)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

    var center = d3.polygonCentroid(cluster.polygon);
    // improve bottom cluster positionning
    if(center[1] > viz.size.height*0.5){
        center[1] -= center[1]/15;
    }
    var force = d3.forceSimulation(cluster.data)
        .force('center', d3.forceCenter(center[0], center[1]))
        .force('polygonCollide',
            forceCollidePolygon(cluster.polygon)
                .radius(radius).iterations(4)
        )
        .force('collide', d3.forceCollide(radius).iterations(3))
        .on('tick', function(){
            bubbles.attr('transform', function(d){
                return 'translate('+d.x+','+d.y+')';
            });
        });
    return force;
}

function initPolygons(){
    // pseudo-triangles parameters
    var ta = viz.polygons_params.ta, tb = viz.polygons_params.tb;
    var w = viz.size.width, h = viz.size.height;
    var points = {
        a:[ 0,   0],
        b:[ w,   0],
        c:[ w,   h],
        d:[ 0,   h],
        e:[ w/2, 0],
        f:[ w,   tb * h],
        g:[ 0,   tb * h],
        h:[ w/2, ta * h]
    };
    return {
        a:[points.a, points.e, points.h, points.g],
        b:[points.e, points.b, points.f, points.h],
        c:[points.g, points.h, points.f, points.c, points.d]
    };
}

var polygons = initPolygons();
viz.clusters = viz.clusters.map(function(c){
    c.data = d3.range(55).map(function(){
        return { size: (Math.random() * 70 + 5) };
    });
    c.polygon = polygons[c.name];
    c.layout  = initLayout(c);
    return c;
});

console.log(viz.clusters)

function dragstarted (d) {
    if (!d3.event.active) viz.clusters.forEach(f => f.layout.alphaTarget(0.3).restart());
    console.log("dragstarted: ",d)
    d.fx = d.x;
    d.fy = d.y;
}

function dragged (d) {
    console.log("dragged: ",d)
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended (d) {
    if (!d3.event.active) viz.clusters.forEach(f => f.layout.alphaTarget(0));
    d.fx = null;
    d.fy = null;
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
    function intersection(p0, p1, p2, p3){
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

    function force(){
        for(var l = 0; l < iterations; l++){
            for(var k = 0; k < nodes.length; k++){
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
                        node.vx = -px/Math.sqrt(absub(i.x, t[0]) + jiggle());
                        node.vy = -py/Math.sqrt(absub(i.y, t[1]) + jiggle());
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