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

	isDucked: boolean;
	lastDuckProg: number;
	duckProg: number;

	constructor(pos: vec3, pitch: number, yaw: number) {
		this.position = pos;
		this.lastPosition = vec3.copy(this.position);
		this.pitch = pitch;
		this.yaw = yaw;

		this.camRotation = quaternion.eulerRad(pitch, yaw, 0);
		this.velocity = vec3.origin();

		this.positionData = {
			groundEnt: -1,
		};

		this.camPosition = this.position;
		this.isDucked = false;
		this.duckProg = 0;
		this.lastDuckProg = this.duckProg;
	}

	move(cmd: Cmd): void {
		this.lastPosition.copy(this.position);
		this.lastDuckProg = this.duckProg;
		PlayerUtil.move(this, cmd, Time.fixedDeltaTime);
	}
}

export let player = new LocalPlayer(new vec3(0, 1, 0), 0, 0);