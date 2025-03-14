import { CommonModule, isPlatformServer } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ResizeDirective } from '@home/shared/browser/resize/resize.directive';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';

@Component({
  selector: 'lib-widgets-space-invaders',
  imports: [CommonModule, WidgetComponent, ResizeDirective],
  templateUrl: './space-invaders.component.html',
  styleUrl: './space-invaders.component.scss',
})
export default class SpaceInvadersComponent extends AbstractWidgetComponent implements AfterViewInit, OnDestroy {
  gameCanvas = viewChild<ElementRef<HTMLCanvasElement>>('gameCanvas');
  private ctx = computed<CanvasRenderingContext2D | undefined>(() => {
    if (isPlatformServer(this.platformId)) return undefined;
    const canvas = this.gameCanvas();
    if (!canvas) return undefined;
    return canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
  });

  id = signal('space-invaders');
  playerPosition = { x: 200, y: 450 };
  bullets: any[] = [];
  enemies: any[] = [];
  animationFrame?: number;
  enemiesDirectionY = 1;
  enemiesDirectionX = 1;
  playerMoving: 'left' | 'right' | 'no' = 'no';

  canShoot = true;
  canvasWidth = 400;
  canvasHeight = 500;

  ngAfterViewInit() {
    if (isPlatformServer(this.platformId)) return undefined;
    this.spawnEnemies();
    this.updatePlayerPositionOnResize();
    this.tick();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  onResize($event: DOMRect) {
    this.canvasWidth = $event.width;
    this.canvasHeight = $event.height;
    this.updatePlayerPositionOnResize();
  }

  updatePlayerPositionOnResize() {
    this.playerPosition.y = this.canvasHeight - 50;
  }

  tick(time = 0) {
    this.updateBullets();
    this.updateEnemies();
    this.checkCollisions();
    this.renderGame();
    this.animationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  updateBullets() {
    this.bullets = this.bullets.map((bullet) => ({ ...bullet, y: bullet.y - 5 }));
  }

  updateEnemies() {
    let changeDirectionX = false;
    let newDirectionX = this.enemiesDirectionX;
    this.enemies = this.enemies.map((enemy) => {
      const newY = enemy.y + this.enemiesDirectionY;
      const newX = enemy.x + this.enemiesDirectionX;
      if (newY >= this.playerPosition.y || newY <= 50) {
        this.enemiesDirectionY *= -1;
      }
      if (newX >= this.canvasWidth - 30) {
        changeDirectionX = true;
        newDirectionX = -1;
      } else if (newX <= 0) {
        changeDirectionX = true;
        newDirectionX = 1;
      }
      return { ...enemy, y: newY, x: newX };
    });
    if (changeDirectionX) {
      this.enemiesDirectionX = newDirectionX;
    }
  }

  checkCollisions() {
    this.bullets.forEach((bullet, bulletIndex) => {
      this.enemies.forEach((enemy, enemyIndex) => {
        if (bullet.x < enemy.x + 30 && bullet.x + 5 > enemy.x && bullet.y < enemy.y + 30 && bullet.y + 10 > enemy.y) {
          this.bullets.splice(bulletIndex, 1);
          this.enemies.splice(enemyIndex, 1);
        }
      });
    });
  }

  spawnEnemies() {
    const rows = 3;
    const enemiesPerRow = 5;
    const gap = 80;
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < enemiesPerRow; i++) {
        this.enemies.push({ x: i * gap, y: 50 + row * gap });
      }
    }
  }

  renderGame() {
    const ctx = this.ctx();
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(this.playerPosition.x, this.playerPosition.y, 30, 30);

    ctx.fillStyle = 'red';
    this.bullets.forEach((bullet) => {
      ctx.fillRect(bullet.x, bullet.y, 5, 10);
    });

    ctx.fillStyle = 'blue';
    this.enemies.forEach((enemy) => {
      ctx.fillRect(enemy.x, enemy.y, 30, 30);
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.playerMoving = 'left';
        break;
      case 'ArrowRight':
        this.playerMoving = 'right';
        break;
      case ' ':
        if (this.canShoot) {
          this.shoot();
          this.canShoot = false;
        }
        break;
    }
    this.updatePlayerPosition();
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.key.startsWith('Arrow')) {
      this.playerMoving = 'no';
    }
    if (event.key === ' ') {
      this.canShoot = true;
    }
  }

  updatePlayerPosition() {
    if (this.playerMoving === 'left' && this.playerPosition.x > 0) {
      this.playerPosition.x -= 10;
    }
    if (this.playerMoving === 'right' && this.playerPosition.x < this.canvasWidth - 30) {
      this.playerPosition.x += 10;
    }
  }

  shoot() {
    this.bullets.push({ x: this.playerPosition.x + 15, y: this.playerPosition.y });
  }
}
