precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor * texture2D(uSampler, vTexCoord);

  if(gl_FragColor.a < 0.9)
    discard;
}