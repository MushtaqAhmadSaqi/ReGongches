import cv2
import os

video_path = r"d:\E-comerence\css\E com.mp4"
output_dir = r"C:\Users\Miraan gee\.gemini\antigravity-ide\brain\0f7c63f7-91e9-4107-ace1-253c05f8496a"

os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("ERROR: Could not open video file")
    exit(1)

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
duration = total_frames / fps if fps > 0 else 0
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"Video info: {width}x{height}, {fps:.1f}fps, {duration:.1f}s, {total_frames} frames")

# Extract 12 evenly spaced frames across the video
num_samples = 12
sample_positions = [int(i * total_frames / num_samples) for i in range(num_samples)]

saved = []
for i, frame_pos in enumerate(sample_positions):
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
    ret, frame = cap.read()
    if ret:
        timestamp = frame_pos / fps if fps > 0 else 0
        filename = os.path.join(output_dir, f"frame_{i:02d}_{timestamp:.1f}s.jpg")
        cv2.imwrite(filename, frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        saved.append(filename)
        print(f"Saved frame {i}: {filename} (t={timestamp:.1f}s)")

cap.release()
print(f"\nDone! Extracted {len(saved)} frames.")
