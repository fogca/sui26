// A drifting colour field. Used both as the site surface (src/lib/ii/Surface.svelte)
// and by the /lab/field studies page.
//
// The reference images are photographs thrown far out of focus: large, soft,
// folded planes of colour with no edge anywhere. That shape comes from domain
// warping — sampling a noise field at coordinates that have themselves been
// displaced by another noise field (Quílez). Two warp passes give the folds;
// a low frequency keeps them large and calm rather than busy.
//
// Everything that distinguishes one study from another is a uniform, so the
// five of them share one compiled program.

export const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform float u_scale;   // field frequency — lower is larger, softer shapes
uniform float u_warp;    // how far the coordinates are displaced
uniform vec2 u_drift;    // direction the field travels, per second
uniform float u_tilt;    // rotation of the whole field, radians
uniform float u_contrast;
uniform float u_sweep;   // how much of the result is a plain directional ramp
uniform float u_zoom;    // magnify the shapes without changing their character
uniform float u_bias;    // push the whole field up or down the palette

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
	// Gain 0.42 rather than the usual 0.5: the later octaves are what read as
	// wispy filigree, and the references have none of it — they are a lens
	// well out of focus, two or three large shapes and nothing finer.
	float v = 0.0;
	float a = 0.58;
	float sum = 0.0;
	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
	for (int i = 0; i < 4; i++) {
		v += a * vnoise(p);
		sum += a;
		p = m * p;
		a *= 0.42;
	}
	// Averaging octaves pulls the result into a narrow band around the middle,
	// so without normalising, the contrast term below works on a fraction of
	// the range it looks like it does and every palette washes out to its
	// second colour.
	return v / sum;
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_res;

	// keep the shapes un-stretched whatever the panel's aspect
	vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
	float s = sin(u_tilt);
	float c = cos(u_tilt);
	p = mat2(c, -s, s, c) * p;
	p *= u_scale / u_zoom;
	p += u_drift * u_time;

	// two warp passes: q folds the plane, r folds the folds
	vec2 q = vec2(
		fbm(p + vec2(0.0, 0.0) + u_time * 0.035),
		fbm(p + vec2(5.2, 1.3) - u_time * 0.028)
	);
	vec2 r = vec2(
		fbm(p + u_warp * q + vec2(1.7, 9.2) + u_time * 0.021),
		fbm(p + u_warp * q + vec2(8.3, 2.8) - u_time * 0.017)
	);
	float f = fbm(p + u_warp * r);

	// A long gradient across the panel, in the same direction the field is
	// tilted. The folds then ride on top of it, which is what gives the
	// references their one-side-pale, one-side-deep reading.
	vec2 dir = vec2(cos(u_tilt), sin(u_tilt));
	float ramp = clamp(dot(uv - 0.5, dir) + 0.5, 0.0, 1.0);
	f = mix(f, ramp, u_sweep);

	f = clamp((f - 0.5) * u_contrast + 0.5 + u_bias, 0.0, 1.0);

	vec3 col = mix(u_c0, u_c1, smoothstep(0.00, 0.45, f));
	col = mix(col, u_c2, smoothstep(0.38, 0.78, f));
	col = mix(col, u_c3, smoothstep(0.70, 1.00, f));

	// the references all carry a faint fall-off, the way a lens does
	col *= 0.965 + 0.045 * (1.0 - uv.y);

	// Pale gradients band badly on 8-bit displays — a sub-LSB dither costs
	// nothing and removes every ring.
	float d = (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
	gl_FragColor = vec4(col + d, 1.0);
}
`;

const hex = (h) => {
	const n = parseInt(h.slice(1), 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/**
 * Compile the program and return a renderer. `renderAt(seconds)` draws one
 * frame for a given point in the field's own time, which is what makes a
 * deterministic screenshot possible — nothing here reads the wall clock.
 */
export function createField(canvas, study) {
	const gl =
		canvas.getContext('webgl', { antialias: false, alpha: false, depth: false }) ||
		canvas.getContext('experimental-webgl');
	if (!gl) return null;

	const compile = (type, src) => {
		const sh = gl.createShader(type);
		gl.shaderSource(sh, src);
		gl.compileShader(sh);
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(sh));
			return null;
		}
		return sh;
	};

	const vs = compile(gl.VERTEX_SHADER, VERT);
	const fs = compile(gl.FRAGMENT_SHADER, FRAG);
	if (!vs || !fs) return null;

	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(prog));
		return null;
	}
	gl.useProgram(prog);

	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(prog, 'a_pos');
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

	const u = (n) => gl.getUniformLocation(prog, n);
	const U = {
		res: u('u_res'),
		time: u('u_time'),
		c0: u('u_c0'),
		c1: u('u_c1'),
		c2: u('u_c2'),
		c3: u('u_c3'),
		scale: u('u_scale'),
		warp: u('u_warp'),
		drift: u('u_drift'),
		tilt: u('u_tilt'),
		contrast: u('u_contrast'),
		sweep: u('u_sweep'),
		zoom: u('u_zoom'),
		bias: u('u_bias')
	};

	gl.uniform3fv(U.c0, hex(study.colors[0]));
	gl.uniform3fv(U.c1, hex(study.colors[1]));
	gl.uniform3fv(U.c2, hex(study.colors[2]));
	gl.uniform3fv(U.c3, hex(study.colors[3]));
	gl.uniform1f(U.scale, study.scale);
	gl.uniform1f(U.warp, study.warp);
	gl.uniform2fv(U.drift, study.drift);
	gl.uniform1f(U.tilt, study.tilt);
	gl.uniform1f(U.contrast, study.contrast);
	gl.uniform1f(U.sweep, study.sweep);
	// Defaulted so the five lab studies render exactly as they did before these
	// two uniforms existed.
	gl.uniform1f(U.zoom, study.zoom == null ? 1.0 : study.zoom);
	gl.uniform1f(U.bias, study.bias == null ? 0.0 : study.bias);

	let w = 0;
	let h = 0;

	function resize(cssW, cssH, dpr) {
		const nw = Math.max(1, Math.round(cssW * dpr));
		const nh = Math.max(1, Math.round(cssH * dpr));
		if (nw === w && nh === h) return;
		w = nw;
		h = nh;
		canvas.width = w;
		canvas.height = h;
		gl.viewport(0, 0, w, h);
		gl.uniform2f(U.res, w, h);
	}

	function renderAt(seconds) {
		gl.uniform1f(U.time, seconds * study.speed);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	function destroy() {
		gl.deleteProgram(prog);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		gl.deleteBuffer(buf);
		const ext = gl.getExtension('WEBGL_lose_context');
		if (ext) ext.loseContext();
	}

	return { resize, renderAt, destroy };
}
