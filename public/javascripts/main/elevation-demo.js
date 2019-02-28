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
                drawContourLines(state.waterline, 'elevation', 'blue', 4, false);
                drawContourLines(0.25, 'elevation', 'red', 4, false);
                drawContourLines(0.5, 'elevation', 'green', 4, false);
                drawContourLines(0.75, 'elevation', 'yellow', 4, false);
            }
        });

        // $('#startEdit').click( function() {
        //     $('#startEdit').prop('hidden', true);
        //     $('#stopEdit').prop('hidden', false);
        //     $('.layerSelect').prop('hidden', false);
        //     $('.elevationSwitch').prop('hidden', false);
        //     $('.incrementSlider').prop('hidden', false);
        //     $('.waterLineSlider').prop('hidden', false);
        //     $('.renderContourLine').prop('hidden', false);
        //     render();
        // });
        //
        // $('#stopEdit').click( function() {
        //     $('#stopEdit').prop('hidden', true);
        //     $('#startEdit').prop('hidden', false);
        //     $('.layerSelect').prop('hidden', true);
        //     $('.elevationSwitch').prop('hidden', true);
        //     $('.incrementSlider').prop('hidden', true);
        //     $('.waterLineSlider').prop('hidden', true);
        //     $('.renderContourLine').prop('hidden', true);
        //     render();
        // });

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

        $('#building-view-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(building);
            } else {
                if(state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                }else if(state.LAYERS.has(building)) {
                    state.LAYERS.delete(building);
                    state.EDIT_MODES.delete('building');
                    $('#building-edit-checkbox').prop('checked', false);
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

        $('#building-edit-checkbox').on('change', function() {
            if(this.checked) {
                state.LAYERS.add(building);
                state.EDIT_MODES.add('building');
                $('#building-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('building');
            }
            render();
        });

        $('#incrementSlider').on('change', function() {
            state.increment = this.value;
        });

        $('#waterLineSlider').on('change', function() {
            state.waterline = this.value / 100;
            state.contourLines.clear();
            onChangeWaterLine();
            render();
            drawContourLines(state.waterline, 'elevation', 'blue', 4, false);
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

    // building layer
    var building = (site_index) => {
        let site = state.graphics.sites[site_index];

        return state.POLYGON_TYPE_COLOR[site.type];
    }

    var state = {
        N: $('#input-sites').val() || 200,
        EDIT_MODES: new Set(),
        LAYERS: new Set([elevation]),
        LAYER: 'elevation',
        radius: 100,
        increment: $('#incrementSlider').val() || 15,
        waterline:  $('#waterLineSlider').val() / 100 || .15,
        pointer: {},
        vertices: [],
        contourLines: [],
        selectedSites: [],
        isDragging: false,
        isIncreasing: true,
        isAltPressed: false,
        transform: d3.zoomIdentity, // scale parameter of zoom
        canvas: canvas.node() || d3.select("canvas").node(),
        width () { return this.canvas.width; },
        height () { return this.canvas.height; },
        context () { return this.canvas.getContext("2d"); },
        DISTRICT_TYPES: ['rich', 'medium','poor','plaza', 'empty', 'water', 'farm'],
        COLOR: [{R: 255, G: 0, B: 0}, {R: 0, G: 255, B: 0}, {R: 0, G: 0, B: 255}],
        RANDOM_COLOR: d3.scaleOrdinal().range(d3.schemeCategory20), // random color
        POLYGON_TYPE_COLOR: {
            'rich' : [152, 134, 148], // purple
            'medium' : [161, 147, 127], // rice
            'poor' : [141, 157, 149], // grey
            'plaza' : [146, 157, 127], // green
            'farm' : [253, 242, 205], // light yellow #cbc5b9
            'empty' : [203, 197, 185], // light yellow #cbc5b9
            'water' : [173, 216, 230], // light blue
        },
    };

    state.graphics = new Graphics();
    console.log(state);
    render();

    // initialize mouse event
    d3.select(state.canvas)
        .call(d3.drag()
            .container(state.canvas)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("wheel", onScroll)
        .on('mousemove', onMouseMove)
        .on("contextmenu", d3.contextMenu(menu))
        .call(d3.zoom().scaleExtent([1 / 4, 8]).on("zoom", zoomed));

    // initialize key event
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

        // relax sites in using Lloyd's algorithm
        for(let n = 0; n < 2; n++) {
            this.sites = relax( this.diagram );
            this.diagram = this.voronoi( this.sites );
        }

        this.polygons = makePolygons(this.diagram);
        this.triangles = this.diagram.triangles();
        this.links = this.diagram.links();
        this.edges = this.diagram.edges;
    }

    function getCellCentroid( cell, diagram, index ) {
        let cx = 0, cy = 0, count = 0;

        getCellVertices(cell, diagram).forEach( v => {
            cx += v[0];
            cy += v[1];
            count++;
        });

        let site = [ cx / count, cy / count];
        site.elevation = 0.35;
        site.affluence = 0;
        site.wall = 0;
        // site.color = state.COLOR[Math.floor(Math.random() * 2)];
        site.type = 'empty';
        site.index = index;
        site.color = { R: Math.random() * 255, G: Math.random() * 255, B: Math.random() * 255 };

        return site;
    }

    // make polygons(districts)
    function makePolygons(diagram) {
        return diagram.cells.map((cell, index) => {
            let polygon = {};
            polygon.index = index;
            polygon.buildings = null;
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
            let vertices = polygon.vertices.map(v => state.vertices[v]);
            polygon.area = Math.abs(d3.polygonArea(vertices));

            return polygon;
        });
    }

    function onChangeWaterLine() {
        // state.graphics.sites
        //     .filter(s => s.elevation <= state.waterline)
        //     .forEach(s => assignType4Site(s.index));
        //
        state.graphics.sites.forEach(s => assignType4Site(s.index));
    }

    // assign type to site(polygon/district)
    function assignType4Site(index) {
        let s = state.graphics.sites[index];
        let value = (s['elevation'] + s['affluence']) / 2;

        if(value >= 0.75 && value <= 1) {
            s.type = 'rich';
        } else if(value < 0.75 && value > 0.5) {
            s.type = 'medium';
        } else if(value <= 0.5 && value > state.waterline) {
            s.type = 'poor';
        } else if(value === 0) {
            s.type = 'empty';
        }

        // assign type [plaza] for district only if it is adjacent to [poor] && [medium] && [rich]
        let types = new Set();
        findAdjacentSites(s).forEach(i => types.add(state.graphics.sites[i].type));

        // condition to assign type 'plaza'
        if(types.size === 3 && types.has('poor') && types.has('medium') && types.has('rich')) {
            s.type = 'plaza';
        }

        // condition to assign type 'water'
        if(s['elevation'] <= state.waterline) {
            s.type = 'water';
        }

        if(s['elevation'] <= 0.5 && value > state.waterline) {
            s.type = Math.random() > 0.5 ? 'farm' : 'empty';
        }

        // split polygons and assign buildings for polygon
        assignBuildings4Polygon(index);
    }

    // make buildings
    function assignBuildings4Polygon(index) {
        let BUILDINGS_NUMBER = {
            'rich' : Math.round(Math.random() * 5 + 5),
            'medium' : Math.round(Math.random() * 10 + 10),
            'poor' : Math.round(Math.random() * 15 + 15),
            'plaza' : Math.round(Math.random() * 2 + 2),
            'farm' : Math.round(Math.random() * 15 + 15),
            'empty' : 0,
            'water' : 0,
        };
        let polygon = state.graphics.polygons[index];
        let site = state.graphics.sites[index];
        let size = BUILDINGS_NUMBER[site.type];
        let vertices = polygon.vertices.map(v => state.vertices[v]);
        let resultArr = splitPolygon(vertices, size);
        resultArr.forEach(r => r.color = state.POLYGON_TYPE_COLOR[site.type]);
        polygon.buildings = resultArr;

        if(site.type === 'farm') {
            polygon.buildings = Math.random() > 0.9 ? [polygon.buildings.pop()] : [];
        } else if(site.type === 'plaza') {
            polygon.buildings = Math.random() > 0.5 ? [polygon.buildings.pop(), polygon.buildings.pop()] : [polygon.buildings.pop()];
        } else {
            while (size > 0) {
                size = size % 5 - 1;
                polygon.buildings.splice(Math.floor(Math.random() * polygon.buildings.length), 1, []);
            }
        }
    }

    // get vertices from diagram.cell
    function getCellVertices( cell, diagram ) {
        return cell.halfedges.map(i => cellHalfedgeStart(cell, diagram.edges[i]));
    }

    // relax sites, get average positions
    function relax( diagram ) {
        return diagram.cells.map((cell, index) => getCellCentroid( cell, diagram, index));
    }

    // render
    function render() {
        state.context().save();
        state.context().clearRect(0, 0, state.width(), state.height());
        state.context().translate(state.transform.x, state.transform.y);
        state.context().scale(state.transform.k, state.transform.k);

        drawPolygons();
        if(state.LAYERS.has(building)) drawBuildings();
        // drawTriangles();
        // renderBackground();
        // drawSites(1, 'black'); // lineWidth, lineColor
        // drawEdges(3, 'black'); // lineWidth, lineColor
        if(state.LAYERS.has(district)) drawContourLines(0.25, 'wall', 'black', 8, true);

        state.context().restore();
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
    function dragsubject() {
        if(state.isAltPressed) {
            return null;
        } else {
            return 0;
        }
    }
    
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
                            s['wall'] = 0.5;
                            if(s.type === 'water') s['wall'] = 0;
                        }
                        if(state.EDIT_MODES.has('elevation')) {
                            s['elevation'] += (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('affluence')) {
                            s['affluence'] += (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] += ((state.increment / 100) * s.delta) / 10;
                            s['affluence'] += ((state.increment / 100) * s.delta) / 10 * 9;
                        }
                        if(s['elevation'] >= 1) s['elevation'] = 1;
                        if(s['affluence'] >= 1) s['affluence'] = 1;
                        if(state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) {
                            assignType4Site(s.index);
                        }
                    });
                }
            } else {
                if(state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        if(state.EDIT_MODES.has('district')) {
                            s['wall'] = 0;
                        }
                        if(state.EDIT_MODES.has('elevation')) {
                            s['elevation'] -= (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('affluence')) {
                            s['affluence'] -= (state.increment / 100) * s.delta;
                        }
                        if(state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] -= ((state.increment / 100) * s.delta) / 10;
                            s['affluence'] -= ((state.increment / 100) * s.delta) / 10 * 9;
                        }
                        if(s['elevation'] <= 0) s['elevation'] = 0;
                        if(s['affluence'] <= 0) s['affluence'] = 0;
                        if(state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) assignType4Site(s.index);
                        // if(state.EDIT_MODES.has('building')) assignBuildings4Polygon(s.index);
                    });
                }
            }
            render();
            if(!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) drawCursor('red');
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
            if(!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) drawCursor('red');
        }
    }

    function onScroll() {
        if(!state.isAltPressed && state.EDIT_MODES.size >= 1) {
            state.radius -= d3.event.deltaX;
            state.radius -= d3.event.deltaY;

            if(state.radius < 15) state.radius = 15;
            if(state.radius > 700) state.radius = 700;
            render();
            if(!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) drawCursor('red');
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
        if(state.isAltPressed) {
            state.isAltPressed = false;
        }
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

            if(state.graphics.sites[p.index].type === 'farm') {
                let canvasPattern = document.createElement("canvas");
                canvasPattern.width = 10;
                canvasPattern.height = 10;
                let contextPattern = canvasPattern.getContext("2d");
                // draw pattern to off-screen context
                contextPattern.beginPath();
                contextPattern.moveTo(0, 0);
                contextPattern.lineTo(10, 10);
                contextPattern.stroke();

                let pattern = state.context().createPattern(canvasPattern,"repeat");
                state.context().fillStyle = pattern;
            }
            for(let i = 0, vertices = p.vertices; i < vertices.length; i++) {
                let vertex = state.vertices[vertices[i]];

                state.context().moveTo(vertex[0], vertex[1]);
                for(let j = 0; j < vertices.length; j ++) {
                    let nextVertex = state.vertices[vertices[j]];
                    state.context().lineTo(nextVertex[0], nextVertex[1]);
                }
            }
            state.context().closePath();
            state.context().fill();
        });
        state.context().restore();
    }

    // draw buildings(splitted polygon) of polygon that has buildings
    function drawBuildings() {
        state.context().save();
        state.graphics.polygons.forEach(p => {
            if(!p.buildings) return;

            p.buildings.forEach(buildings => {
                if(buildings === 0 || buildings.length === 0) return;
                // start drawing building
                state.context().beginPath();
                state.context().translate(state.transform.x, state.transform.y);
                state.context().scale(state.transform.k, state.transform.k);
                state.context().translate(buildings.center[0], buildings.center[1]);
                state.context().scale(0.9, 0.9);
                state.context().translate(-buildings.center[0], -buildings.center[1]);
                state.context().lineWidth = 1;
                state.context().strokeStyle = 'black';
                state.context().fillStyle = `rgb( ${buildings.color[0]}, ${buildings.color[1]}, ${buildings.color[2]} )`;
                // state.context().fillStyle = state.RANDOM_COLOR(Math.random());
                for(let i = 0; i < buildings.length; i++) {
                    let vertex = buildings[i];

                    state.context().moveTo(vertex[0], vertex[1]);
                    for(let j = 0; j < buildings.length; j ++) {
                        let nextVertex = buildings[j];
                        state.context().lineTo(nextVertex[0], nextVertex[1]);
                    }
                }
                state.context().closePath();
                state.context().stroke();
                state.context().fill();
                state.context().setTransform(1,0,0,1,0,0);
            });
        });
        state.context().restore();
    }

    // draw circle following mouse
    function drawCursor(color) {
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
    function drawContourLines(point, layer, color, width, isWall) {
        state.context().save();
        if(!isWall) {
            state.context().translate(state.transform.x, state.transform.y);
            state.context().scale(state.transform.k, state.transform.k);
        }
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

                state.contourLines.push([pt1, pt2]);
                drawLine( pt1, pt2, width, color);
            }
        });
        state.context().restore();
    }

    // draw a line from p1[0, 1] to p2[0, 1]
    function drawLine(p1, p2, width, color) {
        state.context().beginPath();
        state.context().fillStyle = color;
        state.context().lineWidth = width;
        state.context().strokeStyle = color;
        state.context().moveTo(p1[0], p1[1]);
        state.context().lineTo(p2[0], p2[1]);
        state.context().fill();
        state.context().stroke();
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

    // context menu event
    function menu() {
        if(!state.EDIT_MODES.has('district') && !state.EDIT_MODES.has('building')) d3.select('.d3-context-menu').remove();
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
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to medium',
                action: function() {
                    site.type = 'medium';
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to poor',
                action: function() {
                    site.type = 'poor';
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to plaza',
                action: function() {
                    site.type = 'plaza';
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to farm',
                action: function() {
                    site.type = 'farm';
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to water',
                action: function() {
                    site.type = 'water';
                    site['elevation'] = state.waterline / 2;
                    site['affluence'] = state.waterline / 2;
                    assignBuildings4Polygon(site.index);
                    render();
                }
            },
            {
                title: 'Change type to empty',
                action: function() {
                    site.type = 'empty';
                    assignBuildings4Polygon(site.index);
                    render();
                }
            }];
    };

    // split 1 polygon into n sub-polygons
    // polygon [[0,1], ... [0,1]]
    function splitPolygon(polygon, n) {
        if( n == 0 ) return [];
        let subPoly = [polygon];

        while(subPoly.length < n) {
            let p = subPoly.shift();
            let splitResult = splitPolyInto2(p);
            let poly1 = splitResult.poly1.poly.arrVector.map(p => [p.x, p.y]);
            let poly2 = splitResult.poly2.poly.arrVector.map(p => [p.x, p.y]);

            poly1.center = d3.polygonCentroid(poly1);
            poly2.center = d3.polygonCentroid(poly2);
            subPoly.push(poly1);
            subPoly.push(poly2);
        }
        return subPoly;
    }

    // split 1 polygon into 2 sub-polygons
    // polygon [[0,1], ... [0,1]]
    function splitPolyInto2(polygon) {
        let poly = new Polygon();
        let k = Math.random() * .6 + .2;
        let area = Math.abs(d3.polygonArea(polygon)) * k;

        polygon.forEach(v => poly.push_back(new Vector(v[0], v[1])));
        return poly.split(area);
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
    /*=====================================================================================================
                                             return Metro
    ======================================================================================================*/
    return {
        state: state,
        graphics: state.graphics,
    };
}