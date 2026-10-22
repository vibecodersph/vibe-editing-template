"""Contact sheets for a cut: python sheet.py <video.mp4> <out-prefix> [fps] [cols] [rows]
Frames carry a burned-in timestamp so a reviewer can cite them."""
import os, subprocess, sys

video, prefix = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 8
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 3
font = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "video", "assets", "fonts", "Gelasio.ttf").replace("\\", "/").replace(":", "\\:")
vf = (f"fps={fps},scale=270:480:flags=lanczos,"
      f"drawtext=fontfile='{font}':text='%{{pts\\:hms}}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,"
      f"tile={cols}x{rows}:padding=4:margin=4:color=0x101018")
os.makedirs(os.path.dirname(prefix) or ".", exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", vf, "-vsync", "0", prefix + "-%02d.jpg"], check=True)
print([f for f in sorted(os.listdir(os.path.dirname(prefix) or ".")) if f.startswith(os.path.basename(prefix))])
