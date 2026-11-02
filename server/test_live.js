import { extractArticle } from './src/services/extractor.js';

async function testExtraction() {
  console.log('====================================================');
  console.log('TEST 1: Issue Landing Page URL');
  console.log('https://entechonline.com/september-2026-volume-4-issue-9/');
  console.log('====================================================');
  try {
    const res1 = await extractArticle('https://entechonline.com/september-2026-volume-4-issue-9/');
    console.log('Title:', res1.title);
    console.log('Author:', res1.author);
    console.log('Category:', res1.category);
    console.log('Featured Image:', res1.featuredImageUrl);
    console.log('Publish Date:', res1.publishDate);
    console.log('Images count:', res1.images.length);
    console.log('Content length:', res1.contentHtml.length);
    console.log('Reading time:', res1.readingTime, 'min');
    console.log('Is WordPress:', res1.isWordPress, 'Is Page:', res1.isPage);
    console.log('Content snippet:\n', res1.contentHtml.slice(0, 300));
  } catch (err) {
    console.error('Test 1 error:', err.message);
  }

  console.log('\n====================================================');
  console.log('TEST 2: Individual WordPress Article URL');
  console.log('https://entechonline.com/pcb-manufacturing-from-design-to-real-product/');
  console.log('====================================================');
  try {
    const res2 = await extractArticle('https://entechonline.com/pcb-manufacturing-from-design-to-real-product/');
    console.log('Title:', res2.title);
    console.log('Author:', res2.author);
    console.log('Category:', res2.category);
    console.log('Featured Image:', res2.featuredImageUrl);
    console.log('Publish Date:', res2.publishDate);
    console.log('Images count:', res2.images.length);
    console.log('Content length:', res2.contentHtml.length);
    console.log('Reading time:', res2.readingTime, 'min');
    console.log('Is WordPress:', res2.isWordPress, 'Is Page:', res2.isPage);
  } catch (err) {
    console.error('Test 2 error:', err.message);
  }

  console.log('\n====================================================');
  console.log('TEST 3: Standard Webpage (Mozilla Readability)');
  console.log('https://en.wikipedia.org/wiki/Printed_circuit_board');
  console.log('====================================================');
  try {
    const res3 = await extractArticle('https://en.wikipedia.org/wiki/Printed_circuit_board');
    console.log('Title:', res3.title);
    console.log('Author:', res3.author);
    console.log('Category:', res3.category);
    console.log('Featured Image:', res3.featuredImageUrl);
    console.log('Images count:', res3.images.length);
    console.log('Content length:', res3.contentHtml.length);
    console.log('Reading time:', res3.readingTime, 'min');
    console.log('Is WordPress:', res3.isWordPress);
  } catch (err) {
    console.error('Test 3 error:', err.message);
  }

  console.log('\n====================================================');
  console.log('TEST 4: Inaccessible / Invalid URL');
  console.log('https://entechonline.com/this-article-does-not-exist-404');
  console.log('====================================================');
  try {
    await extractArticle('https://entechonline.com/this-article-does-not-exist-404');
    console.log('Unexpected success for 404 URL');
  } catch (err) {
    console.log('Properly handled 404/inaccessible error:', err.message);
  }
}

testExtraction();
