import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EMPTY, Observable, timer } from "rxjs";
import { debounce, debounceTime, distinctUntilChanged, filter, switchMap } from "rxjs/operators";

import { BookService, Book } from "../book.service";
import { FavoriteBookService } from "../favorite-book.service";


@Component({
	selector: 'app-book-list',
	templateUrl: './book-list.component.html',
	styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
	constructor(
		private bookService: BookService,
		private favService: FavoriteBookService
	) {}

	searchBooksCtrl = new FormControl()

	books$: Observable<Book[]> = this.bookService.books$


	ngOnInit() {
		this.searchBooksCtrl.valueChanges.pipe(
			filter(term => term.length == 0 || term.length > 2),
			debounce(term => term ? timer(1500) : EMPTY),
			distinctUntilChanged()
		).subscribe({ next: term => this.bookService.newTerm(term) });
	}

	onLoadNextBooks() {
		this.bookService.nextPage();
	}

	onToggleFavorite(book: Book) {
		this.favService.toggleFavorite(book.id);
	}

	booksTrackBy(index: number, item: Book): string {
		return item.id;
	}
}
