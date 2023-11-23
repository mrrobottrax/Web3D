import { mat4 } from "../math/matrix.js";
import { quaternion, vec3 } from "../math/vector.js";
import { Transform } from "../entitysystem/transform.js";
import { Animation } from "./animation.js";

export interface HierarchyNode {
	index: number;
	children: HierarchyNode[];
}

export class Model {
	hierarchy: HierarchyNode[] = [];
	nodes: Node[] = [];
	animations: Animation[] = [];
}

export interface Node {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	primitives: Primitive[];

	skinned: boolean;
	joints?: number[];
	inverseBindMatrices?: mat4[];
}

export interface NodeData {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	children: number[];

	primitives: PrimitiveData[];

	skinned: boolean;
	joints?: number[];
	inverseBindMatrices?: mat4[];
}

export interface PrimitiveData {
	positions: Uint8Array;
	texCoords: Uint8Array;
	elements: Uint16Array;
	weights: Uint8Array;
	boneIds: Uint8Array;
	color: number[];
	skinned: boolean;

	textureUris: string[];
}

export class Primitive {
	vao: WebGLVertexArrayObject;
	textures: WebGLTexture[];
	elementCount: number;
	color: number[];

	constructor(vao: WebGLVertexArrayObject, textures: WebGLTexture[], elementCount: number, color: number[]) {
		this.vao = vao;
		this.textures = textures;
		this.elementCount = elementCount;
		this.color = color;
	}
}

export function SetUpNodeTransforms(nodeTransforms: Transform[], model: Model) {
	nodeTransforms.length = model.nodes.length;
	for (let i = 0; i < model.nodes.length; ++i) {
		const modelNode = model.nodes[i];
		nodeTransforms[i] = new Transform();
		const node = nodeTransforms[i];

		node.translation = vec3.copy(modelNode.translation);
		node.rotation = quaternion.copy(modelNode.rotation);
		node.scale = vec3.copy(modelNode.scale);
	}
}