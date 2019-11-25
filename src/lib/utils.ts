import { composeObject, entries } from "alcalzone-shared/objects";

export function invertOperation<T extends Record<string, any>>(
	operation: T,
): T {
	return composeObject<number | boolean>(
		entries(operation).map(([key, value]) => {
			switch (typeof value) {
				case "number":
					return [key, Number.NaN] as [string, number];
				case "boolean":
					return [key, !value] as [string, boolean];
				default:
					return [key, null] as [string, any];
			}
		}),
	) as T;
}
