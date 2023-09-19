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
        this.values[row * 4 + column] = value;
    }
    multiplyValue(column, row, value) {
        const index = row * 4 + column;
        this.values[index] = this.values[index] * value;
    }
    data() {
        return this.values;
    }
    translate(t) {
        this.setValue(0, 3, t.x);
        this.setValue(1, 3, t.y);
        this.setValue(2, 3, t.z);
    }
    rotate(q) {
        this.multiplyValue(0, 0, 1 - 2 * q.y * q.y - 2 * q.z * q.z);
        this.setValue(1, 0, 2 * q.x * q.y - 2 * q.w * q.z);
        this.setValue(2, 0, 2 * q.x * q.z + 2 * q.w * q.y);
        this.setValue(0, 1, 2 * q.x * q.y + 2 * q.w * q.z);
        this.multiplyValue(1, 1, 1 - 2 * q.x * q.x - 2 * q.z * q.z);
        this.setValue(2, 1, 2 * q.y * q.z - 2 * q.w * q.x);
        this.setValue(0, 2, 2 * q.x * q.z - 2 * q.w * q.y);
        this.setValue(1, 2, 2 * q.y * q.z + 2 * q.w * q.x);
        this.multiplyValue(2, 2, 1 - 2 * q.x * q.x - 2 * q.y * q.y);
    }
    scale(s) {
        this.multiplyValue(0, 0, s.x);
        this.multiplyValue(1, 1, s.y);
        this.multiplyValue(2, 2, s.z);
    }
}
//# sourceMappingURL=matrix.js.map