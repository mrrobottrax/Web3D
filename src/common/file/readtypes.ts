import { vec3 } from "../math/vector.js";

export class BinaryReader {
	static readUInt32(position: number, file: Uint8Array): number {
		let num = 0;

		for (let i = 3; i >= 0; --i) {
			num = num << 8;
			num |= file[position + i];
		}

		return num;
	}

	static readFloat32(position: number, file: Uint8Array): number {
		let bytes = new Uint8Array(4);
		bytes[0] = file[position]
		bytes[1] = file[position + 1]
		bytes[2] = file[position + 2]
		bytes[3] = file[position + 3];

		let num = new Float32Array(bytes.buffer, 0, 1);

		return num[0];
	}

	static readVec3(position: number, file: Uint8Array): vec3 {
		return new vec3(
			this.readFloat32(position, file),
			this.readFloat32(position + 4, file),
			this.readFloat32(position + 8, file));
	}

	static readUInt16(position: number, file: Uint8Array): number {
		let num = 0;

		for (let i = 1; i >= 0; --i) {
			num = num << 8;
			num |= file[position + i];
		}

		return num;
	}
}