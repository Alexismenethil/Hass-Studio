"use client";
import { getImageProps } from "next/image";
import { isVideo } from "@/lib/content";

export const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/** Shared GLSL: value noise, fbm and "object-fit: cover" for textures. */
export const COMMON = `
precision highp float;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.03;
    a *= 0.5;
  }
  return v;
}
vec2 cover(vec2 uv, vec2 res, vec2 img) {
  float rs = res.x / res.y;
  float ri = img.x / max(img.y, 1.0);
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}
`;

export type Texture = {
  handle: WebGLTexture;
  width: number;
  height: number;
  ready: boolean;
  video?: HTMLVideoElement;
};

export function createRenderer(canvas: HTMLCanvasElement, fragment: string) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, COMMON + fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const locations = new Map<string, WebGLUniformLocation | null>();
  const uniform = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  };

  const textures: Texture[] = [];
  const texture = (src: string, onReady?: () => void): Texture => {
    const handle = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 22, 18, 255]));
    for (const [key, value] of [
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    ])
      gl.texParameteri(gl.TEXTURE_2D, key, value);
    const tex: Texture = { handle, width: 1, height: 1, ready: false };
    textures.push(tex);
    const upload = (source: TexImageSource, w: number, h: number) => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, handle);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        tex.width = w;
        tex.height = h;
        if (!tex.ready) {
          tex.ready = true;
          onReady?.();
        }
      } catch {
        /* Cross-origin media without CORS stays on the DOM fallback. */
      }
    };
    if (!src) return tex;
    if (isVideo(src)) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = src;
      tex.video = video;
      video.addEventListener("loadeddata", () => upload(video, video.videoWidth, video.videoHeight));
      (tex as Texture & { refresh: () => void }).refresh = () => {
        if (video.readyState >= 2) upload(video, video.videoWidth, video.videoHeight);
      };
    } else {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => upload(image, image.naturalWidth, image.naturalHeight);
      image.src = optimized(src);
    }
    return tex;
  };

  const refresh = (tex: Texture) => (tex as Texture & { refresh?: () => void }).refresh?.();

  const resize = (scale: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, scale);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    return [w, h] as const;
  };

  const bind = (unit: number, tex: Texture, name: string) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex.handle);
    gl.uniform1i(uniform(name), unit);
  };

  return {
    gl,
    uniform,
    texture,
    refresh,
    resize,
    bind,
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 6),
    // Free GPU memory but keep the context: the same canvas can be mounted again.
    destroy: () => {
      textures.forEach((tex) => {
        tex.video?.pause();
        tex.video?.removeAttribute("src");
        gl.deleteTexture(tex.handle);
      });
      textures.length = 0;
      gl.deleteBuffer(buffer);
    },
  };
}

/** Same-origin, resized image URL so textures stay light and CORS-free. */
export const optimized = (src: string) =>
  src.startsWith("/_next/")
    ? src
    : getImageProps({ src, alt: "", width: 1000, height: 640, quality: 75 }).props.src;
