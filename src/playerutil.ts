import { Cmd } from "./cmd.js";
import { Buttons } from "./input.js";
import { LocalPlayer, player } from "./localplayer.js";
import gMath from "./math/gmath.js";
import { vec3 } from "./math/vector.js";
import { castAABB } from "./physics.js";

const minWalkableY = 0.7;
const hullSize = new vec3(1, 1.8, 1);
const hullDuckSize = new vec3(1, 1, 1);
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
const maxStepHeight = 0.51;
const duckOffset = (hullSize.y - hullDuckSize.y) / 2;
const duckSpeed = 8;
const duckGlitch = 0.2; // shift play view by this amount when ducking in the air
const jumpBoost = 5;

enum BlockedBits {
	floorBit = 1,
	stepBit = 2,
}

export interface PositionData {
	groundEnt: number;
}

export class PlayerUtil {
	static getViewOffset(player: LocalPlayer): number {
		const offset = 0.1;
		if (player.wishDuck) {
			if (player.isDucked) {
				return gMath.lerp(hullSize.y / 2 + duckOffset, hullDuckSize.y / 2 - offset, player.duckProg);
			} else {
				return gMath.lerp(hullSize.y / 2, hullDuckSize.y / 2 - duckOffset, player.duckProg);
			}
		} else {
			return gMath.lerp(hullSize.y / 2, hullDuckSize.y / 2 - duckOffset - offset, player.duckProg);
		}
	}

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
		for (let bumpCount = 0; bumpCount < maxBumps; ++bumpCount) {
			const add = vel.mult(timeStep);
			const cast = castAABB(player.isDucked ? hullDuckSize : hullSize, pos, pos.add(add));

			if (cast.fract > 0) {
				pos = pos.add(cast.dir.mult(cast.dist));
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
				vel.copy(primalVel.add(cast.normal.mult(-vec3.dot(cast.normal, primalVel))));
				vel.x = vel.x > -stopEpsilon && vel.x < stopEpsilon ? 0 : vel.x;
				vel.y = vel.y > -stopEpsilon && vel.y < stopEpsilon ? 0 : vel.y;
				vel.z = vel.z > -stopEpsilon && vel.z < stopEpsilon ? 0 : vel.z;

				// dont move back into previous planes
				let j
				for (j = 0; j < numplanes; ++j) {
					if (j != i) {
						if (vec3.dot(vel, planes[j]) < 0.000001) {
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

	static catagorizePosition(player: LocalPlayer): PositionData {
		let data: PositionData = {
			groundEnt: -1
		}

		// trimping
		if (player.velocity.y > trimpThreshold) {
			data.groundEnt = -1;
		} else {
			// cast down
			const cast = castAABB(player.isDucked ? hullDuckSize : hullSize, player.position, player.position.add(new vec3(0, -0.003, 0)));
			if (cast.normal.y < minWalkableY) {
				data.groundEnt = -1;
			} else {
				data.groundEnt = 1;
			}

			if (data.groundEnt != -1) {
				// move down
				player.position.copy(player.position.add(cast.dir.mult(cast.dist)));
			}
		}

		return data;
	}

	static groundMove(player: LocalPlayer, cmd: Cmd, delta: number): void {
		player.velocity.copy(this.friction(player.velocity, delta));
		player.velocity.copy(this.accel(player.velocity, cmd.wishDir,
			player.isDucked ? duckMoveSpeed : moveSpeed, player.isDucked ? duckAccel : acceleration, delta));
		player.velocity.y = 0;

		// try regular move
		const move = this.flyMove(player.position, player.velocity, delta);

		// try higher move
		const castUp = castAABB(player.isDucked ? hullDuckSize : hullSize, player.position, player.position.add(new vec3(0, maxStepHeight, 0)));
		// player.velocity.y -= 0.1; // this fixes movement bugs?
		const stepMove = this.flyMove(player.position.add(new vec3(0, castUp.dist, 0)), player.velocity, delta);
		const castDown = castAABB(player.isDucked ? hullDuckSize : hullSize, stepMove.endPos, stepMove.endPos.add(new vec3(0, -maxStepHeight * 3, 0)));

		if (/*castDown.fract == 0 || castDown.fract == 1 || */castDown.normal.y < minWalkableY) {
			player.position.copy(move.endPos);
			player.velocity.copy(move.endVel);
			return;
		}

		const stepPos = stepMove.endPos.add(new vec3(0, -castDown.dist, 0));

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

	static airMove(player: LocalPlayer, cmd: Cmd, delta: number): void {
		player.velocity.y -= gravity * delta * 0.5;

		player.velocity.copy(this.accel(player.velocity, cmd.wishDir, airSpeed, airAccel, delta));

		const move = this.flyMove(player.position, player.velocity, delta);
		player.position.copy(move.endPos);
		player.velocity.copy(move.endVel);

		player.velocity.y -= gravity * delta * 0.5;
	}

	static move(player: LocalPlayer, cmd: Cmd, delta: number): void {
		let wish = vec3.copy(cmd.wishDir);
		wish.y = 0;

		player.positionData = this.catagorizePosition(player);

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
				if (player.positionData.groundEnt != -1) {
					// cast up
					const cast = castAABB(hullDuckSize, player.position,
						player.position.add(new vec3(0, 2 * duckOffset, 0)));

					if (cast.fract == 1) {
						player.wishDuck = false;
						player.position.y += duckOffset;
					}
				} else {
					// cast down to ground
					const cast0 = castAABB(hullDuckSize, player.position,
						player.position.add(new vec3(0, -duckOffset * 2 - duckGlitch, 0)));

					if (cast0.fract == 1) {
						player.wishDuck = false;
						player.position.y -= duckOffset + duckGlitch;
					} else {
						// move down to ground
						let newPos = vec3.copy(player.position);
						newPos.y -= cast0.dist;

						// check if we can unduck
						const cast1 = castAABB(hullDuckSize, newPos,
							newPos.add(new vec3(0, 2 * duckOffset, 0)));


						if (cast1.fract == 1) {
							// movement tech???
							const playerSpeed = player.velocity.magnitide();
							player.velocity = player.velocity.sub(
								cast0.normal.mult(vec3.dot(player.velocity, cast0.normal)));
							player.velocity.normalise();
							player.velocity = player.velocity.mult(playerSpeed);

							player.position = newPos;

							player.wishDuck = false;
							player.position.y += duckOffset
						}
					}
				}
			}
		}

		// instant duck / unduck in the air
		if (player.positionData.groundEnt == -1) {
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
					if (player.positionData.groundEnt != -1) {
						player.position.y -= duckOffset;
					} else {
						player.position.y += duckOffset - duckGlitch;
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
		if (cmd.buttons[Buttons.jump] && player.positionData.groundEnt != -1) {
			player.velocity.y += jumpBoost;
			player.positionData.groundEnt = -1;
		}

		// move
		if (player.positionData.groundEnt >= 0) {
			this.groundMove(player, cmd, delta);
		} else {
			this.airMove(player, cmd, delta);
		}

		player.positionData = this.catagorizePosition(player);

		player.camPosition = player.position.add(new vec3(0, this.getViewOffset(player), 0));
	}
}