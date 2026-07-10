const fs = require('fs');
const path = require('path');

const POSTS_TO_GENERATE = [
  {
    "title": "What Is YouTube's Auto-Dubbing Feature and How Does It Work?",
    "slug": "youtube-auto-dubbing-explained",
    "target_keyword": "youtube auto dubbing",
    "cluster": "youtube-auto-dub",
    "tool_link": "/video-dubbing",
    "image_query": "youtube video audio"
  },
  {
    "title": "How to Turn Off (or Remove) YouTube's Auto-Dub",
    "slug": "how-to-remove-youtube-auto-dub",
    "target_keyword": "remove youtube auto dub",
    "cluster": "youtube-auto-dub",
    "tool_link": "/video-dubbing",
    "image_query": "settings gear screen"
  },
  {
    "title": "YouTube Auto-Dub vs AI Voiceover Tools: Which Sounds More Natural?",
    "slug": "youtube-auto-dub-vs-ai-voiceover",
    "target_keyword": "youtube auto dub",
    "cluster": "youtube-auto-dub",
    "tool_link": "/video-dubbing",
    "image_query": "microphone sound waves"
  },
  {
    "title": "How to Translate a YouTube Video and Add a Voiceover",
    "slug": "translate-youtube-video-add-voiceover",
    "target_keyword": "youtube video translator",
    "cluster": "video-translation",
    "tool_link": "/video-dubbing",
    "image_query": "languages translation globe"
  },
  {
    "title": "English to Spanish Voiceover: Free Tools Compared",
    "slug": "english-to-spanish-voiceover-free-tools",
    "target_keyword": "english to spanish translator voice",
    "cluster": "video-translation",
    "tool_link": "/video-dubbing",
    "image_query": "spain flag english headphones"
  },
  {
    "title": "How to Translate and Dub Audio Without ElevenLabs (Free Method)",
    "slug": "translate-dub-audio-without-elevenlabs",
    "target_keyword": "how to translate and dub audio in eleven labs",
    "cluster": "video-translation",
    "tool_link": "/video-dubbing",
    "image_query": "studio audio editor waveform"
  },
  {
    "title": "How to Add Subtitles and Voiceover to Any Video for Free",
    "slug": "add-subtitles-and-voiceover-to-video-free",
    "target_keyword": "subtitle voiceover dubbing",
    "cluster": "video-translation",
    "tool_link": "/video-dubbing",
    "image_query": "video captions screen subtitles"
  },
  {
    "title": "Best Robotic Text-to-Speech Voices for Videos (Free)",
    "slug": "best-robotic-text-to-speech-voices",
    "target_keyword": "text to speech robot voice",
    "cluster": "tts-voices",
    "tool_link": "/text-to-speech",
    "image_query": "robot cute futuristic voice"
  },
  {
    "title": "Murf AI Text to Speech: Free Alternatives That Work",
    "slug": "murf-ai-text-to-speech-free-alternatives",
    "target_keyword": "murf ai text to speech free",
    "cluster": "tts-voices",
    "tool_link": "/text-to-speech",
    "image_query": "notebook podcast audio mic"
  },
  {
    "title": "ElevenLabs Dubbing Alternatives: Free AI Voice Tools",
    "slug": "elevenlabs-dubbing-alternatives-free",
    "target_keyword": "elevenlabs dubbing",
    "cluster": "tts-voices",
    "tool_link": "/text-to-speech",
    "image_query": "voice actor studio mixing console"
  },
  {
    "title": "Best Free AI Voice Generators in 2026 (Tested)",
    "slug": "best-free-ai-voice-generators-2026",
    "target_keyword": "best free ai voice generator",
    "cluster": "tts-voices",
    "tool_link": "/text-to-speech",
    "image_query": "futuristic smartphone sound wave"
  },
  {
    "title": "Neural TTS vs Old Robotic TTS: What Actually Changed?",
    "slug": "neural-tts-vs-robotic-tts",
    "target_keyword": "neural tts",
    "cluster": "tts-voices",
    "tool_link": "/text-to-speech",
    "image_query": "artificial intelligence brain sound"
  },
  {
    "title": "Is Free AI Voice Dubbing Actually Good in 2026? We Tested It",
    "slug": "is-free-ai-voice-dubbing-good-2026",
    "target_keyword": "free ai voice dubbing",
    "cluster": "ai-dubbing-longtail",
    "tool_link": "/video-dubbing",
    "image_query": "hands typing audio production"
  },
  {
    "title": "Best AI Voice Dubbing Tools Compared (2026)",
    "slug": "best-ai-voice-dubbing-tools-2026",
    "target_keyword": "best ai voice dubbing tools 2026",
    "cluster": "ai-dubbing-longtail",
    "tool_link": "/video-dubbing",
    "image_query": "laptop comparison reviews rating"
  },
  {
    "title": "AI Voice Dubbing for Educators: Use Cases and Free Tools",
    "slug": "ai-voice-dubbing-for-educators",
    "target_keyword": "ai voice dubbing for educators",
    "cluster": "ai-dubbing-longtail",
    "tool_link": "/text-to-speech",
    "image_query": "teacher virtual classroom screen laptop"
  },
  {
    "title": "Why Voice Actors Are Pushing Back Against AI Dubbing",
    "slug": "voice-actors-pushing-back-ai-dubbing",
    "target_keyword": "voice actors push back as ai threatens dubbing industry",
    "cluster": "ai-dubbing-longtail",
    "tool_link": "/video-dubbing",
    "image_query": "voice actor recording protest creative"
  },
  {
    "title": "The Emotion Problem: Why AI Dubbing Still Sounds Flat",
    "slug": "why-ai-dubbing-sounds-flat",
    "target_keyword": "challenges of emotion transfer in ai voice dubbing",
    "cluster": "ai-dubbing-longtail",
    "tool_link": "/video-dubbing",
    "image_query": "theater mask smile cry sound waves"
  },
  {
    "title": "Netflix and AI Dubbing: How Streaming Platforms Are Using AI Voices",
    "slug": "netflix-ai-dubbing-streaming",
    "target_keyword": "netflix ai voice dubbing",
    "cluster": "trending-ai-industry",
    "tool_link": "/video-dubbing",
    "image_query": "tv living room netflix remote screen"
  },
  {
    "title": "AI Voice Cloning Scams: How to Protect Yourself in 2026",
    "slug": "ai-voice-cloning-scams-2026",
    "target_keyword": "ai voice cloning",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "security locked shield phone hacking"
  },
  {
    "title": "How AI Is Changing the Voice Acting Industry Forever",
    "slug": "ai-changing-voice-acting-industry",
    "target_keyword": "ai voice actor",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "microphone headphones reflection light"
  },
  {
    "title": "Can AI Voices Replace Human Narrators? What the Data Says",
    "slug": "can-ai-voices-replace-human-narrators",
    "target_keyword": "ai narrator",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "open book floating letters sound"
  },
  {
    "title": "The Rise of AI Audiobooks: How Publishers Are Using AI Voices",
    "slug": "rise-of-ai-audiobooks",
    "target_keyword": "artificial intelligence voiceover",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "ereader audiobook headset cup of coffee"
  },
  {
    "title": "AI Voice Detection: Can You Tell If a Voice Is Real or AI?",
    "slug": "ai-voice-detection-real-or-ai",
    "target_keyword": "ai voice detection",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "soundwave voice analysis charts"
  },
  {
    "title": "How Podcasters Are Using AI Voices to Scale Content",
    "slug": "podcasters-using-ai-voices",
    "target_keyword": "ai voice over free",
    "cluster": "trending-ai-industry",
    "tool_link": "/text-to-speech",
    "image_query": "podcaster speaking microphone studio"
  },
  {
    "title": "AI Dubbing in Anime: How Studios Are Using AI Voice Tech",
    "slug": "ai-dubbing-in-anime",
    "target_keyword": "dubbing ai best female voice",
    "cluster": "trending-ai-industry",
    "tool_link": "/video-dubbing",
    "image_query": "anime sketch monitor drawing graphic tablet"
  },
  {
    "title": "How to Make Audiobooks from PDFs Using AI Voices",
    "slug": "make-audiobooks-from-pdf-ai-voices",
    "target_keyword": "ai voices text to speech",
    "cluster": "accessibility-education",
    "tool_link": "/text-to-speech",
    "image_query": "pdf doc conversion headphones"
  },
  {
    "title": "AI Voiceovers for E-Learning: A Complete Guide",
    "slug": "ai-voiceovers-for-elearning",
    "target_keyword": "artificial intelligence text to voice",
    "cluster": "accessibility-education",
    "tool_link": "/text-to-speech",
    "image_query": "elearning graduate hat graduation screen laptop"
  },
  {
    "title": "How Teachers Can Use AI Text-to-Speech for Classroom Accessibility",
    "slug": "ai-text-to-speech-classroom-accessibility",
    "target_keyword": "free text to voice ai generator",
    "cluster": "accessibility-education",
    "tool_link": "/text-to-speech",
    "image_query": "classroom school blackboard kids tables"
  },
  {
    "title": "How to Add AI Voiceover to PowerPoint Presentations",
    "slug": "ai-voiceover-for-powerpoint",
    "target_keyword": "ai voice recording",
    "cluster": "accessibility-education",
    "tool_link": "/text-to-speech",
    "image_query": "powerpoint slide presentation projection screen"
  },
  {
    "title": "AI Voice Tools for Content Creators: The Complete 2026 Toolkit",
    "slug": "ai-voice-tools-for-content-creators-2026",
    "target_keyword": "ai voices free",
    "cluster": "accessibility-education",
    "tool_link": "/text-to-speech",
    "image_query": "content creator video setup cameras lighting"
  }
];

// Helper delay to avoid Gemini rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateAllPosts() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined in your environment.");
    console.log("Please run this command: GEMINI_API_KEY=your_key node frontend/scripts/generate-all-posts.js");
    process.exit(1);
  }

  const postsDir = path.join(__dirname, '../content/blog/posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  console.log(`🚀 Starting generation for ${POSTS_TO_GENERATE.length} targeted articles...`);

  for (let idx = 0; idx < POSTS_TO_GENERATE.length; idx++) {
    const postConfig = POSTS_TO_GENERATE[idx];
    const targetFilePath = path.join(postsDir, `${postConfig.slug}.json`);

    // Skip if already generated
    if (fs.existsSync(targetFilePath)) {
      console.log(`⏭️ [${idx + 1}/${POSTS_TO_GENERATE.length}] Skipping "${postConfig.title}" (file already exists).`);
      continue;
    }

    console.log(`⏳ [${idx + 1}/${POSTS_TO_GENERATE.length}] Generating content for: "${postConfig.title}"...`);

    // Target a high-quality free image using Unsplash dynamic source urls based on queries
    const imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`;
    // We will instruct the model to write a highly realistic humanized article, embedding relevant visual sections.

    const prompt = `
    Write a high-quality, comprehensive, and viral SEO-optimized blog post in English.
    
    Topic Details:
    - Title: "${postConfig.title}"
    - Slug: "${postConfig.slug}"
    - Target Keyword: "${postConfig.target_keyword}"
    - Article Cluster Group: "${postConfig.cluster}"
    - Platform CTA Link: "${postConfig.tool_link}"
    
    Core Guidelines for Tone & Structure:
    1. Write in an engaging, humanized, conversational style. Avoid predictable, robotic AI phrases (like "In conclusion," "It's important to note," "In today's fast-paced digital world").
    2. Focus on SEO relevance. Integrate the target keyword naturally throughout the title, headers, and body paragraphs.
    3. The article must be highly informative, actionable, and at least 1,200 words long.
    4. Format the content as a valid HTML string using ONLY standard text formatting tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, blockquote, pre, code. Do NOT wrap the content in html/head/body tags.
    5. Dynamically embed 1 or 2 illustrative image cards in the HTML content using this Unsplash placeholder URL:
       <img src="https://source.unsplash.com/800x450/?${encodeURIComponent(postConfig.image_query)}" alt="${postConfig.title}" style="max-width: 100%; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
    6. Include a natural call-to-action (CTA) paragraph encouraging readers to try AIVoiceDub's free, no-login tools (like generating text to speech at "/text-to-speech" or aligning subtitle tracks at "/video-dubbing").
    7. Return the result in a clean JSON format matching the schema provided. Generate 3 to 5 tags.
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        slug: { type: "STRING" },
        description: { type: "STRING", description: "Compelling search description, max 160 characters." },
        content: { type: "STRING", description: "HTML body content. Contain h2, h3, paragraphs, lists, and images." },
        tags: { type: "ARRAY", items: { type: "STRING" } },
        readingTime: { type: "INTEGER" }
      },
      required: ["title", "slug", "description", "content", "tags", "readingTime"]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        { parts: [{ text: prompt }] }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.82
      }
    };

    let attempts = 3;
    let generated = false;

    while (attempts > 0 && !generated) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        let cleanText = generatedText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        
        const postData = JSON.parse(cleanText);
        postData.publishedAt = new Date().toISOString();
        postData.slug = postConfig.slug; // preserve configuration slug

        fs.writeFileSync(targetFilePath, JSON.stringify(postData, null, 2), 'utf8');
        console.log(`✅ Success! Generated and saved: ${postConfig.slug}.json`);
        generated = true;
      } catch (err) {
        attempts--;
        console.warn(`⚠️ Error generating "${postConfig.title}": ${err.message}. Remaining attempts: ${attempts}`);
        if (attempts > 0) {
          await sleep(5000);
        } else {
          console.error(`❌ Failed to generate "${postConfig.title}" after 3 attempts.`);
        }
      }
    }

    // Delay between iterations to stay safe within API rate-limits
    await sleep(4000);
  }

  console.log("🎉 All blog generation runs completed!");
}

generateAllPosts();
