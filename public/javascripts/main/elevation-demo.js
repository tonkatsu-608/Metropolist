// clear array
Array.prototype.clear = function() {
    while (this.length) {
        this.pop();
    }
};

function Metro(canvas) {
    /*=====================================================================================================
                                             Dom Functions
    ======================================================================================================*/
    $(document).ready( function() {
        $('select').formSelect();

        $('#render').click( function() {
            newGraphics();
        });

        $('.renderContourLine').click( function() {
            if(state.LAYERS.has(elevation)) {
                render();
                drawContourLines(0.25, 'elevation', 'red', 8);
                drawContourLines(0.5, 'elevation', 'green', 8);
                drawContourLines(0.75, 'elevation', 'blue', 8);
            }
        });

        $('#startEdit').click( function() {
            $('#startEdit').prop('hidden', true);
            $('#stopEdit').prop('hidden', false);
            $('.layerSelect').prop('hidden', false);
            $('.elevationSwitch').prop('hidden', false);
            $('.incrementSlider').prop('hidden', false);
            $('.waterLineSlider').prop('hidden', false);
            $('.renderContourLine').prop('hidden', false);
            render();
        });

        $('#stopEdit').click( function() {
            $('#stopEdit').prop('hidden', true);
            $('#startEdit').prop('hidden', false);
            $('.layerSelect').prop('hidden', true);
            $('.elevationSwitch').prop('hidden', true);
            $('.incrementSlider').prop('hidden', true);
            $('.waterLineSlider').prop('hidden', true);
            $('.renderContourLine').prop('hidden', true);
            render();
        });

        // view
        $('#elevation-view-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(elevation);
            } else {
                if(state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                }else if(state.LAYERS.has(elevation)) {
                    state.LAYERS.delete(elevation);
                    state.EDIT_MODES.delete('elevation');
                    $('#elevation-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#affluence-view-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(affluence);
            } else {
                if(state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if(state.LAYERS.has(affluence)) {
                    state.LAYERS.delete(affluence);
                    state.EDIT_MODES.delete('affluence');
                    $('#affluence-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#desirability-view-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(desirability);
            } else {
                if(state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                }else if(state.LAYERS.has(desirability)) {
                    state.LAYERS.delete(desirability);
                    state.EDIT_MODES.delete('desirability');
                    $('#desirability-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#district-view-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(district);
            } else {
                if(state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                }else if(state.LAYERS.has(district)) {
                    state.LAYERS.delete(district);
                    state.EDIT_MODES.delete('district');
                    $('#district-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        // edit
        $('#elevation-edit-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(elevation);
                state.EDIT_MODES.add('elevation');
                $('#elevation-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('elevation');
            }
            render();

        });

        $('#affluence-edit-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(affluence);
                state.EDIT_MODES.add('affluence');
                $('#affluence-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('affluence');
            }
            render();

        });

        $('#desirability-edit-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(desirability);
                state.EDIT_MODES.add('desirability');
                $('#desirability-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('desirability');
            }
            render();

        });

        $('#district-edit-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(district);
                state.EDIT_MODES.add('district');
                $('#district-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('district');
            }
            render();
        });

        $('#incrementSlider').on('change', function() {
            state.increment = this.value;
            render();
            drawCircle('red');
        });

        $('#waterLineSlider').on('change', function() {
            state.waterline = this.value / 10;
            render();
        });

        $('#elevationSwitch').on('change', function() {
            state.isIncreasing = !this.checked;
        });
    });

    // elevation layer
    var elevation = (site_index) => {
        let value = state.graphics.sites[site_index]['elevation'];
        let grayScale = ((1 - value) * 255).toFixed(1);

        if(value <= state.waterline) {
            // set color for river in [elevation] mode
            return [173, 216, 230]; // lightBlue
        }

        return [grayScale, grayScale, grayScale];
    };

    // affluence layer
    var affluence = (site_index) => {
        let value = state.graphics.sites[site_index]['affluence'];
        let grayScale = ((1 - value) * 255).toFixed(1);

        return [grayScale, grayScale, grayScale];
    };

    // desirability layer
    var desirability = (site_index) => {
        let site = state.graphics.sites[site_index];
        let value = (site['elevation'] + site['affluence']) / 2;
        if(site['elevation'] <= state.waterline) value = 0;
        let grayScale = ((1 - value) * 255).toFixed(1);

        return [grayScale, grayScale, grayScale];
    };

    // district layer
    var district = (site_index) => {
        let site = state.graphics.sites[site_index];

        return state.POLYGON_TYPE_COLOR[site.type] || [255, 255, 255];
    };

    var state = {
        N: 1000,
        EDIT_MODES: new Set(),
        LAYERS: new Set([elevation]),
        LAYER: 'elevation',
        radius: 100,
        increment: 12,
        waterline: .2,
        pointer: {},
        vertices: [],
        selectedSites: [],
        isDragging: false,
        isIncreasing: true,
        isAltPressed: false,
        transform: d3.zoomIdentity, // scale parameter of zoom
        canvas: canvas.node() || d3.select("canvas").node(),
        width () { return this.canvas.width; },
        height () { return this.canvas.height; },
        context () { return this.canvas.getContext("2d"); },
        DISTRICT_TYPES: ['rich', 'medium','poor','plaza', 'empty'],
        COLOR: [{R: 255, G: 0, B: 0}, {R: 0, G: 255, B: 0}, {R: 0, G: 0, B: 255}],
        POLYGON_TYPE_COLOR: {
            "rich" : [0, 0, 0], // black
            "medium" : [105, 105, 105], // dimGray
            "poor" : [192, 192, 192], // silver
            "plaza" : [255, 140, 0], // orange
            "empty" : [255, 255, 255], // white
        },
    };

    state.graphics = new Graphics(); console.log(state);

    render();

    d3.select(state.canvas)
        .call(d3.drag()
            .container(state.canvas)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("wheel", onScroll)
        .on('mousemove', onMouseMove)
        .on("contextmenu", d3.contextMenu(menu))
        .call(d3.zoom().scaleExtent([1/2, 4]).on("zoom", zoomed));

    d3.select("body")
        .on("keyup", onKeyUp)
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

        for( let n = 0; n < 10; n++ ) {
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

    function getCellCentroid( cell, diagram, index ) {
        let cx = 0, cy = 0, count = 0;

        getCellVertices(cell, diagram).forEach( v => {
            cx += v[0];
            cy += v[1];
            count++;
        });

        let site = [ cx / count, cy / count];
        site.elevation = 0.5;
        site.affluence = 0;
        site.district = 0;
        site.wall = 0;
        // site.color = state.COLOR[Math.floor(Math.random() * 2)];
        site.type = 'empty';
        site.index = index;
        site.isInside = false;
        site.color = { R: Math.random() * 255, G: Math.random() * 255, B: Math.random() * 255 };

        return site;
    }

    function assignTypeForSite(index) {
        let s = state.graphics.sites[index];
        let value = (s['elevation'] + s['affluence']) / 2;
        if(s['elevation'] <= state.waterline) value = 0;

        if(value >= 0.7) {
            s.type = 'rich';
        } else if(value < 0.7 && value > 0.3) {
            s.type = 'medium';
        } else if(value <= 0.3) {
            s.type = 'poor';
        }

        // assign type [plaza] for district only if it is adjacent to [poor] && [medium] && [rich]
        let types = new Set();

        findAdjacentSites(s).forEach(i => {
            types.add(state.graphics.sites[i].type);
        });

        if(types.size === 3 && types.has('poor') && types.has('medium') && types.has('rich')) {
            s.type = 'plaza';
        }
    }

    function getCellVertices( cell, diagram ) {
        return cell.halfedges.map(i => cellHalfedgeStart(cell, diagram.edges[i]));
    }

    function relax( diagram ) {
        return diagram.cells.map((cell, index) => getCellCentroid( cell, diagram, index));
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
        state.context().save();
        state.context().clearRect(0, 0, state.width(), state.height());
        state.context().translate(state.transform.x, state.transform.y);
        state.context().scale(state.transform.k, state.transform.k);

        drawPolygons();
        // drawTriangles();
        // renderBackground();
        // drawSites(1, 'black'); // lineWidth, lineColor
        drawEdges(0.5, 'grey'); // lineWidth, lineColor
        if(state.LAYERS.has(district)) drawContourLines(0.25, 'wall', '#191970', 8);

        state.context().restore();
    }

    function newGraphics() {
        state.vertices.clear();
        state.N = $('#input-sites').val() || 1000;
        state.graphics = new Graphics();

        render();
    }

    function menu(d) {
        if(!state.EDIT_MODES.has('district')) d3.select('.d3-context-menu').remove();
        let x = state.transform.invertX(d3.event.layerX);
        let y = state.transform.invertY(d3.event.layerY);
        let site = findSite(x, y);

        return [{
            title: 'Current Type: ' + site.type,
        },
            {
                divider: true
            },
            {
                title: 'Change type to rich',
                action: function() {
                    site.type = 'rich';
                    render();
                }
            },
            {
                title: 'Change type to medium',
                action: function() {
                    site.type = 'medium';
                    render();
                }
            },
            {
                title: 'Change type to poor',
                action: function() {
                    site.type = 'poor';
                    render();
                }
            },
            {
                title: 'Change type to plaza',
                action: function() {
                    site.type = 'plaza';
                    render();
                }
            },
            {
                title: 'Change type to empty',
                action: function() {
                    site.type = 'empty';
                    render();
                }
            }];
    };
    /*=====================================================================================================
                                             Event Functions
    ======================================================================================================*/
    function dragstarted() {
        if(state.EDIT_MODES.size >= 1 && !state.isAltPressed) {
            d3.contextMenu('close');
            state.isDragging = true;
        }
    }

    function dragged() {
        if(state.EDIT_MODES.size >= 1 && state.isDragging) {
            state.pointer = d3.mouse(this);
            let x = state.transform.invertX(state.pointer[0]);
            let y = state.transform.invertY(state.pointer[1]);
            state.selectedSites = findSites(x, y, state.radius);

            if(state.isIncreasing) {
                if(state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        if(state.EDIT_MODES.has('district')) {
                            s.isInside = true;
                            s['wall'] = 0.5;
                        }
                        if(state.EDIT_MODES.has('elevation')) {
                            s['elevation'] += (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('affluence')) {
                            s['affluence'] += (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] += ((state.increment / 100) * s.delta) / 2;
                            s['affluence'] += ((state.increment / 100) * s.delta) / 2;
                        }
                        if(s[state.LAYER] >= 1) s[state.LAYER] = 1;
                        if(state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) assignTypeForSite(s.index);
                    });
                }
            } else {
                if(state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        if(state.EDIT_MODES.has('district')) {
                            s.isInside = false;
                            s['wall'] = 0;
                        }
                        if(state.EDIT_MODES.has('elevation')) {
                            s['elevation'] -= (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('affluence')) {
                            s['affluence'] -= (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] -= ((state.increment / 100) * s.delta) / 2;
                            s['affluence'] -= ((state.increment / 100) * s.delta) / 2;
                        }
                        if(s[state.LAYER] <= 0) s[state.LAYER] = 0;
                        if(state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) assignTypeForSite(s.index);
                    });
                }
            }
            render();
            drawCircle('red');
        }
    }

    function dragended() {
        if(state.EDIT_MODES.size >= 1 && state.isDragging) {
            state.isDragging = false;
        }
    }

    // mouse event
    function onMouseMove() {
        if(!state.isAltPressed && state.EDIT_MODES.size >= 1) {
            state.pointer = d3.mouse(this);
            render();
            drawCircle('red');
        }
    }

    function onScroll() {
        if(state.isAltPressed) {
            console.log("panning...");
        }
        if(!state.isAltPressed && state.EDIT_MODES.size >= 1) {
            state.radius -= d3.event.deltaX;
            state.radius -= d3.event.deltaY;

            if(state.radius < 15) state.radius = 15;
            if(state.radius > 700) state.radius = 700;
            render();
            drawCircle('red');
        }
    }

    // set zoom arguments
    function zoomed() {
        if(state.isAltPressed) {
            state.transform = d3.event.transform;
            render();
        }
    }

    function onKeyDown() {
        if(d3.event.altKey) state.isAltPressed = true;

        if(d3.event.keyCode === 13) {
            if($('#sites').val() !== "") {
                newGraphics();
            }
        }
    }

    function onKeyUp() {
        if(state.isAltPressed) state.isAltPressed = false;
    }
    /*=====================================================================================================
                                             Draw Functions
    ======================================================================================================*/
    // draw polygons
    function drawPolygons() {
        state.context().save();

        state.graphics.polygons.forEach(p => {
            let colors = [...state.LAYERS].map(layer => layer(p.site));
            let color = combineColors(colors);

            // start drawing polygon
            state.context().beginPath();
            state.context().fillStyle = color;
            for(let j = 0, vertices = p.vertices; j < vertices.length; j++) {
                let vertex = state.vertices[vertices[j]];

                state.context().moveTo(vertex[0], vertex[1]);
                for(let l = 1; l < vertices.length; l ++) {
                    let nextVertex= state.vertices[vertices[l]];
                    state.context().lineTo(nextVertex[0], nextVertex[1]);
                }
            }
            state.context().closePath();
            state.context().fill();
        });
        state.context().restore();
    }

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
        state.context().beginPath();

        for (let i = 0, n = state.graphics.polygons.length; i < n; i++) {
            let site = state.graphics.sites[state.graphics.polygons[i].site];

            state.context().moveTo(site[0] + radius, site[1]);
            state.context().arc(site[0], site[1], radius, 0, 2 * Math.PI, false);
            state.context().fillStyle = color;
            state.context().fill();
            state.context().strokeStyle = color;
            state.context().stroke();
            // state.context().font = '15px Monda sans-serif';
            // state.context().fillText(`${site['elevation'].toFixed(1)}`, site[0] - 10, site[1] - 10);
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
                state.context().lineWidth = width;
                state.context().strokeStyle = color;
                state.context().stroke();
            }
        }
        state.context().restore();
    }

    // draw triangles
    function drawTriangles() {
        state.context().save();
        state.context().beginPath();
        

        for (let i = 0, n = state.graphics.triangles.length; i < n; ++i) {
            let triangle = state.graphics.triangles[i];
            state.context().moveTo(triangle[0][0], triangle[0][1]);
            state.context().lineTo(triangle[1][0], triangle[1][1]);
            state.context().lineTo(triangle[2][0], triangle[2][1]);
            state.context().closePath();
            state.context().strokeStyle = `grey`;
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
     * @param width
     */
    function drawContourLines(point, layer, color, width) {
        state.context().save();
        state.context().translate(state.transform.x, state.transform.y);
        state.context().scale(state.transform.k, state.transform.k);

        state.graphics.triangles.forEach(triangle => {
            let vertices = triangle.sort((a,b) => {
                if (a[layer] < b[layer]) {
                    return -1;
                } else if (a[layer] > b[layer]) {
                    return 1;
                } else {
                    return 0;
                }
            });

            if( point >= vertices[0][layer] && point <= vertices[2][layer] ) {
                let e1, e2;
                if( point >= vertices[0][layer] && point <= vertices[1][layer] ) {
                    e1 = [ vertices[0], vertices[1] ];
                    if( point >= vertices[0][layer] && point <= vertices[2][layer] ) {
                        e2 = [ vertices[0], vertices[2]];
                    } else {
                        e2 = [vertices[1], vertices[2]];
                    }
                } else {
                    e1 = [vertices[1], vertices[2]];
                    if( point >= vertices[1][layer] && point <= vertices[0][layer] ) {
                        e2 = [ vertices[0], vertices[1]];
                    } else {
                        e2 = [vertices[0], vertices[2]];
                    }
                }

                let pt1 = pointOnEdge( e1[0], e1[1], point, layer );
                let pt2 = pointOnEdge( e2[0], e2[1], point, layer );

                drawLine( pt1, pt2, width, color);
            }
        });
        state.context().restore();
    }

    // draw a line from p1[0, 1] to p2[0, 1]
    function drawLine(p1, p2, width, color) {
        state.context().beginPath();
        state.context().lineWidth = width;
        state.context().strokeStyle = color;
        state.context().moveTo(p1[0], p1[1]);
        state.context().lineTo(p2[0], p2[1]);
        state.context().stroke();
    }
    /*=====================================================================================================
                                             Additional Functions
    ======================================================================================================*/
    function sqr(x) {
        return x * x;
    }

    // get startPoint of edge
    function cellHalfedgeStart(cell, edge) {
        return edge[+(edge.left !== cell.site)];
    }

    // get endPoint of edge
    function cellHalfedgeEnd(cell, edge) {
        return edge[+(edge.left === cell.site)];
    }

    function findSites(x, y, radius) {
        let i = 0,
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
            site.delta = 1 - d2 / radius;
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
        return { w1: w1, w2: w2, w3: w3};
    }


    /**
     * get point position in the edge that consists of site1 and site2
     * @param site1: [0, 1]
     * @param site2: [0, 1]
     * @param point: Number
     * @returns {*[]}
     */
    function pointOnEdge( site1, site2, point, layer ) {
        const lowest = site1[layer] < site2[layer] ? site1 : site2;
        const highest = lowest === site1 ? site2 : site1;
        const x = lowest[0] + (highest[0] - lowest[0]) * ( point - lowest[layer] ) / ( highest[layer] - lowest[layer] );
        // const y = lowest[1] + (highest[1] - lowest[1]) * ( point - lowest['elevation'] ) / ( highest['elevation'] - lowest['elevation'] );
        const k = (lowest[1] - highest[1]) / (lowest[0] - highest[0]); // slope of line from site1 to site2
        const y = -k * (lowest[0] - x) + lowest[1];
        return [x, y];
    }

    /**
     * find adjacent sites on mouse position
     * @param site
     * @returns {Array}
     */
    function findAdjacentSites(site) {
        let sites = [];

        state.graphics.links.forEach(function(link) {
            if (link.source.index === site.index || link.target.index === site.index) {

                //get adjacent polygons
                state.graphics.polygons.forEach(function (p) {
                    if (state.graphics.sites[p.site].index === link.target.index || state.graphics.sites[p.site].index === link.source.index) {
                        sites.push(p.site);
                    }
                });
            }
        });
        return sites;
    }

    function ifOnlyHasDesirabilityMode() {
        if(state.LAYERS.has(desirability) && state.LAYERS.size === 1) {
            return true;
        }
        return false;
    }

    function combineColors(colors) {
        let r = 0, g = 0, b = 0, n = colors.length;

        colors.forEach(color => {
            r += Number(color[0]);
            g += Number(color[1]);
            b += Number(color[2]);
        });

        r /= n; g /= n; b /= n;

        return `rgb(${r}, ${g}, ${b})`;
    }

    function findSite(x, y, radius) {
        var i = 0,
            n = state.graphics.sites.length,
            dx,
            dy,
            d2,
            site,
            closest;

        if (radius == null) radius = Infinity;
        else radius *= radius;

        for (i = 0; i < n; ++i) {
            site = state.graphics.sites[i];
            dx = x - site[0];
            dy = y - site[1];
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest = site, radius = d2;
        }

        return closest;
    }
    /*=====================================================================================================
                                             return Metro
    ======================================================================================================*/
    return {
        state: state,
        graphics: state.graphics,
    };
}