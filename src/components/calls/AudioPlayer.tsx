import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/format";

export function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnd = () => setPlaying(false);
    const onErr = () => setFailed(true);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
    };
  }, [src]);

  const toggle = async () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setFailed(true);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">
        This recording couldn't be loaded. It may have expired.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <audio ref={ref} src={src} preload="metadata" />
      <Button
        size="icon"
        className="size-10 shrink-0 rounded-full"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <span className="tabular w-12 text-xs text-muted-foreground">
        {formatDuration(Math.floor(time))}
      </span>
      <Slider
        value={[time]}
        max={dur || 1}
        step={0.1}
        onValueChange={([v = 0]) => {
          if (ref.current) ref.current.currentTime = v;
          setTime(v);
        }}
        aria-label="Playback position"
        className="flex-1"
      />
      <span className="tabular w-12 text-right text-xs text-muted-foreground">
        {dur ? formatDuration(Math.floor(dur)) : "—"}
      </span>
    </div>
  );
}
