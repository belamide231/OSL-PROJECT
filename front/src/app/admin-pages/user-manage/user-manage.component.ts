
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-user-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './user-manage.component.html',
  styleUrls: ['./user-manage.component.css'],
})
export class UserManageComponent {
  constructor(private readonly api: ApiService, public readonly data: DataService) {}

  agents = [
    { name: 'John Doe', email: 'john.doe@example.com', phone: '1234567890', company: 'Ibcauto' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '9876543210', company: 'Jet' },
  ];

  showModal = false;
  gmail = '';

  openInviteModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.gmail = '';
  }

  sendInvitation() {
    this.data.user.api.invite(this.gmail).subscribe(status => {
      if(status) {
        this.gmail = '';
        this.showModal = false;    
      } else {
        alert(status);
      }
    });
  }
}
