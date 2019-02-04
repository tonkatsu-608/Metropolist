// clear array
Array.prototype.clear = function() {
    while (this.length) {
        this.pop();
    }
};

function Metro(canvas) {
    $(document).ready( function() {
        $('#render').click( function() {
            newGraphics();
        });

        $('#startEdit').click( function() {
            $('#startEdit').attr('hidden', true);
            $('#stopEdit').removeAttr('hidden', true);
            $('#elevationSwitch').removeAttr('disabled', true);
            $('#radius').removeAttr('disabled', true);
            $('#render').attr('disabled', true);

            state.isEditMode = true;
        });

        $('#stopEdit').click( function() {
            $('#stopEdit').attr('hidden', true);
            $('#startEdit').removeAttr('hidden', true);
            $('#elevationSwitch').attr('disabled', true);
            $('#radius').attr('disabled', true);
            $('#render').removeAttr('disabled', true);

            state.isEditMode = false;
        });

        $('#radius').on('change', function() {
            state.radius = this.value;

            render();
        });
    });

    var state = {
        N: 30,
        radius: 100,
        pointer: {},
        vertices: [],
        selectedSites: [],
        isEditMode: false,
        isIncreasing: false,
        canvas: canvas.node() || d3.select("canvas").node(),
        width () { return this.canvas.width; },
        height () { return this.canvas.height; },
        context () { return this.canvas.getContext("2d"); },
    };

    state.graphics = new Graphics();
    console.log(state);

    render();


    d3.select(state.canvas)
        .on('mousemove', onMouseMove)
        .on("wheel", onScroll);

    d3.select("body")
        .on("keydown", onKeyDown);
    /*=====================================================================================================
                                             Main Functions
    ======================================================================================================*/
    function Graphics() {
        this.sites = d3.range(state.N).map( () => [Math.random() * state.width(), Math.random() * state.height(), 0] );
        this.voronoi = d3.voronoi().extent([[20, 20], [state.width() - 20, state.height() - 20]]);
        this.diagram = this.voronoi( this.sites );
        this.polygons = makePolygons(this.diagram);
        this.cells = this.diagram.cells;
        this.edges = this.diagram.edges;
        this.links = this.diagram.links();
        this.triangles = this.diagram.triangles();
        // this.clusters = this.polygons.map( makeCluster );
        // this.buildings = getBuildings( this.clusters );
    }

    function makePolygons(diagram) {
        return diagram.cells.map((cell, index) => {
            let polygon = {};

            polygon.index = index;
            polygon.vertices = cell.halfedges.map(i => {
                polygon.site = cell.site.index;

                let startVertex = cellHalfedgeStart(cell, diagram.edges[i]);
                startVertex.edgeIndex = i;
                startVertex.vertexIndex = state.vertices.length;
                state.vertices.push(startVertex);

                let endVertex = cellHalfedgeEnd(cell, diagram.edges[i]);
                if(!endVertex.hasOwnProperty('edgeIndex') || !endVertex.hasOwnProperty('vertexIndex')) {
                    endVertex.edgeIndex = i;
                    endVertex.vertexIndex = state.vertices.length;
                    state.vertices.push(endVertex);
                }

                return startVertex.vertexIndex;
            });

            return polygon;
        });

        // get startPoint of edge
        function cellHalfedgeStart(cell, edge) {
            return edge[+(edge.left !== cell.site)];
        }

        // get endPoint of edge
        function cellHalfedgeEnd(cell, edge) {
            return edge[+(edge.left === cell.site)];
        }
    }

    // render
    function render() {
        state.context().clearRect(0, 0, state.width(), state.height());

        drawPolygons();
        drawEdges(2, '#CBC5B9'); // lineWidth, lineColor
        drawSites(5, 'black'); // lineWidth
        drawCircle('red');
    }

    function newGraphics() {
        state.vertices.clear();
        state.N = $('#input-sites').val() || 30;
        state.graphics = new Graphics();

        render();
    }

    function findSites(x, y, radius) {
        var i = 0,
            n = state.graphics.sites.length,
            dx,
            dy,
            d2,
            site,
            closest = [];

        if (radius == null) return;
        else radius *= radius;

        for (i = 0; i < n; ++i) {
            site = state.graphics.sites[i];
            dx = x - site[0];
            dy = y - site[1];
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest.push(site);
        }

        return closest;
    }

    // mouse event
    function onMouseMove() {
        if(state.isEditMode) {
            state.pointer = d3.mouse(this);
            state.selectedSites = findSites(state.pointer[0], state.pointer[1], state.radius);

            render();
        }
    }

    function onScroll() {
        if(state.isEditMode) {
            if(state.selectedSites.length > 0) {
                state.selectedSites.map(s => {
                    s[2] -= d3.event.deltaY / 100;
                });
            }
            render();

            // console.log("x: ", d3.event.deltaX, " | y: ", d3.event.deltaY, " | z: ", d3.event.deltaZ);
            // let direction = d3.event.wheelDelta < 0 ? 'down' : 'up';
            //
            // if(direction === 'down') {
            //     // increase
            // } else if(direction === 'up') {
            //     // decrease
            // }
        }
    }

    function onKeyDown() {
        if(d3.event.keyCode === 13) {
            if($('#sites').val() !== "") {
                newGraphics();
            }
        }
    }
    /*=====================================================================================================
                                             Draw Functions
    ======================================================================================================*/
    // draw circle following mouse
    function drawCircle(color) {
        state.context().save();
        state.context().beginPath();
        state.context().moveTo(state.pointer[0], state.pointer[1]);
        state.context().arc(state.pointer[0], state.pointer[1], state.radius, 0, 2 * Math.PI, false);
        state.context().arc(state.pointer[0], state.pointer[1], state.radius / 2, 0, 2 * Math.PI, false);

        state.context().moveTo(state.pointer[0], state.pointer[1]);
        state.context().lineTo(state.pointer[0] - state.radius, state.pointer[1]);

        state.context().moveTo(state.pointer[0], state.pointer[1] - state.radius);
        state.context().lineTo(state.pointer[0], state.height() - 20);

        state.context().lineWidth = 1.5;
        state.context().strokeStyle = color;
        state.context().stroke();
        state.context().restore();
    }

    /**
     * rgba(0, 0, 0, 1) represents black
     * rgba(0, 0, 0, 0) represents white
     */
    function drawSites(radius, color) {
        state.context().save();

        for (let i = 0, n = state.graphics.polygons.length; i < n; i++) {
            let site = state.graphics.sites[state.graphics.polygons[i].site];
            state.context().beginPath();
            state.context().moveTo(site[0] + radius, site[1]);
            state.context().arc(site[0], site[1], radius, 0, 2 * Math.PI, false);
            state.context().fillStyle = color;
            state.context().fill();
            state.context().strokeStyle = color;
            state.context().stroke();
            state.context().font = '15px Monda sans-serif';
            state.context().fillText(`${site[2].toFixed(1)}`, site[0] - 10, site[1] - 10);
        }
        state.context().restore();
    }

    // draw edges
    function drawEdges(width, color) {
        state.context().save();

        for (let i = 0; i < state.graphics.edges.length; i++) {
            let edge = state.graphics.edges[i];
            if (edge !== null && edge !== undefined) {
                let start = state.vertices[edge[0].vertexIndex];
                let end = state.vertices[edge[1].vertexIndex];

                state.context().beginPath();
                state.context().moveTo(start[0], start[1]);
                state.context().lineTo(end[0], end[1]);
                state.context().lineWidth = width
                state.context().strokeStyle = color;
                state.context().stroke();
            }
        }
        state.context().restore();
    }

    // draw polygons
    function drawPolygons() {
        state.context().save();

        for (let i = 0, polygons = state.graphics.polygons; i < polygons.length; i++) {
            state.context().fillStyle = `rgba(0, 0, 0, ${state.graphics.sites[polygons[i].site][2].toFixed(1)})`;
            state.context().beginPath();

            for(let j = 0, vertices = polygons[i].vertices; j < vertices.length; j++) {
                let vertex = state.vertices[vertices[j]];
                state.context().moveTo(vertex[0], vertex[1]);

                for(let l = 1; l < vertices.length; l ++) {
                    let nextVertex= state.vertices[vertices[l]];
                    state.context().lineTo(nextVertex[0], nextVertex[1]);
                }
            }
            state.context().closePath();
            state.context().fill();
        }
        state.context().restore();
    }

    return state;
}