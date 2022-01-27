'use strict'

import MarkdownIt from "markdown-it"
import ParserBlock from "markdown-it/lib/parser_block"
import Renderer, { RenderRule } from "markdown-it/lib/renderer"
import Token from "markdown-it/lib/token"

export interface Options extends MarkdownIt.Options {
  render?: RenderRule
  marker?: string
}



export default function (md: MarkdownIt, name: string, opts?: Options) {

  function defaultValidate(params: string): boolean {
    return params.trim().split(' ', 2)[0] === name
  }

  const defaultRender: RenderRule = (tokens: Token[], idx: number, _options: MarkdownIt.Options, env: any, self: Renderer): string => {
    if (tokens[idx].nesting === 1) {
      tokens[idx].attrPush(['class', name])
    }
    return self.renderToken(tokens, idx, _options)
  }

  const options = Object.assign({
    validate: defaultValidate,
    render: defaultRender
  }, opts)

  const fence: ParserBlock.RuleBlock = (state, startLine, endLine, silent) => {
    const optionMarker = options.marker || '`'
    let pos = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]
    let haveEndMarker = false

    if (state.sCount[startLine] - state.blkIndent >= 4) return false

    if (pos + 3 > max) return false

    const marker = state.src.charCodeAt(pos)

    if (marker !== optionMarker.charCodeAt(0)) return false

    let mem = pos
    pos = state.skipChars(pos, marker)
    
    let len = pos - mem

    if (len < 3) return false

    const markup = state.src.slice(mem, pos)
    const params = state.src.slice(pos, max)

    if (params.indexOf(String.fromCharCode(marker)) >= 0) return false

    // Since start is found, we can report success here in validation mode
    if (silent) { return true; }

    let nextLine = startLine

    for (;;) {
      nextLine++
      if (nextLine >= endLine) break

      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (pos < max && state.sCount[nextLine] < state.blkIndent) break
      if (state.src.charCodeAt(pos) !== marker) continue
      if (state.sCount[nextLine] - state.blkIndent >= 4) continue

      pos = state.skipChars(pos, marker)

      if (pos - mem < len) continue

      pos = state.skipSpaces(pos)

      if (pos < max) continue

      haveEndMarker = true

      break
    }

    len = state.sCount[startLine]

    state.line = nextLine + (haveEndMarker ? 1 : 0)

    let token
    if (options.validate(params)) token = state.push(name, 'div', 0)
    else token = state.push('fence', 'code', 0)
    token.info = params
    token.content = state.getLines(startLine + 1, nextLine, len, true)
    token.markup = markup
    token.map = [startLine, state.line]

    return true
  }

  md.block.ruler.before('fence', name, fence, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })
  md.renderer.rules[name] = options.render
}
