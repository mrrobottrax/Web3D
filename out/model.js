import { quaternion, vec3 } from "./vector.js";
export class Model {
    constructor() {
        this.position = new vec3(0, 0, 0);
        this.scale = new vec3(1, 1, 1);
        this.rotation = new quaternion(1, 0, 0, 0);
        this.verts = [];
        this.elements = [];
    }
}
//# sourceMappingURL=model.js.map