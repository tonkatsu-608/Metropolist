var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    maxRadius = 15;
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6; // separation between different-color nodes


var n = 200, // total number of nodes
    m = 30; // number of distinct clusters

var color = d3.scaleSequential(d3.interpolateRainbow)
    .domain(d3.range(m));

// The largest node for each cluster.
var clusters = new Array(m);

var nodes = d3.range(n).map(function () {
    var i = Math.floor(Math.random() * m),
        // r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
        r = Math.round(Math.random() * maxRadius)
        d = {
            cluster: i,
            radius: r,
            // x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
            // y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
            x: Math.round(Math.random() * width),
            y: Math.round(Math.random() * height)
        };
    if (!clusters[i] || (r > clusters[i].radius)) {
        clusters[i] = d;
    }
    return d;
});

var simulation = d3.forceSimulation()
    .nodes(nodes)
    .force('cluster', d3.forceCluster()
        .centers(function (d) { return clusters[d.cluster]; })
        .strength(1)
        .centerInertia(0.0))
    .force('collide', d3.forceCollide(function (d) { return d.radius + padding; })
        .strength(0))
    .on('tick', layoutTick);

var voronoi = d3.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .extent([[-1, -1], [width + 1, height + 1]]);

var circle = svg.selectAll("g")
    .data(clusters)
    .enter().append("g")
    .attr('id',function(d) { return 'g-'+d.cluster })
    .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    );

var cell = circle.append("path")
    .data(voronoi.polygons(clusters))
    .attr("d", renderCell)
    .attr("class","cell")
    .attr("id", function(d) {  return "cell-" + d.data.cluster; });

circle.append("clipPath")
    .attr("id", function(d) { return "clip-" + d.cluster; })
    .append("use")
    .attr("xlink:href", function(d) { return "#cell-" + d.cluster; });

var node = circle.selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .style('fill', function (d) { return color(d.cluster/10); })
    .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    );

// ramp up collision strength to provide smooth transition
var transitionTime = 3000;
var t = d3.timer(function (elapsed) {
    var dt = elapsed / transitionTime;
    simulation.force('collide').strength(Math.pow(dt, 2) * 0.7);
    if (dt >= 1.0) t.stop();
});

function layoutTick (e) {
    node
        .attr('cx', function (d) { return d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)); })
        .attr('cy', function (d) { return d.y = Math.max(d.radius, Math.min(width - d.radius, d.y)); })
        .attr('r', function (d) { return d.radius; });

    circle.selectAll('circle')
        .attr("cx", function(d) { return d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(d.radius, Math.min(width - d.radius, d.y)); })

    cell = cell.data(voronoi.polygons(clusters)).attr("d", renderCell);
}

function dragstarted (d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged (d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended (d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function renderCell(d) {
    return d == null ? null : "M" + d.join("L") + "Z";
}