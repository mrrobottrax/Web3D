import { vec3 } from "./math/vector.js";
import { castAABB } from "./physics.js";

const minWalkableY = 0.707;
const hullSize = new vec3(1, 1, 1);
const stopDist = 0.01;
const maxIt = 10;
const timeEpsilon = 0.001;

export class PlayerUtil {
	static move(start: vec3, wishDir: vec3, delta: number): vec3 {
		let timeStep = delta;
		let vel = wishDir.mult(3);
		let pos = vec3.origin();
		pos.copy(start);

		let i = 0;
		while (timeStep > timeEpsilon && vel.sqrMagnitude() > stopDist && i < maxIt) {
			const add = vel.mult(timeStep);
			const cast = castAABB(hullSize, pos, pos.add(add));
			let fract = 0;

			// stop if no hit
			if (!cast.hit) {
				fract = 1;
			} else {
				fract = cast.dist / add.magnitide();
			}

			timeStep -= timeStep * fract;
			pos = pos.add(cast.dir.mult(cast.dist));

			// project vel
			vel = vel.add(cast.normal.mult(-vec3.dot(cast.normal, vel)));

			++i;
		}

		if (i == maxIt) {
			console.log(i);
		}

		//return start.add(wishDir.mult(cast.dist));
		return pos;
	}
}