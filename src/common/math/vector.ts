import gMath from "./gmath.js";
import { mat4 } from "./matrix.js";

export class vec3 {
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

	public static one(): vec3 {
		return new vec3(1, 1, 1);
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

	public static lerp(a: quaternion, b: quaternion, t: number): quaternion {
		let result = quaternion.identity();

		result.x = gMath.lerp(a.x, b.x, t);
		result.y = gMath.lerp(a.y, b.y, t);
		result.z = gMath.lerp(a.z, b.z, t);
		result.w = gMath.lerp(a.w, b.w, t);

		result.normalise();

		return result;
	}

	public static dot(a: quaternion, b: quaternion): number {
		return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
	}

	public static slerp(a: quaternion, b: quaternion, t: number): quaternion {
		let _b = quaternion.copy(b);

		// lerp when close
		let dot = quaternion.dot(a, _b);
		if (dot > 0.9995) {
			return quaternion.lerp(a, _b, t);
		}

		if (dot < 0) {
			_b = _b.inverse();
			dot = -dot;
		}

		if (dot > 1) dot = 1;

		// angle between input quaternions
		const theta0 = Math.acos(dot);

		// angle between output quaternion and a
		const theta = theta0 * t;

		const b2 = _b.add(a.mult(-dot));
		b2.normalise();

		return a.mult(Math.cos(theta)).add(b2.mult(Math.sin(theta)));
	}

	public add(q: quaternion): quaternion {
		return new quaternion(this.w + q.w, this.x + q.x, this.y + q.y, this.z + q.z);
	}

	public mult(s: number): quaternion {
		return new quaternion(this.w * s, this.x * s, this.y * s, this.z * s);
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
		return q;
	}

	public normalise(): void {
		const squared_norm = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
		const length = Math.sqrt(squared_norm);
		this.w /= length;
		this.x /= length;
		this.y /= length;
		this.z /= length;
	}

	public static copy(q: quaternion): quaternion {
		return new quaternion(q.w, q.x, q.y, q.z);
	}

	public normalised(): quaternion {
		let result = quaternion.copy(this);
		result.normalise();
		return result;
	}

	public toMatrix(): mat4 {
		let m: mat4 = mat4.identity();

		const q00 = this.w * this.w;
		const q01 = this.w * this.x;
		const q02 = this.w * this.y;
		const q03 = this.w * this.z;
		const q11 = this.x * this.x;
		const q12 = this.x * this.y;
		const q13 = this.x * this.z;
		const q22 = this.y * this.y;
		const q33 = this.z * this.z;
		const q23 = this.y * this.z;

		m.setValue(0, 0, 2 * (q00 + q11) - 1);
		m.setValue(1, 0, 2 * (q12 - q03));
		m.setValue(2, 0, 2 * (q13 + q02));

		m.setValue(0, 1, 2 * (q12 + q03));
		m.setValue(1, 1, 2 * (q00 + q22) - 1);
		m.setValue(2, 1, 2 * (q23 - q01));

		m.setValue(0, 2, 2 * (q13 - q02));
		m.setValue(1, 2, 2 * (q23 + q01));
		m.setValue(2, 2, 2 * (q00 + q33) - 1);

		return m;
	}
}