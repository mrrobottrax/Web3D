import { Transform } from "./transform.js";

export let entityList: Entity[] = [];

export class Entity {
	transform: Transform = new Transform();

	update() {}

	constructor() {
		entityList.push(this);
	}
}