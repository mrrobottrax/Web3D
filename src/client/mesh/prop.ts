import { Entity } from "../../common/entitysystem/entity.js";
import { Transform } from "../../common/entitysystem/transform.js";
import { AnimationController } from "../../common/mesh/animation.js";
import { Model, SetUpNodeTransforms } from "../../common/mesh/model.js";

export class PropBase extends Entity {
	nodeTransforms: Transform[];
	model: Model;
	controller: AnimationController;

	constructor(model: Model) {
		super();

		this.model = model;

		// set up nodes
		this.nodeTransforms = [];
		SetUpNodeTransforms(this.nodeTransforms, this.model);

		this.controller = new AnimationController(this.nodeTransforms);
	}

	override update(): void {
		this.controller.frame();
	}
}

export class StaticProp extends PropBase {
}

export class DynamicProp extends PropBase {
}