export class mat4 {
    constructor() {
        this.values = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }
    static identity() {
        return new mat4();
    }
    setValue(column, row, value) {
        this.values[column * 4 + row] = value;
    }
    getValue(column, row) {
        return this.values[column * 4 + row];
    }
    getData() {
        return this.values;
    }
    translate(t) {
        let m = new mat4();
        m.setValue(3, 0, t.x);
        m.setValue(3, 1, t.y);
        m.setValue(3, 2, t.z);
        this.values = this.multiply(m).values;
    }
    rotate(q) {
        const x2 = q.x + q.x;
        const y2 = q.y + q.y;
        const z2 = q.z + q.z;
        const xx2 = q.x * x2;
        const xy2 = q.x * y2;
        const xz2 = q.x * z2;
        const yy2 = q.y * y2;
        const yz2 = q.y * z2;
        const zz2 = q.z * z2;
        const wx2 = q.w * x2;
        const wy2 = q.w * y2;
        const wz2 = q.w * z2;
        let m = new mat4();
        m.setValue(0, 0, 1 - (yy2 + zz2));
        m.setValue(1, 0, xy2 - wz2);
        m.setValue(2, 0, xz2 + wy2);
        m.setValue(3, 0, 0);
        m.setValue(0, 1, xy2 + wz2);
        m.setValue(1, 1, 1 - (xx2 + zz2));
        m.setValue(2, 1, yz2 - wx2);
        m.setValue(3, 1, 0);
        m.setValue(0, 2, xz2 - wy2);
        m.setValue(1, 2, yz2 + wx2);
        m.setValue(2, 2, 1 - (xx2 + yy2));
        m.setValue(3, 2, 0);
        m.setValue(0, 3, 0);
        m.setValue(1, 3, 0);
        m.setValue(2, 3, 0);
        m.setValue(3, 3, 1);
        this.values = this.multiply(m).values;
    }
    scale(s) {
        let m = new mat4();
        m.setValue(0, 0, s.x);
        m.setValue(1, 1, s.y);
        m.setValue(2, 2, s.z);
        this.values = this.multiply(m).values;
    }
    multiply(m) {
        let result = new mat4();
        for (let row = 0; row < 4; ++row) {
            for (let column = 0; column < 4; ++column) {
                result.setValue(column, row, this.getValue(0, row) * m.getValue(column, 0) +
                    this.getValue(1, row) * m.getValue(column, 1) +
                    this.getValue(2, row) * m.getValue(column, 2) +
                    this.getValue(3, row) * m.getValue(column, 3));
            }
        }
        return result;
    }
}
//# sourceMappingURL=matrix.js.map