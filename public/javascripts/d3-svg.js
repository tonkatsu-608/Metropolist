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
});

var isChecked = false;
var isSelected = false;
var state = {
    stack : [],
};

//undo functions
$('#undo').click(function () {
    circles = (state.stack && state.stack.length > 0) ? state.stack.pop() : circles;
    update();
});
$.Shortcut.on({
    "meta+Z": function () {
        circles = (state.stack && state.stack.length > 0) ? state.stack.pop() : circles;
        update();
    }
});
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = 5;

var n = 0;
var circles = d3.range(30).map(function() {
    return {
        n: n++,
        x: Math.round(Math.random() * width),
        y: Math.round(Math.random() * height)
    };
});
var color = d3.scaleOrdinal()
    .range(d3.schemeCategory20);

// control add/remove
d3.select('#switch').on('click', function (d) {
    isChecked = !isChecked;
    console.log(isChecked)
    d3.selectAll('g').on('click', (isChecked) ? remove : add);
});

var voronoi = d3.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .extent([[-1, -1], [width + 1, height + 1]]);

var circle = svg.selectAll("g")
    .data(circles)
    .enter().append("g")
    .attr('id',function(d) { return 'g-'+d.n })
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on('click', (isChecked) ? remove : add);

var cell = circle.append("path")
    .data(voronoi.polygons(circles))
    .attr("d", renderCell)
    .attr("class","cell")
    .attr("id", function(d) {  return "cell-" + d.data.n; });

circle.append("clipPath")
    .attr("id", function(d) { return "clip-" + d.n; })
    .append("use")
    .attr("xlink:href", function(d) { return "#cell-" + d.n; });

circle.append("circle")
    .attr("clip-path", function(d) { return "url(#clip-" + d.n + ")"; })
    .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
    .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(width - radius, d.y)); })
    .attr("r", radius)
    .style("fill", '#000');
    // .style("fill", function(d) { return color(d.n); });

var simulation = d3.forceSimulation(circles)
    .force("y", d3.forceY())
    .force("x", d3.forceX())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("A", isolate(d3.forceX(-width / 6), function(d) { return d.n % 2; }))
    .force("charge", d3.forceManyBody().strength(-10).distanceMax(50).distanceMin(10))
    .force('collision', d3.forceCollide().radius(function(d) {
        return (radius + 5);
    }))
    .on("tick", ticked);
//
// var simulation = d3.forceSimulation()
//     .nodes(circles)
//     .force('charge', d3.forceManyBody());
//
// simulation.nodes(circles)
//     .on('tick',ticked);

function ticked() {
    circle.selectAll('circle')
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })

    cell = cell.data(voronoi.polygons(circles)).attr("d", renderCell);

}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d3.select(this).select("circle").attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    cell = cell.data(voronoi.polygons(circles)).attr("d", renderCell);
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function renderCell(d) {
    return d == null ? null : "M" + d.join("L") + "Z";
}

function add() {
    // Add circle to circles:
    var result = d3.mouse(this);
    var newIndex = d3.max(circles, function(d) { return d.n; }) + 1;
    circles.push({x: result[0], y: result[1], n: newIndex });

    // Enter and Append:
    circle = svg.selectAll("g").data(circles).enter()

    var newSite = circle.append("g")
        .attr('id',function(d) { return 'g-'+d.n })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on('click',add)

    cell = circle.selectAll("path")
        .data(voronoi.polygons(circles)).enter();

    cell.select('#g-'+newIndex).append('path')
        .attr("d", renderCell)
        .attr("class","cell")
        .attr("id", function(d) { return "cell-" + d.data.n; });

    newSite.data(circles).enter();

    newSite.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.n; })
        .append("use")
        .attr("xlink:href", function(d) { return "#cell-" + d.n; });

    newSite.append("circle")
        .attr("clip-path", function(d) { return "url(#clip-" + d.n + ")"; })
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(width - radius, d.y)); })
        .attr("r", radius)
        .style("fill", '#000');
    // .style("fill", function(d) { return color(d.n); });

    cell = d3.selectAll('.cell');
    d3.select("#cell-"+newIndex).lower(); // ensure the path is above the circle in svg.
    // Update voronoi:
    cell = cell.data(voronoi.polygons(circles)).attr("d", renderCell);

    simulation.nodes(circles)
        .on('tick',ticked);
}

function remove () {
    d3.select(this).raise();
    var id = d3.select(this).attr('id').split('-')[1];
    id = +id;

    // Get the clicked item:
    var index = circles.map(function(d) {
        return d.n;
    }).indexOf(id);
    circles.splice(index,1);

    // Update circle data:
    var circle = svg.selectAll("g")
        .data(circles);
    circle.exit().remove();
    circle.selectAll("clipPath").exit().remove();

    // Update voronoi:
    d3.selectAll('.cell').remove();
    cell = circle.append("path")
        .data(voronoi.polygons(circles))
        .attr("d", renderCell)
        .attr("class","cell")
        .attr("id", function(d) { return "cell-" + d.data.n; });

    simulation.nodes(circles)
        .on('tick',ticked);
}

function isolate(force, filter) {
    var initialize = force.initialize;
    force.initialize = function() { initialize.call(force, circles.filter(filter)) };
    return force;
}