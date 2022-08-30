import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise';
import SVG from './SVG.js';
import * as Geomerty from './geometry.js';


let IS_DEBUG = true;

class Parameter {
    constructor(description, value, stepSize, min, max) {
        this.description = description;
        this.value = value;
        this.stepSize = stepSize;
        this.min = min;
        this.max = max;
    }
}

class Parameters {
    constructor() {
        this.seed = new Parameter("Random seed", 1337, 1);
        this.widthCnt = new Parameter("Number of pices wide", 10, 1, 1);
        this.heightCnt = new Parameter("Number of pices heigh", 10, 1, 1);
        this.width = new Parameter("Width in mm", 200, 1);
        this.height = new Parameter("Height in mm", 200, 1);
        this.gridPerturb = new Parameter("Max grid pertrusion (0.5 => half width of pice)", 0.5, 0.05, 0, 1);
        this.noiseOffsetX = new Parameter("pertrusion noise offset X", 0, 0.01);
        this.noiseOffsetY = new Parameter("pertrusion noise offset Y", 0, 0.01);
        this.noiseScale = new Parameter("pertrusion noise scale", 1, 0.01, 0);
        this.tongueHeightMin = new Parameter("tongue height min", 0.18, 0.01, 0.1, 0.5);
        this.tongueHeightMax = new Parameter("tongue height max", 0.32, 0.01, 0.1, 0.5);
    }

    get piceWidth() { return this.width.value / this.widthCnt.value };
    get piceHeight() { return this.height.value / this.heightCnt.value };

    getList() {
        var list = [];
        for (let param in this)
            if (this[param] instanceof Parameter)
                list.push(this[param]);
        return list;
    }
}

var parameters = new Parameters();

function generate() {
    Math.seedrandom(parameters.seed.value);
    parameters.simplex = createNoise3D();

    let grid = createRectangularGrid();
    perturb(grid);

    let edges = calculateEdges(grid);

    let tongues = createTongues(edges);

    let svg = new SVG.Svg();
    svg.fill = 'none';
    svg.strokeWidth = '0.26458333333299';

    let svgContent = new SVG.Group();
    svg.add(svgContent);
    svgContent.transform = 'scale(3.77952755906)';

    if (IS_DEBUG) {
        let gDebug = new SVG.Group();
        svgContent.add(gDebug);

        addDebugPrints(gDebug, grid, edges);
    }

    let gPuzzle = new SVG.Group();
    svgContent.add(gPuzzle);
    gPuzzle.stroke = '#f00';

    for (const tongue of tongues) {
        gPuzzle.add(tongue);
    }

    return svg.render();
}

function createRectangularGrid() {
    let grid = new Array(parameters.widthCnt.value + 1);

    for (let x = 0; x < grid.length; x++) {
        grid[x] = new Array(parameters.heightCnt.value);
        for (let y = 0; y <= parameters.heightCnt.value; y++)
            grid[x][y] = new Geomerty.Point(x * parameters.piceWidth, y * parameters.piceHeight);
    }
    return grid;
}

function perturb(grid) {
    for (let x = 0; x < grid.length; x++)
        for (let y = 0; y < grid[x].length; y++) {
            grid[x][y] = snapToBorder(x, y, perturbPoint(x, y, grid[x][y]));
        }
}

function perturbPoint(x, y, point) {
    let offset = new Geomerty.Point(
        parameters.simplex(
            (point.x / parameters.width.value + x * 10 + parameters.noiseOffsetX.value) * parameters.noiseScale.value,
            (point.y / parameters.height.value + parameters.noiseOffsetY.value) * parameters.noiseScale.value,
            1) * parameters.piceWidth,
        parameters.simplex(
            (point.x / parameters.width.value + parameters.noiseOffsetX.value) * parameters.noiseScale.value,
            (point.y / parameters.height.value + y * 10 + parameters.noiseOffsetY.value) * parameters.noiseScale.value,
            1) * parameters.piceHeight)
        .scale(parameters.gridPerturb.value);
    return point.translate(offset);
}

function snapToBorder(x, y, point) {
    if (x == 0)
        point.x = 0;
    else if (x == parameters.widthCnt.value)
        point.x = parameters.width.value;

    if (y == 0)
        point.y = 0;
    else if (y == parameters.heightCnt.value)
        point.y = parameters.height.value;

    return point;
}

function calculateEdges(grid) {
    let horizontals = [];
    let verticals = [];

    //separate loops for ordering of the Edges.
    for (let y = 0; y <= parameters.heightCnt.value; y++) {
        for (let x = 0; x < grid.length; x++)
            if (x < grid.length - 1)
                horizontals.push(new Geomerty.Edge(grid[x][y], grid[x + 1][y]));
    }

    for (let x = 0; x < grid.length; x++)
        for (let y = 0; y < grid[x].length; y++) {
            if (y < grid[x].length - 1)
                verticals.push(new Geomerty.Edge(grid[x][y], grid[x][y + 1]));
        }
    return horizontals.concat(verticals);
}

function createTongues(edges) {
    let tongues = [];

    for (const edge of edges) {
        let isEdge = (edge.start.x == 0 && edge.end.x == 0) ||
            (edge.start.y == 0 && edge.end.y == 0) ||
            (edge.start.x == parameters.width.value && edge.end.x == parameters.width.value) ||
            (edge.start.y == parameters.height.value && edge.end.y == parameters.height.value);
        if (isEdge) {
            let line = new SVG.Line(edge);
            tongues.push(line);
        } else {
            let tongue;

            tongue = new BezierTongue(edge);

            let path = new SVG.Path();
            path.d = tongue.render();
            tongues.push(path);
        }
    }

    return tongues;
}

function addDebugPrints(svg, grid, edges) {
    for (const row of grid)
        for (const point of row) {
            let circle = new SVG.Circle(point,0.5);            
            circle.stroke = 'green';
            svg.add(circle);
        }
    for (const edge of edges) {
        let line = new SVG.Line(edge);
        line.stroke = 'cyan';
        svg.add(line);
    }
}

class Tongue {
    constructor(edge) {
        if (this.constructor === Tongue) {
            throw new Error('Class "Tongue" cannot be instantiated')
        }
        this.edge = edge;
    }

    render() { throw new Error('Method "someMethod()" must be implemented.') }
}

class BezierTongue extends Tongue {
    constructor(edge) { super(edge); }

    render() {
        let vEdge = this.edge.dir;
        let vPerpN = new Geomerty.Point(vEdge.y, -vEdge.x).normal();

        //Flip half of the time
        if (Math.random() > 0.5)
            vPerpN = vPerpN.scale(-1);

        let toungRnd = Math.random() * (parameters.tongueHeightMax.value - parameters.tongueHeightMin.value);
        let middleScale = vEdge.length * (parameters.tongueHeightMin.value + toungRnd);
        //todo should be more like distance to edge in direction of tongue

        let middlePosOffset = 0.4 + Math.random() * 0.2;

        let middle = this.edge.start.translate(vEdge.scale(middlePosOffset)).translate(vPerpN.scale(middleScale));

        let middleWidthFactor = 1 + Math.random() * 0.2;

        let startControl = this.edge.start.translate(vEdge.scale(0.8 * middleWidthFactor));
        let middleControl = middle.translate(vEdge.scale(-0.4 * middleWidthFactor));
        let endControl = this.edge.end.translate(vEdge.scale(-0.8 * middleWidthFactor));
        //todo move start and end controll according to middlePosOffset

        var d = new SVG.Paths.PathCollection();

        var absolute = SVG.Paths.Absolute;

        d.add(new absolute.Move(this.edge.start));
        d.add(new absolute.CubicBezier(startControl, middleControl, middle));
        d.add(new absolute.SmoothCubicBezier(endControl, this.edge.end));

        return d.render();
    }
}

export default { generate, parameters };