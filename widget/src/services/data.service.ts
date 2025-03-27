import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService { 

  
  private activeAccountsContainer: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public activeAccountsObserver = this.activeAccountsContainer.asObservable();

  private selectedClientContainer: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public selectedClientObserver = this.selectedClientContainer.asObservable();

  private pageContainer: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public pageObserver = this.pageContainer.asObservable();

  constructor(private api: ApiService, private socket: SocketService) {}


  public getCompanyThemeForUnauthenticatedUsersData = (address: { country: string, city: string, street: string } | {}): Observable<string> => {
    return this.api.getCompanyThemeForUnauthenticatedUsersApi(address).pipe(
      map((response: number | { primary_color: string, secondary_color: string, whites_color: string }) => {

        if(typeof response === 'number') {
          return response.toString();
        }

        Object.keys(response).forEach((key) => {
          document.documentElement.style.setProperty('--' + key, (response as any)[key]);          
        });

        return 'home';
      })
    );
  }


  public getAvailableAccountsInASpecificCompanyData = () => {

    this.api.getAvailableAccountsInASpecificCompanyApi().subscribe((response: any): void => {

      if(typeof response === 'number') {
        return;
      } 

      this.activeAccountsContainer.next(response);
    });
  }


  public changePage = (page: string) => {
    this.pageContainer.next(page);
  }
}
