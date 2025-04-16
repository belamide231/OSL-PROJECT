
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './user-manage.component.html',
  styleUrls: ['./user-manage.component.css'],
})
export class UserManageComponent {
  constructor(
    private readonly api: ApiService,
    public readonly data: DataService) {}
  showModal = false;
  gmail = '';

  ngOnInit(): void {
    this.userAccountList();
  }

  public userInvite(): void {
    this.api.userInvite(this.gmail).subscribe(status => {
      alert(({
        200: 'Successfully emailed the recepient',
        403: 'Email did not exists',
        500: 'Something went wrong to the server'
      } as any)[status]);
      this.gmail = '';
      this.showModal = false;
    })
  }
  public userAccountList(): void {
    // this.api.userAccountList().subscribe(response => {
    //   if(typeof response !== 'number' && isNaN(response)) {
    //     this.listOfAgents = JSON.parse(response).result;
    //   }
    // });
    this.api.userAccountList();
  }
}
