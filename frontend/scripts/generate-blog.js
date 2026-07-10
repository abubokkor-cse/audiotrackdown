const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateSingleBlog(existingTitles) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined.");
    process.exit(1);
  }

  const postsDir = path.join(__dirname, '../content/blog/posts');

  // Custom system instructions for Gemini
  const prompt = `
  Write a high-quality, comprehensive, and viral SEO-optimized blog post in English.
  
  Core Guidelines for Topic & Tone:
  1. Pick a NEW, unique trending topic that is NOT in this list of already written posts: ${JSON.stringify(existingTitles)}.
  2. The topic must focus on the core services offered by our platform, "audiotrackdown" (https://audiotrackdown.com). These services include:
     - YouTube & Facebook Audio Extractor: Download high-quality MP3, M4A, or WebM audio from any video.
     - Multilingual Dubbed Audio Track Extractor: Extract and download different language dubbed audio tracks (e.g., download Hindi, Bangla, or Spanish audio tracks from English videos like MrBeast's).
     - Subtitles & Captions Downloader: Download subtitle files in SRT, WebVTT, or JSON3 formats in 157+ languages.
     - AI Subtitle Translation & Fallback: Translate video captions automatically to another language (e.g. translating English captions to Bangla, Hindi, Arabic, Spanish, etc.) using AI when native tracks aren't available.
  3. Pick topics that highlight user use cases:
     - How to watch/listen to an English video in your local language (Bangla, Hindi, Spanish, etc.) by extracting dubbed audio tracks or translating subtitles.
     - Step-by-step guides to extract subtitles (SRT/VTT) from any video to read or translate.
     - Tips for content creators to repurpose video audio into podcasts, audiobooks, or blog posts.
     - Explanations of caption formats (SRT vs VTT vs JSON) and how to convert/download them.
  4. Tone must be highly engaging, helpful, actionable, and optimized for search click-through rate (CTR).

  Writing Requirements:
  1. The blog post must be at least 1,200 words long.
  2. Provide practical, step-by-step guidance on how to solve these problems using audiotrackdown's free tools.
  3. Divide the post into logical sections with clear headings.
  4. Write the content as a valid HTML string using ONLY standard text formatting tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <pre>, <code>. Do NOT wrap the content in <html>, <head>, or <body> tags.
  5. Include a call-to-action (CTA) inside the blog post encouraging readers to try audiotrackdown's free tools (such as the YouTube Audio Extractor, Subtitle Downloader, or Dubbed Audio Downloader) at the homepage "/".
  6. Return the result in a clean JSON format matching the schema provided. Make sure to generate 3-5 tags.
  `;

  // Gemini API URL for 2.5-flash
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Structured Output Schema
  const schema = {
    type: "OBJECT",
    properties: {
      title: { 
        type: "STRING", 
        description: "The catchy, viral headline of the blog post." 
      },
      slug: { 
        type: "STRING", 
        description: "A URL-safe string representation of the title (e.g. gpt-4o-omni-youtube-growth)." 
      },
      description: { 
        type: "STRING", 
        description: "A compelling meta description summarizing the post (max 160 characters)." 
      },
      content: { 
        type: "STRING", 
        description: "The full HTML body string of the blog post (containing h2, h3, p, ul, ol, li, strong, etc.)." 
      },
      tags: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "3 to 5 relevant keyword tags for search optimization."
      },
      readingTime: { 
        type: "INTEGER", 
        description: "Estimated reading time in minutes." 
      }
    },
    required: ["title", "slug", "description", "content", "tags", "readingTime"]
  };

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.75
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Parse the generated text response (which is a JSON string matching our schema)
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Clean any markdown wrappers if the model includes them
    let cleanText = generatedText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    
    const postData = JSON.parse(cleanText);

    // Add publication date
    postData.publishedAt = new Date().toISOString();

    // Verify and clean slug (ensure it is lowercase and alphanumeric-dash only)
    postData.slug = postData.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const filePath = path.join(postsDir, `${postData.slug}.json`);
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log(`✅ Success! Generated and saved blog post:`);
    console.log(`📌 Title: ${postData.title}`);
    console.log(`📌 Slug: ${postData.slug}`);
    console.log(`📌 File: ${filePath}`);

  } catch (error) {
    console.error("❌ Failed to generate blog post:", error.message);
    throw error;
  }
}

async function main() {
  const postsDir = path.join(__dirname, '../content/blog/posts');
  // Ensure directory exists
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const postsToGenerate = 1;
  console.log(`🚀 Starting generation of ${postsToGenerate} daily blog post...`);

  for (let i = 0; i < postsToGenerate; i++) {
    console.log(`\n📝 Generating post ${i + 1}/${postsToGenerate}...`);
    
    // Read all existing JSON files to get their titles (to avoid duplicates)
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const existingTitles = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(postsDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (content.title) {
          existingTitles.push(content.title);
        }
      } catch (e) {
        console.warn(`Could not read existing file ${file}:`, e.message);
      }
    }

    console.log(`📚 Read ${existingTitles.length} existing blog posts to prevent duplicates.`);
    
    try {
      await generateSingleBlog(existingTitles);
    } catch (e) {
      console.error(`❌ Error on post ${i + 1}: ${e.message}`);
      process.exit(1);
    }
    
    if (i < postsToGenerate - 1) {
      console.log(`⏳ Waiting 5 seconds before the next post to avoid rate limits...`);
      await delay(5000);
    }
  }
  console.log(`\n🎉 Completed generating all daily blog posts!`);
}

main();
