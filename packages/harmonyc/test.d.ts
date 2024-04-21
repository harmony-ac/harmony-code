type FeatureContext = {
  Action(s: string): Promise<void>
  Action(s: string, fn: Function): void
  Response(s: string): Promise<void>
  Response(s: string, fn: Function): void
}
export function Feature(name: string, fn: (ctx: FeatureContext) => void): void
