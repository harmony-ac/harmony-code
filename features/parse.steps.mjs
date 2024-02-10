import { execSync } from "child_process"
import assert from 'assert'
import { When, Then } from '@cucumber/cucumber';
import { parse } from '../packages/harmonyc/dist/parser.js'

When('empty file -- parse', function () {
  this.result = parse('')
});

Then('empty -- parse', function () {
  assert.equal(this.result.children.length, 0)
});
