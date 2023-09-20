var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initGl } from "./gl.js";
import { loadModelFromWeb } from "./gltfloader.js";
import { drawFrame, drawInit } from "./render.js";
import { updateTime } from "./time.js";
let running = false;
main();
function exit() {
    running = false;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        drawInit();
        running = true;
        window.requestAnimationFrame(gameLoop);
        loadModelFromWeb("./data/models/cube.glb");
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initGl();
    });
}
function gameLoop() {
    if (!running)
        return;
    window.requestAnimationFrame(gameLoop);
    updateTime();
    drawFrame();
}
//# sourceMappingURL=main.js.map