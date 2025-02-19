import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  // User credentials with userTypes (Admin or Agent)
  // private credentials: { [key: string]: { username: string; password: string; userType: string } } = {
  //   IBCAdmin: { username: 'IBCadmin', password: 'IBCadmin', userType: 'Admin' },
  //   IBCAgent: { username: 'IBCAgent', password: 'IBCAgent', userType: 'Agent' },
    
  //   JetAdmin: { username: 'Jetadmin', password: 'Jetadmin', userType: 'Admin' },
  //   JetAgent: { username: 'JetAgent', password: 'JetAgent', userType: 'Agent' },
    
  //   GisAdmin: { username: 'Gisadmin', password: 'Gisadmin', userType: 'Admin' },
  //   GisAgent: { username: 'GisAgent', password: 'GisAgent', userType: 'Agent' },
  // };

  // private colorSchemes: { [key: string]: { primary: string; secondary: string; accent: string; whites: string } } = {
  //   IBC: { primary: '#000000', secondary: '#FFFFFF', accent: '#FF0305', whites: '#ffffff' },
  //   Jet: { primary: '#000000', secondary: '#FFFFFF', accent: '#FC9802', whites: '#ffffff' },
  //   Gis: { primary: '#1e1e1e', secondary: '#adb4b7', accent: '#ffc641', whites: '#ffffff' },
  // };

  constructor(private router: Router, private readonly api: ApiService, private readonly socket: SocketService, private readonly database: DatabaseService) {}

  ngOnInit(): void {
    this.database.deleteDatabase();
    // const loggedIn = localStorage.getItem('isLoggedIn');
    // const userType = localStorage.getItem('userType');

    // if (loggedIn === 'true') {
    //   if (userType === 'Admin') {
    //     this.router.navigate(['/dashboard']);
    //   } else if (userType === 'Agent') {
    //     this.router.navigate(['/adashboard']);
    //   }
    // }
  }

  login = () => {

    this.api.login(this.username, this.password).subscribe(res => res ? this.errorMessage = res : this.router.navigate(['/']));

    // const enteredUsername = this.username.trim().toLowerCase();
    // const enteredPassword = this.password.trim().toLowerCase();

    // console.log('Attempting login:', enteredUsername, enteredPassword);

    // for (const key in this.credentials) {
    //   const user = this.credentials[key];
    //   const storedUsername = user.username.toLowerCase();
    //   const storedPassword = user.password.toLowerCase();

    //   if (enteredUsername === storedUsername && enteredPassword === storedPassword) {
    //     console.log('User authenticated:', key, user.userType);

    //     // Store login details
    //     localStorage.setItem('isLoggedIn', 'true');
    //     localStorage.setItem('adminType', key.includes('IBC') ? 'IBC' : key.includes('Jet') ? 'Jet' : 'Gis');
    //     localStorage.setItem('userType', user.userType);

    //     // Apply Theme Colors
    //     const company = key.includes('IBC') ? 'IBC' : key.includes('Jet') ? 'Jet' : 'Gis';
    //     const themeColors = this.colorSchemes[company];
    //     localStorage.setItem('themeColors', JSON.stringify(themeColors));

    //     document.documentElement.style.setProperty('--primary-color', themeColors.primary);
    //     document.documentElement.style.setProperty('--secondary-color', themeColors.secondary);
    //     document.documentElement.style.setProperty('--accent-color', themeColors.accent);
    //     document.documentElement.style.setProperty('--whites-color', themeColors.whites);

    //     // Redirect based on userType
    //     if (user.userType === 'Admin') {
    //       this.router.navigate(['/dashboard']);
    //     } else {
    //       this.router.navigate(['/adashboard']);
    //     }
    //     return;
    //   }
    // }

    // console.log('Login failed');
    // this.errorMessage = 'Invalid username or password. Please try again.';
  }
}
