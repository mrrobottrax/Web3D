import { quaternion, vec3 } from "./math/vector.js";
import { PlayerUtil } from "./playerutil.js";
import { Time } from "./time.js";

export class LocalPlayer {
	camRotation: quaternion;
	pitch: number;
	yaw: number;
	
	position: vec3;
	velocity: vec3;
	
	constructor(pos: vec3, pitch: number, yaw: number) {
		this.position = pos;
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
		this.velocity = vec3.origin();
	}

	move(moveVector: vec3): void {
		const wishDir = moveVector.rotateYaw(this.yaw);
		wishDir.normalise();

		const move = PlayerUtil.move(this.position, this.velocity, wishDir, Time.deltaTime);

		this.position = move.position;
		this.velocity = move.velocity;
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);