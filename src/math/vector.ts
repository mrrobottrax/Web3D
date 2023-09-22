import gMath from "./gmath.js";
import { mat4 } from "./matrix.js";

export class vec3 {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	inverse(): vec3 {
		return new vec3(-this.x, -this.y, -this.z);
	}

	static origin(): vec3 {
		return new vec3(0, 0, 0);
	}

	add(vec: vec3): vec3 {
		return new vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
	}

	mult(s: number): vec3 {
		return new vec3(this.x * s, this.y * s, this.z * s);
	}

	rotateYaw(angle: number): vec3 {
		let v = new vec3(0, this.y, 0);

		const s = Math.sin(angle);
		const c = Math.cos(angle);

		v.x = this.z * s + this.x * c;
		v.z = this.z * c - this.x * s;
		
		return v;
	}
}

export class quaternion {
	w: number;
	x: number;
	y: number;
	z: number;

	static identity() {
		return new quaternion(1, 0, 0, 0);
	}

	constructor(w: number, x: number, y: number, z: number) {
		this.w = w;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static euler(x: number, y: number, z: number): quaternion {
		const _x = gMath.deg2Rad(x);
		const _y = gMath.deg2Rad(y);
		const _z = gMath.deg2Rad(z);

		return this.eulerRad(_x, _y, _z);
	}

	static eulerRad(x: number, y: number, z: number): quaternion {
		const cx = Math.cos(x * 0.5);
		const sx = Math.sin(x * 0.5);
		const cy = Math.cos(y * 0.5);
		const sy = Math.sin(y * 0.5);
		const cz = Math.cos(z * 0.5);
		const sz = Math.sin(z * 0.5);

		let q = quaternion.identity();
		q.w = cx * cy * cz + sx * sy * sz;
		q.x = sx * cy * cz - cx * sy * sz;
		q.y = cx * sy * cz + sx * cy * sz;
		q.z = cx * cy * sz - sx * sy * cz;

		return q;
	}

	inverse(): quaternion {
		let q = new quaternion(this.w, -this.x, -this.y, -this.z);
		// q.normalise();
		return q;
	}

	normalise(): void {
		const squared_norm = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
		this.w /= squared_norm;
		this.x /= squared_norm;
		this.y /= squared_norm;
		this.z /= squared_norm;
	}

	toMatrix(): mat4 {
		let m: mat4 = mat4.identity();

		const qxx = this.x * this.x;
		const qyy = this.y * this.y;
		const qzz = this.z * this.z;
		const qxz = this.x * this.z;
		const qxy = this.x * this.y;
		const qyz = this.y * this.z;
		const qwx = this.w * this.x;
		const qwy = this.w * this.y;
		const qwz = this.w * this.z;

		m.setValue(0, 0, 1 - 2 * (qyy + qzz));
		m.setValue(1, 0, 2 * (qxy + qwz));
		m.setValue(2, 0, 2 * (qxz - qwy));

		m.setValue(0, 1, 2 * (qxy - qwz));
		m.setValue(1, 1, 1 - 2 * (qxx +  qzz));
		m.setValue(2, 1, 2 * (qyz + qwx));

		m.setValue(0, 2, 2 * (qxz + qwy));
		m.setValue(1, 2, 2 * (qyz - qwx));
		m.setValue(2, 2, 1 - 2 * (qxx +  qyy));

		return m;
	}
}