import { UserCmd } from "../input/usercmd.js";
import { quaternion, vec3 } from "../math/vector.js";
import { PlayerUtil, PositionData } from "./playerutil.js";
import { Time } from "../system/time.js";
import { Entity } from "../entitysystem/entity.js";
import { Transform } from "../entitysystem/transform.js";
import { Model, SetUpNodeTransforms as SetupNodeTransforms } from "../mesh/model.js";
import { PlayerAnimController } from "./playeranimcontroller.js";

export let playerModel: Model;
export function setPlayerModel(model: Model) {
	playerModel = model;
	// console.log(playerModel.animations);
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

	controller: PlayerAnimController;
	nodeTransforms: Transform[];

	model: Model;

	constructor(id: number) {
		super();

		this.model = playerModel;

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
		this.controller = new PlayerAnimController(
			this.nodeTransforms,
			this,
			this.model.findAnimation("idle1"),
			this.model.findAnimation("run"),
		);
	}

	processCmd(cmd: UserCmd, positionOnly: boolean = false): void {
		if (!positionOnly) {
			this.pitch = cmd.pitch;
			this.yaw = cmd.yaw;
		}

		PlayerUtil.move(this, cmd, Time.fixedDeltaTime);

		// todo: firing
	}

	override update(): void {
		this.controller.frame();

		super.update();
	}
}