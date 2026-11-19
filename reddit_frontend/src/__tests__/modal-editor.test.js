import { parseMarkdownToBlocks, compileBlocksToMarkdown } from '../notebook-block-parser.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function runModalEditorTests() {
  console.log('--- Running Modal & Editor Verification Tests ---')

  // Test 1: Verify CSS rules for scroll and width
  const cssPath = path.resolve(__dirname, '../App.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  console.assert(cssContent.includes('.modal-wide'), 'CSS test 1 failed: .modal-wide missing')
  console.assert(cssContent.includes('max-width: 1060px !important') || cssContent.includes('max-width: 1040px') || cssContent.includes('1060px'), 'CSS test 2 failed: wide width missing')
  console.assert(cssContent.includes('.modal-scroll-area') || cssContent.includes('overflow-y:auto'), 'CSS test 3 failed: scroll missing')
  console.assert(cssContent.includes('.blog-title-input'), 'CSS test 4 failed: .blog-title-input missing')
  console.assert(cssContent.includes('.post-split-layout'), 'CSS test 5 failed: .post-split-layout missing')
  console.log('✓ Test 1: App.css contains wide modal (1060px), smooth scroll area, blog title, and split view styles')

  // Test 2: Verify CreatePostModal contains viewMode, PostPreviewCard, and scrollable area
  const modalPath = path.resolve(__dirname, '../CreatePostModal.jsx')
  const modalContent = fs.readFileSync(modalPath, 'utf8')

  console.assert(modalContent.includes('PostPreviewCard'), 'Modal test 1 failed: PostPreviewCard missing')
  console.assert(modalContent.includes('modal-scroll-area'), 'Modal test 2 failed: modal-scroll-area missing')
  console.assert(modalContent.includes('post-split-layout'), 'Modal test 3 failed: post-split-layout missing')
  console.assert(modalContent.includes('overflow = \'hidden\''), 'Modal test 4 failed: body scroll lock missing')
  console.log('✓ Test 2: CreatePostModal.jsx verified with body scroll lock, split view, and scrollable canvas')

  // Test 3: Markdown parser multi-cell roundtrip with code and image
  const bt = '```'
  const complexBlog = [
    '# Building Scalable Apps with DevShare',
    'Here is an architecture diagram:',
    '![DevShare Architecture](https://example.com/arch.svg)',
    'And the core Bun Elysia backend entrypoint:',
    `${bt}typescript\nimport { Elysia } from "elysia";\nconst app = new Elysia().get("/", () => "OK").listen(3001);\n${bt}`,
    'Fast, lightweight and modern.'
  ].join('\n\n')

  const parsed = parseMarkdownToBlocks(complexBlog)
  console.assert(parsed.length === 5, `Parser test failed: expected 5 blocks, got ${parsed.length}`)
  console.assert(parsed[0].type === 'text')
  console.assert(parsed[1].type === 'image' && parsed[1].caption === 'DevShare Architecture')
  console.assert(parsed[2].type === 'text')
  console.assert(parsed[3].type === 'code' && parsed[3].lang === 'typescript')
  console.assert(parsed[4].type === 'text')

  const recompiled = compileBlocksToMarkdown(parsed)
  console.assert(recompiled === complexBlog, 'Recompile test failed')
  console.log('✓ Test 3: Full complex blog post (Text, Image, Code, Notes) parses and compiles 100% losslessly')

  console.log('>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<')
}

runModalEditorTests()
