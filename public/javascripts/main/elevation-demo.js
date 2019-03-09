'use strict';

// clear array
Array.prototype.clear = function () {
    while (this.length) {
        this.pop();
    }
};

function Metro(canvas, cursorCanvas) {
    /*=====================================================================================================
                                             Dom Functions
    ======================================================================================================*/
    $(document).ready(function () {
        $('select').formSelect();

        $('#render').click(function () {
            newGraphics();
        });

        $('.renderContourLine').click(function () {
            if (state.LAYERS.has(elevation)) {
                render();
                drawContourLines(state.waterline, 'elevation', 'blue', 4, false, true);
                drawContourLines(0.25, 'elevation', 'red', 4, false, false);
                drawContourLines(0.5, 'elevation', 'green', 4, false, false);
                drawContourLines(0.75, 'elevation', 'yellow', 4, false, false);
            }
        });

        // view
        $('#elevation-view-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(elevation);
            } else {
                if (state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if (state.LAYERS.has(elevation)) {
                    state.LAYERS.delete(elevation);
                    state.EDIT_MODES.delete('elevation');
                    $('#elevation-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#affluence-view-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(affluence);
            } else {
                if (state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if (state.LAYERS.has(affluence)) {
                    state.LAYERS.delete(affluence);
                    state.EDIT_MODES.delete('affluence');
                    $('#affluence-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#desirability-view-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(desirability);
            } else {
                if (state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if (state.LAYERS.has(desirability)) {
                    state.LAYERS.delete(desirability);
                    state.EDIT_MODES.delete('desirability');
                    $('#desirability-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#district-view-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(district);
            } else {
                if (state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if (state.LAYERS.has(district)) {
                    state.LAYERS.delete(district);
                    state.EDIT_MODES.delete('district');
                    $('#district-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        $('#building-view-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(building);
            } else {
                if (state.LAYERS.size === 1) {
                    this.checked = true;
                    return;
                } else if (state.LAYERS.has(building)) {
                    state.LAYERS.delete(building);
                    state.EDIT_MODES.delete('building');
                    $('#building-edit-checkbox').prop('checked', false);
                }
            }
            render();
        });

        // edit
        $('#elevation-edit-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(elevation);
                state.EDIT_MODES.add('elevation');
                $('#elevation-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('elevation');
            }
            render();

        });

        $('#affluence-edit-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(affluence);
                state.EDIT_MODES.add('affluence');
                $('#affluence-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('affluence');
            }
            render();

        });

        $('#desirability-edit-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(desirability);
                state.EDIT_MODES.add('desirability');
                $('#desirability-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('desirability');
            }
            render();

        });

        $('#district-edit-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(district);
                state.EDIT_MODES.add('district');
                $('#district-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('district');
            }
            render();
        });

        $('#building-edit-checkbox').on('change', function () {
            if (this.checked) {
                state.LAYERS.add(building);
                state.EDIT_MODES.add('building');
                $('#building-view-checkbox').prop('checked', true);
            } else {
                state.EDIT_MODES.delete('building');
            }
            render();
        });

        $('#incrementSlider').on('change', function () {
            state.increment = this.value;
        });

        $('#waterLineSlider').on('change', function () {
            state.waterline = this.value / 100;
            onChangeWaterLine();
            drawContourLines(state.waterline, 'elevation', 'blue', 4, false, true);
        });

        $('#elevationSwitch').on('change', function () {
            state.isIncreasing = !this.checked;
        });
    });

    /*=====================================================================================================
                                             Constructors
    ======================================================================================================*/

    // elevation layer
    var elevation = (site_index) => {
        let value = state.graphics.sites[site_index]['elevation'];
        let grayScale = ((1 - value) * 255).toFixed(1);

        if (value <= state.waterline) {
            // set color for river in [elevation] mode
            return [51, 102, 153]; // lightBlue
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
        if (site['elevation'] <= state.waterline) value = 0;
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
        N: $('#input-sites').val() || 100,
        EDIT_MODES: new Set(),
        LAYERS: new Set([elevation]),
        LAYER: 'elevation',
        radius: 100,
        increment: $('#incrementSlider').val() || 15,
        waterline: $('#waterLineSlider').val() / 100 || .15,
        currentCastle: null,
        pointer: {},
        vertices: [],
        contourLines: [],
        selectedSites: [],
        isDragging: false,
        isIncreasing: true,
        isAltPressed: false,
        transform: d3.zoomIdentity, // scale parameter of zoom
        canvas: canvas.node() || d3.select("#myCanvas").node(),
        cursorCanvas: cursorCanvas.node() || d3.select("#cursorCanvas").node(),
        width() {
            return this.canvas.width;
        },
        height() {
            return this.canvas.height;
        },
        context() {
            return this.canvas.getContext("2d", {antialias: true, depth: true});
        },
        cursorContext() {
            return this.cursorCanvas.getContext("2d", {antialias: true, depth: true});
        },
        DISTRICT_TYPES: ['rich', 'medium', 'poor', 'plaza', 'empty', 'water', 'farm', 'park', 'castle', 'harbor', 'military', 'religious', 'university'],
        COLOR: [{R: 255, G: 0, B: 0}, {R: 0, G: 255, B: 0}, {R: 0, G: 0, B: 255}],
        RANDOM_COLOR: d3.scaleOrdinal().range(d3.schemeCategory20), // random color
        POLYGON_TYPE_COLOR: {
            'rich': [152, 134, 148], // purple
            'medium': [161, 147, 127], // rice
            'poor': [103, 99, 92], // grey
            'plaza': [242, 233, 58], // yellow
            'farm': [253, 242, 205], // light yellow #cbc5b9
            'empty': [203, 197, 185], // light yellow #cbc5b9
            'water': [51, 102, 153], // light blue
            'park': [3, 165, 44], // light green
            'castle': [255, 255, 255], // white
            'harbor': [117, 123, 124], // light blue
            'military': [75, 83, 32], // army green
            'religious': [255, 255, 255], // white
            'university': [140, 20, 60], // red
        },
    };
    state.graphics = new Graphics();
    console.log(state);
    render();

    // initialize mouse event
    d3.select(state.cursorCanvas)
        .call(d3.drag()
            .container(state.cursorCanvas)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("wheel", onScroll)
        .on('mousemove', onMouseMove)
        .on("contextmenu", d3.contextMenu(menu))
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", zoomed));

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

        this.sites = d3.range(state.N).map(() => [Math.random() * (MAX_WIDTH - MIN_WIDTH) + MIN_WIDTH, Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT, 0]);
        this.voronoi = d3.voronoi().extent([[MIN_WIDTH, MIN_HEIGHT], [MAX_WIDTH, MAX_HEIGHT]]);
        this.diagram = this.voronoi(this.sites);

        // relax sites in using Lloyd's algorithm
        for (let n = 0; n < 5; n++) {
            this.sites = relax(this.diagram);
            this.diagram = this.voronoi(this.sites);
        }
        this.edges = this.diagram.edges;
        this.links = this.diagram.links();
        this.triangles = this.diagram.triangles();
        this.polygons = makePolygons(this.sites, this.diagram);
    }

    function getCellCentroid(cell, diagram, index) {
        let cx = 0, cy = 0, count = 0;

        getCellVertices(cell, diagram).forEach(v => {
            cx += v[0];
            cy += v[1];
            count++;
        });

        let site = [cx / count, cy / count];
        site.index = index;
        site.type = 'empty';
        site.isBoundary = false;
        site.elevation = 0.35;
        site.affluence = 0;
        site.desirability = 0;
        site.wall = 0;
        site.color = {R: Math.random() * 255, G: Math.random() * 255, B: Math.random() * 255};

        return site;
    }

    // make polygons(districts)
    function makePolygons(sites, diagram) {
        return diagram.cells.map((cell, index) => {
            let polygon = {
                index: index,
                area: null,
                center: null,
                vertices: null,
                buildings: null,
                subPolygons: null,
                isBoundary: false,
                edges: cell.halfedges, // an array of indexes into diagram.edges
            };

            polygon.vertices = cell.halfedges.map(i => {
                polygon.site = cell.site.index;
                diagram.edges[i].forEach(edge => {
                    if (edge.includes(20) || edge.includes(state.width() - 20) || edge.includes(state.height() - 20)) {
                        polygon.isBoundary = true;
                        sites[index].isBoundary = true;
                    }
                });


                let startVertex = cellHalfedgeStart(cell, diagram.edges[i]);
                startVertex.edgeIndex = i;
                startVertex.vertexIndex = state.vertices.length;
                state.vertices.push(startVertex);

                let endVertex = cellHalfedgeEnd(cell, diagram.edges[i]);
                if (!endVertex.hasOwnProperty('edgeIndex') || !endVertex.hasOwnProperty('vertexIndex')) {
                    endVertex.edgeIndex = i;
                    endVertex.vertexIndex = state.vertices.length;
                    state.vertices.push(endVertex);
                }

                return startVertex.vertexIndex;
            });

            let vertices = polygon.vertices.map(v => state.vertices[v]);
            polygon.center = d3.polygonCentroid(vertices);
            polygon.area = Math.abs(d3.polygonArea(vertices));

            return polygon;
        });
    }

    // render
    function render() {
        state.context().save();
        state.cursorContext().clearRect(0, 0, state.width(), state.height());
        state.context().clearRect(0, 0, state.width(), state.height());
        state.context().translate(state.transform.x, state.transform.y);
        state.context().scale(state.transform.k, state.transform.k);

        /* draw districts */
        drawDistricts();

        /* draw buildings */
        if (state.LAYERS.has(building)) drawBuildings();

        // drawTriangles();
        // renderBackground();
        // drawSites(2, 'black'); // lineWidth, lineColor
        // drawEdges(3, 'black'); // lineWidth, lineColor

        /* draw docks */
        if (state.LAYERS.has(building)) drawDock('rgb(233, 233, 233)', 'rgb(233, 233, 233)', 10); // bgColor, edgeColor, lineWidth

        /* draw walls */
        if (state.LAYERS.has(district)) drawContourLines(0.25, 'wall', 'black', 8, true, false);

        state.context().restore();
    }

    function newGraphics() {
        state.vertices.clear();
        state.isAltPressed = true;
        state.currentCastle = null;
        state.N = $('#input-sites').val() || 100;
        state.graphics = new Graphics();

        render();
    }

    /**
     * assign type to site(polygon/district)
     *  @param waterline
     *  @param elevation
     *  @param affluence
     *  @param desirability = (elevation + affluence) / 2
     *
     *  rich: 0.75 <= desirability <= 1
     *  medium: 0.5 < desirability < 0.75
     *  poor: waterline < desirability <= 0.5
     *  plaza: AdjacentSites.contains(`poor` && `medium` && `rich`)
     *  water: elevation <= waterline
     *  farm: waterline < desirability && elevation <= 0.5
     *  empty: value = 0 || (isBoundary && !water)
     *
     *  @Done
     *  park: no building, green,
     *  castle: one building, highest desirability, grey
     *  harbor: water near land, poor, brown
     *  military: near castle and wall, silver
     *  religious: random buildings, yellow/blue
     *  university: next to a least 2 rich, red
     */
    function assignType4Site(index) {
        let s = state.graphics.sites[index];
        let value = (s['elevation'] + s['affluence']) / 2;
        let adjacentTypesMap = new Map();
        let adjacentTypesSet = getAdjacentTypes(s.index); // get all adjacent types -> Set<>

        if (value >= 0.8 && value <= 1) {
            s.type = 'rich';
        } else if (value < 0.8 && value > 0.6) {
            s.type = 'medium';
        } else if (value <= 0.6 && value > state.waterline) {
            s.type = 'poor';
        } else if (value === 0) {
            s.type = 'empty';
        }

        // findAdjacentSites(s.index).forEach(s => adjacentTypesSet.add(state.graphics.sites[s].type));

        // get all adjacent types' frequencies
        [...findAdjacentSites(s.index)]
            .map(s => state.graphics.sites[s].type)
            .forEach(s => {
                if (adjacentTypesMap.has(s)) {
                    adjacentTypesMap.set(s, adjacentTypesMap.get(s) + 1);
                } else {
                    adjacentTypesMap.set(s, 1);
                }
            });

        // assign type `plaza` for district only if it is adjacent to `poor` && `medium` && `rich`
        if (adjacentTypesSet.size === 3 && adjacentTypesSet.has('poor') && adjacentTypesSet.has('medium') && adjacentTypesSet.has('rich')) {
            s.type = Math.random() > 0.5 ? 'plaza' : 'park';
        }

        // assign type `university`
        if (adjacentTypesMap.get('rich') >= 3) {
            s.type = 'university';
        }

        // assign type `park`
        if (adjacentTypesMap.get('rich') >= 4) {
            // s.type = 'park';
        }

        // assign type `water`
        if (s['elevation'] <= state.waterline) {
            s.type = 'water';
            s.wall = 0;
        }

        // assign type `harbor`
        if (s.type !== 'water' && adjacentTypesSet.has('poor') && adjacentTypesSet.has('water')) {
            s.type = 'harbor';
            s.wall = 0;
        }

        // assign type `farm` and `empty`
        if (value <= 0.45 && value > state.waterline) {
            if (!adjacentTypesSet.has('water')) {
                s.type = 'farm';
            } else {
                s.type = 'empty';
            }
        }

        // boundaries can only be assigned as 'empty' or 'water'
        if (s.isBoundary && s.type !== 'water') {
            s.type = Math.random() > 0.5 ? 'empty' : 'farm';
        }

        // randomly assign `religious`
        if (!s.isBoundary && s.type !== 'water' && Number(getAlltypes().get('religious')) <= 2.5 / 100 * state.N) {
            if (Math.random() > 0.99) {
                s.type = 'religious';
            }
        }
        /**
         *  @TODO
         *  park: no building, green,
         *  castle: one building, highest desirability, grey
         *  harbor: water near land, poor, brown
         *  military: near castle and wall, silver
         *  religious: random buildings, yellow/blue
         *  university: next to a least 2 rich, red
         */

        // split polygons and assign buildings for polygon
        assignBuildings4Polygon(index);
    }

    // make sub-polygons/buildings
    function assignBuildings4Polygon(index) {
        let BUILDINGS_NUMBER = {
            'rich': Math.round(Math.random() * 2 + 4),
            'medium': Math.round(Math.random() * 8 + 8),
            'poor': Math.round(Math.random() * 10 + 10),
            'plaza': Math.round(Math.random() * 2 + 2),
            'farm': Math.round(Math.random() * 10 + 10),
            'empty': 0,
            'water': 0,
            'park': 0,
            'castle': 0, // 1
            'military': Math.round(Math.random() * 2 + 6),
            'harbor': Math.round(Math.random() * 4 + 8), // docks
            'religious': Math.round(Math.random() * 2 + 4),
            'university': Math.round(Math.random() * 1 + 5), // UWL red
        };
        let polygon = state.graphics.polygons[index],
            site = state.graphics.sites[index],
            size = BUILDINGS_NUMBER[site.type],
            k = Math.random() * 0.6 + 0.2,
            vertices = convert2Vertices(polygon.vertices),
            resultArr = splitPolygon(vertices, size, k);

        resultArr.forEach(r => r.color = state.POLYGON_TYPE_COLOR[site.type]);
        polygon.buildings = resultArr;

        if (site.type === 'farm') {
            size = Math.round(Math.random() * 4 + 2);
            polygon.subPolygons = splitPolygon(vertices, size, 0.5);
            polygon.subPolygons.forEach( sp => sp.pattern = state.context().createPattern(makeDiagonalPattern(sp), "repeat") );
            polygon.buildings = Math.random() > 0.9 ? [polygon.buildings.pop()] : [];
        } else {
            clearSubPolygons(polygon);

            if (site.type === 'plaza') {
                polygon.buildings = Math.random() > 0.5 ? [polygon.buildings.pop(), polygon.buildings.pop()] : [polygon.buildings.pop()];
            } else if (site.type === 'military') {
                resultArr = splitPolygon(vertices, size, 0.5);
                resultArr.forEach(r => r.color = state.POLYGON_TYPE_COLOR[site.type]);
                polygon.buildings = resultArr;
            } else {
                while (size > 0) {
                    size = size % 5 - 1;
                    polygon.buildings.splice(Math.floor(Math.random() * polygon.buildings.length), 1, []);
                }
            }
        }
    }

    /**
     * assign type `castle`
     *
     * @TODO
     * find sites adjacent to s[`castle`],  s.wall = everySite.wall === 0.5 ? 0 : 0.5;
     */
    function assignCastle4Site() {
        let site = null;
        let sites = state.graphics.sites.filter(s => s.type !== 'water' && s.type !== 'harbor');

        if (sites.length > 0) {
            site = sites.reduce((current, next) => current['desirability'] > next['desirability'] ? current : next);

            if (state.currentCastle && site.index !== state.currentCastle) {
                let newDesirability = state.graphics.sites[site.index]['desirability'];
                let oldDesirability = state.graphics.sites[state.currentCastle]['desirability'];
                if (newDesirability > oldDesirability) {
                    // reassign old one
                    state.graphics.sites[state.currentCastle].wall = 0;
                    assignType4Site(state.currentCastle);
                }
            }

            // assign `castle`
            assignMilitary4Site(site.index);
            site.wall = 0.5;
            site.type = 'castle';
            state.currentCastle = site.index;
            assignBuildings4Polygon(site.index);
        }
    }

    // assign type `military`
    function assignMilitary4Site(index) {
        // reassign old military
        reassignMilitarySites();

        // get all adjacent types
        findAdjacentSites(index).forEach(i => {
            if (state.graphics.sites[i].type !== 'water' && state.graphics.sites[i].type !== 'harbor') {
                state.graphics.sites[i].type = 'military';
                assignBuildings4Polygon(i);
            }
        });
    }

    //  reassign military sites
    function reassignMilitarySites() {
        state.graphics.sites
            .filter(s => s.type === 'military')
            .forEach(s => {
                let adjacentTypesSet = getAdjacentTypes(s.index); // get all adjacent types
                if (!adjacentTypesSet.has('castle')) {
                    assignType4Site(s.index);
                }
            });
    }

    // on changing waterline
    function onChangeWaterLine() {
        state.graphics.sites.forEach(s => assignType4Site(s.index));
        assignCastle4Site();
        render();
    }

    /*=====================================================================================================
                                             Event Functions
    ======================================================================================================*/
    function dragsubject() {
        if (state.isAltPressed) {
            return null;
        } else {
            return 0;
        }
    }

    function dragstarted() {
        if (state.EDIT_MODES.size >= 1 && !state.isAltPressed) {
            d3.contextMenu('close');
            state.isDragging = true;
        }
    }

    function dragged() {
        if (state.EDIT_MODES.size >= 1 && state.isDragging) {
            state.pointer = d3.mouse(this);
            let x = state.transform.invertX(state.pointer[0]);
            let y = state.transform.invertY(state.pointer[1]);
            state.selectedSites.clear();
            state.selectedSites = findSites(x, y, state.radius);

            if (state.isIncreasing) {
                if (state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        if (state.EDIT_MODES.has('district')) {
                            s['wall'] = 0.5;
                            if (s.type === 'water') s['wall'] = 0;
                        }
                        if (state.EDIT_MODES.has('elevation')) {
                            s['elevation'] += (state.increment / 100) * s.delta;
                            s['desirability'] += (state.increment / 100) * s.delta;
                        }
                        if (state.EDIT_MODES.has('affluence')) {
                            s['affluence'] += (state.increment / 100) * s.delta;
                            s['desirability'] += (state.increment / 100) * s.delta;
                        }
                        if (state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] += ((state.increment / 100) * s.delta) / 10;
                            s['affluence'] += ((state.increment / 100) * s.delta) / 10 * 9;
                            s['desirability'] += (state.increment / 100) * s.delta / 10 * 5;
                        }
                        if (s['elevation'] >= 1) s['elevation'] = 1;
                        if (s['affluence'] >= 1) s['affluence'] = 1;
                        if (state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) {
                            assignType4Site(s.index);
                        }
                    });
                }
            } else {
                if (state.selectedSites.length > 0) {
                    state.selectedSites.map(s => {
                        if (state.EDIT_MODES.has('district')) {
                            s['wall'] = 0;
                        }
                        if (state.EDIT_MODES.has('elevation')) {
                            s['elevation'] -= (state.increment / 100) * s.delta;
                            s['desirability'] -= (state.increment / 100) * s.delta;
                        }
                        if (state.EDIT_MODES.has('affluence')) {
                            s['affluence'] -= (state.increment / 100) * s.delta;
                            s['desirability'] -= (state.increment / 100) * s.delta;
                        }
                        if (state.EDIT_MODES.has('desirability') && state.EDIT_MODES.size === 1) {
                            s['elevation'] -= ((state.increment / 100) * s.delta) / 10;
                            s['affluence'] -= ((state.increment / 100) * s.delta) / 10 * 9;
                            s['desirability'] -= (state.increment / 100) * s.delta / 10 * 5;
                        }
                        if (s['elevation'] <= 0) s['elevation'] = 0;
                        if (s['affluence'] <= 0) s['affluence'] = 0;
                        if (state.EDIT_MODES.has('elevation') || state.EDIT_MODES.has('affluence')) assignType4Site(s.index);
                        // if(state.EDIT_MODES.has('building')) assignBuildings4Polygon(s.index);
                    });
                }
            }
            render();
            if (!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) drawCursor('red');
        }
    }

    function dragended() {
        if (state.EDIT_MODES.size >= 1 && state.isDragging) {
            // after drag end, assign type `castle`
            assignCastle4Site();
            state.isDragging = false;
            render();
        }
    }

    // mouse event
    function onMouseMove() {
        if (!state.isAltPressed && state.EDIT_MODES.size >= 1) {
            state.pointer = d3.mouse(this);
            if (!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) {
                drawCursor('red');
            }
        }
    }

    function onScroll() {
        if (!state.isAltPressed && state.EDIT_MODES.size >= 1) {
            state.radius -= d3.event.deltaX;
            state.radius -= d3.event.deltaY;

            if (state.radius < 15) state.radius = 15;
            if (state.radius > 700) state.radius = 700;
            if (!(state.EDIT_MODES.has('building') && state.EDIT_MODES.size === 1)) {
                drawCursor('red');
            }
        }
    }

    // set zoom arguments
    function zoomed() {
        if (state.isAltPressed) {
            state.transform = d3.event.transform;
            render();
        }
    }

    function onKeyDown() {
        if (d3.event.altKey) state.isAltPressed = true;

        if (d3.event.keyCode === 13) {
            if ($('#sites').val() !== "") {
                newGraphics();
            }
        }
    }

    function onKeyUp() {
        state.isAltPressed = state.isAltPressed ? false : true;
    }

    /*=====================================================================================================
                                             Draw Functions
    ======================================================================================================*/

    /**
     * Creates a canvas filled with a 45-degree pinstripe.
     * @returns {HTMLCanvasElement}
     */
    function makeDiagonalPattern(sub) {

        let canvasPattern = document.createElement("canvas");
        canvasPattern.width = sub.size;
        canvasPattern.height = sub.size;
        let contextPattern = canvasPattern.getContext("2d", {antialias: true, depth: false});
        contextPattern.clearRect(0, 0, canvasPattern.width, canvasPattern.height);

        // draw pattern to off-screen context
        contextPattern.beginPath();

        contextPattern.translate(sub.size / 2, sub.size / 2);
        contextPattern.rotate(sub.rotation);
        contextPattern.translate(-sub.size / 2, -sub.size / 2);

        // for(let l = 0; l <= sub.size; l += sub.size / 10) {
        //     contextPattern.moveTo(l, 0);
        //     contextPattern.lineTo(l, sub.size);
        // }

        // if(sub.rotation === 0) {
        //     contextPattern.moveTo(0, 0);
        //     contextPattern.lineTo(canvasPattern.width, canvasPattern.height);
        // } else if(sub.rotation === 1) {
        //     contextPattern.moveTo(canvasPattern.width, 0);
        //     contextPattern.lineTo(0, canvasPattern.height);
        // }

        contextPattern.moveTo(0, 0);
        contextPattern.lineTo(canvasPattern.width, canvasPattern.height);
        contextPattern.stroke();

        return canvasPattern;
    }

    // draw districts
    function drawDistricts() {
        state.context().save();

        state.graphics.polygons.forEach(p => {
            let site = state.graphics.sites[p.index];
            let colors = [...state.LAYERS].map(layer => layer(p.site));
            let color = combineColors(colors);

            // start drawing polygon
            state.context().beginPath();
            // state.context().fillStyle = site.type === 'water' ? 'rgb(51, 102, 153)' : 'rgb(203, 197, 185)';

            if (site.type === 'farm' && state.LAYERS.has(building)) {
                p.subPolygons.forEach(sub => {

                    if (!sub.center) return;

                    state.context().beginPath();
                    state.context().translate(sub.center[0], sub.center[1]);
                    state.context().scale(0.8, 0.8);
                    state.context().translate(-sub.center[0], -sub.center[1]);
                    state.context().fillStyle = sub.pattern;
                    drawPolygon(sub);
                    state.context().closePath();
                    state.context().fill();
                    state.context().setTransform(1, 0, 0, 1, 0, 0);
                    state.context().translate(state.transform.x, state.transform.y);
                    state.context().scale(state.transform.k, state.transform.k);
                });

            } else if (site.type === 'castle' && state.LAYERS.has(building)) {
                state.context().translate(p.center[0], p.center[1]);
                state.context().scale(0.4, 0.4);
                state.context().translate(-p.center[0], -p.center[1]);
                state.context().fillStyle = color;
                state.context().lineWidth = 4;
                state.context().strokeStyle = 'black';
                drawPolygon(convert2Vertices(p.vertices));
                state.context().closePath();
                state.context().stroke();
                state.context().fill();
                state.context().setTransform(1, 0, 0, 1, 0, 0);
                state.context().translate(state.transform.x, state.transform.y);
                state.context().scale(state.transform.k, state.transform.k);

            } else {
                state.context().fillStyle = color;
                drawPolygon(convert2Vertices(p.vertices));
                state.context().closePath();
                state.context().fill();
            }
        });
        state.context().restore();
    }

    // draw single polygon
    function drawPolygon(vertices) {
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];

            state.context().moveTo(vertex[0], vertex[1]);
            for (let j = 0; j < vertices.length; j++) {
                let nextVertex = vertices[j];
                state.context().lineTo(nextVertex[0], nextVertex[1]);
            }
        }
    }

    // draw buildings(splitted polygon) of polygon that has buildings
    function drawBuildings() {
        state.context().save();
        state.graphics.polygons.forEach(p => {
            if (!p.buildings) return;

            p.buildings.forEach(buildings => {
                if (buildings === 0 || buildings.length === 0 || !buildings.center) return;
                // start drawing building
                state.context().beginPath();
                state.context().translate(buildings.center[0], buildings.center[1]);
                state.context().scale(0.8, 0.8);
                state.context().translate(-buildings.center[0], -buildings.center[1]);
                state.context().lineWidth = 1;
                state.context().strokeStyle = 'black';
                state.context().fillStyle = `rgb( ${buildings.color[0]}, ${buildings.color[1]}, ${buildings.color[2]} )`;
                // state.context().fillStyle = state.RANDOM_COLOR(Math.random());
                drawPolygon(buildings);
                state.context().closePath();
                state.context().stroke();
                state.context().fill();
                state.context().setTransform(1, 0, 0, 1, 0, 0);
                state.context().translate(state.transform.x, state.transform.y);
                state.context().scale(state.transform.k, state.transform.k);
            });
        });
        state.context().restore();
    }

    // draw circle following mouse
    function drawCursor(color) {
        if (!state.cursorCanvas) return;

        state.cursorContext().clearRect(0, 0, state.width(), state.height());
        state.cursorContext().beginPath();

        state.cursorContext().moveTo(state.pointer[0], state.pointer[1]);
        state.cursorContext().arc(state.pointer[0], state.pointer[1], state.radius, 0, 2 * Math.PI, false);
        state.cursorContext().arc(state.pointer[0], state.pointer[1], state.radius / 2, 0, 2 * Math.PI, false);

        state.cursorContext().moveTo(state.pointer[0], state.pointer[1]);
        state.cursorContext().lineTo(state.pointer[0] - state.radius, state.pointer[1]);

        state.cursorContext().moveTo(state.pointer[0], state.pointer[1] - state.radius);
        state.cursorContext().lineTo(state.pointer[0], state.pointer[1] + state.radius);

        state.cursorContext().lineWidth = 1.5;
        state.cursorContext().strokeStyle = color;
        state.cursorContext().stroke();
    }

    // draw dock
    function drawDock(bgColor, edgeColor, lineWidth) {
        if (!getAlltypes().get('harbor')) return;

        state.context().save();
        state.context().beginPath();
        state.graphics.sites
            .filter(s => s.type === 'harbor')
            .forEach(s => {
                let poly = state.graphics.polygons[s.index];

                convert2Edges(poly.edges).forEach(e => {
                    let left = e.left ? state.graphics.sites[e.left.index] : null;
                    let right = e.right ? state.graphics.sites[e.right.index] : null;
                    let waterSite = left.type === 'water' ? left : right;
                    let point = null;

                    if (waterSite.type === 'water') {
                        let midX = (e[0][0] + e[1][0]) / 2;
                        let midY = (e[0][1] + e[1][1]) / 2;
                        let d = distance(e[0], e[1]) / 3;
                        let dockDestination = getPerpendicularLineDestination(e[0][0], e[0][1], e[1][0], e[1][1], midX, midY, d);

                        let point1 = [dockDestination.x1, dockDestination.y1];
                        let point2 = [dockDestination.x2, dockDestination.y2];
                        let a = d3.polygonContains(convert2Vertices(state.graphics.polygons[waterSite.index].vertices), point1);
                        let b = d3.polygonContains(convert2Vertices(state.graphics.polygons[waterSite.index].vertices), point2);

                        point = a ? point1 : point2;
                        state.context().moveTo(midX, midY);
                        state.context().lineTo(point[0], point[1]);

                        state.context().fillStyle = bgColor;
                        state.context().lineWidth = lineWidth;
                        state.context().strokeStyle = edgeColor;
                        state.context().fill();
                        state.context().stroke();
                    }
                });
            });
        state.context().restore();
    }

    // draw sites
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
            const x1 = triangle[0][0],
                y1 = triangle[0][1],
                x2 = triangle[1][0],
                y2 = triangle[1][1],
                x3 = triangle[2][0],
                y3 = triangle[2][1],
                min_width = Math.min(x1, x2, x3),
                max_width = Math.max(x1, x2, x3),
                min_height = Math.min(y1, y2, y3),
                max_height = Math.max(y1, y2, y3);

            for (let x = min_width; x < max_width; x++) {
                for (let y = min_height; y < max_height; y++) {
                    let point = [x, y];
                    if (d3.polygonContains(triangle, point)) {
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
    function drawContourLines(point, layer, color, width, isWall, isWaterLine) {
        state.context().save();

        if (!isWall) {
            state.context().translate(state.transform.x, state.transform.y);
            state.context().scale(state.transform.k, state.transform.k);
        }
        state.graphics.triangles.forEach(triangle => {
            let vertices = triangle.sort((a, b) => {
                if (a[layer] < b[layer]) {
                    return -1;
                } else if (a[layer] > b[layer]) {
                    return 1;
                } else {
                    return 0;
                }
            });

            if (point >= vertices[0][layer] && point <= vertices[2][layer]) {
                let e1, e2;
                if (point >= vertices[0][layer] && point <= vertices[1][layer]) {
                    e1 = [vertices[0], vertices[1]];
                    if (point >= vertices[0][layer] && point <= vertices[2][layer]) {
                        e2 = [vertices[0], vertices[2]];
                    } else {
                        e2 = [vertices[1], vertices[2]];
                    }
                } else {
                    e1 = [vertices[1], vertices[2]];
                    if (point >= vertices[1][layer] && point <= vertices[0][layer]) {
                        e2 = [vertices[0], vertices[1]];
                    } else {
                        e2 = [vertices[0], vertices[2]];
                    }
                }

                let pt1 = pointOnEdge(e1[0], e1[1], point, layer);
                let pt2 = pointOnEdge(e2[0], e2[1], point, layer);

                state.contourLines.clear();
                state.contourLines.push([pt1, pt2]);
                drawLine(pt1, pt2, width, color, isWaterLine);
            }
        });
        state.context().restore();
    }

    // draw a line from p1[0, 1] to p2[0, 1]
    function drawLine(p1, p2, width, color, isWaterLine) {
        state.context().beginPath();
        state.context().fillStyle = color;
        state.context().lineWidth = width;
        state.context().lineCap = 'round';
        state.context().strokeStyle = color;
        state.context().moveTo(p1[0], p1[1]);
        if (!isWaterLine) {
            state.context().arc(p1[0], p1[1], 5, 0, 2 * Math.PI, false);
        }
        state.context().moveTo(p1[0], p1[1]);
        state.context().lineTo(p2[0], p2[1]);
        state.context().fill();
        state.context().stroke();
    }

    /*=====================================================================================================
                                             Additional Functions
    ======================================================================================================*/

    // get distance of two vectors
    function distance(a, b) {
        return Math.sqrt(sqr(b[0] - a[0]) + sqr(b[1] - a[1]));
    }

    // get square of x
    function sqr(x) {
        return x * x;
    }

    // get vertices from diagram.cell
    function getCellVertices(cell, diagram) {
        return cell.halfedges.map(i => cellHalfedgeStart(cell, diagram.edges[i]));
    }

    // relax sites, get average positions
    function relax(diagram) {
        return diagram.cells.map((cell, index) => getCellCentroid(cell, diagram, index));
    }

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
        // condition of closing
        if (!state.EDIT_MODES.has('district') && !state.EDIT_MODES.has('building')) {
            d3.select('.d3-context-menu').remove();
        }
        let x = state.transform.invertX(d3.event.layerX);
        let y = state.transform.invertY(d3.event.layerY);
        let site = findSite(x, y);
        let percentMap = getAlltypes();

        if (site.isBoundary) {
            return [{
                title: 'Current Type: ' + site.type,
            },
                {
                    title: `water: ${percentMap.get('water') || 0} / ${state.N}`,
                    action: function () {
                        site.type = 'water';
                        site['elevation'] = state.waterline / 2;
                        site['affluence'] = state.waterline / 2;
                        assignBuildings4Polygon(site.index);
                        render();
                    },
                    disabled: site.type === 'water' ? true : false
                },
                {
                    title: `farm: ${percentMap.get('farm') || 0} / ${state.N}`,
                    action: function () {
                        site.type = 'farm';
                        assignBuildings4Polygon(site.index);
                        render();
                    },
                    disabled: site.type === 'farm' ? true : false
                },
                {
                    title: `empty: ${percentMap.get('empty') || 0} / ${state.N}`,
                    action: function () {
                        site.type = 'empty';
                        site['elevation'] = 0.35;
                        site['affluence'] = 0;
                        assignBuildings4Polygon(site.index);
                        render();
                    },
                    disabled: site.type === 'empty' ? true : false
                }];
        }

        return [{
            title: 'Current Type: ' + site.type,
        },
            {
                divider: true
            },
            {
                title: `rich: ${percentMap.get('rich') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'rich';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'rich' ? true : false
            },
            {
                title: `medium: ${percentMap.get('medium') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'medium';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'medium' ? true : false
            },
            {
                title: `poor: ${percentMap.get('poor') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'poor';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'poor' ? true : false
            },
            {
                title: `plaza: ${percentMap.get('plaza') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'plaza';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'plaza' ? true : false
            },
            {
                title: `park: ${percentMap.get('park') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'park';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'park' ? true : false
            },
            // {
            //     title: `university: ${percentMap.get('university') || 0} / ${state.N}`,
            //     action: function () {
            //         site.type = 'university';
            //         assignBuildings4Polygon(site.index);
            //         render();
            //     },
            //     disabled: site.type === 'university' ? true : false
            // },
            // {
            //     title: `castle: ${percentMap.get('castle') || 0} / ${state.N}`,
            //     action: function () {
            //         site.type = 'castle';
            //         assignBuildings4Polygon(site.index);
            //         render();
            //     },
            //     disabled: site.type === 'castle' ? true : false
            // },
            // {
            //     title: `military: ${percentMap.get('military') || 0} / ${state.N}`,
            //     action: function () {
            //         site.type = 'military';
            //         assignBuildings4Polygon(site.index);
            //         render();
            //     },
            //     disabled: site.type === 'military' ? true : false
            // },
            {
                title: `religious: ${percentMap.get('religious') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'religious';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'religious' || Number(getAlltypes().get('religious')) > 2.5 / 100 * state.N ? true : false
            },
            {
                title: `farm: ${percentMap.get('farm') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'farm';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'farm' ? true : false
            },
            {
                title: `water: ${percentMap.get('water') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'water';
                    site['elevation'] = state.waterline / 2;
                    site['affluence'] = state.waterline / 2;
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'water' ? true : false
            },
            {
                title: `harbor: ${percentMap.get('harbor') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'harbor';
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'harbor' ? true : false
            },
            {
                title: `empty: ${percentMap.get('empty') || 0} / ${state.N}`,
                action: function () {
                    site.type = 'empty';
                    site['elevation'] = 0.35;
                    site['affluence'] = 0;
                    assignBuildings4Polygon(site.index);
                    render();
                },
                disabled: site.type === 'empty' ? true : false
            }];
    };

    /**
     * split 1 polygon into n sub-polygons
     * @param polygon: [vertex, vertex, ..., vertex]
     * @param n: number of sub-polygons
     * @param k: area ratio
     * @returns polygon [[0,1], ... [0,1]]
     */
    function splitPolygon(polygon, n, k) {
        if (n == 0) return [];
        let subPoly = [polygon];

        while (subPoly.length < n) {
            let p = subPoly.shift();
            let splitResult = splitPolyInto2(p, k);
            let poly1 = splitResult.poly1.poly.arrVector.map(p => [p.x, p.y]);
            let poly2 = splitResult.poly2.poly.arrVector.map(p => [p.x, p.y]);

            poly1.size = 10;
            poly2.size = 10;

            poly1.center = d3.polygonCentroid(poly1);
            poly2.center = d3.polygonCentroid(poly2);

            // poly1.rotation = Math.random() * Math.PI;
            // poly2.rotation = Math.random() * Math.PI;

            // poly1.rotation = Math.random() > 0.5 ? 0 : 1;
            // poly2.rotation = Math.random() < 0.5 ? 0 : 1;
            poly1.rotation = Math.random() > 0.5 ? Math.PI * 0.5 : Math.PI * 1;
            poly2.rotation = Math.random() > 0.5 ? Math.PI * 0.5 : Math.PI * 1;

            subPoly.push(poly1, poly2);
        }
        return subPoly;
    }

    // split 1 polygon into 2 sub-polygons
    // polygon [[0,1], ... [0,1]]
    function splitPolyInto2(polygon, k) {
        let poly = new Polygon();
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
        return {w1: w1, w2: w2, w3: w3};
    }


    /**
     * get point position in the edge that consists of site1 and site2
     * @param site1: [0, 1]
     * @param site2: [0, 1]
     * @param point: Number
     * @returns {*[]}
     */
    function pointOnEdge(site1, site2, point, layer) {
        const lowest = site1[layer] < site2[layer] ? site1 : site2;
        const highest = lowest === site1 ? site2 : site1;
        const x = lowest[0] + (highest[0] - lowest[0]) * (point - lowest[layer]) / (highest[layer] - lowest[layer]);
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
    function findAdjacentSites(index) {
        let sites = new Set();

        state.graphics.links.forEach(function (link) {
            if (link.source.index === index || link.target.index === index) {

                //get adjacent polygons
                state.graphics.polygons.forEach(function (p) {
                    if (state.graphics.sites[p.site].index === link.target.index || state.graphics.sites[p.site].index === link.source.index) {
                        sites.add(p.site);
                    }
                });
            }
        });

        return sites;
    }

    // combine different layers' color
    function combineColors(colors) {
        let r = 0, g = 0, b = 0, n = colors.length;

        colors.forEach(color => {
            r += Number(color[0]);
            g += Number(color[1]);
            b += Number(color[2]);
        });

        r /= n;
        g /= n;
        b /= n;

        return `rgb(${r}, ${g}, ${b})`;
    }

    // clear polygon's subPolygons
    function clearSubPolygons(polygon) {
        if (!polygon.subPolygons) return;
        polygon.subPolygons.forEach(polygons => polygons.clear());
        polygon.subPolygons = null;
    }

    // convert indexes of vertex to vertices
    function convert2Vertices(indexes) {
        return indexes.map(i => state.vertices[i]);
    }

    // convert edge-index to edge
    function convert2Edges(indexes) {
        return indexes.map(i => state.graphics.edges[i]);
    }

    // get adjacent sites' type
    function getAdjacentTypes(index) {
        let adjacentTypesSet = new Set();
        findAdjacentSites(index).forEach(s => adjacentTypesSet.add(state.graphics.sites[s].type));

        return adjacentTypesSet;
    }

    /**
     * get all sites' type
     * @returns {Map<any, any>}
     */
    function getAlltypes() {
        let map = new Map(), n = state.graphics.sites.length;

        state.DISTRICT_TYPES.forEach(type => {
            state.graphics.sites.forEach(s => {
                if (type !== s.type) return;
                if (map.has(type)) {
                    map.set(type, map.get(type) + 1);
                } else {
                    map.set(type, 1);
                }
            });
        });

        return map;
    }

    /**
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param midX
     * @param midY
     * @param d
     * @returns {{x1: *, y1: *, x2: *, y2: *}}
     * @URL https://math.stackexchange.com/questions/306468/perpendicular-line-passing-through-the-midpoint-of-another-line
     */
    function getPerpendicularLineDestination(p1_x, p1_y, p2_x, p2_y, midX, midY, d) {
        let k1 = (p2_y - p1_y) / (p2_x - p1_x); // given segment slope
        let k2 = -1 / k1; // perpendicular line slope

        let x1 = midX + d / Math.sqrt(1 + sqr(k2));
        let y1 = midY + d * k2 / Math.sqrt(1 + sqr(k2));

        let x2 = midX - d / Math.sqrt(1 - sqr(k2));
        let y2 = midY - d * k2 / Math.sqrt(1 - sqr(k2));

        return { x1: x1, y1: y1, x2: x2, y2: y2};
    }

    /*=====================================================================================================
                                             return Metro
    ======================================================================================================*/
    return {
        state: state,
        graphics: state.graphics,
    };
}