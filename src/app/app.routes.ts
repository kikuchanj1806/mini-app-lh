import {Routes} from '@angular/router';
import {LayoutComponent} from './layouts/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/home/home.module').then(m => m.HomeModule)
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/book-appointment/book-appointment.module').then(m => m.BookAppointmentModule)
      },
    ]
  },
  // Redirect bất kỳ đường dẫn không khớp nào về trang chủ
  {path: '**', redirectTo: '', pathMatch: 'full'}
];
