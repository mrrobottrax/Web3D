import { quaternion, vec3 } from "../../common/math/vector.js";
import { Entity } from "../../componentsystem/gameobject.js";
import { Transform } from "../../componentsystem/transform.js";
import { Model } from "./model.js";

export class PropBase extends Entity {
	nodeTransforms: Transform[];
	model: Model;

	constructor(model: Model) {
		super();

		this.model = model;

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
}

export class StaticProp extends PropBase {
}

export class DynamicProp extends PropBase {
}