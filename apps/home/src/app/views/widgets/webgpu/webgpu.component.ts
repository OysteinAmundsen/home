import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { ResizeDirective } from '../../../shared/browser/resize/resize.directive';
import { ThemeService } from '../../../shared/browser/theme/theme.service';
import { premultiplyAlpha, setAlpha } from '../../../shared/utils/color';
import { AbstractWidgetComponent } from '../../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../../shared/widget/widget.component';
import pyramidShader from './pyramid.wgsl';

/**
 * A "cacth-all" widget to display if a requested widget is not found
 *
 * In order to find a widget, a widget must be registerred in the
 * `widget.routes.ts` file.
 */
@Component({
  selector: 'app-webgpu',
  imports: [WidgetComponent, ResizeDirective],
  template: `
    <app-widget [host]="host()">
      <canvas #playfield [appResize]="'auto'" (resized)="onResize($event)"></canvas>
    </app-widget>
  `,
  styles: `
    :host {
      canvas {
        display: block;
        min-width: 300px;
        width: 100%;
        height: 100%;
      }
    }
  `,
})
export default class WebGpuComponent extends AbstractWidgetComponent implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(ThemeService);
  id = signal('webgpu');

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('playfield');
  canvasEl = computed<HTMLCanvasElement>(
    () => this.canvas()?.nativeElement ?? (this.document.querySelector('canvas') as HTMLCanvasElement),
  );

  // Size of the canvas
  rect = signal<DOMRect>({ width: 0, height: 0 } as DOMRect);
  width = computed(() => this.rect()?.width ?? 0);
  height = computed(() => this.rect()?.height ?? 0);
  backgroundColor = computed(() => {
    const theme = this.theme.selectedTheme();
    const style = getComputedStyle(this.document.body).getPropertyValue('background-color');
    return premultiplyAlpha(setAlpha(style, 0.01));
  });

  onResize(size: DOMRect) {
    this.rect.set(size);
    this.render();
  }
  onThemeChanged = effect(() => {
    const theme = this.theme.selectedTheme();
    this.render();
  });

  ctx!: GPUCanvasContext;
  device!: GPUDevice;
  pipeline!: GPURenderPipeline;
  uniformBuffer!: GPUBuffer;
  vBuffer!: GPUBuffer;
  iBuffer!: GPUBuffer;
  isInitialized = false;
  isInitializing = false;
  animationFrame: number | undefined;

  /**
   * Configure the rendering context
   *
   * This should only run once.
   */
  async configure() {
    if (!(!this.isInitialized && !this.isInitializing && this.width() > 0 && this.height() > 0)) return false;
    this.isInitialized = false;
    this.isInitializing = true;

    // Check if WebGPU is supported (it is definaltely not supported when running on SSR)
    // and try to initialize the context
    const ctx = this.canvasEl()?.getContext('webgpu');
    if (!ctx || !('gpu' in navigator)) throw new Error('WebGPU not supported in this browser');
    this.ctx = ctx;
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) throw new Error('No GPU adapter found');
    const device = await adapter?.requestDevice();
    if (!device) throw new Error('No GPU device found');
    device.lost.then(() => console.error('GPU device lost'));
    this.device = device;

    // Configure the context
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: 'premultiplied' });

    // Configure our shaders
    const module: GPUShaderModule = device.createShaderModule({
      label: 'Pyramid shaders',
      code: pyramidShader,
    });

    // Create buffers
    this.uniformBuffer = this.device.createBuffer({
      size: 144, // 64 bytes for the projection matrix + 64 bytes for the view matrix + 16 bytes for the rotation angles
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Create vector points for the pyramid including lighting normals
    // prettier-ignore
    const vertexData = new Float32Array([
      // Positions (xyz)   // Normals (lighting xyz)
      -0.5, -0.5, -0.5,     -1.0, -1.0, -1.0, // Point 0: Bottom left (side 0)
       0.5, -0.5, -0.5,      1.0, -1.0, -1.0, // Point 1: Bottom right (side 1)
       0.5, -0.5,  0.5,      1.0, -1.0,  1.0, // Point 2: Top right (side 2)
      -0.5, -0.5,  0.5,     -1.0, -1.0,  1.0, // Point 3: Top left (side 3)
       0.0,  0.5,  0.0,      0.0,  1.0,  0.0, // Point 4: Top vertex
    ]);
    this.vBuffer = this.device.createBuffer({
      label: 'Pyramid vertices',
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.vBuffer.getMappedRange()).set(vertexData);
    this.vBuffer.unmap();

    // Create faces for the vector points
    // prettier-ignore
    const indexData = new Uint16Array([
      // Base (two triangles)
      0, 1, 2,
      0, 3, 2,

      // Sides (four triangles)
      0, 1, 4,   // Side 0 (bottom left to bottom right to top)
      1, 2, 4,   // Side 1 (bottom right to top right to top)
      2, 3, 4,   // Side 2 (top right to top left to top)
      3, 0, 4,   // Side 3 (top left to bottom left to top)
    ]);
    this.iBuffer = this.device.createBuffer({
      label: 'Pyramid faces',
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(this.iBuffer.getMappedRange()).set(indexData);
    this.iBuffer.unmap();

    // Configure the pipeline
    this.pipeline = device.createRenderPipeline({
      label: 'Pyramid pipeline',
      layout: 'auto',
      vertex: {
        module,
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
            ],
          },
        ],
      },
      fragment: { module, targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });

    this.isInitializing = false;
    this.isInitialized = true;

    return true;
  }

  async render(time = 1) {
    time *= 0.001;

    // Die if we are not running in the browser or we are still initializing
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isInitializing) return;

    // Configure the context first time we render
    if (!this.isInitialized) {
      const initialized = await this.configure();
      if (!initialized) return;
    }

    // Update rotation angle
    const rotYAngle = time;
    const rotXAngle = time;
    const rotZAngle = time;
    const projectionMatrix = this.createProjectionMatrix();
    const viewMatrix = this.createViewMatrix();
    this.device.queue.writeBuffer(this.uniformBuffer, 0, projectionMatrix);
    this.device.queue.writeBuffer(this.uniformBuffer, 64, viewMatrix);
    this.device.queue.writeBuffer(this.uniformBuffer, 128, new Float32Array([rotYAngle, rotXAngle, rotZAngle, 0]));

    try {
      // make a command encoder to start encoding commands
      const encoder = this.device.createCommandEncoder({ label: 'Pyramid encoder' });

      // make a render pass encoder to encode render specific commands
      const pass = encoder.beginRenderPass({
        label: 'Pyramid renderPass',
        colorAttachments: [
          {
            view: this.ctx.getCurrentTexture().createView(),
            clearValue: this.backgroundColor(),
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      pass.setPipeline(this.pipeline);
      pass.setVertexBuffer(0, this.vBuffer);
      pass.setIndexBuffer(this.iBuffer, 'uint16');
      pass.setBindGroup(
        0,
        this.device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: {
                buffer: this.uniformBuffer,
              },
            },
          ],
        }),
      );
      pass.drawIndexed(18); // 6 base + 12 sides
      pass.end();

      const commandBuffer = encoder.finish();
      this.device.queue.submit([commandBuffer]);

      // request the next frame
      this.animationFrame = requestAnimationFrame(this.render.bind(this));
    } catch (error) {
      console.error(error);
    }
  }

  createProjectionMatrix() {
    const aspect = this.width() / this.height();
    const fov = Math.PI / 4;
    const near = 0.1;
    const far = 100.0;
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0,
    ]);
  }

  createViewMatrix() {
    const eye = [0, 1, 3];
    const center = [0, 0, 0];
    const up = [0, 1, 0];
    const f = this.normalize(this.subtractVectors(center, eye));
    const s = this.normalize(this.cross(f, up));
    const u = this.cross(s, f);

    return new Float32Array([
      s[0],
      u[0],
      -f[0],
      0,
      s[1],
      u[1],
      -f[1],
      0,
      s[2],
      u[2],
      -f[2],
      0,
      -this.dot(s, eye),
      -this.dot(u, eye),
      this.dot(f, eye),
      1,
    ]);
  }

  subtractVectors(a: number[], b: number[]) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  cross(a: number[], b: number[]) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  normalize(v: number[]) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
  }

  dot(a: number[], b: number[]) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}
