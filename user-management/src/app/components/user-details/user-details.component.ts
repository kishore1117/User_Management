import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    SelectModule,     // ✅ Updated (Replacement for DropdownModule)
    ButtonModule,
    DividerModule,
    FormsModule,
    TagModule,
  ],
  templateUrl: './user-details.component.html',
})
export class UserDetailsComponent implements OnInit {
  user: any = {};
  loading = true;

  // Department options
  departments = [
    { label: 'IT-Systems', value: 'IT-Systems' },
    { label: 'HR', value: 'HR' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Engineering', value: 'Engineering' },
  ];

  // Category options
  categories = [
    { label: 'Laptop', value: 'Laptop' },
    { label: 'Desktop', value: 'Desktop' },
    { label: 'Server', value: 'Server' },
    { label: 'Others', value: 'Others' },
  ];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    // this.userService.getUserById(id).subscribe((res: any) => {
    //   this.user = res.user;
    //   this.loading = false;
    // });
  }

  saveUser() {
    // this.userService.updateUser(this.user.id, this.user).subscribe(() => {
    //   alert('User updated successfully');
    //   this.router.navigate(['/users']);
    // });
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
  