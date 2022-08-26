
const svgNs = 'http://www.w3.org/2000/svg';

class SvgElement {
    constructor(type) {
        if (new.target === SvgElement)
            throw TypeError("new of abstract class SvgElement");
        this.elem = document.createElementNS(svgNs, type || new.target.name.toLocaleLowerCase());
    }

    set strokeDasharray(array) { this.elem.setAttribute('stroke-dasharray', array); }
    set strokeLinecap(type) { this.elem.setAttribute('stroke-linecap', type); }
    set strokeLinejoin(type) { this.elem.setAttribute('stroke-linejoin', type); }
    set strokeWidth(width) { this.elem.setAttribute('stroke-width', width); }
    set stroke(color) { this.elem.setAttribute('stroke', color); }
    set fill(color) { this.elem.setAttribute('fill', color); }
    set fillOpacity(opacity) { this.elem.setAttribute('fill-opacity', opacity); }
    set strokeOpacity(opacity) { this.elem.setAttribute('stroke-opacity', opacity); }
}

class PathCommand { }

class AbsolutePathCommand extends PathCommand {
    constructor(x, y) {
        super();
        if (new.target === AbsolutePathCommand)
            throw TypeError("new of abstract class AbsolutePathCommand");
        this.x = x;
        this.y = y;
    }
}

class RelativePathCommand extends PathCommand {
    constructor(dx, dy) {
        super();
        if (new.target === RelativePathCommand)
            throw TypeError("new of abstract class RelativePathCommand");
        this.dx = dx;
        this.dy = dy;
    }
}

export default {
    Svg: class Svg extends SvgElement {
        constructor() { super(); }

        /**
         * @param {Rectangle} value - viewBox Rectangle
         */
        set viewBox(value) { this.elem.setAttribute('viewBox', value); }

        /**
         * @param {SvgElement} svgElement - element to add
         * @returns {SvgElement} this
         */
        add(svgElement) {
            this.elem.appendChild(svgElement.elem);
            return this;
        }

        render() {
            return this.elem.outerHTML;
        }
    },
    Path: class Path extends SvgElement {
        constructor() { super(); }

        /**
         * @param {string} value - path
         */
        set d(value) { this.elem.setAttribute('d', value); }
    },
    Ellipse: class Ellipse extends SvgElement {
        constructor() {
            throw { name: "NotImplementedError", message: "too lazy to implement" };
        }
    },
    Circle: class Circle extends SvgElement {
        constructor() { super(); }

        /**
         * @param {Number} value - Center X
         */
        set cx(value) { this.elem.setAttribute('cx', value); }

        /**
         * @param {Number} value - Center Y
         */
        set cy(value) { this.elem.setAttribute('cy', value); }

        /**
         * @param {Number} value - Radius
         */
        set r(value) { this.elem.setAttribute('r', value); }
    },
    Rect: class Rect extends SvgElement {
        constructor() { super(); }

        /**
         * @param {Number} value - X Position
         */
        set x(value) { this.elem.setAttribute('x', value); }

        /**
         * @param {Number} value - Y Position
         */
        set y(value) { this.elem.setAttribute('y', value); }

        /**
         * @param {Number} value - Width
         */
        set width(value) { this.elem.setAttribute('width', value); }

        /**
         * @param {Number} value - Height
         */
        set height(value) { this.elem.setAttribute('height', value); }

        /**
         * @param {Number} value - Corner Radius X
         */
        set rx(value) { this.elem.setAttribute('rx', value); }

        /**
         * @param {Number} value - Corner Radius Y
         */
        set ry(value) { this.elem.setAttribute('ry', value); }
    },
    Text: class Text extends SvgElement {
        constructor() { super(); }

        /**
         * @param {String} value - Text
         */
        set text(value) { this.elem.textContent = value; }

        /**
         * @param {Number} value - X Position
         */
        set x(value) { this.elem.setAttribute('x', value); }

        /**
         * @param {Number} value - Y Position
         */
        set y(value) { this.elem.setAttribute('y', value); }

        /**
         * @param {Number} value - Offset X
         */
        set dx(value) { this.elem.setAttribute('dx', value); }

        /**
         * @param {String} value - Rotations
         */
        set rotation(value) { this.elem.setAttribute('rotate', value); }

        /**
         * @param {String} value - Length Adjust (spacing | spacingAndGlyphs)
         */
        set lengthAdjust(value) { this.elem.setAttribute('lengthAdjust', value); }

        /**
         * @param {Number} value - Height
         */
        set textLength(value) { this.elem.setAttribute('textLength', value); }

    },
    Group: class Group extends SvgElement {
        constructor() { super('g'); }

        /**
         * @param {SvgElement} svgElement - element to add
         * @returns {SvgElement} this
         */
        add(svgElement) {
            this.elem.appendChild(svgElement.elem);
            return this;
        }
    },
    Paths: {
        PathCollection: class PathCollection {
            constructor() {
                this.paths = [];
            }

            /**
             * @param {PathCommand} command 
             */
            add(command) {
                this.paths.push(command);
            }

            render(isClosed) {
                return this.paths.map(x => x.render()).join() + (isClosed ? "Z" : "");
            }
        },
        Absolute: {
            Move: class Move extends AbsolutePathCommand {
                /**
                 * @param {Number} x - Point X
                 * @param {Number} y - Point Y
                 */
                constructor(x, y) { super(x, y); }

                render() { return `M${this.x} ${this.y}`; }
            },
            Line: class Line extends AbsolutePathCommand {
                /**
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(x, y) { super(x, y); }

                render() { return `L${this.x} ${this.y}`; }
            },
            CubicBezier: class CubicBezier extends AbsolutePathCommand {
                /**
                 * @param {Number} x1 - Start Controll Point X
                 * @param {Number} y1 - Start Controll Point Y
                 * @param {Number} x2 - End Controll Point X
                 * @param {Number} y2 - End Controll Point Y
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(x1, y1, x2, y2, x, y) {
                    super(x, y);
                    this.x1 = x1;
                    this.y1 = y1;
                    this.x2 = x2;
                    this.y2 = y2;
                }

                render() { return `C${this.x1} ${this.y1} ${this.x2} ${this.y2} ${this.x} ${this.y}`; }
            },
            SmoothCubicBezier: class SmoothCubicBezier extends AbsolutePathCommand {
                /**
                 * @param {Number} x2 - End Controll Point X
                 * @param {Number} y2 - End Controll Point Y
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(x2, y2, x, y) {
                    super(x, y);
                    this.x2 = x2;
                    this.y2 = y2;
                }

                render() { return `S${this.x2} ${this.y2} ${this.x} ${this.y}`; }
            },
            QuadraticBezier: class QuadraticBezier extends AbsolutePathCommand {
                /**
                 * @param {Number} x1 - Controll Point X
                 * @param {Number} y1 - Controll Point Y
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(x1, y1, x, y) {
                    super(x, y);
                    this.x1 = x1;
                    this.y1 = y1;
                }

                render() { return `Q${this.x1} ${this.y1} ${this.x} ${this.y}`; }
            },
            SmoothQuadraticBezier: class SmoothQuadraticBezier extends AbsolutePathCommand {
                /**
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(x, y) {
                    super(x, y);
                }

                render() { return `T${this.x} ${this.y}`; }
            },
            Arc: class Arc extends AbsolutePathCommand {
                /**
                 * @param {Number} rx - Radius X
                 * @param {Number} ry - Radius Y
                 * @param {Number} angle - Rotation of ellipse
                 * @param {Boolean} largeArcFlag - True if larger arc of the two possibillities
                 * @param {Boolean} isClockwise - True if rotation in clockwise direction
                 * @param {Number} x - End Point X
                 * @param {Number} y - End Point Y
                 */
                constructor(rx, ry, angle, largeArcFlag, isClockwise, x, y) {
                    super(x, y);
                    this.rx = rx;
                    this.ry = ry;
                    this.angle = angle;
                    this.largeArcFlag = largeArcFlag;
                    this.isClockwise = isClockwise;
                }

                render() { return `A${this.rx} ${this.ry} ${this.angle} ${this.largeArcFlag ? 1 : 0} ${this.isClockwise ? 1 : 0} ${this.x} ${this.y}`; }
            }
        },
        Relative: {
            Move: class Move extends RelativePathCommand {
                /**
                 * @param {Number} dx - Point Offset X
                 * @param {Number} dy - Point Offset Y
                 */
                constructor(dx, dy) { super(dx, dy); }

                render() { return `m${this.dx} ${this.dy}`; }
            },
            Line: class Line extends RelativePathCommand {
                /**
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(dx, dy) { super(dx, dy); }

                render() { return `l${this.dx} ${this.dy}`; }
            },
            CubicBezier: class CubicBezier extends RelativePathCommand {
                /**
                 * @param {Number} dx1 - Start Controll Point Offset X
                 * @param {Number} dy1 - Start Controll Point Offset Y
                 * @param {Number} dx2 - End Controll Point Offset X
                 * @param {Number} dy2 - End Controll Point Offset Y
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(dx1, dy1, dx2, dy2, dx, dy) {
                    super(dx, dy);
                    this.dx1 = dx1;
                    this.dy1 = dy1;
                    this.dx2 = dx2;
                    this.dy2 = dy2;
                }

                render() { return `c${this.dx1} ${this.dy1} ${this.dx2} ${this.dy2} ${this.dx} ${this.dy}`; }
            },
            SmoothCubicBezier: class SmoothCubicBezier extends RelativePathCommand {
                /**
                 * @param {Number} dx2 - End Controll Point Offset X
                 * @param {Number} dy2 - End Controll Point Offset Y
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(dx2, dy2, dx, dy) {
                    super(dx, dy);
                    this.dx2 = dx2;
                    this.dy2 = dy2;
                }

                render() { return `s${this.dx2} ${this.dy2} ${this.dx} ${this.dy}`; }
            },
            QuadraticBezier: class QuadraticBezier extends RelativePathCommand {
                /**
                 * @param {Number} dx1 - Controll Point Offset X
                 * @param {Number} dy1 - Controll Point Offset Y
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(dx1, dy1, dx, dy) {
                    super(dx, dy);
                    this.dx1 = dx1;
                    this.dy1 = dy1;
                }

                render() { return `q${this.dx1} ${this.dy1} ${this.dx} ${this.dy}`; }
            },
            SmoothQuadraticBezier: class SmoothQuadraticBezier extends RelativePathCommand {
                /**
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(dx, dy) {
                    super(dx, dy);
                }

                render() { return `t${this.dx} ${this.dy}`; }
            },
            Arc: class Arc extends RelativePathCommand {
                /**
                 * @param {Number} rx - Radius X
                 * @param {Number} ry - Radius Y
                 * @param {Number} angle - Rotation of ellipse
                 * @param {Boolean} largeArcFlag - True if larger arc of the two possibillities
                 * @param {Boolean} isClockwise - True if rotation in clockwise direction
                 * @param {Number} dx - End Point Offset X
                 * @param {Number} dy - End Point Offset Y
                 */
                constructor(rx, ry, angle, largeArcFlag, isClockwise, dx, dy) {
                    super(dx, dy);
                    this.rx = rx;
                    this.ry = ry;
                    this.angle = angle;
                    this.largeArcFlag = largeArcFlag;
                    this.sweepFlag = sweepFlag;
                }

                render() { return `a${this.rx} ${this.ry} ${this.angle} ${this.largeArcFlag ? 1 : 0} ${this.isClockwise ? 1 : 0} ${this.dx} ${this.dy}`; }
            }
        }
    }
};