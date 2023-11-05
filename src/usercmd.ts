import { vec3 } from "./common/math/vector";

export interface UserCmd {
	wishDir: vec3;
	buttons: Array<boolean>;
	pitch: number,
	yaw: number
}