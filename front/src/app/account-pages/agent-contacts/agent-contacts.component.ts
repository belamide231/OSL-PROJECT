import { Component } from '@angular/core';
import { aSidebarComponent } from "../sidebar/sidebar.component";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-agent-contacts',
  standalone: true,
  imports: [aSidebarComponent, CommonModule],
  templateUrl: './agent-contacts.component.html',
  styleUrl: './agent-contacts.component.css'
})
export class AgentContactsComponent {
  constructor(
    private router: Router) {}

  contacts = [
    { name: 'John Doe', status: 'Online', avatar: 'assets/avatars/john.jpg', id: 1 },
    { name: 'Jane Smith', status: 'Away', avatar: 'assets/avatars/jane.jpg', id: 2 },
    { name: 'Mark Brown', status: 'Busy', avatar: 'assets/avatars/mark.jpg', id: 3 },
    { name: 'Lisa White', status: 'Offline', avatar: 'assets/avatars/lisa.jpg', id: 4 }
  ];

  filteredContacts = [...this.contacts];

  ngOnInit(): void {}

  filterContacts(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredContacts = this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm)
    );
  }

  openChat(contact: any) {
    this.router.navigate(['/achat', contact.id]);
  }

}
