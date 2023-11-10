import { gameobjectsList } from "../client/level.js";
import { Transform } from "./transform.js";

export class GameObject {
	transform: Transform = new Transform();

	constructor() {
		gameobjectsList.push(this);
	}
}