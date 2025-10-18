import { Branch, Label, Section, Step } from '../../model/model.ts'

export function autoLabel(b: Branch) {
  const forks = b.children.filter((c, i) => c.isFork || i === 0)
  if (forks.length > 1) {
    forks
      .filter((child) => child instanceof Step)
      .forEach((step) => {
        const label = step.action.toSingleLineString()
        const autoLabel = new Label(label)
        autoLabel.atSameAs(step.action)
        const autoSection = new Section(autoLabel, [], step.isFork)
        // todo this is some redundancy with both section and label storing the position
        autoSection.atSameAs(step)
        step.replaceWith(autoSection)
        autoSection.addChild(step)
      })
  }
  b.children.forEach((c) => autoLabel(c))
}
