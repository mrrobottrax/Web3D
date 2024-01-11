import { UserCmd } from "../input/usercmd.js";
import { quaternion, vec3 } from "../math/vector.js";
import { PlayerUtil } from "./playerutil.js";
import { Time } from "../system/time.js";
import { Entity } from "../entitysystem/entity.js";
import { Transform } from "../entitysystem/transform.js";
import { Model, SetUpNodeTransforms } from "../mesh/model.js";
import { PlayerAnimController } from "./playeranimcontroller.js";
import { Buttons } from "../input/buttons.js";
import { Weapon } from "../weapons/weapon.js";
import { Environment, environment } from "../system/context.js";

export let playerModel: Model;
export function setPlayerModel(model: Model) {
	playerModel = model;
	// console.log(playerModel.animations);
}

export interface PredictedData {
	position: vec3;
	velocity: vec3;

	isDucked: boolean;
	duckProg: number;
}

export abstract class SharedPlayer extends Entity {
	camPosition: vec3;
	camRotation: quaternion;
	pitch: number;
	yaw: number;

	position: vec3;
	velocity: vec3;

	groundEnt: Entity | null = null;

	wishDuck: boolean;
	isDucked: boolean;
	duckProg: number;

	id: number;

	controller: PlayerAnimController;
	nodeTransforms: Transform[];

	model: Model;

	weapon: Weapon | null = null;

	health: number = 100;
	respawnTimer: number = 0;

	constructor(id: number) {
		super();

		this.model = playerModel;

		this.position = vec3.origin();
		this.pitch = 0;
		this.yaw = 0;

		this.camRotation = quaternion.identity();
		this.velocity = vec3.origin();

		this.camPosition = this.position;
		this.isDucked = false;
		this.wishDuck = false;
		this.duckProg = 0;

		this.id = id;

		this.nodeTransforms = [];
		SetUpNodeTransforms(this.nodeTransforms, playerModel);
		this.controller = new PlayerAnimController(
			this.nodeTransforms,
			this,
			this.model.findAnimation("idle1"),
			this.model.findAnimation("run"),
		);
	}

	processCmd(cmd: UserCmd, positionOnly: boolean = false): void {
		if (this.isDead()) return;

		if (!positionOnly) {
			this.pitch = cmd.pitch;
			this.yaw = cmd.yaw;
		}

		// todo: fire before or after move?
		if (this.getButtons()[Buttons.fire1] && !this.getLastButtons()[Buttons.fire1]) {
			if (this.weapon)
				this.weapon.fire(this);
		}

		PlayerUtil.move(this, cmd, Time.fixedDeltaTime);
	}

	override update(): void {
		this.controller.frame();

		super.update();
	}

	abstract getButtons(): boolean[];
	abstract getLastButtons(): boolean[];

	createPredictedData(): PredictedData {
		return {
			position: vec3.copy(this.position),
			velocity: vec3.copy(this.velocity),
			isDucked: this.isDucked,
			duckProg: this.duckProg
		}
	}

	setPredictedData(data: PredictedData): void {
		this.position.copy(data.position);
		this.velocity.copy(data.velocity);
		this.isDucked = data.isDucked;
		this.duckProg = data.duckProg;
	}

	static predictedVarsMatch(a: PredictedData, b: PredictedData): boolean {
		if (!a.position.equals(b.position)) return false;
		if (!a.velocity.equals(b.velocity)) return false;
		if (a.isDucked != b.isDucked) return false;
		if (a.duckProg != b.duckProg) return false;

		return true;
	}

	static copyPredictedData(data: PredictedData): PredictedData {
		return {
			position: vec3.copy(data.position),
			velocity: vec3.copy(data.velocity),
			isDucked: data.isDucked,
			duckProg: data.duckProg
		}
	}

	damage(damage: number) {
		if (environment == Environment.server) {
			this.health -= damage;
			console.log("Health: " + this.health);
			if (this.health <= 0) {
				this.die();
			}
		}

		this.damageEffect();
	}

	die() {}
	async damageEffect() {}

	isGrounded(): boolean {
		return this.groundEnt != null;
	}

	isDead(): boolean {
		return this.health <= 0;
	}
}