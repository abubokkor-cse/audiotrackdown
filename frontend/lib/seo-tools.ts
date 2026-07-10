export interface SEOToolPage {
  slug: string; // e.g. "extract-youtube-audio-tracks" or "es/extraer-audio-youtube"
  focusKeyword: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  platform: 'youtube' | 'facebook' | 'both';
  routeType: 'audio' | 'text';
  sampleLanguages: string;
  primaryIntent: string;
  primaryAction: string;
}

export const SEO_TOOL_PAGES: SEOToolPage[] = [
  {
    slug: 'extract-youtube-audio-tracks',
    focusKeyword: 'extract youtube audio tracks',
    h1: 'Extract High-Quality Audio Tracks from YouTube',
    metaTitle: 'Extract YouTube Audio Tracks (MP3) - AudioTrackDown',
    metaDescription: 'Extract original high-quality audio tracks & AI dubs from any YouTube URL. No video, pure audio conversion.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Spanish, Hindi, French',
    primaryIntent: 'extract audio tracks',
    primaryAction: 'extract high-quality audio tracks'
  },
  {
    slug: 'youtube-multi-language-audio-download',
    focusKeyword: 'youtube multi language audio download',
    h1: 'Download YouTube Multi-Language Audio Tracks',
    metaTitle: 'Download YouTube Multi-Language Audio Tracks',
    metaDescription: 'Extract alternative multi-language audio tracks & AI dubs from YouTube videos instantly in high-quality MP3.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Spanish, Hindi, Arabic',
    primaryIntent: 'download alternative audio tracks',
    primaryAction: 'download multi-language voice dubs'
  },
  {
    slug: 'download-youtube-srt-subtitles',
    focusKeyword: 'download youtube srt subtitles',
    h1: 'Download YouTube Subtitles in SRT Format',
    metaTitle: 'Download YouTube SRT Subtitles',
    metaDescription: 'Extract and download original or auto-translated YouTube subtitles as clean SRT files. Fast, free, and accurate.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Bengali',
    primaryIntent: 'download subtitles',
    primaryAction: 'download clean SRT files'
  },
  {
    slug: 'youtube-transcript-generator-txt',
    focusKeyword: 'youtube transcript generator txt',
    h1: 'Generate Clean TXT Transcripts from YouTube',
    metaTitle: 'YouTube Transcript Generator to TXT',
    metaDescription: 'Convert any YouTube video into a clean text transcript. Download full TXT files without timestamps instantly.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, French',
    primaryIntent: 'generate text transcripts',
    primaryAction: 'download clean TXT files'
  },
  {
    slug: 'facebook-video-audio-extractor',
    focusKeyword: 'facebook video audio extractor',
    h1: 'Extract High-Quality Audio from Facebook Videos',
    metaTitle: 'Facebook Video Audio Extractor',
    metaDescription: 'Extract high-quality MP3 audio tracks directly from Facebook URLs. Fast processing with no video downloads.',
    platform: 'facebook',
    routeType: 'audio',
    sampleLanguages: 'English, Spanish, Portuguese',
    primaryIntent: 'extract audio',
    primaryAction: 'download standalone MP3 audio'
  },
  {
    slug: 'download-facebook-subtitles-vtt',
    focusKeyword: 'download facebook subtitles vtt',
    h1: 'Extract and Download Facebook Subtitles as VTT',
    metaTitle: 'Download Facebook Subtitles (VTT)',
    metaDescription: 'Free tool to parse and download closed captions from Facebook videos in VTT format. No installation needed.',
    platform: 'facebook',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, French',
    primaryIntent: 'download subtitles',
    primaryAction: 'download VTT caption files'
  },
  {
    slug: 'youtube-ai-dub-track-extractor',
    focusKeyword: 'youtube ai dub track extractor',
    h1: 'Extract AI Dubbed Voice Tracks from YouTube',
    metaTitle: 'Extract YouTube AI Dub Track',
    metaDescription: 'Get alternative language voice tracks and AI dubs from YouTube videos. Download high-fidelity voice-only MP3s.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Spanish, Hindi, Arabic',
    primaryIntent: 'extract voice dubs',
    primaryAction: 'extract secondary dubbed audio tracks'
  },
  {
    slug: 'convert-youtube-to-vtt',
    focusKeyword: 'convert youtube to vtt',
    h1: 'Convert YouTube Closed Captions to WebVTT',
    metaTitle: 'Convert YouTube to VTT Subtitles',
    metaDescription: 'Extract and convert YouTube video captions to clean WebVTT (.vtt) files for media players and development.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Japanese',
    primaryIntent: 'convert captions to VTT',
    primaryAction: 'download WebVTT subtitle files'
  },
  {
    slug: 'extract-audio-by-language',
    focusKeyword: 'extract audio by language',
    h1: 'Extract Video Audio Tracks by Language',
    metaTitle: 'Extract Video Audio Tracks by Language',
    metaDescription: 'Pull multi-language voice feeds from online videos. Isolate Spanish, Hindi, or Arabic audio tracks as MP3 files.',
    platform: 'both',
    routeType: 'audio',
    sampleLanguages: 'Spanish, Hindi, Arabic',
    primaryIntent: 'extract audio by language',
    primaryAction: 'isolate specific language voice tracks'
  },
  {
    slug: 'es/extraer-audio-youtube',
    focusKeyword: 'extraer audio de youtube',
    h1: 'Extraer Pistas de Audio de YouTube en Alta Calidad',
    metaTitle: 'Extraer Audio de YouTube (MP3)',
    metaDescription: 'Extrae pistas de audio originales y doblajes de IA de cualquier video de YouTube. Descarga rápida en formato MP3.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'español, inglés, portugués',
    primaryIntent: 'extraer audio',
    primaryAction: 'descargar audios en MP3'
  },
  {
    slug: 'hi/youtube-audio-nikale',
    focusKeyword: 'youtube se audio nikale',
    h1: 'YouTube वीडियो से ऑडियो ट्रैक निकालें',
    metaTitle: 'YouTube se Audio Nikale - MP3 Extractor',
    metaDescription: 'किसी भी YouTube वीडियो से मूल ऑडियो और बहु-भाषी डब ट्रैक सीधे MP3 में डाउनलोड करें। सुरक्षित और तेज़।',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Hindi, English, Spanish',
    primaryIntent: 'ऑडियो ट्रैक डाउनलोड करें',
    primaryAction: 'MP3 फ़ाइलें डाउनलोड करें'
  },
  {
    slug: 'de/youtube-untertitel-herunterladen',
    focusKeyword: 'youtube untertitel herunterladen',
    h1: 'YouTube-Untertitel im SRT- und VTT-Format downloaden',
    metaTitle: 'YouTube Untertitel Herunterladen',
    metaDescription: 'Sichern Sie sich Untertitel und Transkripte von YouTube-Videos als saubere SRT-, VTT- oder TXT-Dateien.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'Deutsch, Englisch, Französisch',
    primaryIntent: 'Untertitel herunterladen',
    primaryAction: 'SRT- und VTT-Dateien downloaden'
  },
  {
    slug: 'pt/extrair-legendas-facebook',
    focusKeyword: 'extrair legendas do facebook',
    h1: 'Extrair e Baixar Legendas de Vídeos do Facebook',
    metaTitle: 'Extrair Legendas do Facebook (SRT)',
    metaDescription: 'Baixe facilmente arquivos de legenda SRT e VTT de vídeos do Facebook. Conversão direta online e gratuita.',
    platform: 'facebook',
    routeType: 'text',
    sampleLanguages: 'português, inglês, espanhol',
    primaryIntent: 'baixar legendas',
    primaryAction: 'extrair arquivos SRT e VTT'
  },
  {
    slug: 'fr/extracteur-audio-youtube',
    focusKeyword: 'extracteur audio youtube',
    h1: 'Extracteur de Pistes Audio YouTube sans Vidéo',
    metaTitle: 'Extracteur Audio YouTube MP3',
    metaDescription: 'Extrayez les pistes audio originales et les doublages multilingues des vidéos YouTube. Téléchargement MP3 direct.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'français, anglais, espagnol',
    primaryIntent: 'extraire l\'audio',
    primaryAction: 'télécharger des fichiers MP3'
  },
  {
    slug: 'youtube-spanish-audio-track-downloader',
    focusKeyword: 'youtube spanish audio track downloader',
    h1: 'Download Spanish Audio Track from YouTube Videos',
    metaTitle: 'Download YouTube Spanish Audio Track',
    metaDescription: 'Isolate and download the alternative Spanish voice track or AI-dubbed track from any multi-language YouTube video.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Spanish',
    primaryIntent: 'download Spanish dubs',
    primaryAction: 'extract Spanish audio voice tracks'
  },
  {
    slug: 'youtube-hindi-voice-track-extractor',
    focusKeyword: 'youtube hindi voice track extractor',
    h1: 'Extract Hindi Voice Tracks from YouTube Videos',
    metaTitle: 'Extract YouTube Hindi Voice Track',
    metaDescription: 'Extract and download secondary Hindi audio dubs from YouTube videos as high-quality MP3 tracks.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Hindi',
    primaryIntent: 'extract Hindi audio',
    primaryAction: 'download secondary Hindi audio dubs'
  },
  {
    slug: 'download-arabic-audio-from-youtube',
    focusKeyword: 'download arabic audio from youtube',
    h1: 'Extract and Download Arabic Audio Tracks from YouTube',
    metaTitle: 'Download Arabic Audio from YouTube',
    metaDescription: 'Save the alternative Arabic audio feed from multi-language YouTube videos into standalone high-quality MP3s.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Arabic',
    primaryIntent: 'download Arabic audio',
    primaryAction: 'extract standalone Arabic audio tracks'
  },
  {
    slug: 'youtube-to-srt-converter-free',
    focusKeyword: 'youtube to srt converter free',
    h1: 'Free Online YouTube to SRT Subtitle Converter',
    metaTitle: 'YouTube to SRT Converter Free',
    metaDescription: 'Programmatically parse video timelines to generate flawless SRT files from YouTube closed captions.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, French',
    primaryIntent: 'convert to SRT',
    primaryAction: 'generate timing-perfect SRT files'
  },
  {
    slug: 'extract-closed-captions-online',
    focusKeyword: 'extract closed captions online',
    h1: 'Extract Closed Captions and Subtitles Online',
    metaTitle: 'Extract Closed Captions Online',
    metaDescription: 'Pull clean subtitles, text transcripts, and multi-language closed captions from YouTube and Facebook links.',
    platform: 'both',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Hindi',
    primaryIntent: 'extract closed captions',
    primaryAction: 'download clean transcripts'
  },
  {
    slug: 'youtube-clean-text-transcript-downloader',
    focusKeyword: 'youtube clean text transcript downloader',
    h1: 'Download Clean YouTube Text Transcripts',
    metaTitle: 'YouTube Text Transcript Downloader',
    metaDescription: 'Get timestamp-free, raw text transcripts from any YouTube video. Perfect for reading, quoting, and AI parsing.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, German',
    primaryIntent: 'download transcripts',
    primaryAction: 'download raw text transcripts'
  },
  {
    slug: 'facebook-mp3-track-extractor',
    focusKeyword: 'facebook mp3 track extractor',
    h1: 'Extract Standalone MP3 Tracks from Facebook',
    metaTitle: 'Facebook MP3 Track Extractor',
    metaDescription: 'Convert Facebook video URLs to high-bitrate MP3 audio tracks instantly. Clean, secure extraction process.',
    platform: 'facebook',
    routeType: 'audio',
    sampleLanguages: 'English, Portuguese, Spanish',
    primaryIntent: 'extract MP3 tracks',
    primaryAction: 'convert Facebook URLs to MP3'
  },
  {
    slug: 'save-youtube-voice-only',
    focusKeyword: 'save youtube voice only',
    h1: 'Save Voice-Only Audio Tracks from YouTube',
    metaTitle: 'Save YouTube Voice-Only Tracks',
    metaDescription: 'Strip video elements and download clean voice-only or multi-language dubbed audio feeds from YouTube.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'English, Spanish, Hindi',
    primaryIntent: 'save voice-only tracks',
    primaryAction: 'download clean audio feeds'
  },
  {
    slug: 'youtube-bilingual-subtitles-extractor',
    focusKeyword: 'youtube bilingual subtitles extractor',
    h1: 'Extract Multi-Language & Bilingual Subtitles',
    metaTitle: 'YouTube Bilingual Subtitles Extractor',
    metaDescription: 'Download primary and alternative language subtitle tracks simultaneously from multi-language YouTube videos.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, French',
    primaryIntent: 'extract bilingual subtitles',
    primaryAction: 'download multi-language subtitle tracks'
  },
  {
    slug: 'convert-facebook-video-to-srt',
    focusKeyword: 'convert facebook video to srt',
    h1: 'Convert Facebook Video Captions to SRT Format',
    metaTitle: 'Convert Facebook Video to SRT',
    metaDescription: 'Parse Facebook video links to instantly generate downloadable, timing-accurate SRT subtitle files.',
    platform: 'facebook',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Portuguese',
    primaryIntent: 'convert captions to SRT',
    primaryAction: 'generate SRT subtitle files'
  },
  {
    slug: 'get-youtube-auto-translated-subtitles',
    focusKeyword: 'get youtube auto translated subtitles',
    h1: 'Download Auto-Translated Subtitles from YouTube',
    metaTitle: 'Get YouTube Auto-Translated Subs',
    metaDescription: 'Extract and download official auto-translated subtitle layers from YouTube in SRT, VTT, or TXT formats.',
    platform: 'youtube',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Bengali',
    primaryIntent: 'download translated subtitles',
    primaryAction: 'extract auto-translated subtitle layers'
  },
  {
    slug: 'parse-video-subtitles-to-text',
    focusKeyword: 'parse video subtitles to text',
    h1: 'Parse Video Subtitles and Convert to Raw Text',
    metaTitle: 'Parse Video Subtitles to Text',
    metaDescription: 'Turn closed captions into readable text paragraphs. Works with YouTube and Facebook video subtitle tracks.',
    platform: 'both',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, Hindi',
    primaryIntent: 'parse subtitles to text',
    primaryAction: 'convert captions into text paragraphs'
  },
  {
    slug: 'download-original-audio-track',
    focusKeyword: 'download original audio track',
    h1: 'Download Original Highest Quality Video Audio Track',
    metaTitle: 'Download Original Audio Track (MP3)',
    metaDescription: 'Isolate and preserve the exact original audio stream or alternative language track from online videos.',
    platform: 'both',
    routeType: 'audio',
    sampleLanguages: 'English, Spanish, Arabic',
    primaryIntent: 'download original audio',
    primaryAction: 'isolate the original audio stream'
  },
  {
    slug: 'youtube-dubbed-audio-ripper',
    focusKeyword: 'youtube dubbed audio ripper',
    h1: 'Rip Alternative Dubbed Audio Tracks from YouTube',
    metaTitle: 'YouTube Dubbed Audio Track Ripper',
    metaDescription: 'Rip specific multi-language voice-over tracks from YouTube videos without downloading the video stream.',
    platform: 'youtube',
    routeType: 'audio',
    sampleLanguages: 'Spanish, Hindi, German',
    primaryIntent: 'rip dubbed audio',
    primaryAction: 'rip alternative voice-over tracks'
  },
  {
    slug: 'vtt-to-txt-transcript-converter',
    focusKeyword: 'vtt to txt transcript converter',
    h1: 'Convert Video Subtitles (VTT/SRT) to TXT',
    metaTitle: 'VTT & SRT to TXT Converter',
    metaDescription: 'Strip out formatting code and timing markers to turn VTT or SRT subtitle tracks into standard text.',
    platform: 'both',
    routeType: 'text',
    sampleLanguages: 'English, Spanish, French',
    primaryIntent: 'convert subtitles to TXT',
    primaryAction: 'convert VTT or SRT files to standard text'
  },
  {
    slug: 'facebook-live-audio-extractor',
    focusKeyword: 'facebook live audio extractor',
    h1: 'Extract Audio Tracks from Finished Facebook Lives',
    metaTitle: 'Facebook Live Audio Extractor',
    metaDescription: 'Turn completed Facebook Live streams into high-quality MP3 audio tracks. Fast cloud-based extraction.',
    platform: 'facebook',
    routeType: 'audio',
    sampleLanguages: 'English, Portuguese, Spanish',
    primaryIntent: 'extract Live audio',
    primaryAction: 'convert Facebook Live streams into MP3'
  }
];

export function getSEOToolPage(slugArr: string[]): SEOToolPage | null {
  const fullSlug = slugArr.join('/');
  return SEO_TOOL_PAGES.find(p => p.slug === fullSlug) || null;
}
