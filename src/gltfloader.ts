export async function loadModelFromWeb(url: string) {
	// send requests
	const req = new XMLHttpRequest();

	const promise = new Promise<XMLHttpRequest>((resolve) => {
		req.addEventListener("load", function () { resolve(this); });
	});

	req.responseType = "arraybuffer";
	req.open("GET", url);
	req.send();

	let model = 0;

	// get shader from requests
	await promise.then((result) => {
		if (result.status != 200) {
			return null;
		}

		model = loadModel(result.response.Uint8Array);
		console.log(result.response);
	});

	// fall back when request fails
	// todo: error model
	//if (!result) {
	//	console.error(`Failed to load shader ${vs}, ${fs}`);
	//	shader = initShaderProgram(fallbackVSource, fallbackFSource);
	//}

	return model;
}

function loadModel(file: Uint8Array) {
	// assert magic number
	console.log(readUInt32(0, file));

	return 1;
}

function readUInt32(position: number, file: Uint8Array): number {
	let num = 0;

	for (let i = 0; i < 4; i++) {
		num = num << 8;
		num |= file[position + i];
	}
	
	return num;
}