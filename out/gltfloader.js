var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function loadModelFromWeb(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // send requests
        const req = new XMLHttpRequest();
        const promise = new Promise((resolve) => {
            req.addEventListener("load", function () { resolve(this); });
        });
        req.responseType = "arraybuffer";
        req.open("GET", url);
        req.send();
        let model = 0;
        // get shader from requests
        yield promise.then((result) => {
            if (result.status != 200) {
                return null;
            }
            model = loadModel(new Uint8Array(result.response));
        });
        // fall back when request fails
        // todo: error model
        //if (!result) {
        //	console.error(`Failed to load shader ${vs}, ${fs}`);
        //	shader = initShaderProgram(fallbackVSource, fallbackFSource);
        //}
        return model;
    });
}
const magicNumber = 1735152710;
function loadModel(file) {
    // assert magic number
    if (readUInt32(0, file) != magicNumber) {
        return 0;
    }
    console.log('Loaded model');
    return 1;
}
function readUInt32(position, file) {
    let num = 0;
    for (let i = 0; i < 4; i++) {
        num = num << 8;
        num |= file[position + i];
    }
    return num;
}
//# sourceMappingURL=gltfloader.js.map