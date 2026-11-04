/**
 * Initial editorial dataset and URL utilities for the Web2Mag application.
 * Contains high-fidelity real articles pre-formatted for static A4 magazine layout.
 */

export const TEST_SUCCESS_URL =
  'https://entechonline.com/do-you-understand-your-code/';
export const TEST_PCB_URL =
  'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/';
export const TEST_WP_NEWS_URL =
  'https://wordpress.org/news/2026/10/wordpress-7-1-4/';
export const TEST_FAILURE_URL = 'https://example.com/error';

/**
 * Initial curated articles for the Article Library and Magazine Preview.
 * The primary featured article is the ENTECH Magazine September 2026 cover story.
 */
export const SEED_ARTICLES = [
  {
    id: 'art-entech-101',
    title: "Do you Understand your Code?",
    author: "Vivek Khatri",
    date: "2026-09-17T12:04:40.000Z",
    formattedDate: "September 17, 2026",
    category: "Issue 9 - September 2026",
    summary: "AI has made writing code faster, but it hasn’t made software engineering easier. This article discusses race conditions, retries, testing, observability, and why understanding your system matters more than ever.",
    thumbnail: "https://entechonline.com/wp-content/uploads/2026/08/AI-generated-code-and-Code-Understandability.jpg",
    sourceUrl: "https://entechonline.com/do-you-understand-your-code/",
    status: 'Ready',
    sourceType: 'wordpress-rest-api',
    stats: {
      wordCount: 1554,
      readingTimeMinutes: 8,
    },
    sections: [
      {
            "type": "heading",
            "level": 2,
            "content": "Introduction: Race conditions in software"
      },
      {
            "type": "paragraph",
            "content": "A race condition can hit you anytime, you think it won’t because your software system isn’t that big, or doesn’t process a lot of requests, but it will happen, and when it happens, you will feel a bit silly about not handling it.",
            "html": "A race condition can hit you anytime, you think it won’t because your software system isn’t that big, or doesn’t process a lot of requests, but it will happen, and when it happens, you will feel a bit silly about not handling it."
      },
      {
            "type": "paragraph",
            "content": "Race conditions don’t happen during local software testing. They don’t happen when you manually click buttons. But, they happen on a Friday evening when two requests arrive within the same millisecond. Suddenly you have duplicate invoices, duplicate payments or reviews. It makes life difficult, because now you have a production system which is in an inconsistent state.",
            "html": "Race conditions don’t happen during local software testing. They don’t happen when you manually click buttons. But, they happen on a Friday evening when <strong>two requests arrive within the same millisecond</strong>. Suddenly you have duplicate invoices, duplicate payments or reviews. It makes life difficult, because now you have a production system which is in an inconsistent state."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Preventing Race Conditions with Database Constraints"
      },
      {
            "type": "paragraph",
            "content": "When you build software systems that create things/records, it is better to add a check that only one record is getting created, the best way to achieve that is to add a unique constraint on your db table. If your business rule says only one record should ever exist, let the database enforce it. A unique constraint is often simpler and more reliable than hoping your application code wins every race, effectively eliminating race conditions in software.",
            "html": "When you build software systems that create things/records, it is better to add a check that only one record is getting created, the best way to achieve that is to add a unique constraint on your db table. If your business rule says only one record should ever exist, let the database enforce it. A unique constraint is often simpler and more reliable than hoping your application code wins every race, effectively eliminating race conditions in software."
      },
      {
            "type": "paragraph",
            "content": "Every feature has a few things that should never be violated. A user should only be charged once. An order should only be shipped once. A username should be unique. Figure out those invariants first, then let your database and your code enforce them. Once you know what must always be true, designing the rest of the system becomes much easier.",
            "html": "Every feature has a few things that should never be violated. A user should only be charged once. An order should only be shipped once. A username should be unique. Figure out those invariants first, then let your database and your code enforce them. Once you know what must always be true, designing the rest of the system becomes much easier."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "When Constraints Aren’t Enough: Concurrency Control"
      },
      {
            "type": "paragraph",
            "content": "Of course, not every problem can be solved with a constraint. Sometimes you need multiple operations to behave as one, and that’s where concurrency control comes into the picture.",
            "html": "Of course, not every problem can be solved with a constraint. Sometimes you need multiple operations to behave as one, and that’s where concurrency control comes into the picture."
      },
      {
            "type": "heading",
            "level": 3,
            "content": "Optimistic vs Pessimistic Locking"
      },
      {
            "type": "paragraph",
            "content": "You can lock the rows for updation but at some point you will encounter deadlock situations, so what to do? Well, there are things like Optimistic locking and Pessimistic locking. I mean we give common sense solutions names but locking rows is common sense. Sometimes you lock rows before modifying them (pessimistic locking). Sometimes you assume conflicts are rare and detect them only when saving (optimistic locking). Neither is magic, they solve different problems. You have to make decisions based on the business rule.",
            "html": "You can lock the rows for updation but at some point you will encounter deadlock situations, so what to do? Well, there are things like Optimistic locking and Pessimistic locking. I mean we give common sense solutions names but locking rows is common sense. Sometimes you lock rows before modifying them (pessimistic locking). Sometimes you assume conflicts are rare and detect them only when saving (optimistic locking). Neither is magic, they solve different problems. You have to make decisions based on the business rule."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Handling Partial Failures and Retries"
      },
      {
            "type": "paragraph",
            "content": "Even if you’ve handled concurrent writes correctly, your system still has another enemy: partial failures.",
            "html": "Even if you’ve handled concurrent writes correctly, your system still has another enemy: <strong>partial failures</strong>."
      },
      {
            "type": "paragraph",
            "content": "Retrying, you can always retry right? Retries are so fun, you don’t have to worry about it. Wrong! Retries can introduce more ridiculous conditions that you might never have imagined could happen. So what do you do? Do you build a self healing system? Imagine your image gets published successfully, but the third-party API times out before confirming it. Your retry logic kicks in, and congratulations, you’ve just published it twice. Now you have to deal with a confused client.",
            "html": "Retrying, you can always retry right? Retries are so fun, you don’t have to worry about it. Wrong! Retries can introduce more ridiculous conditions that you might never have imagined could happen. So what do you do? Do you build a self healing system? Imagine your image gets published successfully, but the third-party API times out before confirming it. Your retry logic kicks in, and congratulations, you’ve just published it twice. Now you have to deal with a confused client."
      },
      {
            "type": "paragraph",
            "content": "The frustrating part about these failures is that they often happen when you’re asleep. By the time you wake up, the only evidence left is whatever your system decided to record.",
            "html": "The frustrating part about these failures is that they often happen when you’re asleep. By the time you wake up, the only evidence left is whatever your system decided to record."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "The Importance of Logging and Monitoring"
      },
      {
            "type": "paragraph",
            "content": "Always log things, people underestimate logging, obviously you shouldn’t over-log, but log things. Your code might handle errors gracefully, but you need to know what went wrong and why so the next day when you wake up, you can patch things up. Every important decision your code makes should leave behind a breadcrumb. Logs tell you why something failed. Monitoring tells you that it failed in the first place. Both are equally important. So add some monitoring. You should know what is happening in the system. A bird’s eye view.",
            "html": "Always log things, people underestimate logging, obviously you shouldn’t over-log, but log things. Your code might handle errors gracefully, but you need to know what went wrong and why so the next day when you wake up, you can patch things up. Every important decision your code makes should leave behind a breadcrumb. Logs tell you why something failed. Monitoring tells you that it failed in the first place. Both are equally important. So add some monitoring. You should know what is happening in the system. A bird’s eye view."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Adapting Testing Strategies for AI-Generated Code"
      },
      {
            "type": "paragraph",
            "content": "Given how AI is now writing a lot of code and in the blink of an eye, it becomes more difficult to understand it. You need to build testing strategies that your AI follows every time it builds a feature. For that you have to understand the feature perfectly and think about what edge cases might hit your system. AI can do that, but it never has the full context, and some times it just choses to ignore the context. So better to be the context yourself. Drive the AI.",
            "html": "Given how AI is now writing a lot of code and in the blink of an eye, it becomes more difficult to understand it. You need to build testing strategies that your AI follows every time it builds a feature. For that you have to understand the feature perfectly and think about what edge cases might hit your system. AI can do that, but it never has the full context, and some times it just choses to ignore the context. So better to be the context yourself. Drive the AI."
      },
      {
            "type": "paragraph",
            "content": "Previously, in the cave man times when the human wrote code themselves, they knew what they were writing they understood it. When an error appeared they knew why it appeared and what might be broken. In the times of AI writing code, the human might not know why the error appeared. Good thing here is that AI is good at pattern matching and in 9/10 events it will tell you where the error is and what to do to mitigate it. But to mitigate the root cause you will have to think harder. Monkey patching is easy, but there is always a reason why the error occurred in the first place. For a long term fix, you have to patch that too.",
            "html": "Previously, in the cave man times when the human wrote code themselves, they knew what they were writing they understood it. When an error appeared they knew why it appeared and what might be broken. In the times of AI writing code, the human might not know why the error appeared. Good thing here is that AI is good at pattern matching and in 9/10 events it will tell you where the error is and what to do to mitigate it. But to mitigate the root cause you will have to think harder. Monkey patching is easy, but there is always a reason why the error occurred in the first place. For a long term fix, you have to patch that too."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Code Understandability and Ownership"
      },
      {
            "type": "paragraph",
            "content": "Code understandability is important, you have to understand the code, if you do you become the foremost authority on that code. You know how things work, you know when something breaks what might be the reason. You just know.",
            "html": "Code understandability is important, you have to understand the code, if you do you become the foremost authority on that code. You know how things work, you know when something breaks what might be the reason. You just know."
      },
      {
            "type": "paragraph",
            "content": "But now that AI writes bulk of the code, one cannot be expected to keep everything in mind, you have to adjust for edge cases, you have to make sure the code handles edge cases gracefully otherwise you will find yourself in a dark hole of unknowns and when your lead asks you why this happened you will never have an answer. You have to change your testing approach, you have to add checks for edge cases, send the same request twice at the same time, see how the system behaves. If it doesn’t behave the way you expected it to, you fix it. What if the application loses db connection midway? What happens then? Is your db idempotent? You have to have AI write these tests and also review them. AI can try to be a bit cunning and skip the hard things at times.",
            "html": "But now that AI writes bulk of the code, one cannot be expected to keep everything in mind, you have to adjust for edge cases, you have to make sure the code handles edge cases gracefully otherwise you will find yourself in a dark hole of unknowns and when your lead asks you why this happened you will never have an answer. You have to change your testing approach, you have to add checks for edge cases, send the same request twice at the same time, see how the system behaves. If it doesn’t behave the way you expected it to, you fix it. What if the application loses db connection midway? What happens then? Is your db idempotent? You have to have AI write these tests and also review them. AI can try to be a bit cunning and skip the hard things at times."
      },
      {
            "type": "paragraph",
            "content": "Also Read: Digital Ethics and Algorithmic Bias: Future Skills 2030",
            "html": "<strong>Also Read:</strong> <a href=\"https://entechonline.com/digital-ethics-and-algorithmic-bias-future-skills-2030/\" target=\"_blank\" rel=\"noopener noreferrer\">Digital Ethics and Algorithmic Bias: Future Skills 2030</a>"
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Testing in Production"
      },
      {
            "type": "paragraph",
            "content": "The best test of your code is in production, where real things happen, if your code can stand tall on prod, then you have won. If writing code has become cheaper, then verifying that code has become much more important.",
            "html": "The best test of your code is in production, where real things happen, if your code can stand tall on prod, then you have won. If writing code has become cheaper, then verifying that code has become much more important."
      },
      {
            "type": "paragraph",
            "content": "Code understandability builds overtime, if you have written the code by your own hands then you do remember, but if it is a repo that you inherited, then it takes time to understand things. With AI you can ask questions and all that, but true understanding comes from debugging, tracing and going through code.",
            "html": "Code understandability builds overtime, if you have written the code by your own hands then you do remember, but if it is a repo that you inherited, then it takes time to understand things. With AI you can ask questions and all that, but true understanding comes from debugging, tracing and going through code."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Avoiding Complexity in Modern Systems"
      },
      {
            "type": "quote",
            "content": "One lesson I’ve learned from all of this is that complexity compounds.",
            "citation": ""
      },
      {
            "type": "paragraph",
            "content": "With AI writing a bunch of code, you need to make sure things are simple, you need to make sure you have minimised the number of parts that the code has. If there are more cogs in the machine than there should be, you have to remove some cogs and make the machine simple. Simple is better. Simple is smooth. Simplicity will never betray you or keep you awake at night. Do not overcomplicate solutions to get a promotion, do not write cunning code, be simple. Simple code is easy to debug and maintain.",
            "html": "With AI writing a bunch of code, you need to make sure things are simple, you need to make sure you have minimised the number of parts that the code has. If there are more cogs in the machine than there should be, you have to remove some cogs and make the machine simple. Simple is better. Simple is smooth. Simplicity will never betray you or keep you awake at night. Do not overcomplicate solutions to get a promotion, do not write cunning code, be simple. Simple code is easy to debug and maintain."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "Conclusion: Race conditions in software"
      },
      {
            "type": "paragraph",
            "content": "AI has made software engineering faster, but it hasn’t made distributed systems any less complicated. Networks still fail. Databases still race. Users still click twice. Production still finds the assumptions you forgot to test. The engineers who thrive won’t be the ones who generate the most code, they’ll be the ones who understand the systems they build. AI can write code, but it can’t own production. You do.",
            "html": "AI has made software engineering <strong>faster</strong>, but it hasn’t made distributed systems any less complicated. Networks still fail. Databases still race. Users still click twice. Production still finds the assumptions you forgot to test. The engineers who thrive won’t be the ones who generate the most code, they’ll be the ones who <strong>understand the systems</strong> they build. AI can write code, but it can’t own production. You do."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "FAQs: Race Conditions in Software"
      },
      {
            "type": "paragraph",
            "content": "When two requests come in at the same time, it is called a race condition. This doesn’t happen very often during manual testing or local development. They usually do it on a busy day, when real people are using the system at the same time.Race conditions are hidden until they are seen by production traffic. This is because local testing usually only involves one user and set times.",
            "html": "When two requests come in at the same time, it&nbsp;is called a race condition. This doesn’t happen very often during manual testing or local development. They usually do it on a busy day, when real people are using the system at the same time.<br>Race conditions are hidden until they are seen by production traffic. This is because local testing usually only involves one user and set times."
      },
      {
            "type": "paragraph",
            "content": "The most reliable method is to add a unique constraint on your database table. Don’t let the database change the fact that there should only ever be one record for a business rule.",
            "html": "The most reliable method is to add a unique constraint on your database table. Don’t let the database change the fact that there should only ever be one record for a business rule."
      },
      {
            "type": "paragraph",
            "content": "Retries can introduce more ridiculous conditions than the original failure.",
            "html": "Retries can introduce more ridiculous conditions than the original failure."
      },
      {
            "type": "paragraph",
            "content": "Since AI-generated code may include edge cases that the developer doesn’t fully understand, you must: 1. Add checks specifically for race conditions (e.g., send the same request twice at the same time) 2. Test what happens when the application loses a database connection midway 3. Have AI write these tests and review them (since AI can be cunning and skip hard things) 4. Focus on code understandability, because true understanding comes from debugging and tracing—not just asking AI questions The best test is still production, but verifying code has become even more critical now that writing it has become cheaper.",
            "html": "Since AI-generated code may include edge cases that the developer doesn’t fully understand, you must: <br>1. Add checks specifically for race conditions (e.g., send the same request twice at the same time) <br>2. Test what happens when the application loses a database connection midway <br>3. Have AI write these tests&nbsp;<em>and</em>&nbsp;review them (since AI can be cunning and skip hard things) <br>4. Focus on code understandability, because true understanding comes from debugging and tracing—not just asking AI questions <br><br>The best test is still production, but verifying code has become even more critical now that writing it has become cheaper."
      },
      {
            "type": "heading",
            "level": 2,
            "content": "References:"
      },
      {
            "type": "list",
            "ordered": true,
            "items": [
                  "Khatri, V. (2026, June 28). Do you understand your Code? Vivek’s Tryst With Tech. https://tech.peculiarvivek.com/do-you-understand-your-code",
                  "Trisovic, A., Lau, M. K., Pasquier, T., & Crosas, M. (2022). A large-scale study on research code quality and execution. Scientific Data, 9(1), 60. https://doi.org/10.1038/s41597-022-01143-6"
            ]
      }
    ],
  },
  {
    id: 'art-entech-102',
    title: 'PCB Manufacturing: From Design to Real Product!',
    author: 'Virendra Singh Shekhawat',
    date: '2026-09-17T17:34:54.000Z',
    formattedDate: 'September 17, 2026',
    category: 'Electronics & Engineering',
    summary:
      'Designing a printed circuit board is an exciting milestone, but turning a digital layout into a functional hardware product requires strict adherence to fabrication tolerances, copper layers, and assembly workflows.',
    thumbnail:
      'https://entechonline.com/wp-content/uploads/2026/08/PCB-design-and-manufacturing.jpg',
    sourceUrl:
      'https://entechonline.com/pcb-manufacturing-from-design-to-real-product/',
    status: 'Ready',
    sourceType: 'wordpress-rest-api',
    stats: {
      wordCount: 1100,
      readingTimeMinutes: 6,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'From Schematic Capture to Physical Substrate',
      },
      {
        type: 'paragraph',
        content:
          'Every electronic hardware product starts with a schematic diagram. Once electrical connections are routed and verified through design rule checks (DRC), Gerber files are generated to instruct computer-aided manufacturing machines at the fabrication plant.',
      },
      {
        type: 'paragraph',
        content:
          'FR-4 epoxy-laminated woven fiberglass remains the industry gold standard substrate, delivering electrical insulation, flame resistance, and mechanical rigidity across high-frequency consumer devices.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Etching, Plating, and Solder Mask Application',
      },
      {
        type: 'paragraph',
        content:
          'Photolithography transfers circuit traces onto copper-clad laminate sheets. Unexposed copper is chemically etched away, leaving only signal pathways and power planes. Vias are electroplated with copper to bridge signals across multi-layer stacks.',
      },
      {
        type: 'quote',
        content:
          'Precision in solder mask registration prevents solder bridges between micro-pitch IC pins during high-speed reflow oven soldering.',
        citation: 'Virendra Singh Shekhawat',
      },
      {
        type: 'paragraph',
        content:
          'Automated optical inspection (AOI) inspects line widths, missing pads, and trace clearances against IPC Class 2 and Class 3 reliability standards before assembly commences.',
      },
    ],
  },
  {
    id: 'art-103',
    title: 'Editorial Pacing: Balancing Long-Form Essays with Visual Spreads',
    author: 'Clara Chen',
    date: '2026-08-20T10:00:00.000Z',
    formattedDate: 'August 20, 2026',
    category: 'Design & Publication',
    summary:
      'Modern magazine readers navigate between immersive investigative journalism and swift visual scanning. Maintaining narrative rhythm across multi-column spreads requires deliberate typography and whitespace.',
    thumbnail: '', // Intentionally empty to test fallback placeholder
    sourceUrl: 'https://atelier.example.com/editorial-pacing-visual-spreads',
    status: 'Ready',
    sourceType: 'html-fallback',
    stats: {
      wordCount: 780,
      readingTimeMinutes: 4,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'The Architecture of Editorial Pacing',
      },
      {
        type: 'paragraph',
        content:
          'When designing a multi-page publication, the rhythm of reading changes dramatically between text-heavy analysis and visual breathing room. A magazine layout is not simply a blog post rendered onto paper; it is a choreographed reading journey.',
      },
      {
        type: 'paragraph',
        content:
          'By introducing pull quotes, asymmetric sidebars, and carefully proportioned two-column grids, the layout guides the human eye down the column while preserving typographic contrast.',
      },
    ],
  },
  {
    id: 'art-104',
    title:
      'Automated Web-to-Magazine Pipelines: Structuring Semantic HTML for Multi-Column Layout Engines',
    author: 'Devon K. Sterling',
    date: '2026-07-14T14:30:00.000Z',
    formattedDate: 'July 14, 2026',
    category: 'Workflow & Tech',
    summary:
      'Converting unstructured CMS articles into print-ready A4 magazines requires rigorous DOM sanitization, CSS multi-column balance, and page-break rules.',
    thumbnail: '',
    sourceUrl: 'https://publishingtech.example.io/web-to-magazine-semantic-html',
    status: 'Needs Review',
    sourceType: 'html-fallback',
    stats: {
      wordCount: 920,
      readingTimeMinutes: 5,
    },
    sections: [
      {
        type: 'heading',
        level: 2,
        content: 'Bridging the Web-to-Print Divide',
      },
      {
        type: 'paragraph',
        content:
          'Web publishing prioritizes infinite vertical scrolling, responsive viewport widths, and dynamic embeds. Print editorial software, by contrast, operates on fixed paper boundaries: A4 sheets, baseline grids, and symmetrical columns.',
      },
      {
        type: 'paragraph',
        content:
          'By leveraging standard HTML5 semantic elements and CSS column-count with break-inside avoidance, automated publication pipelines achieve typographic elegance without manual desktop publishing software.',
      },
    ],
  },
];

export const mockArticles = SEED_ARTICLES;

/**
 * Normalizes a URL string for duplicate comparison.
 * @param {string} rawUrl
 * @returns {string}
 */
export function normalizeArticleUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${pathname}${parsed.search}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Validates an input string as an HTTP/HTTPS URL using the standard JavaScript URL constructor.
 * @param {string} rawInput
 * @returns {{ isValid: boolean, normalizedUrl: string, parsedUrl: URL | null, error: string }}
 */
export function validateArticleUrl(rawInput) {
  const trimmed = typeof rawInput === 'string' ? rawInput.trim() : '';

  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Please enter an article URL to import.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'URL cannot contain spaces. Please enter a valid web address.',
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error:
        'Please enter a well-formed URL including the protocol (e.g. https://entechonline.com/article).',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Only HTTP and HTTPS URLs are supported.',
    };
  }

  const host = parsed.hostname;
  const hasValidDomain =
    host === 'localhost' ||
    (host.includes('.') &&
      !host.startsWith('.') &&
      !host.endsWith('.') &&
      host.split('.').every((part) => part.length > 0));

  if (!host || !hasValidDomain) {
    return {
      isValid: false,
      normalizedUrl: '',
      parsedUrl: null,
      error: 'Please include a valid domain name in the URL.',
    };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.href,
    parsedUrl: parsed,
    error: '',
  };
}

export default SEED_ARTICLES;
