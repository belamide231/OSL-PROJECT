import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; 
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Include HttpClient
import { ChatWidgetComponent } from './app/chat-widget/chat-widget.component';

bootstrapApplication(AppComponent,{
  providers: [
    provideRouter(routes), // Register your routes here
    provideHttpClient(), provideAnimationsAsync(),       // Register HttpClient
  ],
})
  .catch((err) => console.error(err));
  // Ensure DOMContentLoaded only applies this logic when the widget is embedded


// Ensure DOMContentLoaded only applies this logic when the widget is embedded
document.addEventListener('DOMContentLoaded', () => {
  // Check if the chat widget container already exists to avoid duplication
  if (!document.getElementById('chat-widget-container')) {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-widget-container';
    document.body.appendChild(chatContainer);
  }
});
