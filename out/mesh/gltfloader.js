var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Mesh } from "./mesh.js";
export function loadGlTFFromWeb(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // send requests
        const req1 = new XMLHttpRequest();
        const req2 = new XMLHttpRequest();
        const promise1 = new Promise((resolve) => {
            req1.addEventListener("load", function () { resolve(this); });
        });
        const promise2 = new Promise((resolve) => {
            req2.addEventListener("load", function () { resolve(this); });
        });
        req1.open("GET", url + ".gltf");
        req1.send();
        req2.responseType = "arraybuffer";
        req2.open("GET", url + ".bin");
        req2.send();
        let mesh = null;
        // get shader from requests
        yield Promise.all([promise1, promise2]).then((results) => {
            if (results[0].status != 200 || results[1].status != 200) {
                return null;
            }
            mesh = loadGltf(JSON.parse(results[0].responseText), [new Uint8Array(results[1].response)]);
        });
        // fall back when request fails
        // todo: error model
        //if (!result) {
        //	console.error(`Failed to load shader ${vs}, ${fs}`);
        //	shader = initShaderProgram(fallbackVSource, fallbackFSource);
        //}
        return mesh;
    });
}
export function loadGlbFromWeb(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // send requests
        const req1 = new XMLHttpRequest();
        const promise1 = new Promise((resolve) => {
            req1.addEventListener("load", function () { resolve(this); });
        });
        req1.open("GET", url + ".glb");
        req1.send();
        let mesh = null;
        // get shader from requests
        yield promise1.then((result) => {
            if (result.status != 200 || result.status != 200) {
                return null;
            }
            mesh = loadGlb(new Uint8Array(result.response));
        });
        // fall back when request fails
        // todo: error model
        //if (!result) {
        //	console.error(`Failed to load shader ${vs}, ${fs}`);
        //	shader = initShaderProgram(fallbackVSource, fallbackFSource);
        //}
        return mesh;
    });
}
const magicNumber = 1179937895;
const version = 2;
const chunkTypes = {
    JSON: 0x4E4F534A,
    BIN: 0x004E4942
};
const componentTypes = {
    BYTE: 5120,
    UNSIGNED_BYTE: 5121,
    SHORT: 5122,
    UNSIGNED_SHORT: 5123,
    UNSIGNED_INT: 5125,
    FLOAT: 5126,
};
const accessorTypes = {
    SCALAR: "SCALAR",
    VEC2: "VEC2",
    VEC3: "VEC3",
    VEC4: "VEC4",
    MAT2: "MAT2",
    MAT3: "MAT3",
    MAT4: "MAT4",
};
function loadGlb(file) {
    let pos = 0;
    // ~~~~~~ HEADER ~~~~~~~
    // assert magic number
    if (readUInt32(pos, file) != magicNumber) {
        console.error("Failed to load glTF file");
        return null;
    }
    pos += 4;
    if (readUInt32(pos, file) != version) {
        console.error("glTF: bad version");
        return null;
    }
    pos += 4;
    const length = readUInt32(pos, file);
    pos += 4;
    // ~~~~~~ JSON CHUNK ~~~~~~~
    const jsonChunk = readChunk(pos, file);
    if (jsonChunk.chunkType != chunkTypes.JSON) {
        console.error("glTF: bad type");
    }
    pos = jsonChunk.dataPos;
    const json = JSON.parse(new TextDecoder().decode(file.subarray(pos, pos + jsonChunk.chunkLength)));
    // ~~~~~~~ BIN CHUNK ~~~~~~~
    pos += jsonChunk.chunkLength;
    const binChunk = readChunk(pos, file);
    if (binChunk.chunkType != chunkTypes.BIN) {
        console.error("glTF: bad type");
    }
    pos = binChunk.dataPos;
    let buffers = [file.subarray(binChunk.dataPos, binChunk.dataPos + binChunk.chunkLength)];
    // temp: load first primitive
    const p = loadPrimitive(json.meshes[0].primitives[0], json, buffers);
    if (!p) {
        return null;
    }
    const m = new Mesh();
    m.genBuffers([p]);
    return m;
}
function loadGltf(json, buffers) {
    // temp: load first primitive
    const p = loadPrimitive(json.meshes[0].primitives[0], json, buffers);
    if (!p) {
        return null;
    }
    const m = new Mesh();
    m.genBuffers([p]);
    return m;
}
function loadPrimitive(primitive, json, buffers) {
    const attributes = primitive.attributes;
    const positionIndex = attributes["POSITION"];
    const texCoordIndex = attributes["TEXCOORD_0"];
    const indicesIndex = primitive["indices"];
    const positionAccessor = json.accessors[positionIndex];
    const texCoordAccessor = json.accessors[texCoordIndex];
    const indicesAccessor = json.accessors[indicesIndex];
    // asserts
    if (positionAccessor.componentType != componentTypes.FLOAT) {
        console.error("glTF: type error");
        return null;
    }
    if (positionAccessor.type != accessorTypes.VEC3) {
        console.error("glTF: type error");
        return null;
    }
    if (texCoordAccessor.componentType != componentTypes.FLOAT) {
        console.error("glTF: type error");
        return null;
    }
    if (texCoordAccessor.type != accessorTypes.VEC2) {
        console.error("glTF: type error");
        return null;
    }
    if (indicesAccessor.componentType != componentTypes.UNSIGNED_SHORT) {
        console.error("glTF: type error");
        return null;
    }
    if (indicesAccessor.type != accessorTypes.SCALAR) {
        console.error("glTF: type error");
        return null;
    }
    const positionBufferView = json.bufferViews[positionAccessor.bufferView];
    const texCoordBufferView = json.bufferViews[texCoordAccessor.bufferView];
    const indicesBufferView = json.bufferViews[indicesAccessor.bufferView];
    const positionBuffer = new DataView(buffers[positionBufferView.buffer].buffer, buffers[positionBufferView.buffer].byteOffset + positionBufferView.byteOffset);
    const texCoordBuffer = new DataView(buffers[texCoordBufferView.buffer].buffer, buffers[texCoordBufferView.buffer].byteOffset + texCoordBufferView.byteOffset);
    const indicesBuffer = new DataView(buffers[indicesBufferView.buffer].buffer, buffers[indicesBufferView.buffer].byteOffset + indicesBufferView.byteOffset);
    let data = '';
    for (let i = 0; i < positionBuffer.byteLength; ++i) {
        data += positionBuffer.getUint8(i).toString(16) + " ";
    }
    // positions
    let vertices = [];
    for (let i = 0; i < positionAccessor.count * 3; ++i) {
        vertices[i] = positionBuffer.getFloat32(i * 4, true);
    }
    // positions
    let texCoords = [];
    for (let i = 0; i < texCoordAccessor.count * 2; ++i) {
        texCoords[i] = texCoordBuffer.getFloat32(i * 4, true);
    }
    // indices
    let indices = [];
    for (let i = 0; i < indicesAccessor.count; ++i) {
        indices[i] = indicesBuffer.getUint16(i * 2, true);
    }
    let p = {
        positions: new Float32Array(vertices),
        texCoords: new Float32Array(texCoords),
        elements: new Uint16Array(indices)
    };
    return p;
}
function readChunk(position, file) {
    return {
        chunkLength: readUInt32(position, file),
        chunkType: readUInt32(position + 4, file),
        dataPos: position + 8,
    };
}
function readUInt32(position, file) {
    let num = new Uint32Array(1);
    for (let i = 3; i >= 0; --i) {
        num[0] = num[0] << 8;
        num[0] |= file[position + i];
    }
    return num[0];
}
//# sourceMappingURL=gltfloader.js.map