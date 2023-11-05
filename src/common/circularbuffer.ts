import gMath from "./math/gmath.js";

export class CircularBuffer<Type> {
	array: Array<Type>;
	front: number;

	constructor(size: number) {
		this.array = new Array<Type>(size);
		this.front = 0;
	}

	public rewind(offset: number): Type {
		return this.array[gMath.modulo(this.front - offset, this.array.length)];
	}

	public push(entry: Type) {
		this.array[this.front] = entry;

		++this.front;
		this.front = this.front % this.array.length;
	}

	public getFront() {
		return this.array[this.front];
	}
}