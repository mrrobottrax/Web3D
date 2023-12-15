export class BinaryReader {
	static readUInt32(position: number, file: Uint8Array): number {
		let num = new Uint32Array(1);

		for (let i = 3; i >= 0; --i) {
			num[0] = num[0] << 8;
			num[0] |= file[position + i];
		}

		return num[0];
	}

	static readUInt16(position: number, file: Uint8Array): number {
		let num = new Uint16Array(1);

		for (let i = 1; i >= 0; --i) {
			num[0] = num[0] << 8;
			num[0] |= file[position + i];
		}

		return num[0];
	}
}