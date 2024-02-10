import { execSync } from "child_process"
import assert from 'assert'
import { When, Then } from '@cucumber/cucumber';

When('no args -- cli', function () {
  try {
    this.stdout = execSync('harmonyc').toString()
  } catch (e) {
    this.stderr = e.stderr.toString()
  }
});

When('args {string} -- cli', function (args) {
  try {
    this.stdout = execSync(`harmonyc ${args}`).toString()
  } catch (e) {
    this.stderr = e.stderr.toString()
  }
});

Then('prints usage -- cli', function () {
  assert.match(this.stderr, /^Usage:/)
});