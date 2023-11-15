import { mat4 } from "../common/math/matrix.js";
import { quaternion, vec3 } from "../common/math/vector.js";
import { Component } from "./component.js";

export class Transform extends Component {
	position: vec3 = vec3.origin();
	scale: vec3 = vec3.one();
	rotation: quaternion = quaternion.identity();
	worldMatrix: mat4 = mat4.identity();
}