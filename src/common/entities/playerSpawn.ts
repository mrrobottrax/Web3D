import { Entity } from "../entitysystem/entity.js";
import { Team } from "../player/teamEnum.js";

export class PlayerSpawn extends Entity {
	team: Team = Team.RED;
}