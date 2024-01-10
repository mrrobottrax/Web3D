import { Pistol } from "../../common/weapons/pistol.js";
import { ClientWeapon } from "./clientweapon.js";

export class ClientPistol extends Pistol {
	override clientSideFire(): void {
		ClientWeapon.clientSideFire(this);
	}
}