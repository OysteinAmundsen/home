import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { ChatService } from './chat.service';

@Component({
  selector: 'lib-chat',
  imports: [CommonModule, ReactiveFormsModule, WidgetComponent, MarkdownPipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export default class ChatComponent extends AbstractWidgetComponent {
  private readonly chatService = inject(ChatService);

  id = signal('chat');
  form = viewChild<ElementRef<HTMLFormElement>>('form');
  chatwindow = viewChild<ElementRef<HTMLDivElement>>('chatwindow');

  selectedModel = this.chatService.selectedModel;
  progressText = this.chatService.progressText;
  isInitialized = this.chatService.isInitialized;

  userPrompt = new FormControl('');

  messages = this.chatService.chatHistory;
  filteredMessages = computed(() => this.messages().filter((message) => ['assistant', 'user'].includes(message.role)));
  onMessage = effect(() => {
    const messages = this.filteredMessages();
    const window = this.chatwindow()?.nativeElement;
    if (window) {
      window.scrollTop = window.scrollHeight;
    }
  });

  // Submit on enter
  maybeSendMessage($event: KeyboardEvent) {
    if ($event.key === 'Enter' && !$event.shiftKey && this.isInitialized()) {
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
    this.userPrompt.disable();
    const reply = await this.chatService.sendMessage(`${message}`);
    this.userPrompt.enable();
  }
}
