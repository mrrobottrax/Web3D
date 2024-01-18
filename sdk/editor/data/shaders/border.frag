precision mediump float;

uniform vec2 uResolution;

varying vec2 vPosition;

const float margin = 10.0;
const float thickness = 2.0;

void main() {
	vec2 pos = vPosition * uResolution;

	float outerX = step(abs(pos.x), uResolution.x - margin);
	float outerY = step(abs(pos.y), uResolution.y - margin);

	float outer = outerX * outerY;

	float innerX = step(uResolution.x - margin - thickness, abs(pos.x));
	float innerY = step(uResolution.y - margin - thickness, abs(pos.y));

	float inner = max(innerX, innerY);

	gl_FragColor = vec4(1.0, 0.0, 0.0, inner * outer);
}