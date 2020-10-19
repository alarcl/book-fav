import { Component, OnInit } from '@angular/core';
import { Book, BookService } from "../book.service";
import { Observable } from "rxjs";
import { FavoriteBookService } from "../favorite-book.service";

@Component({
	selector: 'app-book-fav',
	templateUrl: './book-fav.component.html',
	styleUrls: ['./book-fav.component.css']
})
export class BookFavComponent implements OnInit {
	constructor(
		private bookService: BookService,
		private favService: FavoriteBookService
	) { }

	ngOnInit() { }


	books$: Observable<Book[]> = this.bookService.booksFav$


	onToggleFavorite(book: Book) {
		this.favService.toggleFavorite(book.id);
	}

	booksTrackBy(index: number, item: Book): string {
		return item.id;
	}
}
