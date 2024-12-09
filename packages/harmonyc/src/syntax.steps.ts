export default class Syntax {
  src = ''
  async empty() {}
  async __empty_test_design() {
    this.src = '#comment'
  }
  async there_are_empty_lines() {
    this.src = '\n\n\n'
  }
}
