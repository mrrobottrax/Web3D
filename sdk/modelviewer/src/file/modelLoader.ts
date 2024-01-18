import { setImageGlSettings } from "../../../../src/client/mesh/texture.js";
import { gl } from "../../../../src/client/render/gl.js";
import { getFileType, getFileWithoutDirectory } from "../../../../src/common/file/fileFunctions.js";
import { Primitive } from "../../../../src/common/mesh/model.js";
import { modelViewer } from "../main.js";
import { setCurrentModelText } from "../ui/footer.js";
import { ModelViewerGltfLoader } from "./modelViewGltfLoader.js";

const gltfFormatString = ".gltf";
const binFormatString = ".bin";
const modelFormatString = ".gmdl";

let tryingToLoadModel: boolean = false;

let currentModelName: string = "";

let hasGltfFile: boolean = false;
let hasBinFile: boolean = false;
let hasMdlFile: boolean = false;

let gltfJson: any = null;
let binBuffer: Uint8Array | null = null;

const loadedModelTextures = new Map<string, WebGLTexture>();

export function openModelDialog() {
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = `${gltfFormatString}, ${modelFormatString}, ${binFormatString}`;
	fileInput.multiple = true;

	fileInput.addEventListener("input", () => {
		if (fileInput && fileInput.files) {
			for (let i = 0; i < fileInput.files.length; ++i)
				openModelFile(fileInput.files[i]);
		}
	});

	fileInput.click();
	fileInput.remove();
}

function openModelFile(file: File) {
	setCurrentModelText(file.name);

	const type = getFileType(file.name);
	switch (type) {
		case gltfFormatString:
			setGltf(file);
			break;
		case binFormatString:
			setBin(file);
			break;
		case modelFormatString:
			setMdl(file);
			break;
	}
}

function setGltf(file: File) {
	if (hasMdlFile) closeModelFile();

	currentModelName = file.name;

	file.text().then(result => {
		const json = JSON.parse(result);
		hasGltfFile = true;
		tryingToLoadModel = true;

		if (!hasBinFile) {
			setCurrentModelText("Add .bin file.");
		}

		gltfJson = json;

		tryOpenGltf();
	});
}

function setBin(file: File) {
	if (hasMdlFile) closeModelFile();


	file.arrayBuffer().then(result => {
		const array = new Uint8Array(result);

		hasBinFile = true;
		tryingToLoadModel = true;

		if (!hasGltfFile) {
			setCurrentModelText("Add .gltf file.");
		}
		binBuffer = array;

		tryOpenGltf();
	});
}

async function tryOpenGltf() {
	if (hasBinFile && hasGltfFile) {
		if (binBuffer) {
			const mdl = await ModelViewerGltfLoader.loadGltf(gltfJson, [binBuffer], "");

			modelViewer.setModel(mdl);
		}
	}
}

function setMdl(file: File) {
	closeModelFile();

	hasMdlFile = true;
}

export function closeModelFile() {
	hasBinFile = false;
	hasGltfFile = false;
	hasMdlFile = false;

	gltfJson = null;
	binBuffer = null;

	tryingToLoadModel = false;

	setCurrentModelText("NO MODEL LOADED. Load a model by opening either a .gmdl file or a .gltf and a .bin file. Textures must be added after.")
	modelViewer.setModel(null!);

	// todo:
}

export function loadModelTextureDialog() {
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = `.png, .jpg, .jpeg`;
	fileInput.multiple = true;

	fileInput.addEventListener("input", () => {
		if (fileInput && fileInput.files) {
			for (let i = 0; i < fileInput.files.length; ++i) {
				addTexture(fileInput.files[i]);
			}
		}
	});

	fileInput.click();
	fileInput.remove();
}

function addTexture(file: File) {
	const image = new Image();
	const fr = new FileReader();
	fr.onload = function () {
		image.src = fr.result as string;

		image.onload = () => {
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);

			const level = 0;
			const internalFormat = gl.RGBA;
			const srcFormat = gl.RGBA;
			const srcType = gl.UNSIGNED_BYTE;
			gl.texImage2D(
				gl.TEXTURE_2D,
				level,
				internalFormat,
				srcFormat,
				srcType,
				image,
			);

			setImageGlSettings(image);

			gl.bindTexture(gl.TEXTURE_2D, null);

			loadedModelTextures.set(file.name, tex!);
		}
	}
	fr.readAsDataURL(file);
}

export async function waitForUserToAddTexture(name: string, primitive: Primitive) {
	const shortName = getFileWithoutDirectory(name);

	// wait until user has loaded the texture
	while (!(loadedModelTextures.has(shortName) || !tryingToLoadModel)) {
		setCurrentModelText("Please load texture: " + name);
		await new Promise(r => setTimeout(r, 1000));
	}

	primitive.texture = loadedModelTextures.get(shortName)!;

	setCurrentModelText(currentModelName);
	return;
}