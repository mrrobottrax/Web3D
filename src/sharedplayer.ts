import { UserCmd } from "./usercmd.js";
import { quaternion, vec3 } from "./math/vector.js";
import { PlayerUtil, PositionData } from "./playerutil.js";
import { Time } from "./time.js";

export class SharedPlayer {
	camPosition: vec3;
	camRotation: quaternion;
	pitch: number;
	yaw: number;

	position: vec3;
	velocity: vec3;

	positionData: PositionData;

	wishDuck: boolean;
	isDucked: boolean;
	duckProg: number;

	constructor(pos: vec3, pitch: number, yaw: number) {
		this.position = pos;
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
		this.velocity = vec3.origin();

		this.positionData = {
			groundEnt: -1,
		};

		this.camPosition = this.position;
		this.isDucked = false;
		this.wishDuck = false;
		this.duckProg = 0;
	}

	processCmd(cmd: UserCmd): void {
		this.pitch = cmd.pitch;
		this.yaw = cmd.yaw;
		PlayerUtil.move(this, cmd, Time.fixedDeltaTime);
	}
}