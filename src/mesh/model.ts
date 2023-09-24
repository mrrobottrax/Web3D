import { quaternion, vec3 } from "../math/vector.js";
import { Mesh } from "./mesh.js";

export class Model {
	position: vec3 = new vec3(0, 0, 0);
	scale: vec3 = new vec3(1, 1, 1);
	rotation: quaternion = new quaternion(1, 0, 0, 0);

	mesh: Mesh = new Mesh();
}