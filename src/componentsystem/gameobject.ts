import { entityList } from "../client/level.js";
import { Transform } from "./transform.js";

export class Entity {
	transform: Transform = new Transform();

	constructor() {
		entityList.push(this);
	}
}