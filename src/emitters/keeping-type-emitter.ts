import { isString, stringify, toValue } from '../util'
import { Emitter } from './emitter'

export class KeepingTypeEmitter implements Emitter {
  // buffer can be a primitive value until a second non-empty output is written
  private _buffer: any = ''
  // whether any non-empty output has been written
  private _written = false

  public get buffer (): any {
    return this._buffer
  }

  public write (html: any) {
    html = toValue(html)
    // Empty strings (e.g. `{{ "" }}`, null/undefined output or whitespace
    // trimmed by `{%- -%}`) don't participate in the rendered output, so
    // they neither preserve a type nor force stringification. This makes the
    // result independent of where they occur:
    //   {{ "" }}{{ n }} === {{ n }}{{ "" }} === {{ n }} -> 42 (number)
    if (isString(html) && html === '') return

    if (!this._written) {
      // preserve the type of the single, isolated value
      // I.E:
      // {{ my-port }} -> 42
      // {{ my-host }}:{{ my-port }} -> 'host:42'
      // {{ nil }} -> null
      this._buffer = html
      this._written = true
    } else {
      this._buffer = stringify(this._buffer) + stringify(html)
    }
  }
}
