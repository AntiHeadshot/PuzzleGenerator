import {createNoise3D} from 'https://cdn.skypack.dev/simplex-noise';
import SVG from './SVG.js';
import * as Geomerty from './geometry.js';

class Parameter {
    constructor(description, value) {
        this.description = description;
        this.value = value;
    }
}

class Parameters {
    constructor() {
        this.seed = new Parameter("Random seed", 1337);
        this.widthCnt = new Parameter("Number of pices wide", 10);
        this.heightCnt = new Parameter("Number of pices heigh", 10);
        this.width = new Parameter("Width in mm", 200);
        this.height = new Parameter("Height in mm", 200);
    }

    getList() {
        var list = [];
        for (let param in this)
            list.push(this[param]);
        return list;
    }
}

function generate() {
    Math.seedrandom(parameters.seed);
    var simplex = createNoise3D();
    
    var value2d = simplex(10, 15, 12);

    var svg = new SVG.Svg();

    var text = new SVG.Text();
    text.text = `puzzle ${value2d} ${parameters.widthCnt.value} x ${parameters.heightCnt.value} ${Math.random()}`;
    text.fill = 'black';

    svg.add(text);

    var path = new SVG.Path();

    var d = new SVG.Paths.PathCollection();

    var absolute = SVG.Paths.Absolute;

    d.add(new absolute.Move(10, 30));
    d.add(new absolute.Arc(20, 20, 0, false, true, 50, 30));
    d.add(new absolute.Arc(20, 20, 0, false, true, 90, 30));
    d.add(new absolute.QuadraticBezier(90, 60, 50, 90));
    d.add(new absolute.QuadraticBezier(10, 60, 10, 30));

    path.d = d.render(true);
    path.stroke = 'red';
    path.strokeWidth = 8;
    path.strokeLinecap = 'round';
    path.strokeLinejoin = 'round';

    svg.fill = 'none';

    svg.add(path);

    return svg.render();
}

var parameters = new Parameters();

export default { generate, parameters };