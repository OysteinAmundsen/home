import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';
import { SpinnerComponent } from '@home/shared/ux/spinner/spinner.component';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { map, Observable, switchMap, timer } from 'rxjs';
import { ChatService } from './chat.service';

@Component({
  selector: 'lib-chat',
  imports: [CommonModule, ReactiveFormsModule, WidgetComponent, MarkdownPipe, SpinnerComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export default class ChatComponent extends AbstractWidgetComponent implements OnInit {
  private readonly chatService = inject(ChatService);

  id = signal('chat');
  chatBox = viewChild<ElementRef<HTMLTextAreaElement>>('chatBox');
  chatwindow = viewChild<ElementRef<HTMLDivElement>>('chatwindow');

  selectedModel = this.chatService.selectedModel;
  progressText = this.chatService.progressText;
  isInitialized = this.chatService.isInitialized;
  sysInfo = this.chatService.systemInfo;

  private now$: Observable<number> = timer(1000 - new Date().getMilliseconds(), 1000).pipe(
    switchMap(() => timer(0, 1000)),
    map(() => Date.now()),
  );
  // The current time as a signal
  now = toSignal(this.now$, { initialValue: Date.now() });

  userPrompt = new FormControl('');

  welcomeMessage = `### WebLLM experiment.

  Loads and runs entirely in the client. May have implications on memory and performance depending on selected model.
  > '${this.selectedModel()}'`;

  status = this.chatService.status;
  messages = this.chatService.chatHistory;
  filteredMessages = computed(() => this.messages().filter((message) => ['assistant', 'user'].includes(message.role)));
  onMessage = effect(() => {
    const messages = this.filteredMessages();
    this.autoScroll();
  });

  async ngOnInit() {
    await this.chatService.loadModel();
    await this.chatService.resetChat();
    if (isPlatformBrowser(this.platformId)) {
      this.autoScroll();
      this.autoFocus();
    }
  }

  autoScroll() {
    const window = this.chatwindow()?.nativeElement;
    if (window) {
      window.scrollTop = window.scrollHeight;
    }
  }

  autoFocus() {
    this.chatBox()?.nativeElement.focus();
    this.chatBox()?.nativeElement.click();
  }

  // Submit on enter
  maybeSendMessage($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      $event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage($event?: SubmitEvent) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }

    // Update chat history
    const message = this.userPrompt.getRawValue();
    this.userPrompt.setValue('');
    const reply = await this.chatService.sendMessage(`${message}`);
    this.autoFocus();
  }
}
