import gMath from "./gmath.js";
import { mat4 } from "./matrix.js";

export  class vec3 {
	x: number;
	y: number;
	z: number;

	public constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	public inverse(): vec3 {
		return new vec3(-this.x, -this.y, -this.z);
	}

	public equals(v: vec3): boolean {
		return this.x == v.x && this.y == v.y && this.z == v.z;
	}

	public add(vec: vec3): vec3 {
		return new vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
	}

	public sub(vec: vec3): vec3 {
		return new vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
	}

	public mult(s: number): vec3 {
		return new vec3(this.x * s, this.y * s, this.z * s);
	}

	public copy(v: vec3): void {
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
	}

	public static copy(v: vec3): vec3 {
		let vec = new vec3(0, 0, 0);

		vec.x = v.x;
		vec.y = v.y;
		vec.z = v.z;

		return vec;
	}

	public static dist(a: vec3, b: vec3): number {
		return a.dist(b);
	}

	public rotateYaw(angle: number): vec3 {
		let v = new vec3(0, this.y, 0);

		const s = Math.sin(angle);
		const c = Math.cos(angle);

		v.x = this.z * s + this.x * c;
		v.z = this.z * c - this.x * s;

		return v;
	}

	public rotatePitch(angle: number): vec3 {
		let v = new vec3(0, this.y, 0);

		const s = Math.sin(-angle);
		const c = Math.cos(angle);

		v.y = this.z * s + this.y * c;
		v.z = this.z * c - this.x * s;

		return v;
	}

	public sqrMagnitude(): number {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	public magnitide(): number {
		return Math.sqrt(this.sqrMagnitude());
	}

	public normalise() {
		const m = this.magnitide();
		if (m == 0)
			return;

		this.x /= m;
		this.y /= m;
		this.z /= m;
	}

	public normalised(): vec3 {
		const m = this.magnitide();
		if (m == 0)
			return this;

		return this.mult(1 / m);
	}

	public multMat4(mat: mat4): vec3 {
		let result = vec3.origin();

		result.x = (
			this.x * mat.getValue(0, 0) +
			this.y * mat.getValue(1, 0) +
			this.z * mat.getValue(2, 0) +
			mat.getValue(3, 0)
		);
		result.y = (
			this.x * mat.getValue(0, 1) +
			this.y * mat.getValue(1, 1) +
			this.z * mat.getValue(2, 1) +
			mat.getValue(3, 1)
		);
		result.z = (
			this.x * mat.getValue(0, 2) +
			this.y * mat.getValue(1, 2) +
			this.z * mat.getValue(2, 2) +
			mat.getValue(3, 2)
		);

		return result;
	}

	public sqrDist(v: vec3): number {
		return this.sub(v).sqrMagnitude();
	}

	public dist(v: vec3): number {
		return this.sub(v).magnitide();
	}

	public static dot(a: vec3, b: vec3): number {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	}

	public static origin(): vec3 {
		return new vec3(0, 0, 0);
	}

	public static cross(a: vec3, b: vec3): vec3 {
		return new vec3(
			a.y * b.z - a.z * b.y,
			a.z * b.x - a.x * b.z,
			a.x * b.y - a.y * b.x,
		);
	}

	public static min(a: vec3, b: vec3): vec3 {
		return new vec3(
			Math.min(a.x, b.x),
			Math.min(a.y, b.y),
			Math.min(a.z, b.z)
		);
	}

	public static max(a: vec3, b: vec3): vec3 {
		return new vec3(
			Math.max(a.x, b.x),
			Math.max(a.y, b.y),
			Math.max(a.z, b.z)
		);
	}

	public static lerp(a: vec3, b: vec3, t: number): vec3 {
		return new vec3(
			a.x + (b.x - a.x) * t,
			a.y + (b.y - a.y) * t,
			a.z + (b.z - a.z) * t
		);
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

	public static euler(x: number, y: number, z: number): quaternion {
		const _x = gMath.deg2Rad(x);
		const _y = gMath.deg2Rad(y);
		const _z = gMath.deg2Rad(z);

		return this.eulerRad(_x, _y, _z);
	}

	public static eulerRad(x: number, y: number, z: number): quaternion {
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

	public inverse(): quaternion {
		let q = new quaternion(this.w, -this.x, -this.y, -this.z);
		// q.normalise();
		return q;
	}

	public normalise(): void {
		const squared_norm = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
		this.w /= squared_norm;
		this.x /= squared_norm;
		this.y /= squared_norm;
		this.z /= squared_norm;
	}

	public toMatrix(): mat4 {
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
		m.setValue(1, 1, 1 - 2 * (qxx + qzz));
		m.setValue(2, 1, 2 * (qyz + qwx));

		m.setValue(0, 2, 2 * (qxz + qwy));
		m.setValue(1, 2, 2 * (qyz - qwx));
		m.setValue(2, 2, 1 - 2 * (qxx + qyy));

		return m;
	}
}