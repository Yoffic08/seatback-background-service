import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanPage } from './home.page';

const routes: Routes = [
  {
    path: '',
    component: ScanPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
