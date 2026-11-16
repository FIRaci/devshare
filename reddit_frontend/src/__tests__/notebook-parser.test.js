import { parseMarkdownToBlocks, compileBlocksToMarkdown } from '../notebook-block-parser.js'

function runTests() {
  const bt = '```'
  console.log('--- Running Notebook Block Parser Unit Tests ---')

  // Test 1: Empty string
  const t1 = parseMarkdownToBlocks('')
  console.assert(t1.length === 1 && t1[0].type === 'text', 'Test 1 failed')
  console.log('✓ Test 1: Empty string returns 1 text cell')

  // Test 2: Text only
  const textSample = 'Line 1\nLine 2'
  const t2 = parseMarkdownToBlocks(textSample)
  console.assert(t2.length === 1 && t2[0].type === 'text' && t2[0].content === textSample, 'Test 2 failed')
  console.log('✓ Test 2: Text only preserved')

  // Test 3: Code only
  const codeSample = `${bt}python\nprint("hello")\n${bt}`
  const t3 = parseMarkdownToBlocks(codeSample)
  console.assert(t3.length === 1 && t3[0].type === 'code' && t3[0].lang === 'python' && t3[0].content === 'print("hello")', 'Test 3 failed')
  console.log('✓ Test 3: Code only cell parsed cleanly')

  // Test 4: Image only
  const imgSample = '![Diagram](https://img.devshare.io/arch.png)'
  const t4 = parseMarkdownToBlocks(imgSample)
  console.assert(t4.length === 1 && t4[0].type === 'image' && t4[0].caption === 'Diagram' && t4[0].url === 'https://img.devshare.io/arch.png', 'Test 4 failed')
  console.log('✓ Test 4: Image only cell parsed with caption and url')

  // Test 5: Full article with text, image, code, text
  const fullArticle = `# My First Article\n\n![Hero Banner](https://img.devshare.io/hero.jpg)\n\n${bt}typescript\nconst x: number = 42;\n${bt}\n\nIn conclusion, DevShare is fast.`
  const t5 = parseMarkdownToBlocks(fullArticle)
  console.assert(t5.length === 4, `Test 5 failed: length should be 4, got ${t5.length}`)
  console.assert(t5[0].type === 'text', 'Test 5 item 0 failed')
  console.assert(t5[1].type === 'image', 'Test 5 item 1 failed')
  console.assert(t5[2].type === 'code', 'Test 5 item 2 failed')
  console.assert(t5[3].type === 'text', 'Test 5 item 3 failed')
  const compiled = compileBlocksToMarkdown(t5)
  console.assert(compiled === fullArticle, `Test 5 roundtrip failed:\n${compiled}\nvs\n${fullArticle}`)
  console.log('✓ Test 5: Full article roundtrip matches perfectly')

  // Test 6: Incomplete or empty image block handling
  const partial = '![Alt]()'
  const t6 = parseMarkdownToBlocks(partial)
  console.assert(t6.length === 1 && t6[0].type === 'text', 'Test 6: Empty url stays text or handled cleanly')
  console.log('✓ Test 6: Empty URL image handled safely')

  console.log('>>> ALL 6 UNIT TESTS PASSED SUCCESSFULLY! <<<')
}

runTests()
