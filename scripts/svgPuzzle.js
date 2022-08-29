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

function clamp(num, min, max) { return Math.min(Math.max(num, min), max); };

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
            let line = new SVG.Line();
            line.x1 = edge.start.x;
            line.y1 = edge.start.y;
            line.x2 = edge.end.x;
            line.y2 = edge.end.y;
            tongues.push(line);
        } else {
            let vEdge = edge.dir;
            let vPerpN = new Geomerty.Point(vEdge.y, -vEdge.x).normal();

            //Flip half of the time
            if (Math.random() > 0.5)
                vPerpN = vPerpN.scale(-1);

            let toungRnd = Math.random() * (parameters.tongueHeightMax.value - parameters.tongueHeightMin.value);
            let middleScale = vEdge.length * (parameters.tongueHeightMin.value + toungRnd);
            //todo should be more like distance to edge in direction of tongue

            let middlePosOffset = 0.4 + Math.random() * 0.2;

            let middle = edge.start.translate(vEdge.scale(middlePosOffset)).translate(vPerpN.scale(middleScale));

            let middleWidthFactor = 1 + Math.random() * 0.2;

            let startFactor = 0.8 * middleWidthFactor;

            let endFactor = 0.8 * middleWidthFactor;

            let middleFactor = 0.4 * middleWidthFactor;

            let startControl = edge.start.translate(vEdge.scale(startFactor));
            let middleControl = middle.translate(vEdge.scale(-middleFactor));
            let endControl = edge.end.translate(vEdge.scale(-endFactor));

            //todo move start and end controll according to middlePosOffset

            let path = new SVG.Path();

            var d = new SVG.Paths.PathCollection();

            var absolute = SVG.Paths.Absolute;

            d.add(new absolute.Move(edge.start.x, edge.start.y));
            d.add(new absolute.CubicBezier(startControl.x, startControl.y, middleControl.x, middleControl.y, middle.x, middle.y));
            d.add(new absolute.SmoothCubicBezier(endControl.x, endControl.y, edge.end.x, edge.end.y));

            path.d = d.render();
            tongues.push(path);
        }
    }

    return tongues;
}

function addDebugPrints(svg, grid, edges) {
    for (const row of grid)
        for (const point of row) {
            let circle = new SVG.Circle();
            circle.cx = point.x;
            circle.cy = point.y;
            circle.r = '0.5';
            circle.stroke = 'green';
            svg.add(circle);
        }
    for (const edge of edges) {
        let line = new SVG.Line();
        line.x1 = edge.start.x;
        line.y1 = edge.start.y;
        line.x2 = edge.end.x;
        line.y2 = edge.end.y;
        line.stroke = 'cyan';
        svg.add(line);
    }
}

export default { generate, parameters };