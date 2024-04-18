import { xmur3 } from './util/xmur3.js'

export class Router<N> {
  index = 0
  random: () => number
  started = new Set<N>()
  covered = new Set<N>()

  constructor(
    public outs: N[],
    seed = 'TODO',
  ) {
    this.random = xmur3(seed)
  }

  next() {
    if (this.outs.length === 0) throw new Error('internal error: no outs')
    if (this.index < this.outs.length) return this.outs[this.index++]
    else return this.outs[this.random() % this.outs.length]
  }

  get incompleteCount() {
    return this.outs.length - this.index
  }
}

interface Node {
  successors: this[]
}

export class Routers<N extends Node> {
  routers = new Map<N, Router<N>>()

  constructor(private root: N) {
    this.discover(root)
  }

  discover(branch: N) {
    const successors = branch.successors
    if (!this.routers.has(branch)) {
      this.routers.set(branch, new Router(successors))
    }
    for (const s of successors) this.discover(s)
  }

  get(branch: N) {
    if (!this.routers.has(branch)) {
      this.routers.set(branch, new Router(branch.successors))
    }
    return this.routers.get(branch)!
  }

  nextWalk() {
    const walk: N[] = []
    let current = this.root
    while (current.successors.length) {
      current = this.get(current).next()
      walk.push(current)
    }
    return walk
  }

  getIncompleteCount() {
    return Array.from(this.routers.values()).reduce(
      (sum, r) => sum + r.incompleteCount,
      0,
    )
  }
}
