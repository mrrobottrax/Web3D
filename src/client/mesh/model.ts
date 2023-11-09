import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { Mesh } from "./mesh.js";

export class Transform {
	position: vec3 = vec3.origin();
	scale: vec3 = vec3.one();
	rotation: quaternion = quaternion.identity();
	worldMatrix: mat4 = mat4.identity();
}

export class ModelBase {
	transform: Transform = new Transform();

	mesh: Mesh = new Mesh();

	children: ModelBase[] = [];
	parent: ModelBase | null = null;

	skinned: boolean = false;

	animations: Animation[] = [];
}

export class StaticModel extends ModelBase {
}

export class SkinnedModel extends ModelBase {
	joints: ModelBase[] = [];
	inverseBindMatrices: mat4[] = [];
}