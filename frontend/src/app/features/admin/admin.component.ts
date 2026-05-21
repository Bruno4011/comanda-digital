import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent {
  user = this.auth.getUser();
  constructor(private auth: AuthService) {}
}
