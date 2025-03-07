import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ResizeDirective } from '../../../shared/size/resize.directive';
import { Debouncer } from '../../../shared/utils/function';
import { AbstractWidgetComponent } from '../../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../../shared/widget/widget.component';
import triangleShader from './triangle.wgsl';

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
export default class WebGpuComponent extends AbstractWidgetComponent {
  private readonly el = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  id = signal('webgpu');

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('playfield');
  canvasEl = computed<HTMLCanvasElement>(
    () => this.canvas()?.nativeElement ?? (this.document.querySelector('canvas') as HTMLCanvasElement),
  );

  // Size of the canvas
  rect = signal<DOMRect>({ width: 0, height: 0 } as DOMRect);
  width = computed(() => this.rect()?.width ?? 0);
  height = computed(() => this.rect()?.height ?? 0);

  onResize(size: DOMRect) {
    this.rect.set(size);

    if (isPlatformBrowser(this.platformId) && size.width > 0 && size.height > 0) {
      this.render();
    }
  }

  @Debouncer()
  async render() {
    // Check if WebGPU is supported (it is definaltely not supported when running on SSR)
    // and try to initialize the context
    if (isPlatformBrowser(this.platformId)) {
      try {
        const ctx = this.canvasEl()?.getContext('webgpu');
        if (ctx && 'gpu' in navigator) {
          const adapter = await navigator.gpu?.requestAdapter();
          const device = await adapter?.requestDevice();
          if (!device) throw new Error('No GPU device found');

          const format = navigator.gpu.getPreferredCanvasFormat();
          ctx.configure({ device, format });

          const module: GPUShaderModule = device.createShaderModule({
            label: 'our hardcoded red triangle shaders',
            code: triangleShader,
          });
          const pipeline: GPURenderPipeline = device.createRenderPipeline({
            label: 'our hardcoded red triangle pipeline',
            layout: 'auto',
            vertex: {
              entryPoint: 'vertex_shader',
              module,
            },
            fragment: {
              entryPoint: 'fragment_shader',
              module,
              targets: [{ format }],
            },
          });
          // Get the current texture from the canvas context
          const view = ctx.getCurrentTexture().createView();
          const renderPassDescriptor: GPURenderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
              {
                view,
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          };
          // make a command encoder to start encoding commands
          const encoder = device.createCommandEncoder({ label: 'our encoder' });

          // make a render pass encoder to encode render specific commands
          const pass = encoder.beginRenderPass(renderPassDescriptor);
          pass.setPipeline(pipeline);
          pass.draw(3); // call our vertex shader 3 times
          pass.end();

          const commandBuffer = encoder.finish();
          device.queue.submit([commandBuffer]);
        } else {
          console.error('WebGPU not supported');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
