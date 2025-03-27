import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './components/chat/chat.component';
import { HomeComponent } from './components/home/home.component';
import { DataService } from '../services/data.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatComponent, HomeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'widget';
  page = '';


  constructor(public data: DataService) {
    this.initializesClientData();
  }


  ngOnInit(): void {
    this.data.pageObserver.subscribe(page => this.page = page);
  }


  public selectAccount = async (selectedAccountId: string) => {
    console.log(selectedAccountId);
  }


  public getAddress = async (): Promise<{ city?: string, country?: string, street?: string }> => {
      
    try {

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
      });
  
      const { latitude, longitude } = position.coords;
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
  
      return {
        city: data.address.city,
        country: data.address.country,
        street: data.address.road
      };
  
    } catch (error) {

      return {};
    } 
  }


  public initializesClientData = async () => {
    const address = await this.getAddress();
    this.data.getCompanyThemeForUnauthenticatedUsersData(address).subscribe((response: string) => this.page = response);
  }
}