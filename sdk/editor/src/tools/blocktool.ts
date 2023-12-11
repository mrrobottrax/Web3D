import { drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export interface Block {
	min: vec3;
	max: vec3;
}

export class BlockTool extends Tool {
	currentBlock: Block = {
		min: new vec3(-1, -1, -1),
		max: new vec3(1, 1, 1)
	};

	dragStart: vec3 = vec3.origin();
	dragEnd: vec3 = vec3.origin();

	dragging: boolean = false;

	drawCurrentBlock() {
		let a = new vec3(this.currentBlock.min.x, this.currentBlock.min.y, this.currentBlock.min.z);
		let b = new vec3(this.currentBlock.min.x, this.currentBlock.min.y, this.currentBlock.max.z);
		let c = new vec3(this.currentBlock.min.x, this.currentBlock.max.y, this.currentBlock.min.z);
		let d = new vec3(this.currentBlock.min.x, this.currentBlock.max.y, this.currentBlock.max.z);
		let e = new vec3(this.currentBlock.max.x, this.currentBlock.min.y, this.currentBlock.min.z);
		let f = new vec3(this.currentBlock.max.x, this.currentBlock.min.y, this.currentBlock.max.z);
		let g = new vec3(this.currentBlock.max.x, this.currentBlock.max.y, this.currentBlock.min.z);
		let h = new vec3(this.currentBlock.max.x, this.currentBlock.max.y, this.currentBlock.max.z);

		const color = [1, 0, 0, 1];
		const t = 0;

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

	startDrag(position: vec3, mask: vec3) {
		console.log(position);
		this.dragStart = position;

		this.dragging = true;

		this.drag(position, mask);
	}

	stopDrag() {
		this.dragging = false;
	}

	drag(position: vec3, mask: vec3) {
		if (!this.dragging)
			return;

		this.dragEnd = position;

		this.currentBlock.min.x = (1 - mask.x) * Math.min(this.dragStart.x, this.dragEnd.x) + mask.x * this.currentBlock.min.x;
		this.currentBlock.min.y = (1 - mask.y) * Math.min(this.dragStart.y, this.dragEnd.y) + mask.y * this.currentBlock.min.y;
		this.currentBlock.min.z = (1 - mask.z) * Math.min(this.dragStart.z, this.dragEnd.z) + mask.z * this.currentBlock.min.z;
		this.currentBlock.max.x = (1 - mask.x) * Math.max(this.dragStart.x, this.dragEnd.x) + mask.x * this.currentBlock.max.x;
		this.currentBlock.max.y = (1 - mask.y) * Math.max(this.dragStart.y, this.dragEnd.y) + mask.y * this.currentBlock.max.y;
		this.currentBlock.max.z = (1 - mask.z) * Math.max(this.dragStart.z, this.dragEnd.z) + mask.z * this.currentBlock.max.z;
	}

	override mouse(button: number, pressed: boolean): boolean {
		const active = editor.windowManager.activeWindow as Viewport;

		if (active && button == 0) {
			if (pressed) {
				this.startDrag(active.getMouseWorldRounded(), active.getMask());
			} else {
				this.stopDrag();
			}

			return true;
		}

		return false;
	}

	override mouseMove(dx: number, dy: number): boolean {
		if (!this.dragging)
			return false;

		const active = editor.windowManager.activeWindow as Viewport;

		if (active) {
			this.drag(active.getMouseWorldRounded(), active.getMask());

			return true;
		}

		return false;
	}
}