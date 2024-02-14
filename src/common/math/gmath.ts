import { drawBox } from "../../client/render/debugRender.js";
import { Environment, environment } from "../system/context.js";
import { Ray } from "./ray.js";
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

	static sqrDistToRay(ray: Ray, point: vec3): number
	{
		const relativePoint = point.minus(ray.origin);
		const dot = vec3.dot(ray.direction, relativePoint);
		const pointOnRay = ray.origin.plus(ray.direction.times(dot));

		return vec3.sqrDist(pointOnRay, point);
	}

	static distToRay(ray: Ray, point: vec3): number
	{
		return Math.sqrt(this.sqrDistToRay(ray, point));
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

	static clipRayToAABB(ray: Ray, min: vec3, max: vec3, offset: vec3): number | null {
		const _min = vec3.copy(min);
		const _max = vec3.copy(max);
		_min.add(offset);
		_max.add(offset);

		// if (gameContext == GameContext.client)
		// 	drawBox(min, max, offset, [1, 0, 0, 1], 5);

		const inner = (normal: vec3): number | undefined => {
			const dist1 = vec3.dot(_min, normal);
			const dist2 = vec3.dot(_max, normal);
			const dist = Math.max(dist1, dist2);

			let right: vec3;
			let up: vec3;
			if (Math.abs(normal.x) == 1) {
				// side
				right = new vec3(0, 0, 1);
				up = new vec3(0, 1, 0);
			} else if (Math.abs(normal.y) == 1) {
				// top
				right = new vec3(1, 0, 0);
				up = new vec3(0, 0, 1);
			} else {
				// front
				right = new vec3(1, 0, 0);
				up = new vec3(0, 1, 0);
			}

			// ignore backs
			const dot = vec3.dot(ray.direction, normal);
			if (dot > 0) return;

			// find intersection with plane
			const dot2 = -vec3.dot(ray.origin, normal) + dist;

			const t = dot2 / dot;
			const p = ray.origin.plus(ray.direction.times(t));

			// check if p is within the bounds
			const x = vec3.dot(right, p);
			const y = vec3.dot(up, p);
			const maxX = vec3.dot(right, _max);
			const maxY = vec3.dot(up, _max);
			const minX = vec3.dot(right, _min);
			const minY = vec3.dot(up, _min);

			if (x > minX && x < maxX && y > minY && y < maxY) {
				// intersecting
				return t;
			}
		}

		const checkPlanes = () => {
			let t;
			t = inner(new vec3(1, 0, 0)); if (t != undefined) return t;
			t = inner(new vec3(-1, 0, 0)); if (t != undefined) return t;
			t = inner(new vec3(0, 1, 0)); if (t != undefined) return t;
			t = inner(new vec3(0, -1, 0)); if (t != undefined) return t;
			t = inner(new vec3(0, 0, 1)); if (t != undefined) return t;
			t = inner(new vec3(0, 0, -1)); if (t != undefined) return t;
		}
		const t = checkPlanes();

		return t ? t : null;
	}

	static isPowerOf2(value: number): boolean {
		return (value & (value - 1)) === 0;
	}
}