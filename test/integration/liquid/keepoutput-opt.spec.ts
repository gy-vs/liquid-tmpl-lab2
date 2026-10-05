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

  describe('capture always captures strings', function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = {
      f: false,
      t: true,
      nil: null,
      n: 5,
      obj: { k: 'v' }
    }

    it('should capture false as the string "false"', async function () {
      const src = '{% capture c %}{{ f }}{% endcapture %}{% if c %}truthy{% else %}falsy{% endif %}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('truthy')
      expect(engine.parseAndRenderSync(src, context)).toBe('truthy')
    })
    it('should capture true as the string "true"', async function () {
      const src = '{% capture c %}{{ t }}{% endcapture %}{% if c == "true" %}eq{% else %}ne{% endif %}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('eq')
    })
    it('should capture null as empty string', async function () {
      const src = '{% capture c %}{{ nil }}{% endcapture %}{% if c == "" %}eq{% else %}ne{% endif %}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('eq')
      expect(engine.parseAndRenderSync(src, context)).toBe('eq')
    })
    it('should capture numbers as strings', async function () {
      const src = '{% capture c %}{{ 1 }}{% endcapture %}{% if c == "1" %}eq{% else %}ne{% endif %}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('eq')
    })
    it('should stringify captured objects', async function () {
      const src = '{% capture c %}{{ obj }}{% endcapture %}{{ c.k }}{{ c }}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('[object Object]')
    })
    it('should render captured value back as its captured string', async function () {
      const src = '{% capture c %}{{ n }}{% endcapture %}{{ c }}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe('5')
    })
    it('should behave identically to keepOutputType disabled inside capture', async function () {
      const plain = new Liquid()
      const srcs = [
        '{% capture c %}{{ f }}{% endcapture %}{% if c %}truthy{% else %}falsy{% endif %}',
        '{% capture c %}{{ nil }}{% endcapture %}{% if c == "" %}eq{% else %}ne{% endif %}',
        '{% capture c %}{{ 1 }}{% endcapture %}{% if c == "1" %}eq{% else %}ne{% endif %}',
        '{% capture c %}{{ obj }}{% endcapture %}{% if c.k %}prop{% else %}noprop{% endif %}'
      ]
      for (const src of srcs) {
        expect(await engine.parseAndRender(src, context)).toBe(await plain.parseAndRender(src, context))
      }
    })
  })

  describe('empty outputs are ignored for type preservation', function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { n: 5, nil: null }

    it('should keep number type with an empty string after it', async function () {
      await expect(engine.parseAndRender('{{ n }}{{ "" }}', context)).resolves.toBe(5)
      expect(engine.parseAndRenderSync('{{ n }}{{ "" }}', context)).toBe(5)
    })
    it('should keep number type with an empty string before it', async function () {
      await expect(engine.parseAndRender('{{ "" }}{{ n }}', context)).resolves.toBe(5)
      expect(engine.parseAndRenderSync('{{ "" }}{{ n }}', context)).toBe(5)
    })
    it('should keep number type when surrounding whitespace is trimmed', async function () {
      const src = '{%- assign enabled = true -%}{%- if enabled -%}\n  {{ n }}\n{%- endif -%}'
      await expect(engine.parseAndRender(src, context)).resolves.toBe(5)
      expect(engine.parseAndRenderSync(src, context)).toBe(5)
    })
    it('should keep number type for an empty template', async function () {
      await expect(engine.parseAndRender('{{ "" }}', context)).resolves.toBe('')
    })
    it('should keep null type for a single null output', async function () {
      const result = await engine.parseAndRender('{{ nil }}', context)
      expect(result).toBeNull()
      expect(engine.parseAndRenderSync('{{ nil }}', context)).toBeNull()
    })
    it('should stringify when non-empty content is appended after', async function () {
      await expect(engine.parseAndRender('{{ n }}px', context)).resolves.toBe('5px')
    })
    it('should stringify when non-empty content is prepended before', async function () {
      await expect(engine.parseAndRender('px{{ n }}', context)).resolves.toBe('px5')
    })
    it('should stringify when two values are output together', async function () {
      await expect(engine.parseAndRender('{{ n }}{{ n }}', context)).resolves.toBe('55')
    })
    it('should stringify around empty strings only when other content exists', async function () {
      await expect(engine.parseAndRender('{{ "" }}{{ n }}px{{ "" }}', context)).resolves.toBe('5px')
    })
  })

  it('should return sync and async results with identical types', async function () {
    const engine = new Liquid({ keepOutputType: true })
    const context = { n: 5 }
    const srcs = ['{{ n }}', '{{ n }}{{ "" }}', '{{ "" }}{{ n }}', '{{ n }}px']
    for (const src of srcs) {
      const syncResult = engine.parseAndRenderSync(src, context)
      const asyncResult = await engine.parseAndRender(src, context)
      expect(asyncResult).toEqual(syncResult)
      expect(typeof asyncResult).toBe(typeof syncResult)
    }
  })

  it('should not keep output type for streamed rendering', function () {
    const engine = new Liquid({ keepOutputType: true })
    const tpl = engine.parse('{{ n }}')
    const stream = engine.renderToNodeStream(tpl, { n: 5 })
    return new Promise((resolve, reject) => {
      let buf = ''
      stream.on('data', (chunk: string) => { buf += chunk })
      stream.on('end', () => {
        expect(buf).toBe('5')
        expect(typeof buf).toBe('string')
        resolve(null)
      })
      stream.on('error', reject)
    })
  })
})
