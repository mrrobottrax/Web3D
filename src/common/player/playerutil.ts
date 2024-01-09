import { UserCmd } from "../input/usercmd.js";
import { Buttons } from "../input/buttons.js";
import { SharedPlayer } from "./sharedplayer.js";
import gMath from "../math/gmath.js";
import { vec3 } from "../math/vector.js";
import { castAABB } from "../system/physics.js";
import { Entity } from "../entitysystem/entity.js";

const minWalkableY = 0.7;
const hullSize = new vec3(1, 2, 1);
const hullDuckSize = new vec3(1, 1.5, 1);
const stopSpeed = 0.01;
const stopEpsilon = 0.001;
const maxBumps = 4;
const maxClipPlanes = 5;
const friction = 4;
const frictControl = 2;
const acceleration = 10;
const moveSpeed = 10;
const duckAccel = 8;
const duckMoveSpeed = 6;
const airAccel = 200;
const airSpeed = 1.5;
const trimpThreshold = 6;
const gravity = 12;
const maxStepHeight = 0.5;
const duckOffset = (hullSize.y - hullDuckSize.y) / 2;
const duckGlitch = 0.1;
const duckSpeed = 8;
const jumpBoost = 5;

enum BlockedBits {
	floorBit = 1,
	stepBit = 2,
}

export class PlayerUtil {
	static getViewOffset(player: SharedPlayer): number {
		const offset = 0.05;
		if (player.wishDuck) {
			if (player.isDucked) {
				return gMath.lerp(hullSize.y / 2 + duckOffset, hullDuckSize.y / 2 - duckGlitch, player.duckProg) - offset;
			} else {
				return gMath.lerp(hullSize.y / 2, hullDuckSize.y / 2 - duckOffset - duckGlitch, player.duckProg) - offset;
			}
		} else {
			return gMath.lerp(hullSize.y / 2, hullDuckSize.y / 2 - duckOffset, player.duckProg) - offset;
		}
	}

	static getFeet(player: SharedPlayer): vec3 {
		if (player.isDucked) {
			return player.position.minus(new vec3(0, hullDuckSize.y / 2, 0));
		} else {
			return player.position.minus(new vec3(0, hullSize.y / 2, 0));
		}
	}

	static flyMove(start: vec3, velocity: vec3, delta: number, player: SharedPlayer): {
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
		for (let bumpCount = 0; bumpCount < maxBumps; ++bumpCount) {
			const cast = castAABB(player.isDucked ? hullDuckSize : hullSize, pos, vel.times(timeStep));

			if (cast.fract > 0) {
				pos.add(cast.dir.times(cast.dist));
				numplanes = 0;
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

			timeStep -= timeStep * cast.fract;

			if (numplanes >= maxClipPlanes) {
				console.error("clip planes exceeded");
				vel = vec3.origin();
				break;
			}

			planes[numplanes] = vec3.copy(cast.normal);
			numplanes++;

			let i;
			for (i = 0; i < numplanes; ++i) {
				// clip vel
				vel.copy(primalVel.plus(cast.normal.times(-vec3.dot(cast.normal, primalVel) + 0.001)));
				vel.x = vel.x > -stopEpsilon && vel.x < stopEpsilon ? 0 : vel.x;
				vel.y = vel.y > -stopEpsilon && vel.y < stopEpsilon ? 0 : vel.y;
				vel.z = vel.z > -stopEpsilon && vel.z < stopEpsilon ? 0 : vel.z;

				// dont move back into previous planes
				let j
				for (j = 0; j < numplanes; ++j) {
					if (j != i) {
						if (vec3.dot(vel, planes[j]) < 0.002) {
							break;
						}
					}
				}

				if (j == numplanes)
					break;

			}

			if (i != numplanes) {

			}
			else {
				// go along the crease
				if (numplanes != 2) {
					vel = vec3.origin();
					break;
				}
				const dir = vec3.cross(planes[0], planes[1]);
				dir.normalise();
				const d = vec3.dot(dir, vel);
				vel = dir.times(d);
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

		return vel.times(newSpeed);
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

		return curVel.plus(vec3.copy(wishDir).times(accelSpeed));
	}

	static catagorizePosition(player: SharedPlayer) {
		// trimping
		if (player.velocity.y > trimpThreshold) {
			player.groundEnt = null;
		} else {
			// cast down
			const cast = castAABB(player.isDucked ? hullDuckSize : hullSize, player.position, new vec3(0, -0.003, 0));
			if (cast.normal.y < minWalkableY) {
				// too steep
				player.groundEnt = null;
			} else {
				player.groundEnt = cast.entity;
			}

			if (player.groundEnt) {
				// move down
				player.position.copy(player.position.plus(cast.dir.times(cast.dist)));
			}
		}
	}

	static groundMove(player: SharedPlayer, cmd: UserCmd, delta: number): void {
		player.velocity.copy(this.friction(player.velocity, delta));
		player.velocity.copy(this.accel(player.velocity, cmd.wishDir,
			player.isDucked ? duckMoveSpeed : moveSpeed, player.isDucked ? duckAccel : acceleration, delta));
		player.velocity.y = 0;

		// try regular move
		const move = this.flyMove(player.position, player.velocity, delta, player);

		// try higher move
		const castUp = castAABB(player.isDucked ? hullDuckSize : hullSize, player.position, new vec3(0, maxStepHeight, 0));
		// player.velocity.y -= 0.1; // this fixes movement bugs?
		const stepMove = this.flyMove(player.position.plus(new vec3(0, castUp.dist, 0)), player.velocity, delta, player);
		const castDown = castAABB(player.isDucked ? hullDuckSize : hullSize, stepMove.endPos, new vec3(0, -maxStepHeight * 2.01, 0));

		if (/*castDown.fract == 0 || castDown.fract == 1 || */castDown.normal.y < minWalkableY) {
			player.position.copy(move.endPos);
			player.velocity.copy(move.endVel);
			return;
		}

		const stepPos = stepMove.endPos.plus(new vec3(0, -castDown.dist, 0));

		const moveDist = move.endPos.sqrDist(player.position);
		const stepDist = stepPos.sqrDist(player.position);

		if (moveDist > stepDist) {
			player.position.copy(move.endPos);
			player.velocity.copy(move.endVel);
		} else {
			player.velocity.copy(stepMove.endVel);
			player.position.copy(stepPos);
			player.velocity.y = move.endVel.y;
		}
	}

	static airMove(player: SharedPlayer, cmd: UserCmd, delta: number): void {
		player.velocity.y -= gravity * delta * 0.5;

		player.velocity.copy(this.accel(player.velocity, cmd.wishDir, airSpeed, airAccel, delta));

		const move = this.flyMove(player.position, player.velocity, delta, player);
		player.position.copy(move.endPos);
		player.velocity.copy(move.endVel);

		player.velocity.y -= gravity * delta * 0.5;
	}

	static move(player: SharedPlayer, cmd: UserCmd, delta: number): void {
		let wish = vec3.copy(cmd.wishDir);
		wish.y = 0;

		this.catagorizePosition(player);

		// duck / unduck
		if (!player.isDucked) {
			if (cmd.buttons[Buttons.duck]) {
				player.wishDuck = true;
			} else {
				player.wishDuck = false;
			}
		} else {
			if (!cmd.buttons[Buttons.duck]) {
				// check if can unduck
				if (player.isGrounded()) {
					// cast up
					const cast = castAABB(hullDuckSize, player.position, new vec3(0, 2 * duckOffset, 0));

					if (cast.fract == 1) {
						player.wishDuck = false;
						player.position.y += duckOffset;
					}
				} else {
					// cast down to ground
					const cast0 = castAABB(hullDuckSize, player.position, new vec3(0, -duckOffset * 2, 0));

					if (cast0.fract == 1) {
						player.wishDuck = false;
						player.position.y -= duckOffset;
					} else {
						// move down to ground
						let newPos = vec3.copy(player.position);
						newPos.y -= cast0.dist;

						// check if we can unduck
						const cast1 = castAABB(hullDuckSize, newPos, new vec3(0, 2 * duckOffset, 0));


						if (cast1.fract == 1) {
							// movement tech???
							const playerSpeed = player.velocity.magnitide();
							player.velocity.sub(cast0.normal.times(vec3.dot(player.velocity, cast0.normal)));
							player.velocity.normalise();
							player.velocity = player.velocity.times(playerSpeed);

							player.position = newPos;

							player.wishDuck = false;
							player.position.y += duckOffset
						}
					}
				}
			}
		}

		// instant duck / unduck in the air
		if (!player.isGrounded()) {
			if (player.wishDuck) {
				player.duckProg = 1;
			} else {
				player.duckProg = 0;
			}
		}

		// update duck prog
		if (player.wishDuck) {
			player.duckProg += delta * duckSpeed;
			if (player.duckProg > 1) {
				player.duckProg = 1;
			}

			if (player.duckProg > 0.95) {
				if (!player.isDucked) {
					if (player.isGrounded()) {
						player.position.y -= duckOffset;
					} else {
						player.position.y += duckOffset;
					}
				}

				player.isDucked = true;
			}
		} else {
			player.duckProg -= delta * duckSpeed;
			if (player.duckProg < 0) {
				player.duckProg = 0;
			}

			player.isDucked = false;
		}

		// jump
		if (cmd.buttons[Buttons.jump] && player.isGrounded()) {
			player.velocity.y += jumpBoost;
			player.groundEnt = null;
		}

		// move
		if (player.isGrounded()) {
			this.groundMove(player, cmd, delta);
		} else {
			this.airMove(player, cmd, delta);
		}

		this.catagorizePosition(player);

		player.camPosition = this.getCameraPosition(player);
	}

	static getCameraPosition(player: SharedPlayer): vec3 {
		return player.position.plus(new vec3(0, this.getViewOffset(player), 0));
	}

	static debugMove(player: SharedPlayer, cmd: UserCmd, delta: number): void {
		const cast = castAABB(hullSize, player.position, cmd.wishDir.times(delta * 10));
		player.position.add(cast.dir.times(cast.dist));
		player.camPosition = player.position.plus(new vec3(0, this.getViewOffset(player), 0));
	}
}