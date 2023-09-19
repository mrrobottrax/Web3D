import { quaternion, vec3 } from "./vector";

export class mat4 {
	values: number[];

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

	setValue(column: number, row: number, value: number) {
		this.values[row * 4 + column] = value;
	}

	multiplyValue(column: number, row: number, value: number) {
		const index = row * 4 + column;
		this.values[index] = this.values[index] * value;
	}

	data() {
		return this.values;
	}

	translate(t: vec3) {
		this.setValue(0, 3, t.x);
		this.setValue(1, 3, t.y);
		this.setValue(2, 3, t.z);
	}

	rotate(q: quaternion) {
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

	scale(s: vec3) {
		this.multiplyValue(0, 0, s.x);
		this.multiplyValue(1, 1, s.y);
		this.multiplyValue(2, 2, s.z);
	}
}