import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from "rxjs";
import { skip } from "rxjs/operators";


export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
	providedIn: 'root',
	factory: () => localStorage
});

@Injectable({
	providedIn: 'root'
})
export class FavoriteBookService implements OnDestroy {
	constructor(@Inject(BROWSER_STORAGE) private storage: Storage) {
		this.favSubscription = this.favBookIds$.pipe(
			skip(1)
		).subscribe({next: (favBookIdsSet) => {
			this.storage.setItem(this.storageKeyName, JSON.stringify(Array.from(favBookIdsSet)));
		}});

		// const initSet = this.getFavoriteBookIdsFromStorage();
		// this.favBooksIds.next(initSet);
	}

	ngOnDestroy() {
		if (this.favSubscription) {
			this.favSubscription.unsubscribe();
		}
	}


	private storageKeyName = 'favorite-books'

	private favBooksIds = new BehaviorSubject<Set<string>>(this.getFavoriteBookIdsFromStorage())
	public favBookIds$ = this.favBooksIds.asObservable()
	private favSubscription: Subscription


	toggleFavorite(bookId) {
		if (!this.favBooksIds.value.delete(bookId)) {
			this.favBooksIds.value.add(bookId);
		}
		this.favBooksIds.next(new Set(this.favBooksIds.value));
	}

	private getFavoriteBookIdsFromStorage(): Set<string> {
		const favBookIdsRaw = this.storage.getItem(this.storageKeyName);
		let favBookIdsArr;
		try {
			favBookIdsArr = JSON.parse(favBookIdsRaw);
		} catch { }

		const bookIdsSet = Array.isArray(favBookIdsArr) ? new Set(favBookIdsArr) : new Set();

		return bookIdsSet;
	}
}
