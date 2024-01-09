import { quaternion, vec2, vec3 } from "./vector.js";

export default class gMath {
	static deg2Rad(angle: number): number {
		return (angle * Math.PI) / 180;
	}

	static rad2Deg(angle: number): number {
		return (angle * 180) / Math.PI;
	}

	static lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	static easeInOut(t: number) {
		if (t < 0.5) {
			return 4 * t * t * t;
		} else {
			const f = ((2 * t) - 2);
			return 0.5 * f * f * f + 1;
		}
	}

	static modulo(a: number, b: number) {
		return ((a % b) + b) % b;
	}

	static clamp(x: number, min: number, max: number) {
		return Math.min(Math.max(x, min), max);
	}

	static sqrDistToLine(a: vec2, b: vec2, point: vec2): number {
		const dir = b.minus(a);
		const m = dir.magnitide();
		dir.mult(1 / m);

		// closest point on line to cursor
		let t = vec2.dot(point.minus(a), dir);
		t = this.clamp(t, 0, m);

		const p = a.plus(dir.times(t));

		return vec2.sqrDist(point, p);
	}

	static getClosestCardinalRotation(rotation: quaternion): quaternion {
		let forward = new vec3(0, 0, 1);
		forward = forward.rotate(rotation);

		const dxz = Math.abs(vec3.dot(forward, new vec3(0, 1, 0)));
		const dxy = Math.abs(vec3.dot(forward, new vec3(0, 0, 1)));
		const dyz = Math.abs(vec3.dot(forward, new vec3(1, 0, 0)));

		if (dxz > dxy && dxz > dyz) {
			// console.log("XZ");
			return quaternion.identity();
		} else if (dxy > dxz && dxy > dyz) {
			// console.log("XY");
			return quaternion.euler(-90, 0, 0);
		} else {
			// console.log("YZ");
			return quaternion.euler(0, 0, -90);
		}
	}

	static randomInt(max: number) {
		return Math.floor(Math.random() * max);
	}
}