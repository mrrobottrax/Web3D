import { quaternion, vec3 } from "./math/vector.js";
import { PlayerUtil, PositionData } from "./playerutil.js";
import { Time } from "./time.js";

export class LocalPlayer {
	camRotation: quaternion;
	pitch: number;
	yaw: number;

	position: vec3;
	velocity: vec3;

	positionData: PositionData;

	constructor(pos: vec3, pitch: number, yaw: number) {
		this.position = pos;
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
		this.velocity = vec3.origin();

		this.positionData = {
			onground: -1,
		};
	}

	move(moveVector: vec3): void {
		const wishDir = moveVector.rotateYaw(this.yaw);
		wishDir.normalise();

		PlayerUtil.move(this.position, this.velocity, wishDir, this.positionData, Time.deltaTime);
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);