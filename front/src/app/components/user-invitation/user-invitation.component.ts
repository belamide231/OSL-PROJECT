import { CommonModule,  } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-user-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-invitation.component.html',
  styleUrl: './user-invitation.component.css'
})
export class UserInvitationComponent implements OnInit {
  step: number = 1; // Current step
  firstName: string = '';
  lastName: string = '';
  middleInitial: string = '';
  password: string = '';
  address: string = '';
  contactNumber: string = '';
  email: string | null = null;
  company: string | null = null;

  constructor(private route: ActivatedRoute, private readonly socket: SocketService) {}

  ngOnInit() {
    // Fetch query parameters from the URL
    this.email = this.route.snapshot.queryParamMap.get('email');
    this.company = this.route.snapshot.queryParamMap.get('company');
  }

  goToNextStep() {
    this.step = 2;
  }

  goToPreviousStep() {
    this.step = 1;
  }

  submitForm() {
    console.log('Agent details submitted:', {
      firstName: this.firstName,
      lastName: this.lastName,
      middleInitial: this.middleInitial,
      password: this.password,
      address: this.address,
      contactNumber: this.contactNumber
    });

    alert('Your details have been successfully submitted. Welcome aboard!');
  }
}
