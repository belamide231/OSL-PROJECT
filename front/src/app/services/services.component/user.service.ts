import { Injectable } from '@angular/core';
import { ApiService } from '../services.configuration/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(public readonly api: ApiService) {}
}
