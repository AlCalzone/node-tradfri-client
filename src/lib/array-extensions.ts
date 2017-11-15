// tslint:disable:curly

///
/// Stellt Erweiterungsmethoden für Arrays bereit
///

// gibt die Elemente zurück, die in a, aber nicht in b sind.
export function except<T>(a: T[], b: T[]): T[] {
	return a.filter((el) => b.indexOf(el) === -1);
}

// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
export function firstOrDefault<T>(arr: T[], filter: (item: T) => boolean) {
	for (const item of arr) {
		if (filter(item)) return item;
	}
	return null;
}
