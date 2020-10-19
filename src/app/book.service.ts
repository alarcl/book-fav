import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, map, mergeMap, skip, switchMap, take, toArray } from "rxjs/operators";
import { FavoriteBookService } from "./favorite-book.service";


export interface Book {
	id: string,
	selfLink: string,
	title: string
	subtitle: string,
	infoLink: string,
	smallThumbnail: string,
	favorite: boolean
}

type QueryBook = Partial<{
	id: string
	q: string
	currentIndex: number
	maxResults: number
}>

@Injectable({
	providedIn: 'root'
})
export class BookService implements OnDestroy {
	constructor(private http: HttpClient, private favService: FavoriteBookService) {
		this.termSubscription = merge(this.term$.pipe(skip(1)), this.page).pipe(
			switchMap(term => this.getBooksList(term)),
			switchMap(books => this.favService.favBookIds$.pipe(
				take(1),
				map(fav => {
					return books.map(book => {
						book.favorite = fav.has(book.id);
						return book;
					})
				})
			))
		).subscribe(this.books);

		this.favSubscription = this.favService.favBookIds$.pipe(
			switchMap(fav => this.books$.pipe(
				take(1),
				map(books => books.map(book => {
					book.favorite = fav.has(book.id);
					return book;
				}))
			))
		).subscribe(this.books);

		// this.favSubscription = this.favService.favBookIds$.pipe(
		// 	map(fav => {
		// 		return this.books.value.map(book => {
		// 			book.favorite = fav.has(book.id);
		// 			return book;
		// 		})
		// 	})
		// ).subscribe(this.books);

		this.favService.favBookIds$.pipe(
			switchMap(fav => from(fav).pipe(
				mergeMap(id => this.getGoogleBook(id)),
				map(book => (book.favorite = true, book)),
				toArray()
			))
		).subscribe(this.booksFav);
	}

	ngOnDestroy() {
		if (this.termSubscription) {
			this.termSubscription.unsubscribe();
		}
		if (this.favSubscription) {
			this.favSubscription.unsubscribe();
		}
	}


	private books = new BehaviorSubject<Book[]>([])
	public books$ = this.books.asObservable()

	private booksFav = new BehaviorSubject<Book[]>([])
	public booksFav$ = this.booksFav.asObservable()

	private term = new BehaviorSubject<string>('')
	private term$ = this.term.asObservable()
	private termSubscription: Subscription

	private page = new Subject<boolean>()

	private favSubscription: Subscription

	newTerm(term: string) {
		this.term.next(term);
	}

	nextPage() {
		this.page.next(true);
	}


	private currentIndex = 0
	private maxResults = 10

	getBooksList(msg: string | boolean): Observable<Book[]> {
		if (typeof msg === 'string') {
			this.currentIndex = 0;
			if (!msg.length) {
				return of([]);
			}
		} else if (typeof  msg === 'boolean') {
			this.currentIndex += this.maxResults;
		} else {
			this.currentIndex = 0;
			return of([]);
		}

		return this.getGoogleBooks({
			q: this.term.value, currentIndex: this.currentIndex, maxResults: this.maxResults
		}).pipe(
			map(books =>  this.currentIndex ? [...this.books.value, ...books] : books)
		);
	}




	// todo вынести в отдельный сервис GoogleBook

	private static googleBookAPIUrl(query: QueryBook) {
		const baseURL = 'https://www.googleapis.com/books/v1/volumes';
		const {id, q, currentIndex, maxResults} = query;

		if (q) {
			return `${baseURL}?q=${q}&orderBy=relevance&maxResults=${maxResults}&startIndex=${currentIndex}`;
		} else if (id) {
			return `${baseURL}/${id}`;
		}
	}

	private static castToBook(book: any): Book {
		return {
			id: book?.id,
			selfLink: book?.selfLink,
			title: book?.volumeInfo?.title,
			subtitle: book?.volumeInfo?.subtitle,
			infoLink: book?.volumeInfo?.infoLink,
			smallThumbnail: book?.volumeInfo?.imageLinks?.smallThumbnail,
			favorite: false
		};
	}

	private static castToBookArray(books: any): Book[] {
		if (!books || !Array.isArray(books.items)) {
			return [];
		}

		return books.items.map(book => BookService.castToBook(book));
	}

	getGoogleBooks(query: QueryBook): Observable<Book[]> {
		return this.http.get(BookService.googleBookAPIUrl(query)).pipe(
			map(books => BookService.castToBookArray(books)),
			catchError((e) => {
				console.log(e);
				return of([]);
			})
		);
	}

	getGoogleBook(id: string): Observable<Book> {
		return this.http.get(BookService.googleBookAPIUrl({id})).pipe(
			map(book => BookService.castToBook(book)),
			catchError((e) => {
				console.log(e);
				return of(<Book>{});
			})
		);
	}
}
