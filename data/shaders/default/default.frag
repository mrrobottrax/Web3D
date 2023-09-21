precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main() {
  gl_FragColor = vec4(vTexCoord.x, vTexCoord.y, 0, 1);
}