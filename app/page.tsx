"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Play,
  Pause,
  Heart,
  Upload,
  Lock,
  User,
  CreditCard,
  FolderPlus,
  Plus,
  Music,
  LogOut,
  X,
  UserPlus,
  Flame,
  Home,
  Library,
  Disc3,
} from "lucide-react";

// SIMPLE UI COMPONENTS (NO SHADCN)
const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-3xl border border-zinc-800 bg-zinc-950 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const Button = ({ children, className = "", variant, ...props }: any) => (
  <button
    className={`px-4 py-2 rounded-2xl font-medium transition ${
      variant === "outline"
        ? "border border-zinc-800 bg-black text-white hover:bg-zinc-900"
        : "bg-white text-black hover:bg-zinc-200"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }: any) => (
  <input
    className={`px-3 py-2 rounded-2xl border border-zinc-800 bg-black text-white w-full ${className}`}
    {...props}
  />
);

const Badge = ({ children, className = "" }: any) => (
  <span
    className={`px-2 py-1 text-xs rounded-full border border-zinc-700 text-zinc-300 ${className}`}
  >
    {children}
  </span>
);

type Track = {
  id: number;
  title: string;
  version: string;
  bpm: number;
  key: string;
  genre: string;
  cover: string;
  liked?: boolean;
  previewUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  uploadedBy?: string;
  uploaderId?: number | null;
  waveform?: number[];
  plays?: number;
  downloads?: number;
  createdAt?: number;
  source?: "local" | "dropbox";
};

type Crate = {
  id: number;
  name: string;
  trackIds: number[];
};

type UserAccount = {
  id: number;
  email: string;
  password: string;
  name: string;
  subscribed: boolean;
};

type SessionProfile = {
  loggedIn: boolean;
  email: string;
  name: string;
  subscribed: boolean;
  userId: number | null;
};

type View = "dashboard" | "trending" | "library" | "crates";

const STORAGE_KEYS = {
  tracks: "blackster_tracks_v7",
  crates: "blackster_crates_v7",
  session: "blackster_session_v7",
  users: "blackster_users_v7",
};

const initialTracks: Track[] = [
  {
    id: 1,
    title: "Frenna - Pretty Girls",
    version: "Intro Edit",
    bpm: 102,
    key: "Gm",
    genre: "NL",
    cover: "FR",
    uploadedBy: "Blackster",
    uploaderId: 0,
    plays: 44,
    downloads: 18,
    createdAt: Date.now() - 86400000 * 3,
    waveform: [18, 26, 24, 30, 16, 34, 22, 28, 18, 32, 20, 26, 30, 14, 22, 28, 20, 24, 16, 30],
    source: "local",
  },
];

const genres = ["All", "Afro", "R&B", "NL", "Amapiano", "Custom"];

function Waveform({ progress, bars }: { progress: number; bars?: number[] }) {
  const fallback = [18, 30, 24, 38, 16, 44, 22, 32, 20, 40];
  const data = bars || fallback;

  return (
    <div className="flex h-14 items-end gap-1 rounded-2xl border border-zinc-800 bg-black px-3 py-2">
      {data.map((h, i) => {
        const filled = i / data.length <= progress;
        return (
          <div
            key={i}
            className={`w-full rounded-full ${filled ? "bg-white" : "bg-zinc-700"}`}
            style={{ height: `${Math.max(8, h)}px` }}
          />
        );
      })}
    </div>
  );
}

export default function BlacksterApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [profile, setProfile] = useState<SessionProfile>({
    loggedIn: false,
    email: "",
    name: "Bryan",
    subscribed: false,
    userId: null,
  });

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) =>
      `${track.title} ${track.genre}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [tracks, query]);

  const togglePlay = (track: Track) => {
    const audio = audioRef.current;
    if (!audio || !track.previewUrl) return;

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.previewUrl;
    audio.play();
    setPlayingId(track.id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <audio ref={audioRef} />

      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-black">Blackster DJ Pool</h1>

        <Input
          placeholder="Search tracks..."
          value={query}
          onChange={(e: any) => setQuery(e.target.value)}
        />

        <Card>
          <CardContent>
            <div className="space-y-4">
              {filteredTracks.map((track) => {
                const isPlaying = playingId === track.id;

                return (
                  <div
                    key={track.id}
                    className="border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">{track.title}</div>
                        <div className="text-zinc-500 text-sm">
                          {track.version}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => togglePlay(track)}
                        >
                          {isPlaying ? <Pause /> : <Play />}
                        </Button>

                        <Button>
                          <Download />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Waveform progress={isPlaying ? 0.4 : 0} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
