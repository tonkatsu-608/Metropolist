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
    $('#switch').on('change', function () {
        if (this.checked) {
            isChecked = true;
        } else {
            isChecked = false;
        }
    });
    $('nav').click( function(e) {
        $('#panel').addClass('hide');
    });
});

var isChecked = false;
var isSelected = false;
var state = {
    stack : [],
};

//undo functions
$('#undo').click(function () {
    sites = (state.stack && state.stack.length > 0) ? state.stack.pop() : sites;
    render();
});
$.Shortcut.on({
    "meta+Z": function () {
        sites = (state.stack && state.stack.length > 0) ? state.stack.pop() : sites;
        render();
    }
});
/*=====================================================================================================
                                         Main Functions
======================================================================================================*/
var canvas = d3.select("canvas")
        .on("touchstart mousedown", mousedowned).node(),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;

var sites = d3.range(60).map(function(d) { return [Math.random() * width, Math.random() * height]; });
var voronoi = d3.voronoi()
    .extent([[-1, 1], [width + 1, height + 1]]);
var diagram, links, polygons;

render();
d3.select(canvas)
    .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on('start.render drag.render end.render', render)

var simulation = d3.forceSimulation(sites)
    .force("charge", d3.forceManyBody().strength(-10))
    .force("link", d3.forceLink(links).distance(200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .alphaTarget(1)
    .on("tick", render);

//mousedown
function mousedowned() {
    if(!isSelected){
        var node = d3.mouse(this);
        if(isChecked){
            var obj = diagram.find(node[0], node[1]);
            sites = sites.slice();
            sites.splice(obj.index, 1);
            state.stack.push(sites);
        }else{
            state.stack.push(sites);
            sites = sites.slice();
            sites.push(node)
        }
    }else{
        console.log("selected")
    }
    render();
}

//render
function render() {
    context.clearRect(0, 0, width, height);
    diagram = voronoi(sites);
    links = diagram.links();
    polygons = diagram.polygons();

    //draw polygons
    context.beginPath();
    for(var i = 0, n = polygons.length; i < n; ++i) {
        drawCell(polygons[i]);
    }
    context.strokeStyle = "#000";
    context.stroke();

    //draw links
    context.beginPath();
    for (var i = 0, n = links.length; i < n; ++i) {
        drawLink(links[i]);
    }
    context.strokeStyle = "rgba(0,0,0,0.2)";
    context.stroke();

    //draw sites
    context.beginPath();
    for (var i = 1, n = sites.length; i < n; ++i) {
        drawSite(sites[i]);
    }
    context.fillStyle = "#000";
    context.fill();
    context.strokeStyle = "#fff";
    context.stroke();
}

/*=====================================================================================================
                                         Draw Functions
======================================================================================================*/
function dragsubject() {
    var sbj = diagram.find(d3.event.x, d3.event.y);
    console.log("sbj: " + sbj);
    return sbj;
}

function dragstarted() {
    console.log("dragStarted: " + d3.event.subject)
    d3.event.subject.active = true;
}

function dragged() {
    console.log("dragged X: " + d3.event.x)
    console.log("dragged Y: " + d3.event.y)

    d3.event.subject.x = d3.event.x;
    d3.event.subject.y = d3.event.y;
}

function dragended() {
    console.log("dragEnded: " + d3.event.subject)
    d3.event.subject.active = false;
}


function drawSite(site) {
    context.moveTo(site[0] + 2.5, site[1]);
    context.arc(site[0], site[1], 2.5, 0, 2 * Math.PI, false);
}

function drawLink(link) {
    context.moveTo(link.source[0], link.source[1]);
    context.lineTo(link.target[0], link.target[1]);
}

function drawCell(cell) {
    if (!cell) return false;
    context.moveTo(cell[0][0], cell[0][1]);
    for (var j = 1, m = cell.length; j < m; ++j) {
        context.lineTo(cell[j][0], cell[j][1]);
    }
    context.closePath();
    return true;
}