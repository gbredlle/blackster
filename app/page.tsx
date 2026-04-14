"use client";
// redeploy trigger FINAL

import React, { useMemo, useRef, useState } from "react";

const Button = ({ children, ...props }: any) => (
  <button
    style={{
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid #333",
      background: "#fff",
      color: "#000",
      cursor: "pointer",
    }}
    {...props}
  >
    {children}
  </button>
);

const Input = (props: any) => (
  <input
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: 12,
      border: "1px solid #333",
      background: "#000",
      color: "#fff",
    }}
    {...props}
  />
);

type Track = {
  id: number;
  title: string;
  version: string;
};

const initialTracks: Track[] = [
  { id: 1, title: "Frenna - Pretty Girls", version: "Intro" },
  { id: 2, title: "Tyla - Water", version: "Clean" },
];

export default function BlacksterApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tracks] = useState<Track[]>(initialTracks);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return tracks.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [tracks, query]);

  const play = (id: number) => {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    setPlaying(id);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: 40,
        fontFamily: "Arial",
      }}
    >
      <audio ref={audioRef} />

      <h1 style={{ fontSize: 40, marginBottom: 20 }}>Blackster DJ Pool</h1>

      <div style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search tracks..."
          value={query}
          onChange={(e: any) => setQuery(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((track) => (
          <div
            key={track.id}
            style={{
              border: "1px solid #222",
              padding: 20,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{track.title}</div>
                <div style={{ color: "#777" }}>{track.version}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => play(track.id)}>
                  {playing === track.id ? "Pause" : "Play"}
                </Button>
                <Button>Download</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
