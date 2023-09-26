import { vec3 } from "./math/vector.js";
import { castAABB } from "./physics.js";

const minWalkableY = 0.7;
const hullSize = new vec3(1, 1, 1);
const stopSpeed = 0.01;
const maxBumps = 4;
const maxClipPlanes = 5;
const friction = 3;
const frictControl = 0.5;
const acceleration = 5;
const moveSpeed = 3;
const airAccel = 80;
const airSpeed = 0.5;
const trimpThreshold = 4.7;
const gravity = 9;
const maxStepHeight = 0.5;

enum BlockedBits {
	floorBit = 1,
	stepBit = 2,
}

export interface PositionData {
	onground: number;
}

export class PlayerUtil {

	static flyMove(start: vec3, velocity: vec3, delta: number): {
		endPos: vec3,
		blocked: number,
		endVel: vec3
	} {
		let timeStep = delta;
		const primalVel = vec3.copy(velocity);
		let vel = vec3.copy(velocity);
		let pos = vec3.origin();
		pos.copy(start);

		let numplanes = 0;
		let planes = new Array<vec3>(maxClipPlanes);

		let blocked = 0;
		for (let i = 0; i < maxBumps; ++i) {
			const add = vel.mult(timeStep);
			add.y -= 0.0000001; // HACK: for some reason this fixes collision bugs
			const cast = castAABB(hullSize, pos, pos.add(add));

			if (cast.fract > 0) {
				pos = pos.add(cast.dir.mult(cast.dist));
			}

			if (cast.fract == 1) {
				break;
			}

			if (cast.normal.y >= minWalkableY) {
				blocked |= BlockedBits.floorBit;
			}
			if (!cast.normal.y) {
				blocked |= BlockedBits.stepBit;
			}

			if (numplanes >= maxClipPlanes) {
				console.log("clip planes exceeded");
				vel = vec3.origin();
				break;
			}

			planes[numplanes] = cast.normal;
			numplanes++;

			let j;
			for (j = 0; j < numplanes; ++j) {
				// clip vel
				vel = vel.add(cast.normal.mult(-vec3.dot(cast.normal, vel)));

				// dont move back into previous planes
				let k
				for (k = 0; k < numplanes; ++k) {
					if (k != j) {
						if (vec3.dot(vel, planes[k]) < 0)
							break;
					}

					if (k == numplanes)
						break;
				}

				if (j == numplanes) {
					// go along the crease
					if (numplanes != 2) {
						vel = vec3.origin();
						break;
					}
					let dir = vec3.cross(planes[0], planes[1]);
					let d = vec3.dot(dir, vel);
					vel = dir.mult(d);
				}

				//
				// if velocity is against the original velocity, stop dead
				// to avoid tiny occilations in sloping corners
				//
				if (vec3.dot(vel, primalVel) <= 0) {
					vel = vec3.origin();
					break;
				}
			}

			timeStep -= timeStep * cast.fract;
		}

		return { endPos: pos, endVel: vel, blocked: blocked };
	}

	static friction(vel: vec3, delta: number): vec3 {
		let speed = vel.magnitide();

		if (speed < stopSpeed) {
			return vec3.origin();
		}

		let control = speed < frictControl ? frictControl : speed;
		let drop = control * friction * delta;

		let newSpeed = speed - drop;
		if (newSpeed < 0)
			newSpeed = 0;
		newSpeed /= speed;

		return vel.mult(newSpeed);
	}

	static accel(curVel: vec3, wishDir: vec3, wishSpeed: number, accel: number, delta: number): vec3 {
		let currSpeed = vec3.dot(curVel, wishDir);
		let addSpeed = wishSpeed - currSpeed;
		if (addSpeed <= 0) {
			return curVel;
		}

		let accelSpeed = accel * delta * wishSpeed;
		if (accelSpeed > addSpeed) {
			accelSpeed = addSpeed;
		}

		return curVel.add(wishDir.mult(accelSpeed));
	}

	static catagorizePosition(position: vec3, velocity: vec3): PositionData {
		let data: PositionData = {
			onground: -1
		}

		// trimping
		if (velocity.y > trimpThreshold) {
			data.onground = -1;
		} else {
			// cast down
			const cast = castAABB(hullSize, position, position.add(new vec3(0, -0.002, 0)));
			if (cast.normal.y < minWalkableY) {
				data.onground = -1;
			} else {
				data.onground = 1;
			}

			if (data.onground != -1) {
				// move down
				position.copy(position.add(cast.dir.mult(cast.dist)));
			}
		}

		return data;
	}

	static groundMove(position: vec3, velocity: vec3, wishDir: vec3, delta: number): void {
		velocity.copy(this.friction(velocity, delta));
		velocity.copy(this.accel(velocity, wishDir, moveSpeed, acceleration, delta));
		
		// try regular move
		const move = this.flyMove(position, velocity, delta);
		
		// try higher move
		const castUp = castAABB(hullSize, position, position.add(new vec3(0, maxStepHeight, 0)));
		const stepMove = this.flyMove(position.add(new vec3(0, castUp.dist, 0)), velocity, delta);
		const castDown = castAABB(hullSize, stepMove.endPos, stepMove.endPos.add(new vec3(0, -maxStepHeight * 2, 0)));
		const stepPos = stepMove.endPos.add(new vec3(0, -castDown.dist, 0));

		if (castDown.fract == 0 || castDown.fract == 1 || castDown.normal.y < minWalkableY) {
			position.copy(move.endPos);
			velocity.copy(move.endVel);
			return;
		}

		const moveDist = move.endPos.sqrDist(position);
		const stepDist = stepPos.sqrDist(position);

		//if (castDown.normal.y < minWalkableY || moveDist > stepDist) {
		if (false) {
			position.copy(move.endPos);
			velocity.copy(move.endVel);
		} else {
			position.copy(stepPos);
			velocity.copy(stepMove.endVel);
		}
	}

	static airMove(position: vec3, velocity: vec3, wishDir: vec3, delta: number): void {
		velocity.y -= gravity * delta * 0.5;

		velocity.copy(this.accel(velocity, wishDir, airSpeed, airAccel, delta));

		const move = this.flyMove(position, velocity, delta);
		position.copy(move.endPos);
		velocity.copy(move.endVel);

		velocity.y -= gravity * delta * 0.5;
	}

	static move(position: vec3, velocity: vec3, wishDir: vec3, positionData: PositionData, delta: number): void {
		positionData.onground = this.catagorizePosition(position, velocity).onground;

		if (positionData.onground > 0) {
			this.groundMove(position, velocity, wishDir, delta);
		} else {
			this.airMove(position, velocity, wishDir, delta);
		}
	}
}