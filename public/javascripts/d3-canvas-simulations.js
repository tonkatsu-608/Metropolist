var canvas = d3.select("canvas")
    // .on("touchstart mousedown", mousedowned)
        .node(),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;

var isChecked = false;
var isSelected = false;
var state = {
    stack : [],
    points: []
};
var tau = 2 * Math.PI;
var N = 30;//sites num
var W = 10, R = 5;//building size
var CLUSTERS_PER_CELL = 3;//buildings num for each district
var color = d3.scaleOrdinal().range(d3.schemeCategory20);

function makeGraphics() {
    var sites = d3.range(N).map( d => [Math.random() * width, Math.random() * height] );
    // var sites = d3.range(N).map(function (i) {
    //     return {
    //         index: i,
    //         r: Math.round(Math.random() * 10 + 5),
    //         x: Math.random() * width,
    //         y: Math.random() * height
    //     };
    // });
    console.log(sites)
    var voronoi = d3.voronoi().extent([[-1, 1], [width + 1, height + 1]]);
    var diagram = voronoi( sites );
    var links = diagram.links();
    var polygons = diagram.polygons();
    var clusters = polygons.map( poly => makeDots( poly, CLUSTERS_PER_CELL, 10 ) );
    console.log(clusters)
    var foci = polygons.map( poly => d3.polygonCentroid(poly));

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
var graphics = makeGraphics();