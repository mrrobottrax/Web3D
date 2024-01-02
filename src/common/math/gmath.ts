import { quaternion, vec2 } from "./vector.js";

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
		return quaternion.identity();
	}
}