import gMath from "./gmath.js";

export class vec3 {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
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

	constructor(w:number, x: number, y: number, z: number) {
		this.w = w;
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static euler(x: number, y: number, z: number): quaternion {
		const _x = gMath.deg2Rad(x);
		const _y = gMath.deg2Rad(y);
		const _z = gMath.deg2Rad(z);

		const cx = Math.cos(_x * 0.5);
		const sx = Math.sin(_x * 0.5);
		const cy = Math.cos(_y * 0.5);
		const sy = Math.sin(_y * 0.5);
		const cz = Math.cos(_z * 0.5);
		const sz = Math.sin(_z * 0.5);

		let q = quaternion.identity();
		q.w = cx * cy * cz + sx * sy * sz;
		q.x = sx * cy * cz - cx * sy * sz;
		q.y = cx * sy * cz + sx * cy * sz;
		q.z = cx * cy * sz - sx * sy * cz;

		return q;
	}
}