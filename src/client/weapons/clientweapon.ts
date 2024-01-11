import { Weapon } from "../../common/weapons/weapon.js";
import { fireViewmodel } from "../render/viewmodel.js";

export class ClientWeapon {
	static clientSideFire(weapon: Weapon) {
		fireViewmodel();
	}
}