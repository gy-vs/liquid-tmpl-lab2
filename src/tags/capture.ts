import { Liquid, Tag, Template, Context, TagToken, TopLevelToken } from '..'
import { SimpleEmitter } from '../emitters'
import { Parser } from '../parser'
import { IdentifierToken, QuotedToken } from '../tokens'
import { isTagToken } from '../util'

export default class extends Tag {
  identifier: IdentifierToken | QuotedToken
  variable: string
  templates: Template[] = []
  constructor (tagToken: TagToken, remainTokens: TopLevelToken[], liquid: Liquid, parser: Parser) {
    super(tagToken, remainTokens, liquid)
    this.identifier = this.readVariable()
    this.variable = this.identifier.content

    while (remainTokens.length) {
      const token = remainTokens.shift()!
      if (isTagToken(token) && token.name === 'endcapture') return
      this.templates.push(parser.parseToken(token, remainTokens))
    }
    throw new Error(`tag ${tagToken.getText()} not closed`)
  }

  private readVariable (): IdentifierToken | QuotedToken {
    let ident: IdentifierToken | QuotedToken | undefined = this.tokenizer.readIdentifier()
    if (ident.content) return ident
    ident = this.tokenizer.readQuoted()
    if (ident) return ident
    throw this.tokenizer.error('invalid capture name')
  }

  * render (ctx: Context): Generator<unknown, void, string> {
    const r = this.liquid.renderer
    // capture always stores the rendered output as string,
    // regardless of keepOutputType
    const html = yield r.renderTemplates(this.templates, ctx, new SimpleEmitter())
    ctx.bottom()[this.variable] = html
  }

  public * children (): Generator<unknown, Template[]> {
    return this.templates
  }

  public * localScope (): Iterable<string | IdentifierToken | QuotedToken> {
    yield this.identifier
  }
}
