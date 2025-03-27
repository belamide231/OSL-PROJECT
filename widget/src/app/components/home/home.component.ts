import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {


  public activeAccountsData: null | { id: { name: string } } = null;
  public activeAccountsDataTest: { [key:string]: { name: string } } = {
    '1': {
      name: 'Timoy Titoy'
    }
  };
  public listOfKeyOf = (data: any): string[] => {
    return Object.keys(data);
  }


  constructor(private data: DataService) {
    data.getAvailableAccountsInASpecificCompanyData();
  }


  ngOnInit(): void {
    this.data.activeAccountsObserver.subscribe(activeAccountsData => this.activeAccountsData = activeAccountsData);
  }
}
