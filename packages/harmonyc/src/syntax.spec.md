# Syntax

Markdown code is mapped to the Harmony test model along the following rules.

## Empty file

- empty => empty test design
- empty lines => empty test design
- only a paragraph => empty test design

## Section headings

- only a h1 => one section
- more h1s => forked sections
- only h2s => forked sections
- nested headings => nested forked sections
- deep nested headings => deep nested forked sections

## Bulleted lists

- only a bullet point => one step
- more bullet points => forked steps
- nested bullet points => nested forked steps
- deep nested bullet points => deep nested forked steps
