import { mat4 } from "../common/math/matrix.js";
import { quaternion, vec3 } from "../common/math/vector.js";

export class Transform {
	translation: vec3 = vec3.origin();
	scale: vec3 = vec3.one();
	rotation: quaternion = quaternion.identity();
	worldMatrix: mat4 = mat4.identity();
}