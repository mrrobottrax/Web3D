import { quaternion, vec3 } from "../../common/math/vector.js";
import { Entity } from "../../entitysystem/entity.js";
import { Transform } from "../../entitysystem/transform.js";
import { AnimationController } from "../animation.js";
import { Model } from "./model.js";

export class PropBase extends Entity {
	nodeTransforms: Transform[];
	model: Model;
	controller: AnimationController;

	constructor(model: Model) {
		super();

		this.model = model;
		this.controller = new AnimationController(this);

		// set up nodes
		this.nodeTransforms = [];
		this.nodeTransforms.length = model.nodes.length;
		for (let i = 0; i < model.nodes.length; ++i) {
			const modelNode = model.nodes[i];
			this.nodeTransforms[i] = new Transform();
			const node = this.nodeTransforms[i];

			node.translation = vec3.copy(modelNode.translation);
			node.rotation = quaternion.copy(modelNode.rotation);
			node.scale = vec3.copy(modelNode.scale);
		}
	}

	override update(): void {
		this.controller.frame();
	}
}

export class StaticProp extends PropBase {
}

export class DynamicProp extends PropBase {
}