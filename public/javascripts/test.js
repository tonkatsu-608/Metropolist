var width = 1400,
    height = 750,
    radius = 10;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#eee");

// center of svg
var px = width / 4,
    py = height / 2.5,
    nodes = d3.range(20).map(function(d){ return {} });

generateLayout(Math.round(Math.random() * 10));

function generateLayout(ns){

    svg.selectAll("*").remove();

    if (!ns) ns = parseInt(Math.random() * 5) + 4;

    var ang = d3.range(ns).map(function(d){ return Math.random() * (2 * Math.PI) }).sort();

    var polyPoints = ang.map(function(a){
        var r = (Math.random() * Math.min(width, height)) / 2,
            x = r * Math.cos(a) + px;
        y = r * Math.sin(a) + py;
        return [x, y];
    });

    var cent = d3.geom.polygon(polyPoints).centroid();

    svg.append("polygon")
        .style("stroke", "black")
        .style("fill", "none")
        .attr("points", polyPoints.join(" "));

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links([]);

    force.linkDistance(100);
    force.charge(-200);

    var node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .call(force.drag);

    var N = polyPoints.length;
    force.on('tick', function(e) {

        node.attr('r', radius)
            .attr('transform', function(d) {

                // change focus to the center of the triangle
                var x = (d.x - (width / 2 - cent[0])),
                    y = (d.y - (height / 2 - cent[1])),
                    inter = false;

                for (var i = 0; i < N; i++){
                    var f = i,
                    s = (i + 1) < N ? (i + 1) : 0,
                    inter = getLineIntersection(polyPoints[f][0], polyPoints[f][1],
                        polyPoints[s][0], polyPoints[s][1], cent[0], cent[1], x, y);

                    if (inter){
                        x = inter.x;
                        y = inter.y;
                        break;
                    }
                }

                return "translate(" + x + "," + y + ")";
            });
    });

    force.start();
}

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
