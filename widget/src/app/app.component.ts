import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './socket.service';
import { ApiService } from './api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  title = 'widget';

  initialSectionHeight: number = 0;
  initialTextareaHeight: number = 0;
  initialLabelHeight: number = 0;
  previousScrollHeight: number = 0;
  @ViewChild('section') section!: ElementRef<HTMLDivElement>;
  @ViewChild('label') label!: ElementRef<HTMLLabelElement>;
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  constructor(private socket: SocketService, private api: ApiService) {}

  ngAfterViewInit(): void {
    
    this.initialSectionHeight = this.section.nativeElement.clientHeight;
    this.initialLabelHeight = this.label.nativeElement.clientHeight;
    this.initialTextareaHeight = this.textarea.nativeElement.clientHeight;
    this.previousScrollHeight = this.textarea.nativeElement.clientHeight;

    if(this.textarea && this.label) {

      this.textarea.nativeElement.addEventListener('input', () => {
        const section = this.section.nativeElement;
        const label = this.label.nativeElement;
        const textarea = this.textarea.nativeElement;

        textarea.style.height = 'fit-content';

        if(textarea.scrollHeight >= 144) {
          section.style.height = `${(this.initialSectionHeight + this.initialTextareaHeight + 2) - 144}px`
          label.style.height = `${(this.initialLabelHeight - this.initialTextareaHeight) + 144}px`;  
          textarea.style.height = `${144}px`;
          textarea.style.overflowY = 'auto';
        } else {
          section.style.height = `${(this.initialSectionHeight + this.initialTextareaHeight + 1) - textarea.scrollHeight}px`
          label.style.height = `${(this.initialLabelHeight - this.initialTextareaHeight + 2) + textarea.scrollHeight}px`;  
          textarea.style.height = `${textarea.scrollHeight}px`;
          textarea.style.overflowY = 'hidden';
        }
      });
    }
  }
}
