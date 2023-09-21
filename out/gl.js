var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export let glProperties = {
    width: 0,
    height: 0
};
export let gl;
export let fallbackShader = {
    program: null,
    modelViewMatrixUnif: null,
    projectionMatrixUnif: null
};
export let spriteShader = {
    program: null,
    modelViewMatrixUnif: null,
    projectionMatrixUnif: null,
    samplerUnif: null,
    colorUnif: null
};
export let defaultShader = {
    program: null,
    modelViewMatrixUnif: null,
    samplerUnif: null,
    projectionMatrixUnif: null
};
// ~~~~~~~~~~~~~ default / fallbacks ~~~~~~~~~~~~~~
let solidTex;
// vertex shader program
const fallbackVSource = `
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;
// fragment shader program
const fallbackFSource = `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`;
// ~~~~~~~~~~~~~ init ~~~~~~~~~~~~~~
export function initGl() {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.querySelector("#game");
        if (!canvas) {
            console.error("Could not find canvas");
            return;
        }
        glProperties.width = canvas.width;
        glProperties.height = canvas.height;
        // initialize the GL context
        const _gl = canvas.getContext("webgl2", {
            antialias: true,
            alpha: false,
        });
        // only continue if WebGL is available and working
        if (!_gl) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        // initialize gl context
        gl = _gl;
        gl.clearColor(0.25, 0.25, 0.25, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // create fallback program
        const fallbackProgram = initShaderProgram(fallbackVSource, fallbackFSource);
        if (!fallbackProgram) {
            console.error("Failed to init fallback shader");
            return;
        }
        fallbackShader.program = fallbackProgram;
        defaultShader.program = fallbackShader.program;
        spriteShader.program = fallbackShader.program;
        // create default solid texture
        createSolidTexture();
        // create remaining shader programs
        yield Promise.all([
            initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag"),
            initProgramFromWeb("data/shaders/sprite/sprite.vert", "data/shaders/sprite/sprite.frag"),
        ]).then((results) => {
            defaultShader.program = results[0];
            spriteShader.program = results[1];
        });
        // get shader locations
        fallbackShader.modelViewMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uModelViewMatrix");
        fallbackShader.projectionMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uProjectionMatrix");
        defaultShader.modelViewMatrixUnif = gl.getUniformLocation(defaultShader.program, "uModelViewMatrix");
        defaultShader.projectionMatrixUnif = gl.getUniformLocation(defaultShader.program, "uProjectionMatrix");
        spriteShader.samplerUnif = gl.getUniformLocation(defaultShader.program, "uSampler");
        spriteShader.modelViewMatrixUnif = gl.getUniformLocation(spriteShader.program, "uModelViewMatrix");
        spriteShader.projectionMatrixUnif = gl.getUniformLocation(spriteShader.program, "uProjectionMatrix");
        spriteShader.samplerUnif = gl.getUniformLocation(spriteShader.program, "uSampler");
        spriteShader.colorUnif = gl.getUniformLocation(spriteShader.program, "uColor");
    });
}
// ~~~~~~~~~~~~~ load shader program from web urls ~~~~~~~~~~~~~~
function initProgramFromWeb(vs, fs) {
    return __awaiter(this, void 0, void 0, function* () {
        // send requests
        const reqV = new XMLHttpRequest();
        const reqF = new XMLHttpRequest();
        const promiseV = new Promise((resolve) => {
            reqV.addEventListener("load", function () { resolve(this); });
        });
        const promiseF = new Promise((resolve) => {
            reqF.addEventListener("load", function () { resolve(this); });
        });
        reqV.open("GET", vs);
        reqF.open("GET", fs);
        reqV.send();
        reqF.send();
        var shader = null;
        // get shader from requests
        yield Promise.all([promiseV, promiseF]).then((results) => {
            if (results[0].status != 200 || results[1].status != 200) {
                return null;
            }
            shader = initShaderProgram(results[0].responseText, results[1].responseText);
        });
        // fall back when request fails
        if (!shader) {
            console.error(`Failed to load shader ${vs}, ${fs}`);
            shader = initShaderProgram(fallbackVSource, fallbackFSource);
        }
        return shader;
    });
}
// ~~~~~~~~~~~~~ create shader program ~~~~~~~~~~~~~~
function initShaderProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader)
        return null;
    // create the shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram)
        return null;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.bindAttribLocation(shaderProgram, 0, "aVertexPosition");
    gl.bindAttribLocation(shaderProgram, 1, "aTexCoord");
    gl.linkProgram(shaderProgram);
    // if creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
}
// ~~~~~~~~~~~~~ load shader from text ~~~~~~~~~~~~~~
function loadShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error("Failed to create shader");
        return null;
    }
    // send the source to the shader object
    gl.shaderSource(shader, source);
    // compile the shader program
    gl.compileShader(shader);
    // see if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
// ~~~~~~~~~~~~~ default solid texture ~~~~~~~~~~~~~~
function createSolidTexture() {
    // create texture
    solidTex = gl.createTexture();
    if (!solidTex) {
        console.error("Failed to create solid texture");
        return;
    }
    // set texture properties
    gl.bindTexture(gl.TEXTURE_2D, solidTex);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    // generate texture
    const pixel = new Uint8Array([255, 255, 255, 255]); // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
// ~~~~~~~~~~~~~ load a texture from url ~~~~~~~~~~~~~~
export function loadTexture(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // create texture
        const texture = gl.createTexture();
        if (!texture) {
            console.error("Failed to create texture: " + url);
            return null;
        }
        // set to fallback texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 0, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 1, 1, border, srcFormat, srcType, pixel);
        // replace when texture loads
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            // power of 2 textures require special treatment
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        image.src = url;
        return texture;
    });
}
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}
//# sourceMappingURL=gl.js.map