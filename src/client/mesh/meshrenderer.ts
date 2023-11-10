import { mat4 } from "../../common/math/matrix.js";
import { Component } from "../../componentsystem/component.js";
import { Transform } from "../../componentsystem/transform.js";
import { Animation } from "../animation.js";
import { Mesh } from "./mesh.js";

export class MeshRendererBase extends Component {
	mesh: Mesh = new Mesh();
}

export class StaticMeshRenderer extends MeshRendererBase {
}

export class SkinnedMeshRenderer extends MeshRendererBase {
	joints: Transform[] = [];
	inverseBindMatrices: mat4[] = [];
}