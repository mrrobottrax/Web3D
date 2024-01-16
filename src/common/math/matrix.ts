import gMath from "./gmath.js";
import { quaternion, vec3 } from "./vector.js";

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

	setAll(value: number) {
		this.values.forEach(element => {
			element = value;
		});
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

	rotateX(angle: number) {
		const mat = mat4.identity();
		const theta = gMath.deg2Rad(angle);
		mat.setValue(1, 1, Math.cos(theta));
		mat.setValue(2, 1, -Math.sin(theta));
		mat.setValue(1, 2, Math.sin(theta));
		mat.setValue(2, 2, Math.cos(theta));

		this.values = this.multiply(mat).values;
	}

	rotateY(angle: number) {
		const mat = mat4.identity();
		const theta = gMath.deg2Rad(angle);
		mat.setValue(0, 0, Math.cos(theta));
		mat.setValue(2, 0, Math.sin(theta));
		mat.setValue(0, 2, -Math.sin(theta));
		mat.setValue(2, 2, Math.cos(theta));

		this.values = this.multiply(mat).values;
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

		for (let i = 0; i < this.values.length; ++i) {
			ret.values[i] = this.values[i];
		}
		
		return ret;
	}
}