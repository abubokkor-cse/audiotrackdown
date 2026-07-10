import sys
import json
import os
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
        # Support both dict and object style cues
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

def build_api(proxy_url=None):
    """Build YouTubeTranscriptApi instance with optional proxy support."""
    if proxy_url:
        try:
            from youtube_transcript_api.proxies import GenericProxyConfig
            return YouTubeTranscriptApi(
                proxy_config=GenericProxyConfig(
                    http_url=proxy_url,
                    https_url=proxy_url,
                )
            )
        except ImportError:
            # Older version of library — fall back to instance without proxy
            pass
    return YouTubeTranscriptApi()

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing video_id or target_lang"}))
        sys.exit(1)

    # Resolve rotating proxy from environment variables
    proxy_url = (
        os.environ.get('ROTATING_PROXIES') or
        os.environ.get('HTTP_PROXY') or
        os.environ.get('http_proxy')
    )

    ytt_api = build_api(proxy_url)

    if sys.argv[1] == '--list':
        video_id = sys.argv[2]
        try:
            transcript_list = ytt_api.list(video_id)
            transcripts_data = []
            for t in transcript_list:
                transcripts_data.append({
                    "language_code": t.language_code,
                    "language": t.language,
                    "is_generated": t.is_generated,
                    "is_translatable": t.is_translatable,
                    "translation_languages": [
                        {"language_code": tl["language_code"], "language": tl["language"]}
                        for tl in (t.translation_languages if t.is_translatable else [])
                    ]
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
        transcript_list = ytt_api.list(video_id)

        # 1. Try to find a direct match for the requested language
        try:
            transcript = transcript_list.find_transcript([target_lang])
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

        # 2. Try native YouTube translation to the requested language
        try:
            source_transcript = None
            try:
                source_transcript = transcript_list.find_manually_created_transcript()
            except Exception:
                try:
                    source_transcript = transcript_list.find_generated_transcript()
                except Exception:
                    pass

            if not source_transcript:
                for t in transcript_list:
                    source_transcript = t
                    break

            if source_transcript:
                translated = source_transcript.translate(target_lang)
                cues = translated.fetch()
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

        # 3. Fall back: return best original transcript and let Node.js/Gemini translate
        try:
            best_transcript = None
            try:
                best_transcript = transcript_list.find_manually_created_transcript()
            except Exception:
                try:
                    best_transcript = transcript_list.find_generated_transcript()
                except Exception:
                    pass

            if not best_transcript:
                for t in transcript_list:
                    best_transcript = t
                    break

            if best_transcript:
                cues = best_transcript.fetch()
                vtt_content = format_to_vtt(cues)
                print(json.dumps({
                    "success": True,
                    "language": best_transcript.language_code,
                    "is_translated": False,
                    "original_language": best_transcript.language_code,
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
