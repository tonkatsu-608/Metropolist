// clear array
Array.prototype.clear = function() {
    while (this.length) {
        this.pop();
    }
};

// affluence, desirability

function Metro(canvas) {
    $(document).ready( function() {
        $('select').formSelect();

        $('#render').click( function() {
            newGraphics();
        });

        $('#renderControlLine').click( function() {
            if(state.LAYER === 2) {
                render();
                drawContourLines(0.25, 'red', 2);
                drawContourLines(0.5, 'yellow', 2);
                drawContourLines(0.75, 'blue', 2);
            }
        });

        $('#startEdit').click( function() {
            $('#startEdit').attr('hidden', true);
            $('#stopEdit').removeAttr('hidden', true);
            $('.layerSelect').removeAttr('hidden', true);
            $('.elevationSwitch').removeAttr('hidden', true);
            $('.incrementSlider').removeAttr('hidden', true);
            $('#renderControlLine').removeAttr('hidden', true);

            state.isEditMode = true;
            render();
        });

        $('#stopEdit').click( function() {
            $('#stopEdit').attr('hidden', true);
            $('#startEdit').removeAttr('hidden', true);
            $('.layerSelect').attr('hidden', true);
            $('.elevationSwitch').attr('hidden', true);
            $('.incrementSlider').attr('hidden', true);
            $('#renderControlLine').attr('hidden', true);

            state.isEditMode = false;
            render();
        });

        $('#layerSelect').on('change', function() {
            switch (this.value) {
                case 'elevation': state.LAYER = 2; break;
                case 'affluence': state.LAYER = 3; break;
                case 'desirability':
                    state.LAYER = 4;
                    state.graphics.sites.map(s => s[4] = (s[2] + s[3]) / 2);
                    break;
            }
            render();
        });

        $('#incrementSlider').on('change', function() {
            state.increment = this.value;
            render();
            drawCircle('red');
        });

        $('#elevationSwitch').on('change', function() {
            if(this.checked) {
                state.isIncreasing = false; // decrease
            } else {
                state.isIncreasing = true; // increase
            }
        });
    });

    var state = {
        N: 1000,
        LAYER: 2,
        radius: 100,
        increment: 5,
        pointer: {},
        vertices: [],
        selectedSites: [],
        isDragging: false,
        isEditMode: false,
        isIncreasing: true,
        canvas: canvas.node() || d3.select("canvas").node(),
        width () { return this.canvas.width; },
        height () { return this.canvas.height; },
        context () { return this.canvas.getContext("2d"); },
        COLOR: [{R: 255, G: 0, B: 0}, {R: 0, G: 255, B: 0}, {R: 0, G: 0, B: 255}],
    };

    state.graphics = new Graphics();
    console.log(state);

    render();

    d3.select(state.canvas)
        .call(d3.drag()
            .container(state.canvas)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on('mousemove', onMouseMove)
        .on("wheel", onScroll);

    d3.select("body")
        .on("keydown", onKeyDown);
    /*=====================================================================================================
                                             Main Functions
    ======================================================================================================*/
    function Graphics() {
        const MIN_WIDTH = 20;
        const MIN_HEIGHT = 20;
        const MAX_WIDTH = state.width() - 20;
        const MAX_HEIGHT = state.height() - 20;

        this.sites = d3.range(state.N).map( () => [Math.random() * (MAX_WIDTH - MIN_WIDTH) + MIN_WIDTH, Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT, 0] );
        this.voronoi = d3.voronoi().extent([[MIN_WIDTH, MIN_HEIGHT], [MAX_WIDTH, MAX_HEIGHT]]);
        this.diagram = this.voronoi( this.sites );

        for( let n = 0; n < 5; n++ ) {
            this.sites = relax( this.diagram );
            this.diagram = this.voronoi( this.sites );
        }

        this.polygons = makePolygons(this.diagram);
        this.cells = this.diagram.cells;
        this.edges = this.diagram.edges;
        this.links = this.diagram.links();
        this.triangles = this.diagram.triangles();
        // this.clusters = this.polygons.map( makeCluster );
        // this.buildings = getBuildings( this.clusters );
    }

    function getCellCentroid( cell, diagram ) {
        let cx = 0, cy = 0, count = 0;

        getCellVertices(cell, diagram).forEach( v => {
            cx += v[0];
            cy += v[1];
            count++;
        });

        let site = [ cx / count, cy / count, 0, 0, 0 ];
        // site.elevation = 0;
        // site.affluence = 0;
        // site.desirability = 0;
        // site.color = state.COLOR[Math.floor(Math.random() * 2)];
        site.color = { R: Math.random() * 255, G: Math.random() * 255, B: Math.random() * 255 };

        return site;
    }

    function getCellVertices( cell, diagram ) {
        return cell.halfedges.map(i => cellHalfedgeStart(cell, diagram.edges[i]));

    }

    function relax( diagram ) {
        return diagram.cells.map((cell) => getCellCentroid( cell, diagram ));
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
    }

    // render
    function render() {
        state.context().clearRect(0, 0, state.width(), state.height());

        drawPolygons();
        // drawTriangles();
        // renderBackground();
        drawEdges(0.5, 'grey'); // lineWidth, lineColor
        // drawSites(1, 'black'); // lineWidth
    }

    function newGraphics() {
        state.vertices.clear();
        state.N = $('#input-sites').val() || 1000;
        state.graphics = new Graphics();

        render();
    }

    /*=====================================================================================================
                                             Event Functions
    ======================================================================================================*/
    function dragstarted() {
        if(state.isEditMode && state.LAYER !== 4) {
            state.isDragging = true;
        }
    }

    function dragged() {
        if(state.isEditMode && state.LAYER !== 4) {
            state.pointer = d3.mouse(this);
            state.selectedSites = findSites(state.pointer[0], state.pointer[1], state.radius);
            // let dist = distance(state.pointer, d3.mouse(this));

            if(state.isIncreasing) {
                if(state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        s[state.LAYER] += state.increment / 100;
                        if(s[state.LAYER] > 1) s[state.LAYER] = 1;
                    });
                }
            } else {
                if(state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        s[state.LAYER] -= state.increment / 100;
                        if(s[state.LAYER] < 0) s[state.LAYER] = 0;
                    });
                }
            }
            render();
            drawCircle('red');
        }
    }

    function dragended() {
        if(state.isEditMode && state.LAYER !== 4) {
            state.isDragging = false;
        }
    }

    // mouse event
    function onMouseMove() {
        if(state.isEditMode && state.LAYER !== 4) {
            state.pointer = d3.mouse(this);
            render();
            drawCircle('red');
        }
    }

    function onScroll() {
        if(state.isEditMode && state.LAYER !== 4) {
            d3.event.preventDefault();

            state.radius -= d3.event.deltaX;
            state.radius -= d3.event.deltaY;

            if(state.radius < 30) state.radius = 30;
            if(state.radius > 700) state.radius = 700;
            render();
            drawCircle('red');
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
        state.context().lineTo(state.pointer[0], state.pointer[1] + state.radius);

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
            // state.context().font = '15px Monda sans-serif';
            // state.context().fillText(`${site[2].toFixed(1)}`, site[0] - 10, site[1] - 10);
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
            let grayscale = (1 - state.graphics.sites[polygons[i].site][state.LAYER]) * 255;

            grayscale = grayscale.toFixed(1);
            state.context().fillStyle = `rgb( ${grayscale},${grayscale}, ${grayscale} )`;
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

    // draw triangles
    function drawTriangles() {
        state.context().save();
        for (let i = 0, n = state.graphics.triangles.length; i < n; ++i) {
            let triangle = state.graphics.triangles[i];
            state.context().beginPath();
            state.context().moveTo(triangle[0][0], triangle[0][1]);
            state.context().lineTo(triangle[1][0], triangle[1][1]);
            state.context().lineTo(triangle[2][0], triangle[2][1]);
            state.context().closePath();
            state.context().strokeStyle = `black`;
            state.context().stroke();
        }
        state.context().restore();
    }

    // render background
    function renderBackground() {
        state.context().save();

        state.graphics.triangles.forEach(triangle => {
            const x1       = triangle[0][0],
                y1         = triangle[0][1],
                x2         = triangle[1][0],
                y2         = triangle[1][1],
                x3         = triangle[2][0],
                y3         = triangle[2][1],
                min_width  = Math.min(x1, x2, x3),
                max_width  = Math.max(x1, x2, x3),
                min_height = Math.min(y1, y2, y3),
                max_height = Math.max(y1, y2, y3);

            for(let x = min_width; x < max_width; x ++) {
                for(let y = min_height; y < max_height; y ++) {
                    let point = [x, y];
                    if(d3.polygonContains(triangle, point)) {
                        const weight = getBarycentricValue(x1, x2, x3, y1, y2, y3, point[0], point[1]);
                        const R = (triangle[0].color.R * weight.w1) + (triangle[1].color.R * weight.w2) + (triangle[2].color.R * weight.w3);
                        const G = (triangle[0].color.G * weight.w1) + (triangle[1].color.G * weight.w2) + (triangle[2].color.G * weight.w3);
                        const B = (triangle[0].color.B * weight.w1) + (triangle[1].color.B * weight.w2) + (triangle[2].color.B * weight.w3);

                        state.context().beginPath();
                        state.context().fillStyle = `rgb(${R}, ${G}, ${B})`;
                        state.context().fillRect(x, y, 1, 1);
                    }
                }
            }
        });
        state.context().restore();
    }

    /**
     * draw terrain contour lines based on given points
     * @param point
     * @param color
     */
    function drawContourLines(point, color, width) {
        state.context().save();

        state.graphics.triangles.forEach(triangle => {
            let contourPoints = [];

            for(let i = 0, n = triangle.length; i < n; i ++) {
                let j = (i + 1) < n ? (i + 1) : 0;
                let site1 = triangle[i];
                let site2 = triangle[j];

                // https://codegolf.stackexchange.com/questions/8649/shortest-code-to-check-if-a-number-is-in-a-range-in-javascript
                if((point - site1[2]) * (point - site2[2]) < 0) {
                    const minX = Math.min(site1[0], site2[0]),
                        maxX = Math.max(site1[0], site2[0]),
                        minY = Math.min(site1[1], site2[1]),
                        maxY = Math.max(site1[1], site2[1]),
                        minElevation = Math.min(site1[2], site2[2]),
                        maxElevation = Math.max(site1[2], site2[2]);
                    const k = (site1[1] - site2[1]) / (site1[0] - site2[0]); // slope of line from site1 to site2
                    const px = minX + (maxX - minX) * (point - minElevation) / (maxElevation - minElevation);
                    const py = -k * (site1[0] - px) + site1[1];

                    contourPoints.push([px, py]);
                    // state.context().fillStyle = 'red';
                    // state.context().moveTo(px, py);
                    // state.context().fillRect(px, py, 5, 5);
                }
            }
            if(contourPoints.length >= 2) {
                state.context().beginPath();
                state.context().lineWidth = width;
                state.context().strokeStyle = color;
                for(let n = 0; n < contourPoints.length; n ++) {
                    let point = contourPoints[n];

                    state.context().moveTo(point[0], point[1]);

                    for(let l = 1; l < contourPoints.length; l ++) {
                        let nextPoint = contourPoints[l];
                        state.context().lineTo(nextPoint[0], nextPoint[1]);
                    }
                }
                state.context().stroke();
            }
        });
        state.context().restore();
    }
    /*=====================================================================================================
                                             Additional Functions
    ======================================================================================================*/
    // get startPoint of edge
    function cellHalfedgeStart(cell, edge) {
        return edge[+(edge.left !== cell.site)];
    }

    // get endPoint of edge
    function cellHalfedgeEnd(cell, edge) {
        return edge[+(edge.left === cell.site)];
    }

    function sqr(x) {
        return x * x;
    }

    function distance(a, b) {
        return Math.sqrt(sqr(b[0] - a[0]) + sqr(b[1] - a[1]));
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

    // https://codeplea.com/triangular-interpolation
    // https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle
    function getBarycentricValue(x1, x2, x3, y1, y2, y3, px, py) {
        const w1 = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
        const w2 = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
        const w3 = 1 - w1 - w2;
        // console.log("w1: ", w1, " | w2: ", w2, " | w3: ", w3, " | sum: ", w1 + w2 + w3);
        // console.log("R: ", R, " | G: ", G, " | B: ", B);

        return { w1: w1, w2: w2, w3: w3};
    }

    // return Metro()
    return {
        state: state,
        graphics: state.graphics,
        newGraphics: newGraphics,
    };
}