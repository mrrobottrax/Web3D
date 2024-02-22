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

	public plus(vec: vec3): vec3 {
		return new vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
	}

	public minus(vec: vec3): vec3 {
		return new vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
	}

	public times(s: number): vec3 {
		return new vec3(this.x * s, this.y * s, this.z * s);
	}

	public add(vec: vec3): void {
		this.x += vec.x;
		this.y += vec.y;
		this.z += vec.z;
	}

	public sub(vec: vec3): void {
		this.x -= vec.x;
		this.y -= vec.y;
		this.z -= vec.z;
	}

	public mult(s: number): void {
		this.x *= s;
		this.y *= s;
		this.z *= s;
	}

	public div(s: number): void {
		this.x /= s;
		this.y /= s;
		this.z /= s;
	}

	public set(v: vec3): void {
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

	public static sqrDist(a: vec3, b: vec3): number {
		return a.sqrDist(b);
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
		let v = new vec3(this.x, 0, 0);

		const s = Math.sin(angle);
		const c = Math.cos(angle);

		v.y = this.y * c - this.z * s;
		v.z = this.y * s + this.z * c;

		return v;
	}

	public rotate(q: quaternion): vec3 {
		// qvqc

		const qx2 = q.x * q.x;
		const qy2 = q.y * q.y;
		const qz2 = q.z * q.z;

		const qxqy = q.x * q.y;
		const qxqz = q.x * q.z;
		const qxqw = q.x * q.w;
		const qyqz = q.y * q.z;
		const qyqw = q.y * q.w;
		const qzqw = q.z * q.w;

		let rotatedVector = vec3.origin();

		rotatedVector.x = (1 - 2 * qy2 - 2 * qz2) * this.x + 2 * (qxqy - qzqw) * this.y + 2 * (qxqz + qyqw) * this.z;
		rotatedVector.y = 2 * (qxqy + qzqw) * this.x + (1 - 2 * qx2 - 2 * qz2) * this.y + 2 * (qyqz - qxqw) * this.z;
		rotatedVector.z = 2 * (qxqz - qyqw) * this.x + 2 * (qyqz + qxqw) * this.y + (1 - 2 * qx2 - 2 * qy2) * this.z;

		return rotatedVector;
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

		return this.times(1 / m);
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

	public abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		this.z = Math.abs(this.z);
	}

	public timesComponent(v: vec3) {
		let vec: vec3 = vec3.origin();

		vec.x *= v.x;
		vec.y *= v.y;
		vec.z *= v.z;

		return vec;
	}

	public sqrDist(v: vec3): number {
		return this.minus(v).sqrMagnitude();
	}

	public dist(v: vec3): number {
		return this.minus(v).magnitide();
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

	static from2(v: vec2): vec3 {
		return new vec3(v.x, v.y, 0);
	}

	static parse(s: string): vec3 {
		const split = s.split(" ");
		return new vec3(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]));
	}

	toString() {
		return `${this.x} ${this.y} ${this.z}`;
	}
}

export class vec2 {
	x: number;
	y: number;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public inverse(): vec2 {
		return new vec2(-this.x, -this.y);
	}

	public equals(v: vec2): boolean {
		return this.x == v.x && this.y == v.y;
	}

	public plus(vec: vec2): vec2 {
		return new vec2(this.x + vec.x, this.y + vec.y);
	}

	public minus(vec: vec2): vec2 {
		return new vec2(this.x - vec.x, this.y - vec.y);
	}

	public times(s: number): vec2 {
		return new vec2(this.x * s, this.y * s);
	}

	public add(vec: vec2): void {
		this.x += vec.x;
		this.y += vec.y;
	}

	public sub(vec: vec2): void {
		this.x -= vec.x;
		this.y -= vec.y;
	}

	public mult(s: number): void {
		this.x *= s;
		this.y *= s;
	}

	public copy(v: vec2): void {
		this.x = v.x;
		this.y = v.y;
	}

	public static copy(v: vec2): vec2 {
		let vec = new vec2(0, 0);

		vec.x = v.x;
		vec.y = v.y;

		return vec;
	}

	public static dist(a: vec2, b: vec2): number {
		return a.dist(b);
	}

	public static sqrDist(a: vec2, b: vec2): number {
		return a.sqrDist(b);
	}

	public rotateYaw(angle: number): vec2 {
		let v = new vec2(this.x, this.y);

		const s = Math.sin(angle);
		const c = Math.cos(angle);

		v.x = this.y * s + this.x * c;
		v.y = this.y * c - this.x * s;

		return v;
	}

	public sqrMagnitude(): number {
		return this.x * this.x + this.y * this.y
	}

	public magnitide(): number {
		return Math.sqrt(this.sqrMagnitude());
	}

	public normalize() {
		const m = this.magnitide();
		if (m == 0)
			return;

		this.x /= m;
		this.y /= m;
	}

	public normalized(): vec2 {
		const m = this.magnitide();
		if (m == 0)
			return this;

		return this.times(1 / m);
	}

	public sqrDist(v: vec2): number {
		return this.minus(v).sqrMagnitude();
	}

	public dist(v: vec2): number {
		return this.minus(v).magnitide();
	}

	public static dot(a: vec2, b: vec2): number {
		return a.x * b.x + a.y * b.y;
	}

	public static origin(): vec2 {
		return new vec2(0, 0);
	}

	public static one(): vec2 {
		return new vec2(1, 1);
	}

	public static min(a: vec2, b: vec2): vec2 {
		return new vec2(
			Math.min(a.x, b.x),
			Math.min(a.y, b.y)
		);
	}

	public static max(a: vec2, b: vec2): vec2 {
		return new vec2(
			Math.max(a.x, b.x),
			Math.max(a.y, b.y)
		);
	}

	public static lerp(a: vec2, b: vec2, t: number): vec2 {
		return new vec2(
			a.x + (b.x - a.x) * t,
			a.y + (b.y - a.y) * t
		);
	}

	static from3(v: vec3): vec2 {
		return new vec2(v.x, v.y);
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

	public static eulerV(v: vec3): quaternion {
		const _x = gMath.deg2Rad(v.x);
		const _y = gMath.deg2Rad(v.y);
		const _z = gMath.deg2Rad(v.z);

		return this.eulerRad(_x, _y, _z);
	}

	public toEulerRad(): vec3 {
		const ysqr = this.y * this.y;
	
		// Roll (x-axis rotation)
		const t0 = +2.0 * (this.w * this.x + this.y * this.z);
		const t1 = +1.0 - 2.0 * (this.x * this.x + ysqr);
		const roll = Math.atan2(t0, t1);
	
		// Pitch (y-axis rotation)
		let t2 = +2.0 * (this.w * this.y - this.z * this.x);
		t2 = t2 > 1.0 ? 1.0 : t2;
		t2 = t2 < -1.0 ? -1.0 : t2;
		const pitch = Math.asin(t2);
	
		// Yaw (z-axis rotation)
		const t3 = +2.0 * (this.w * this.z + this.x * this.y);
		const t4 = +1.0 - 2.0 * (ysqr + this.z * this.z);
		const yaw = Math.atan2(t3, t4);
	
		return new vec3(pitch, yaw, roll);
	}
	
	public toEuler(): vec3 {
		const v = this.toEulerRad();

		v.x = gMath.rad2Deg(v.x);
		v.y = gMath.rad2Deg(v.y);
		v.z = gMath.rad2Deg(v.z);

		return v;
	}

	public static lerp(a: quaternion, b: quaternion, t: number): quaternion {
		// todo: fix with signs
		let result = quaternion.identity();

		result.x = gMath.lerp(a.x, b.x, t);
		result.y = gMath.lerp(a.y, b.y, t);
		result.z = gMath.lerp(a.z, b.z, t);
		result.w = gMath.lerp(a.w, b.w, t);

		result.normalize();

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
		b2.normalize(); // todo: needed?

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

	public normalize(): void {
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

	public normalized(): quaternion {
		let result = quaternion.copy(this);
		result.normalize();
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

	minus(q: quaternion): quaternion {
		return new quaternion(
			this.w - q.w,
			this.x - q.x,
			this.y - q.y,
			this.z - q.z
		);
	}

	sqrMagnitude(): number {
		return this.w * this.w +
			this.x * this.x +
			this.y * this.y +
			this.z * this.z;
	}

	static sqrDist(a: quaternion, b: quaternion): number {
		const d = b.minus(a);
		return d.sqrMagnitude();
	}
}