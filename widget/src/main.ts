import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(HttpClientModule)] // ✅ Ensure global availability
});


//platformBrowserDynamic().bootstrapModule(AppComponent, {
//  providers: [importProvidersFrom(HttpClientModule)];
//})