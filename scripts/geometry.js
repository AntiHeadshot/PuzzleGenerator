export class Edge {
    constructor(sx, sy, ex, ey) {
        if (arguments.length == 2) {
            this.start = new Point(sx.x, sx.y);
            this.end = new Point(sy.x, sy.y);
        } else if (arguments.length == 4) {
            this.start = new Point(sx, sy);
            this.end = new Point(ex, ey);
        } else throw `there is no constructor with ${arguments.length} arguments`;
    }

    getClosestPointOnEdge(point) {
        let v1 = this.dir;
        let v2 = point.subtract(this.start);
        // unit dist of point on Edge
        let u = (v2.x * v1.x + v2.y * v1.y) / (v1.y * v1.y + v1.x * v1.x);
        if (u < 0)
            return this.start.clone()
        if (u > 1)
            return this.end.clone();
        if (u >= 0 && u <= 1)
            return v1.scaleThis(u).translateThis(this.start);

        console.log(`WTF? ${u}, v1:${v1} v2:${v2}`);
        return v1.scaleThis(u).translateThis(this.start);
    }

    get dir() {
        return this.end.subtract(this.start);
    }
}

export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.length = Math.sqrt(x * x + y * y);
    }

    toString() {
        return `${this.x},${this.y}`;
    }

    add(p2) {
        return new Point(this.x + p2.x, this.y + p2.y);
    }

    subtract(p2) {
        return new Point(this.x - p2.x, this.y - p2.y);
    }

    invert() {
        return new Point(-this.x, -this.y);
    }

    scale(f) {
        return new Point(this.x * f, this.y * f);
    }

    translate(d) {
        return new Point(this.x + d.x, this.y + d.y);
    }

    scaleThis(f) {
        this.x *= f;
        this.y *= f;
        return this;
    }

    translateThis(d) {
        this.x += d.x;
        this.y += d.y;

        return this;
    }

    setThis(x, y) {
        if (arguments.length == 1) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
    }

    dist(d) {
        let x = d.x - this.x;
        let y = d.y - this.y;
        return Math.sqrt(x * x + y * y);
    }

    distsqr(d) {
        let x = d.x - this.x;
        let y = d.y - this.y;
        return x * x + y * y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    areEqual(other) {
        return other !== undefined && (this.x == other.x && this.y == other.y);
    }
}
