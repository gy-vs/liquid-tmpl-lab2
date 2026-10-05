import { Liquid } from '../../../src/liquid'

describe('LiquidOptions#*keepOutputType*', function () {
  it('should respect keepOutputType', async function () {
    const engine = new Liquid({
      keepOutputType: true
    })
    const context = {
      'my-boolean': true,
      'my-number': 42,
      'my-string': 'test'
    }
    const booleanHtml = await engine.parseAndRender('{{my-boolean}}', context)
    expect(booleanHtml).toBe(true)
    const numberHtml = await engine.parseAndRender('{{my-number}}', context)
    expect(numberHtml).toBe(42)
    const html = await engine.parseAndRender('{{my-string}}', context)
    expect(html).toBe('test')
    const composedHtml = await engine.parseAndRender('{{my-string}}:{{my-number}}', context)
    expect(composedHtml).toBe('test:42')
  })

  it('should respect keepOutputType = false as default', async function () {
    const engine = new Liquid()
    const context = {
      'my-boolean': true,
      'my-number': 42,
      'my-string': 'test'
    }
    const booleanHtml = await engine.parseAndRender('{{my-boolean}}', context)
    expect(booleanHtml).toBe('true')
    const numberHtml = await engine.parseAndRender('{{my-number}}', context)
    expect(numberHtml).toBe('42')
    const html = await engine.parseAndRender('{{my-string}}', context)
    expect(html).toBe('test')
    const composedHtml = await engine.parseAndRender('{{my-string}}:{{my-number}}', context)
    expect(composedHtml).toBe('test:42')
  })

  it('should always capture rendered output as string', async function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { f: false, nil: null, n: 5, obj: { k: 'v' } }
    expect(await engine.parseAndRender('{% capture c %}{{ f }}{% endcapture %}{% if c %}T{% else %}F{% endif %}', context)).toBe('T')
    expect(await engine.parseAndRender('{% capture c %}{{ nil }}{% endcapture %}{% if c == "" %}T{% else %}F{% endif %}', context)).toBe('T')
    expect(await engine.parseAndRender('{% capture c %}{{ 1 }}{% endcapture %}{% if c == "1" %}T{% else %}F{% endif %}', context)).toBe('T')
    expect(await engine.parseAndRender('{% capture c %}{{ obj }}{% endcapture %}{{ c.k }}', context)).toBeUndefined()
    expect(await engine.parseAndRender('{% capture c %}{{ obj }}{% endcapture %}{{ c }}', context)).toBe('[object Object]')
    expect(await engine.parseAndRender('{% capture c %}{{ n }}{% endcapture %}{{ c }}', context)).toBe('5')
  })

  it('should not treat empty strings as additional output', async function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { n: 5, nil: null, enabled: true }
    expect(await engine.parseAndRender('{{ "" }}{{ n }}', context)).toBe(5)
    expect(await engine.parseAndRender('{{ n }}{{ "" }}', context)).toBe(5)
    expect(await engine.parseAndRender('{%- if enabled -%}\n  {{ n }}\n{%- endif -%}', context)).toBe(5)
    expect(await engine.parseAndRender('{{ nil }}{{ "" }}', context)).toBeNull()
    expect(await engine.parseAndRender('{{ "" }}{{ nil }}', context)).toBeNull()
  })

  it('should stringify non-empty composed output', async function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { n: 5 }
    expect(await engine.parseAndRender('{{ n }}px', context)).toBe('5px')
    expect(await engine.parseAndRender('{{ n }}{{ n }}', context)).toBe('55')
    expect(await engine.parseAndRender('{{ n }}{{ "" }}px', context)).toBe('5px')
  })

  it('should keep nil output as null', async function () {
    const engine = new Liquid({ keepOutputType: true })
    expect(await engine.parseAndRender('{{ nil }}')).toBeNull()
  })

  it('should return consistent results for sync and async render', function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { n: 5, enabled: true }
    const tpl = '{%- if enabled -%}\n  {{ n }}\n{%- endif -%}'
    expect(engine.parseAndRenderSync(tpl, context)).toBe(5)
    return engine.parseAndRender(tpl, context).then(html => expect(html).toBe(5))
  })
})
