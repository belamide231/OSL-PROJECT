
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-user-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './user-manage.component.html',
  styleUrls: ['./user-manage.component.css'],
})
export class UserManageComponent {
  constructor(private readonly socket: SocketService) {}

  agents = [
    { name: 'John Doe', email: 'john.doe@example.com', phone: '1234567890', company: 'Ibcauto' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '9876543210', company: 'Jet' },
  ];

  showModal = false;
  newAgent = {
    name: '',
    email: '',
    phone: '',
    company: '',
  };

  openInviteModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.newAgent = { name: '', email: '', phone: '', company: '' };
  }

  sendInvitation() {
    // Generate a unique invitation link
    const baseUrl = window.location.origin; // Gets the current app base URL
    const invitationLink = `${baseUrl}/user-invite?email=${encodeURIComponent(
      this.newAgent.email
    )}&company=${encodeURIComponent(this.newAgent.company)}`;

    console.log('Generated Invitation Link:', invitationLink);

    // Show the invitation link or send it to the agent via email
    alert(`Invitation link generated: ${invitationLink}`);

    // Optionally, close the modal after sending the invitation
    this.closeModal();
  }
}
