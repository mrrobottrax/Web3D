import { Cmd } from "./cmd.js";
import { quaternion, vec3 } from "./math/vector.js";
import { PlayerUtil, PositionData } from "./playerutil.js";
import { Time } from "./time.js";

export class LocalPlayer {
	camPosition: vec3;
	camRotation: quaternion;
	pitch: number;
	yaw: number;

	lastPosition: vec3;
	position: vec3;
	velocity: vec3;

	positionData: PositionData;

	constructor(pos: vec3, pitch: number, yaw: number) {
		this.position = pos;
		this.lastPosition = vec3.copy(this.position);
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
		this.velocity = vec3.origin();

		this.positionData = {
			onground: -1,
		};

		this.camPosition = this.position;
	}

	move(cmd: Cmd): void {
		this.lastPosition.copy(this.position);
		PlayerUtil.move(this.position, this.velocity, cmd, this.positionData, Time.fixedDeltaTime);
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);