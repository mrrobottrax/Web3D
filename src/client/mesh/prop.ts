import { GameObject } from "../../componentsystem/gameobject.js";
import { Animation } from "../animation.js";
import { SkinnedMeshRenderer, StaticMeshRenderer } from "./meshrenderer.js";

export class PropBase extends GameObject {
	
}

export class StaticProp extends PropBase {
	meshRenderer!: StaticMeshRenderer;
}

export class DynamicProp extends PropBase {

}

class AnimatedPropBase extends DynamicProp {
	animations: Animation[] = [];
}

export class AnimatedProp extends AnimatedPropBase {
	meshRenderer!: StaticMeshRenderer;
}

export class SkinnedProp extends AnimatedPropBase {
	meshRenderer!: SkinnedMeshRenderer;
}