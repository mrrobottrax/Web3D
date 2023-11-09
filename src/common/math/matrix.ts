import { quaternion, vec3 } from "./vector";

export class mat4 {
	private values: Float32Array;

	constructor(n: number) {
		this.values = new Float32Array([
			n, 0, 0, 0,
			0, n, 0, 0,
			0, 0, n, 0,
			0, 0, 0, n,
		]);
	}

	static identity() {
		return new mat4(1);
	}

	static empty() {
		return new mat4(0);
	}

	setValue(column: number, row: number, value: number) {
		this.values[column * 4 + row] = value;
	}

	setIdentity() {
		for (let row = 0; row < 4; ++row) {
			for (let column = 0; column < 4; ++column) {
				this.setValue(column, row, column == row ? 1 : 0);
			}
		}
	}

	set(mat: mat4) {
		const matData = mat.getData();

		for (let i = 0; i < this.values.length; ++i)
			this.values[i] = matData[i];
	}

	getValue(column: number, row: number): number {
		return this.values[column * 4 + row];
	}

	getData(): Float32Array {
		return this.values;
	}

	translate(t: vec3) {
		let m = mat4.identity();

		m.setValue(3, 0, t.x);
		m.setValue(3, 1, t.y);
		m.setValue(3, 2, t.z);

		this.values = this.multiply(m).values;
	}

	rotate(q: quaternion) {
		this.values = this.multiply(q.toMatrix()).values;
	}

	scale(s: vec3) {
		let m = mat4.identity();

		m.setValue(0, 0, s.x);
		m.setValue(1, 1, s.y);
		m.setValue(2, 2, s.z);

		this.values = this.multiply(m).values;
	}

	multiply(m: mat4) {
		let result = mat4.identity();

		for (let row = 0; row < 4; ++row) {
			for (let column = 0; column < 4; ++column) {
				result.setValue(column, row,
					this.getValue(0, row) * m.getValue(column, 0) +
					this.getValue(1, row) * m.getValue(column, 1) +
					this.getValue(2, row) * m.getValue(column, 2) +
					this.getValue(3, row) * m.getValue(column, 3)
				);
			}
		}

		return result;
	}

	copy(): mat4 {
		let ret = new mat4(1);
		ret.values = this.values;
		return ret;
	}
}