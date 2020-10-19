import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookListComponent } from './book-list/book-list.component';
import { BookFavComponent } from './book-fav/book-fav.component';


const routes: Routes = [
	{path: 'book-list', component: BookListComponent},
	{path: 'book-fav', component: BookFavComponent},
	{path: '**', redirectTo: '/book-list'}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
