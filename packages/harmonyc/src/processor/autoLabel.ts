import { Branch, Label, Phrase, Section, Step } from '../model/model'

export function autoLabel(s: Branch) {
  if (s.children.length <= 1) return
  s.children
    .filter((c) => c instanceof Step)
    .filter((c) => c.isFork)
    .forEach((c) => {
      const label = c.action.toSingleLineString()
      const autoSection = new Section(new Label(label), [], c.isFork)
      c.replaceWith(autoSection)
      autoSection.addChild(c)
    })
  s.children.forEach((c) => autoLabel(c))
}
