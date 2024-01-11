import { vec3 } from "../../common/math/vector.js";
import { HalfEdgeMesh } from "../../common/mesh/halfedge.js";

interface Line {
	start: vec3,
	end: vec3,
	color: number[],
	time: number
}
export let lines: Line[] = [];
export function drawLine(start: vec3, end: vec3, color: number[], time: number = 0) {
	lines.push({ start: vec3.copy(start), end: vec3.copy(end), color: color, time: time });
}

export function drawBox(min: vec3, max: vec3, origin: vec3, color: number[], t: number = 0) {
	const _min = vec3.copy(min);
	const _max = vec3.copy(max);
	_min.add(origin);
	_max.add(origin);

	let a = new vec3(_min.x, _min.y, _min.z);
	let b = new vec3(_min.x, _min.y, _max.z);
	let c = new vec3(_min.x, _max.y, _min.z);
	let d = new vec3(_min.x, _max.y, _max.z);
	let e = new vec3(_max.x, _min.y, _min.z);
	let f = new vec3(_max.x, _min.y, _max.z);
	let g = new vec3(_max.x, _max.y, _min.z);
	let h = new vec3(_max.x, _max.y, _max.z);

	drawLine(a, b, color, t);
	drawLine(a, c, color, t);
	drawLine(a, e, color, t);
	drawLine(b, d, color, t);
	drawLine(b, f, color, t);
	drawLine(c, d, color, t);
	drawLine(c, g, color, t);
	drawLine(d, h, color, t);
	drawLine(e, g, color, t);
	drawLine(e, f, color, t);
	drawLine(h, f, color, t);
	drawLine(h, g, color, t);
}

export let screenLines: Line[] = [];
export function drawLineScreen(start: vec3, end: vec3, color: number[], time: number = 0) {
	screenLines.push({ start: vec3.copy(start), end: vec3.copy(end), color: color, time: time });
}

export function drawHalfEdgeMesh(mesh: HalfEdgeMesh, color: number[], time: number = 0) {
	for (let i = 0; i < mesh.edges.length; ++i) {
		drawLine(
			mesh.vertices[mesh.halfEdges[mesh.edges[i].halfEdge].vert].position,
			mesh.vertices[mesh.halfEdges[mesh.halfEdges[mesh.edges[i].halfEdge].next].vert].position,
			color,
			time
		);
	}

	for (let i = 0; i < mesh.faces.length; ++i) {
		const f = mesh.faces[i];

		const p = mesh.vertices[mesh.halfEdges[f.halfEdge].vert].position;

		drawLine(
			p,
			p.plus(f.normal),
			color,
			time
		);
	}
}