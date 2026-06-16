import cheerio from 'cheerio';

async function testGrab(title: string, year?: number, director?: string) {
  try {
    const url = `https://film-grab.com/?s=${encodeURIComponent(title)}`;
    console.log(`Fetching url: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch, status: ${res.status}`);
      return;
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const results: { href: string; entryTitle: string }[] = [];
    $('.entry-title a').each((_, el) => {
      const href = $(el).attr('href');
      const entryTitle = $(el).text().trim();
      if (href) results.push({ href, entryTitle });
    });

    console.log(`Found ${results.length} search results:`);
    console.log(JSON.stringify(results, null, 2));

    if (results.length === 0) return;

    let bestResult = results[0];
    if (year || director) {
      const yearStr = year ? String(year) : null;
      const directorTokens = director
        ? director.toLowerCase().split(/\s+/).filter(t => t.length > 2)
        : [];

      let bestScore = -1;
      for (const r of results) {
        const haystack = (r.entryTitle + ' ' + r.href).toLowerCase();
        let score = 0;
        if (yearStr && haystack.includes(yearStr)) score += 2;
        if (directorTokens.length > 0 && directorTokens.some(t => haystack.includes(t))) score += 1;
        console.log(`Score for "${r.entryTitle}": ${score} (haystack: ${haystack})`);
        if (score > bestScore) {
          bestScore = score;
          bestResult = r;
        }
      }

      console.log(`Best score: ${bestScore}`);
      if (bestScore <= 0) {
        console.log(`Match score <= 0. Rejecting.`);
        return;
      }
    }

    console.log(`Selected: "${bestResult.entryTitle}" (${bestResult.href})`);
    
    // Fetch post details
    const postRes = await fetch(bestResult.href);
    if (!postRes.ok) {
      console.log(`Failed to fetch post, status: ${postRes.status}`);
      return;
    }
    const postHtml = await postRes.text();
    const $post = cheerio.load(postHtml);

    const images: string[] = [];
    $post('.bwg-masonry-thumb, .bwg-item img, img.size-full, .gallery-item img, figure img').each((i, el) => {
      let src = $post(el).closest('a').attr('href') || $post(el).attr('src') || $post(el).attr('data-src') || $post(el).attr('data-lazy-src');
      if (src) {
        if (src.includes('/thumb/')) {
           src = src.replace('/thumb/', '/').split('?')[0];
        }
        images.push(src);
      }
    });

    if (images.length === 0) {
        $post('.entry-content img').each((i, el) => {
           let src = $post(el).closest('a').attr('href') || $post(el).attr('src');
           if (src) images.push(src);
        });
    }

    console.log(`Found ${images.length} images:`);
    console.log(images.slice(0, 5));
  } catch (e) {
    console.error(e);
  }
}

testGrab("Gattaca", 1997, "Andrew Niccol");
