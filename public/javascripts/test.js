var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height,
    tau = 2 * Math.PI;

var color = d3.scaleOrdinal().range(d3.schemeCategory20c);

function makeGraphics() {
    var sites = d3.range(30).map( d => [Math.random() * width, Math.random() * height]);
    var voronoi = d3.voronoi().extent([[-1, 1], [width + 1, height + 1]]);
    var diagram = voronoi( sites );
    var links = diagram.links();
    var polygons = diagram.polygons();

    return {
        sites : sites,
        voronoi : voronoi,
        diagram : diagram,
        polygons : polygons,
        links : links
    }
}
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
var graphics = makeGraphics();
var foci = [];

for(var i = 0; i < graphics.sites.length; i ++){
    foci.push(graphics.sites[i]);
}
// for(var i = 0; i < graphics.polygons.length; i ++){
//     foci.push(d3.polygonCentroid(graphics.polygons[i]));
// }

var nodes = d3.range(100).map(function(i) {
    return {
        index: i,
        id: ~~(Math.random() * foci.length),
        r: Math.random() * 10 + 5
    };
});
console.log(nodes)

var simulation = d3.forceSimulation(nodes)
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(function(d) { return d.r + 10; }).iterations(2))
    .on("tick", ticked);

d3.select(canvas)
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
// .on('start.render drag.render end.render', render);

function ticked() {
    // Push nodes toward their designated focus.
    var k = 0.03;
    nodes.forEach(function(o,i) {
        o.x += (foci[o.id][0] - o.x) * k;
        o.y += (foci[o.id][1] - o.y) * k;
        o.x = Math.max(o.r, Math.min(width - o.r, o.x));
        o.y = Math.max(o.r, Math.min(height - o.r, o.y));
    });

    context.clearRect(0, 0, width, height);
    context.save();

    //draw polygons
    context.beginPath();
    for(var i = 0, n = graphics.polygons.length; i < n; ++i) {
        drawCell(graphics.polygons[i]);
    }
    context.strokeStyle = "#000";
    context.stroke();

    //draw points
    for(var i = 0; i < nodes.length; i ++){
        var d = nodes[i];
        var polyPoints = graphics.polygons[d.id];
        var N = polyPoints.length;
        // var dx = Math.max(d.r, Math.min(width - d.r, d.x));
        // var dy = Math.max(d.r, Math.min(width - d.r, d.y));

        // change focus to the center of the triangle
        var cent = d3.polygonCentroid(polyPoints);
        var x = (d.x - (width / 2  - cent[0])),
            y = (d.y - (height / 2 - cent[1])),
            inter = false;

        for(var j = 0; j < N; j++){
            var f = j,
                s = (j + 1) < N ? (j + 1) : 0,
                inter = getLineIntersection(polyPoints[f][0], polyPoints[f][1],
                    polyPoints[s][0], polyPoints[s][1], cent[0], cent[1], x, y);
            if (inter){
                x = inter.x;
                y = inter.y;
                break;
            }
        }

        context.beginPath();
        context.moveTo(d.x + d.r, d.y);
        // context.moveTo(dx + d.r, dy);
        context.arc(d.x, d.y, d.r, 0, tau);
        context.fillStyle = color(i);
        context.fill();
        context.strokeStyle = "#333";
        context.stroke();

    }

    // draw links
    // context.beginPath();
    // for (var i = 0, n = graphics.links.length; i < n; ++i) {
    //     drawLink(graphics.links[i]);
    // }
    // context.strokeStyle = "rgba(0,0,0,0.2)";
    // context.stroke();

    // draw sites
    // context.beginPath();
    // for (var i = 1, n = graphics.sites.length; i < n; ++i) {
    //     drawSite(graphics.sites[i]);
    // }
    // context.fillStyle = "#000";
    // context.fill();
    // context.strokeStyle = "#fff";
    // context.stroke();

    context.restore();
}

/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
function drawCell(cell) {
    if (!cell) return false;
    context.moveTo(cell[0][0], cell[0][1]);
    for (var j = 1, m = cell.length; j < m; ++j) {
        context.lineTo(cell[j][0], cell[j][1]);
    }
    context.closePath();
    return true;
}

function drawSite(site) {
    context.moveTo(site[0] + 2.5, site[1]);
    context.arc(site[0], site[1], 2.5, 0, 2 * Math.PI, false);
}

function drawLink(link) {
    context.moveTo(link.source[0], link.source[1]);
    context.lineTo(link.target[0], link.target[1]);
}

/*=====================================================================================================
                                         Drag Functions
======================================================================================================*/
function dragsubject() {
    var sbj = simulation.find(d3.event.x, d3.event.y);
    console.log("sbj:",sbj);
    return sbj;
}

function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    var d = d3.event.subject;
    d3.event.subject.fx = Math.max(d.r, Math.min(width - d.r, d3.event.subject.x)) ;
    d3.event.subject.fy = Math.max(d.r, Math.min(height - d.r, d3.event.subject.y)) ;
    // d3.event.subject.fx = d3.event.subject.x;
    // d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
    var d = d3.event.subject;
    d3.event.subject.fx = Math.max(d.r, Math.min(width - d.r, d3.event.x));
    d3.event.subject.fy = Math.max(d.r, Math.min(height - d.r, d3.event.y));
    // d3.event.subject.fx = d3.event.x;
    // d3.event.subject.fy = d3.event.y;
}

function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
}

/*=====================================================================================================
                                     Additional Functions
======================================================================================================*/
// from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
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