// https://stackoverflow.com/revisions/47593316/25 by bryc (github.com/bryc)
export function xmur3(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)),
      (h = (h << 13) | (h >>> 19))
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}
