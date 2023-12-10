precision mediump float;

varying vec2 position;

const float margin = 0.015;
const float thickness = 0.005;

void main() {
	float a = step(abs(position.x), 1.0 - margin);
	float b = step(abs(position.y), 1.0 - margin);

	float m = a * b;

	float c = step(1.0 - thickness - margin, abs(position.x));
	float d = step(1.0 - thickness - margin, abs(position.y));

	float n = max(c, d);

	float x = m * n;

	if(x <= 0.0)
		discard;

	gl_FragColor = vec4(x, 0, 0, 1.0);
}