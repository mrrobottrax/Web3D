precision mediump float;

varying vec2 vTexCoord;
varying vec3 vColor;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main() {
	gl_FragColor = uColor * vec4(vColor, 1) * texture2D(uSampler, vTexCoord);
}