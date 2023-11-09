import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { Mesh } from "./mesh.js";

export class Transform {
	position: vec3 = vec3.origin();
	scale: vec3 = vec3.one();
	rotation: quaternion = quaternion.identity();
	worldMatrix: mat4 = mat4.identity();
}

export class Model {
	transform: Transform = new Transform();

	mesh: Mesh = new Mesh();

	children: Model[] = [];
	parent: Model | null = null;

	skinned: boolean = false;
}

export class SkinnedModel extends Model {
	joints: Model[] = [];
	inverseBindMatrices: mat4[] = [];
}