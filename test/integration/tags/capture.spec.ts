import { Liquid } from '../../../src/liquid'

describe('tags/capture', function () {
  const liquid = new Liquid()

  it('should support capture', async function () {
    const src = '{% capture f %}{{"a" | capitalize}}{%endcapture%}{{f}}'
    const html = await liquid.parseAndRender(src)
    return expect(html).toBe('A')
  })

  it('should support quoted variable name', async function () {
    const src = '{% capture "f" %}{{"a" | capitalize}}{%endcapture%}{{f}}'
    const html = await liquid.parseAndRender(src)
    return expect(html).toBe('A')
  })

  it('should not change root scope', async function () {
    const src = '{% capture var %}10{% endcapture %}{{var}}'
    const ctx = { 'var': 20 }
    const html = await liquid.parseAndRender(src, ctx)
    expect(html).toBe('10')
    expect(ctx.var).toBe(20)
  })

  it('should throw on invalid identifier', function () {
    const src = '{% capture = %}{%endcapture%}'
    return expect(liquid.parseAndRender(src))
      .rejects.toThrow('invalid capture name, line:1, col:12')
  })

  it('should throw when capture not closed', function () {
    const src = '{%capture c%}{{c}}'
    return expect(liquid.parseAndRender(src))
      .rejects.toThrow(/tag .* not closed/)
  })
  it('should support sync', function () {
    const src = '{% capture f %}{{"a" | capitalize}}{%endcapture%}{{f}}'
    const html = liquid.parseAndRenderSync(src)
    return expect(html).toBe('A')
  })

  describe('with keepOutputType enabled', function () {
    const typed = new Liquid({ keepOutputType: true })
    it('should always capture as string regardless of value type', function () {
      const src = '{% capture c %}{{ n }}{% endcapture %}{{ c }}'
      expect(typed.parseAndRenderSync(src, { n: 5 })).toBe('5')
    })
    it('should capture falsy boolean as a truthy string', function () {
      const src = '{% capture c %}{{ f }}{% endcapture %}{% if c %}truthy{% else %}falsy{% endif %}'
      expect(typed.parseAndRenderSync(src, { f: false })).toBe('truthy')
    })
    it('should capture null as empty string', function () {
      const src = '{% capture c %}{{ nil }}{% endcapture %}{% if c == "" %}eq{% else %}ne{% endif %}'
      expect(typed.parseAndRenderSync(src, { nil: null })).toBe('eq')
    })
    it('should stringify captured objects', function () {
      const src = '{% capture c %}{{ obj }}{% endcapture %}{% if c.k %}prop{% else %}noprop{% endif %}'
      expect(typed.parseAndRenderSync(src, { obj: { k: 'v' } })).toBe('noprop')
    })
  })
})
