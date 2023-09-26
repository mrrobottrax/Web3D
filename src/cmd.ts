import { vec3 } from "./math/vector";

export interface Cmd {
	wishDir: vec3;
	buttons: Array<boolean>;
}