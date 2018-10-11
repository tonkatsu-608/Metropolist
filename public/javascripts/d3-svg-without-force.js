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

var polygons = voronoi.polygons(circles);

var circle = svg.selectAll("g")
    .data(circles)
    .enter().append("g")
    .attr('id',function(d) { return 'g-'+d.n })
    // .call(d3.drag()
    //     .on("start", dragstarted)
    //     .on("drag", dragged)
    //     .on("end", dragended))
    .on('click', (isChecked) ? remove : add);

var cell = circle.append("path")
    .data(polygons)
    .attr("d", renderCell)
    .attr("class","cell")
    .attr("id", function(d) {  return "cell-" + d.data.n; });

circle.append("clipPath")
    .attr("id", function(d) { return "clip-" + d.n; })
    .append("use")
    .attr("xlink:href", function(d) { return "#cell-" + d.n; });

circle.append("circle")
    .attr("clip-path", function(d) { return "url(#clip-" + d.n + ")"; })
    .attr("class","site")
    .attr("id", function(d) { return "site-" + d.n; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", radius)
    .style("fill", '#CBC5B9');
// .style("fill", function(d) { return color(d.n); });


for(var i = 0, n = polygons.length; i < n; i ++){
    var points = makeDots(polygons[i], 10, 15);

    for(var j = 0, m = points.length; j < m; j ++){
        console.log(points[j])

        circle.selectAll("circle")
            .data(points)
            .enter().append("circle")
            .attr("class","building")
            .attr("id", function (d) { return "building-" + i * j; })
            .attr("cx", function (d) { return d[0]; })
            .attr("cy", function (d) { return d[1]; })
            .attr("r", radius)
            .style("fill", function (d) { return color(i); });
    }
}


// for(var i = 0, n = 10, m = circles.length; i < m; i ++){
//     var cell = $('.cell')[i];
//     var bound = cell.getBoundingClientRect();
//     console.log("bound: ",bound)
//
//     var index= 0;
//     var buildings = d3.range(n).map(function() {
//         return {
//             n: index++,
//             x: Math.round(cell.getBoundingClientRect().right - Math.random() * cell.getBoundingClientRect().width) ,
//             y: Math.round(cell.getBoundingClientRect().bottom - Math.random() * cell.getBoundingClientRect().height)
//         };
//     });
//     console.log("buildings: ",buildings);
//     for(var j = 0; j < n; j ++) {
//         var building = circle.selectAll("circle")
//             .data(buildings)
//             .enter().append("circle")
//             .attr("class","building")
//             .attr("id", function (d) { return "building-" + i*j; })
//             .attr("cx", function (d) { return d.x; })
//             .attr("cy", function (d) { return d.y; })
//             .attr("r", radius)
//             .style("fill", function (d) { return color(d.n); });
//     }
// }

//multiple buildings
// for(var i = 0, n = circles.length; i < n; i++){
//     var cell = $('.cell')[i];
//     var bound = cell.getBoundingClientRect();
//     var cell = $('.site')[i];
//
//     console.log("cell", cell);
//     console.log("bound", bound);
//     console.log("circle: ",circle)
//
//     for(var j = 0, m = Math.round(Math.random() * 5 + 5); j < m; j++){
//
//
//         svg.select(`#g-${i}`)
//             .append("circle")
//             .attr("id", function (d) { return "#building-" + j })
//             .attr("cx", function(d) { return d.x; })
//             .attr("cy", function(d) { return d.y; })
//             .attr("r", Math.round(Math.random() * 10))
//             .style("fill", function(d) { return color(d.n); });
//     }
// }

function dragstarted(d) {
    // if (!d3.event.active) simulation.alphaTarget(0.3).restart();
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
    // if (!d3.event.active) simulation.alphaTarget(0);
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
        .attr("class","site")
        .attr("id", function(d) { return "site-" + d.n; })
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", radius)
        .style("fill", '#000');
    // .style("fill", function(d) { return color(d.n); });

    cell = d3.selectAll('.cell');

    d3.select("#cell-"+newIndex).lower(); // ensure the path is above the circle in svg.

    // Update voronoi:
    cell = cell.data(voronoi.polygons(circles)).attr("d", renderCell);
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