export default class Syntax {
  src = ''
  async When_empty() {}
  async Then_empty_test_design() {
    this.src = '#comment'
  }
  async When_there_are_empty_lines() {
    this.src = '\n\n\n'
  }
}
