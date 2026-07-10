const fs = require('fs');
const path = require('path');

const ARTICLES_TO_GENERATE = [
  {
    title: "How to Convert SRT to Speech: Convert Subtitles into Natural AI Voiceovers",
    slug: "how-to-convert-srt-to-speech",
    keyword: "convert srt to speech",
    imageQuery: "video subtitles voiceover",
    toolLink: "/video-dubbing",
    description: "Learn how to convert SRT subtitle files into natural, human-like AI voiceovers. Step-by-step guide on automatic timing and lip-sync alignment.",
    diagramDesc: "SRT to Speech conversion pipeline: SRT File Upload -> Timestamp Parsing -> Neural Text-to-Speech Synthesis -> Audio Timing & Duration Alignment -> Merged Media Track."
  },
  {
    title: "WebVTT to MP3: Create AI Voiceovers from Video Subtitles Automatically",
    slug: "vtt-to-mp3-converter-guide",
    keyword: "vtt to mp3",
    imageQuery: "audio waveform speaker",
    toolLink: "/video-dubbing",
    description: "Convert WebVTT (VTT) subtitles directly to high-quality MP3 voiceovers. Discover tools to automate video dubbing and timestamp alignment.",
    diagramDesc: "WebVTT to MP3 pipeline: VTT Input -> Cue Extraction -> Voice Synthesis API -> Pacing Correction & Silence Insertion -> MP3 Download."
  },
  {
    title: "Subtitle to Speech Converter: Turn Subtitle Files into Realistic Narration",
    slug: "subtitle-to-speech-converter-guide",
    keyword: "subtitle to speech converter",
    imageQuery: "microphone computer subtitles",
    toolLink: "/video-dubbing",
    description: "Find the best subtitle to speech converter tools. Learn how neural speech engines transform text subtitles into realistic, human-sounding narration.",
    diagramDesc: "Subtitle to Speech Conversion process: Subtitle Parsing -> Language and Speaker Detection -> Synthesis Engine -> Audio Concatenation -> Final Narrated File."
  },
  {
    title: "Transcript to Voice Generator: Turn Video Transcripts into Human-Like Audio",
    slug: "transcript-to-voice-generator-guide",
    keyword: "transcript to voice generator",
    imageQuery: "writing reading record",
    toolLink: "/text-to-speech",
    description: "Discover how a transcript to voice generator can convert your scripts and transcripts into natural, multi-speaker voiceovers in seconds.",
    diagramDesc: "Transcript to Voice generation: Text Script -> Speaker Tag Parsing -> Neural voice assignments -> Segmented Audio rendering -> Mixed Stereo output."
  },
  {
    title: "How to Create AI Voiceovers Automatically (Step-by-Step)",
    slug: "how-to-create-ai-voiceovers-automatically",
    keyword: "how to create ai voiceovers automatically",
    imageQuery: "robotic automation audio",
    toolLink: "/text-to-speech",
    description: "An evergreen tutorial explaining how to create AI voiceovers automatically using modern neural TTS engines without professional voice actors.",
    diagramDesc: "Automated Voiceover workflow: Script Writing/Input -> API/Platform Processing -> Custom Pacing & Dialect Adjustments -> Automated MP3 Rendering."
  },
  {
    title: "How to Turn Video Subtitles into Audio Tracks for Free",
    slug: "turn-video-subtitles-into-audio",
    keyword: "turn video subtitles into audio",
    imageQuery: "video player timeline sound",
    toolLink: "/video-dubbing",
    description: "Need to turn video subtitles into audio tracks? Learn the free methods using browser tools and online converters without signing up.",
    diagramDesc: "Subtitle to Audio flow: Extract SRT/VTT -> Feed to TTS Engine -> Synchronize audio segments to match original video timestamps -> Export audio track."
  },
  {
    title: "AI Dubbing for Content Creators: Scale Your Channel Internationally",
    slug: "ai-dubbing-for-content-creators",
    keyword: "ai dubbing for content creators",
    imageQuery: "social media creator camera studio",
    toolLink: "/video-dubbing",
    description: "Scale your reach globally. The definitive guide on AI dubbing for content creators to localize YouTube, TikTok, and social media videos.",
    diagramDesc: "Global localization strategy: Original Video -> Automatic Translation -> Multi-Speaker Dubbing -> Lip Sync & Audio Sync -> Multilingual Video Release."
  },
  {
    title: "Best Free AI Voice Generator: Convert Text to Speech Instantly",
    slug: "best-free-ai-voice-generator-guide",
    keyword: "best free ai voice generator",
    imageQuery: "futuristic headphones waves",
    toolLink: "/text-to-speech",
    description: "Compare the best free AI voice generators of 2026. Create ultra-realistic human-sounding voiceovers directly from your web browser for free.",
    diagramDesc: "Free TTS Platform evaluation: Input Script -> Neural Model Engine -> Emotion & Pacing Overlays -> Instant Preview -> Direct MP3 download."
  },
  {
    title: "Realistic AI Voices Explained: How Modern Neural Text-to-Speech Works",
    slug: "realistic-ai-voices-explained",
    keyword: "realistic ai voices",
    imageQuery: "neural connection soundwave",
    toolLink: "/text-to-speech",
    description: "Unlock the science of realistic AI voices. Learn how deep learning models and neural text-to-speech (TTS) engines duplicate human voice inflections.",
    diagramDesc: "Neural Speech Architecture: Input Text -> Text Normalization -> Acoustic Model (Mel-spectrogram) -> Neural Vocoder (Waveform synthesis) -> Realistic Audio."
  },
  {
    title: "AI Audio Production Guide: The Modern Sound Engineer's Toolkit",
    slug: "ai-audio-production-guide",
    keyword: "ai audio production",
    imageQuery: "studio sound mixer console",
    toolLink: "/text-to-speech",
    description: "The ultimate AI audio production guide. Explore modern tools for noise removal, automatic mastering, and neural vocal generation.",
    diagramDesc: "AI Audio Production workflow: Raw Recording -> Neural Noise Reduction -> AI Voiceover Integration -> Automated Loudness & Mastering -> High Fidelity Export."
  }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runGenerator() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined in the environment.");
    process.exit(1);
  }

  const postsDir = path.join(__dirname, '../content/blog/posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  console.log(`🚀 Starting generation for ${ARTICLES_TO_GENERATE.length} Evergreen SEO articles...`);

  for (let idx = 0; idx < ARTICLES_TO_GENERATE.length; idx++) {
    const article = ARTICLES_TO_GENERATE[idx];
    const targetFilePath = path.join(postsDir, `${article.slug}.json`);

    // Skip if already exists
    if (fs.existsSync(targetFilePath)) {
      console.log(`⏭️ [${idx + 1}/${ARTICLES_TO_GENERATE.length}] Skipping "${article.title}" (file already exists).`);
      continue;
    }

    console.log(`⏳ [${idx + 1}/${ARTICLES_TO_GENERATE.length}] Generating: "${article.title}"...`);

    const prompt = `
    Write an incredibly comprehensive, premium, and SEO-optimized evergreen blog post in English.

    Target Article Details:
    - Title: "${article.title}"
    - Slug: "${article.slug}"
    - Target Keyword: "${article.keyword}"
    - Tool/CTA Link: "${article.toolLink}"
    - Meta Description: "${article.description}"
    - Diagram Topic: "${article.diagramDesc}"

    Formatting and Style Guidelines:
    1. WORD COUNT: The article must be highly detailed, thorough, and comprehensive, between 1500 and 2500 words.
    2. STRUCTURE: Include a compelling introduction, a detailed Step-by-Step Guide, Benefits, Common Questions/Troubleshooting, a thorough FAQ section (with 3-5 frequently asked questions and answers), and a conclusion.
    3. HEADINGS: Use ONLY <h2> and <h3> tags for headers. Do NOT include any <h1> tag inside the content (as it is already rendered by the page layout).
    4. HTML FORMATTING: Write the content as a valid HTML string using ONLY standard text formatting tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <pre>, <code>, <table>, <thead>, <tbody>, <tr>, <th>, <td>. Do NOT wrap the content in <html>, <head>, or <body> tags. All paragraph text should be natural and engaging.
    5. INTEGRATE SVG DIAGRAM: You MUST include a detailed, responsive, and beautiful inline SVG diagram representing the pipeline or process mentioned in: "${article.diagramDesc}".
       - Use standard SVG tags: <svg width="100%" height="auto" viewBox="0 0 800 200" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 1.5rem; margin: 1.5rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;">
       - Build a gorgeous flowchart or process map containing at least 4 nodes/stages represented as styled <rect> or <circle> elements, connected by clean lines or arrow paths (using <polygon> or stroke markers).
       - Ensure all text labels inside the SVG are crisp, visible, and match a dark theme palette: use colors like cyber teal (#06b6d4), violet (#8b5cf6), deep purple, and white (#ffffff). Ensure text is styled with fill="#ffffff" or similar bright text colors.
       - The SVG must be clean, syntactically correct, and stand out as a high-quality visual element.
    6. INCORPORATE ILLUSTRATIVE IMAGE: Dynamically embed 1 high-quality illustrative image in the HTML using this exact HTML structure:
       <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" alt="${article.title}" style="max-width: 100%; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
    7. INTERNAL LINKS: Automatically and naturally link to our tools:
       - Link to "/text-to-speech" (use anchor text like "AI Text to Speech tool" or "free text-to-speech converter").
       - Link to "/video-dubbing" (use anchor text like "Subtitle Voiceover Dubber" or "video subtitle translator").
       - These links should be integrated naturally in paragraph text.
    8. TONAL QUALITY: Write in an elite, conversational, and authoritative tone. Avoid boring AI introductory phrases.
    9. FAQ: The FAQ section should be highly structured with detailed responses to resolve common user search queries.
    10. RETURN FORMAT: Return the result in a clean JSON format matching the schema provided. Generate 3 to 5 tags.
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        slug: { type: "STRING" },
        description: { type: "STRING", description: "Compelling search description, max 160 characters." },
        content: { type: "STRING", description: "HTML body content. Contains h2, h3, paragraphs, lists, inline SVG diagrams, and images." },
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
        temperature: 0.8
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
        
        // Populate published date
        postData.publishedAt = new Date().toISOString();
        postData.slug = article.slug; // ensure it matches configuration slug

        const filePath = path.join(postsDir, `${article.slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(postData, null, 2), 'utf8');
        console.log(`✅ Success! Generated and saved: ${article.slug}.json (Estimated word count: ${postData.content.split(/\s+/).length} words)`);
        generated = true;
      } catch (err) {
        attempts--;
        console.warn(`⚠️ Error generating "${article.title}": ${err.message}. Remaining attempts: ${attempts}`);
        if (attempts > 0) {
          await sleep(6000);
        } else {
          console.error(`❌ Failed to generate "${article.title}" after 3 attempts.`);
        }
      }
    }

    // Delay between iterations to stay safe within API rate-limits
    await sleep(5000);
  }

  console.log("🎉 All Evergreen SEO blog generation runs completed!");
}

runGenerator();
