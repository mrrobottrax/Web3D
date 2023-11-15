import { quaternion, vec3 } from "../../common/math/vector.js";
import { GameObject } from "../../componentsystem/gameobject.js";
import { Transform } from "../../componentsystem/transform.js";
import { Model } from "./model.js";

export class PropBase extends GameObject {
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

			node.position = vec3.copy(modelNode.translation);
			node.rotation = quaternion.copy(modelNode.rotation);
			node.scale = vec3.copy(modelNode.scale);
		}
	}
}

export class StaticProp extends PropBase {
}

export class DynamicProp extends PropBase {
}

// export class AnimatedGameObject extends GameObject {
// 	animations: Animation[] = [];
// 	controller!: AnimationController;
// }

// export class SkinnedProp extends DynamicProp {
// 	meshRenderer!: SkinnedMeshRenderer;
// }