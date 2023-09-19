import { quaternion, vec3 } from "./vector.js";

export class Model {
	position: vec3 = new vec3(0, 0, 0);
	scale: vec3 = new vec3(1, 1, 1);
	rotation: quaternion = new quaternion(1, 0, 0, 0);

	verts: number[] = [];
	elements: number[] = [];

	constructor() {

	}
}