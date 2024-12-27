import { Branch, Label, Phrase, Section, Step } from '../model/model'

export function autoLabel(s: Branch) {
  const forks = s.children.filter((c, i) => c.isFork || i === 0)
  if (forks.length > 1) {
    forks
      .filter((c) => c instanceof Step)
      .forEach((c) => {
        const label = c.action.toSingleLineString()
        const autoSection = new Section(new Label(label), [], c.isFork)
        c.replaceWith(autoSection)
        autoSection.addChild(c)
      })
  }
  s.children.forEach((c) => autoLabel(c))
}
