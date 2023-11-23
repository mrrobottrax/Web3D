import { UserCmd } from "../input/usercmd.js";
import { quaternion, vec3 } from "../math/vector.js";
import { PlayerUtil, PositionData } from "./playerutil.js";
import { Time } from "../system/time.js";
import { Entity } from "../entitysystem/entity.js";
import { Transform } from "../entitysystem/transform.js";
import { AnimationController } from "../mesh/animation.js";
import { Model, SetUpNodeTransforms as SetupNodeTransforms } from "../mesh/model.js";

export let playerModel: Model;
export function setPlayerModel(model: Model) {
	playerModel = model;
}

export class SharedPlayer extends Entity {
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

	id: number;

	controller: AnimationController;
	nodeTransforms: Transform[];

	constructor(id: number) {
		super();

		this.position = vec3.origin();
		this.pitch = 0;
		this.yaw = 0;

		this.camRotation = quaternion.identity();
		this.velocity = vec3.origin();

		this.positionData = {
			groundEnt: -1,
		};

		this.camPosition = this.position;
		this.isDucked = false;
		this.wishDuck = false;
		this.duckProg = 0;

		this.id = id;

		this.nodeTransforms = [];
		SetupNodeTransforms(this.nodeTransforms, playerModel);
		this.controller = new AnimationController(this.nodeTransforms);
	}

	processCmd(cmd: UserCmd, positionOnly: boolean = false): void {
		if (!positionOnly) {
			this.pitch = cmd.pitch;
			this.yaw = cmd.yaw;
		}

		PlayerUtil.move(this, cmd, Time.fixedDeltaTime);

		// todo: firing
	}
}