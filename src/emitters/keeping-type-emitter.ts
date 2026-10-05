import { isString, stringify, toValue } from '../util'
import { Emitter } from './emitter'

export class KeepingTypeEmitter implements Emitter {
  public buffer: any = '';
  private settled = false;

  public write (html: any) {
    html = toValue(html)
    // An empty string is not considered an output, so it never turns
    // the kept value into a string, whether written before or after it.
    // I.E:
    // {{ my-port }}        -> 42
    // {{ "" }}{{ my-port }} -> 42
    // {{ my-port }}{{ "" }} -> 42
    // {{ my-port }}px      -> '42px'
    if (isString(html) && html === '') return
    if (!this.settled) {
      this.settled = true
      this.buffer = html
    } else {
      this.buffer = stringify(this.buffer) + stringify(html)
    }
  }
}
