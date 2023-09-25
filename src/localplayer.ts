import { quaternion, vec3 } from "./math/vector.js";
import { castAABB } from "./physics.js";
import { Time } from "./time.js";

export class LocalPlayer {
	camPosition: vec3;
	camRotation: quaternion;
	pitch: number;
	yaw: number;
	
	constructor(pos: vec3, pitch: number, yaw: number) {
		this.camPosition = pos;
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
	}

	move(moveVector: vec3): void {
		const wishDir = moveVector.rotateYaw(this.yaw);
		wishDir.normalise();
		const goal = this.camPosition.add(wishDir.mult(Time.deltaTime * 3));

		const cast = castAABB(new vec3(1, 1, 1), this.camPosition, goal);

		this.camPosition = this.camPosition.add(wishDir.mult(cast.dist));
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);