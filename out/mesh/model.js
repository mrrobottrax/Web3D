import { quaternion, vec3 } from "../math/vector.js";
import { Mesh } from "./mesh.js";
export class Model {
    constructor() {
        this.position = new vec3(0, 0, 0);
        this.scale = new vec3(1, 1, 1);
        this.rotation = new quaternion(1, 0, 0, 0);
        this.mesh = new Mesh();
    }
}
//# sourceMappingURL=model.js.map