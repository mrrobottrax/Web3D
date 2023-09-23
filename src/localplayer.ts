import { quaternion, vec3 } from "./math/vector.js";
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

		this.camPosition = this.camPosition.add(wishDir.mult(Time.deltaTime));
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);