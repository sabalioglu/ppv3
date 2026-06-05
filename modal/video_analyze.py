# Stovd video analyzer — standalone Modal app.
#
# Drop-in replacement for the old VPS `POST /analyze`. Given a video URL it
# downloads the clip (yt-dlp for pages like TikTok/YouTube, direct stream for a
# CDN MP4 such as Instagram's Apify-resolved URL), then:
#   - ffmpeg extracts 16k mono audio  -> faster-whisper transcript + language
#   - ffmpeg extracts scene-change keyframes -> base64 JPEGs (no data: prefix)
# Returns the exact AnalyzeBundle the Stovd `video-intelligence` edge fn expects:
#   { platform, title, caption, thumbnail, webpage_url, duration,
#     transcript, language, frame_count, frames[] }
#
# This app is fully isolated — it shares nothing with `creative-cloner-backend`.
import base64
import os
import subprocess
import tempfile

import modal

app = modal.App("stovd-video-analyze")

# whisper model cache survives across cold starts
model_cache = modal.Volume.from_name("stovd-whisper-cache", create_if_missing=True)
CACHE_DIR = "/models"  # dedicated empty mount; build never writes here

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi[standard]",
        "yt-dlp",
        "faster-whisper",
        "requests",
    )
    .env({"HF_HOME": CACHE_DIR})
)

# Bearer secret shared with the edge fn (VIDEO_SVC_SECRET).
_SECRETS = [modal.Secret.from_name("stovd-video-secret")]

WHISPER_MODEL = "base"  # CPU int8 — fast enough for <3 min reels
MAX_FRAMES = 14


def _run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def _download(url: str, workdir: str) -> dict:
    """Return {path, info} — yt-dlp for known sites, direct stream otherwise."""
    import requests
    import yt_dlp

    out = os.path.join(workdir, "video.%(ext)s")
    info: dict = {}
    # 1) yt-dlp (TikTok / YouTube / generic extractors)
    try:
        ydl_opts = {
            "outtmpl": out,
            "quiet": True,
            "no_warnings": True,
            "format": "mp4/best",
            "noplaylist": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            meta = ydl.extract_info(url, download=True)
            path = ydl.prepare_filename(meta)
            info = {
                "title": meta.get("title"),
                "caption": meta.get("description"),
                "thumbnail": meta.get("thumbnail"),
                "duration": meta.get("duration"),
                "platform": meta.get("extractor_key"),
                "webpage_url": meta.get("webpage_url") or url,
            }
            if os.path.exists(path):
                return {"path": path, "info": info}
    except Exception as e:
        print(f"yt-dlp failed ({e}); falling back to direct download")

    # 2) direct stream (Apify CDN MP4 etc.)
    path = os.path.join(workdir, "video.mp4")
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
    info.setdefault("webpage_url", url)
    return {"path": path, "info": info}


def _transcribe(video_path: str, workdir: str) -> dict:
    from faster_whisper import WhisperModel

    audio = os.path.join(workdir, "audio.wav")
    r = _run(["ffmpeg", "-y", "-i", video_path, "-vn",
              "-ar", "16000", "-ac", "1", "-f", "wav", audio])
    if r.returncode != 0 or not os.path.exists(audio):
        return {"transcript": "", "language": None}

    model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8",
                         download_root=CACHE_DIR)
    segments, meta = model.transcribe(audio, vad_filter=True)
    text = " ".join(s.text.strip() for s in segments).strip()
    return {"transcript": text, "language": getattr(meta, "language", None)}


def _keyframes(video_path: str, workdir: str) -> list[str]:
    """Scene-change keyframes (fallback to fps sampling), base64 JPEG."""
    frames_dir = os.path.join(workdir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    pat = os.path.join(frames_dir, "f_%03d.jpg")

    _run(["ffmpeg", "-y", "-i", video_path,
          "-vf", "select='gt(scene,0.3)',scale=512:-1",
          "-vsync", "vfr", "-frames:v", str(MAX_FRAMES), pat])

    files = sorted(os.listdir(frames_dir))
    if len(files) < 3:  # not enough scene cuts -> sample 1 frame / 2s
        for f in files:
            os.remove(os.path.join(frames_dir, f))
        _run(["ffmpeg", "-y", "-i", video_path,
              "-vf", "fps=1/2,scale=512:-1",
              "-frames:v", str(MAX_FRAMES), pat])
        files = sorted(os.listdir(frames_dir))

    out: list[str] = []
    for f in files[:MAX_FRAMES]:
        with open(os.path.join(frames_dir, f), "rb") as fh:
            out.append(base64.b64encode(fh.read()).decode("ascii"))
    return out


@app.function(
    image=image,
    volumes={CACHE_DIR: model_cache},
    secrets=_SECRETS,
    timeout=600,
    scaledown_window=120,
)
@modal.asgi_app()
def web():
    from fastapi import FastAPI, Header, HTTPException, Request

    api = FastAPI()

    @api.post("/analyze")
    async def analyze(request: Request, authorization: str = Header(default="")):
        secret = os.environ.get("VIDEO_SVC_SECRET", "")
        if secret and authorization != f"Bearer {secret}":
            raise HTTPException(status_code=401, detail="unauthorized")
        item = await request.json()
        return _analyze_impl(item)

    @api.get("/health")
    async def health():
        return {"ok": True}

    return api


def _analyze_impl(item: dict):
    from fastapi.responses import JSONResponse

    url = (item or {}).get("url", "").strip()
    if not url:
        return JSONResponse({"error": "url required"}, status_code=400)

    with tempfile.TemporaryDirectory() as workdir:
        try:
            dl = _download(url, workdir)
        except Exception as e:
            return JSONResponse({"error": "download failed", "detail": str(e)},
                                status_code=502)
        path, info = dl["path"], dl["info"]
        try:
            audio = _transcribe(path, workdir)
        except Exception as e:
            print(f"transcribe error: {e}")
            audio = {"transcript": "", "language": None}
        try:
            frames = _keyframes(path, workdir)
        except Exception as e:
            print(f"keyframe error: {e}")
            frames = []

    bundle = {
        "platform": info.get("platform"),
        "title": info.get("title"),
        "caption": info.get("caption"),
        "thumbnail": info.get("thumbnail"),
        "webpage_url": info.get("webpage_url", url),
        "duration": info.get("duration"),
        "transcript": audio["transcript"],
        "language": audio["language"],
        "frame_count": len(frames),
        "frames": frames,
    }
    return JSONResponse(bundle)
