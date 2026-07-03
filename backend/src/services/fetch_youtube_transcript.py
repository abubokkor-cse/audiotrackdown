import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def format_time(seconds):
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d}.{ms:03d}"

def format_to_vtt(cues):
    out = "WEBVTT\n\n"
    for cue in cues:
        # Check if the cue is a dict or an object
        if isinstance(cue, dict):
            start = cue.get('start', 0)
            duration = cue.get('duration', 0)
            text = cue.get('text', '')
        else:
            start = getattr(cue, 'start', 0)
            duration = getattr(cue, 'duration', 0)
            text = getattr(cue, 'text', '')
        
        start_str = format_time(start)
        end_str = format_time(start + duration)
        out += f"{start_str} --> {end_str}\n{text}\n\n"
    return out.strip() + "\n"

import os

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing video_id or target_lang"}))
        sys.exit(1)

    # Resolve rotating proxy from environment
    proxy = os.environ.get('ROTATING_PROXIES') or os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy')
    proxies = None
    if proxy:
        proxies = {"http": proxy, "https": proxy}

    if sys.argv[1] == '--list':
        video_id = sys.argv[2]
        try:
            list_transcripts = YouTubeTranscriptApi.list_transcripts(video_id, proxies=proxies)
            transcripts_data = []
            for t in list_transcripts:
                transcripts_data.append({
                    "language_code": t.language_code,
                    "language": t.language,
                    "is_generated": t.is_generated,
                    "is_translatable": t.is_translatable,
                    "translation_languages": [
                        {"language_code": tl.language_code, "language": tl.language}
                        for tl in t.translation_languages
                    ] if t.is_translatable else []
                })
            print(json.dumps({
                "success": True,
                "transcripts": transcripts_data
            }))
            return
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
            sys.exit(1)

    video_id = sys.argv[1]
    target_lang = sys.argv[2]

    try:
        list_transcripts = YouTubeTranscriptApi.list_transcripts(video_id, proxies=proxies)
        
        # 1. Try to find a direct match
        try:
            transcript = list_transcripts.find_transcript([target_lang])
            cues = transcript.fetch()
            vtt_content = format_to_vtt(cues)
            print(json.dumps({
                "success": True,
                "language": target_lang,
                "is_translated": False,
                "vtt": vtt_content
            }))
            return
        except Exception:
            pass

        # 2. Try to translate using youtube-transcript-api
        try:
            transcript = None
            try:
                transcript = list_transcripts.find_manually_created_transcript()
            except Exception:
                try:
                    transcript = list_transcripts.find_generated_transcript()
                except Exception:
                    pass
            
            if not transcript:
                for t in list_transcripts:
                    transcript = t
                    break
            
            if transcript:
                translated_transcript = transcript.translate(target_lang)
                cues = translated_transcript.fetch()
                vtt_content = format_to_vtt(cues)
                print(json.dumps({
                    "success": True,
                    "language": target_lang,
                    "is_translated": True,
                    "vtt": vtt_content
                }))
                return
        except Exception:
            pass

        # 3. Fall back to returning the best original transcript
        try:
            transcript = None
            try:
                transcript = list_transcripts.find_manually_created_transcript()
            except Exception:
                try:
                    transcript = list_transcripts.find_generated_transcript()
                except Exception:
                    pass
            
            if not transcript:
                for t in list_transcripts:
                    transcript = t
                    break
            
            if transcript:
                cues = transcript.fetch()
                vtt_content = format_to_vtt(cues)
                print(json.dumps({
                    "success": True,
                    "language": transcript.language_code,
                    "is_translated": False,
                    "original_language": transcript.language_code,
                    "requires_gemini_translation": True,
                    "vtt": vtt_content
                }))
                return
            else:
                raise Exception("No transcripts found for this video")
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to retrieve original transcript: {str(e)}"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
