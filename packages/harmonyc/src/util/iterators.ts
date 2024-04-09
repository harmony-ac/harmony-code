export function* flatMap<T, R>(
  iterable: Iterable<T>,
  callback: (value: T) => Iterable<R>
): Generator<R, void, undefined> {
  for (const value of iterable) {
    yield* callback(value)
  }
}
