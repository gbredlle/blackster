"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Track = {
  id: number;
  title: string;
  version: string;
  genre: string;
  bpm: number;
  keyName: string;
  previewUrl: string;
  downloadUrl: string;
  source: "local" | "dropbox";
  uploadedBy: string;
};

type User = {
  email: string;
  password: string;
  name: string;
  subscribed: boolean;
};

const STORAGE_KEYS = {
  tracks: "blackster_tracks_clean",
  user: "blackster_user_clean",
};

const initialTracks: Track[] = [
  {
    id: 1,
    title: "Frenna - Pretty Girls",
    version: "Intro Edit",
    genre: "NL",
    bpm: 102,
    keyName: "Gm",
    previewUrl: "",
    downloadUrl: "",
    source: "local",
    uploadedBy: "Blackster",
  },
  {
    id: 2,
    title: "Tyla - Water",
    version: "Clean",
    genre: "Afro",
    bpm: 100,
    keyName: "Am",
    previewUrl: "",
    downloadUrl: "",
    source: "local",
    uploadedBy: "Blackster",
  },
];

function normalizeDropboxUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("dl.dropboxusercontent.com")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("dropbox.com")) {
      parsed.searchParams.delete("dl");
      parsed.searchParams.set("raw", "1");
      return parsed.toString();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function fakeBpm(file: File) {
  const base = 90 + (file.size % 50);
  return Math.min(160, Math.max(85, base));
}

export default function Page() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);

  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [genre, setGenre] = useState("Custom");
  const [keyName, setKeyName] = useState("Am");
  const [bpm, setBpm] = useState(100);

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [dropboxPreviewUrl, setDropboxPreviewUrl] = useState("");
  const [dropboxDownloadUrl, setDropboxDownloadUrl] = useState("");

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showAuth, setShowAuth] = useState(false);
  const [showMembership, setShowMembership] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  useEffect(() => {
    try {
      const storedTracks = localStorage.getItem(STORAGE_KEYS.tracks);
      const storedUser = localStorage.getItem(STORAGE_KEYS.user);
      if (storedTracks) setTracks(JSON.parse(storedTracks));
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tracks, JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [user]);

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) =>
      `${track.title} ${track.version} ${track.genre} ${track.uploadedBy}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [tracks, query]);

  const login = () => {
    if (!authEmail || !authPassword) {
      alert("Vul e-mail en wachtwoord in.");
      return;
    }

    const saved = localStorage.getItem("blackster_registered_user");
    if (!saved) {
      alert("Nog geen account gevonden. Kies Register.");
      return;
    }

    const parsed: User = JSON.parse(saved);
    if (parsed.email !== authEmail || parsed.password !== authPassword) {
      alert("Onjuiste login.");
      return;
    }

    setUser(parsed);
    setShowAuth(false);
  };

  const register = () => {
    if (!authName || !authEmail || !authPassword) {
      alert("Vul naam, e-mail en wachtwoord in.");
      return;
    }

    const newUser: User = {
      name: authName,
      email: authEmail,
      password: authPassword,
      subscribed: false,
    };

    localStorage.setItem("blackster_registered_user", JSON.stringify(newUser));
    setUser(newUser);
    setShowAuth(false);
  };

  const activateMembership = () => {
    if (!user) {
      setShowMembership(false);
      setShowAuth(true);
      return;
    }
    const next = { ...user, subscribed: true };
    localStorage.setItem("blackster_registered_user", JSON.stringify(next));
    setUser(next);
    setShowMembership(false);
    alert("Membership geactiveerd.");
  };

  const uploadTrack = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!artist || !title || !version) {
      alert("Vul artiest, titel en versie in.");
      return;
    }

    const finalDownloadUrl =
      normalizeDropboxUrl(dropboxDownloadUrl) ||
      (mainFile ? URL.createObjectURL(mainFile) : "");

    const finalPreviewUrl =
      normalizeDropboxUrl(dropboxPreviewUrl) ||
      (previewFile ? URL.createObjectURL(previewFile) : finalDownloadUrl);

    if (!finalDownloadUrl) {
      alert("Voeg een Dropbox downloadlink of mp3-bestand toe.");
      return;
    }

    const track: Track = {
      id: Date.now(),
      title: `${artist} - ${title}`,
      version,
      genre,
      bpm,
      keyName,
      previewUrl: finalPreviewUrl,
      downloadUrl: finalDownloadUrl,
      source: dropboxDownloadUrl ? "dropbox" : "local",
      uploadedBy: user.name,
    };

    setTracks((prev) => [track, ...prev]);

    setArtist("");
    setTitle("");
    setVersion("");
    setGenre("Custom");
    setKeyName("Am");
    setBpm(100);
    setMainFile(null);
    setPreviewFile(null);
    setDropboxPreviewUrl("");
    setDropboxDownloadUrl("");
  };

  const playPreview = async (track: Track) => {
    if (!track.previewUrl) {
      alert("Geen preview beschikbaar.");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.previewUrl;
    try {
      await audio.play();
      setPlayingId(track.id);
    } catch {
      alert("Preview kan niet worden afgespeeld.");
    }
  };

  const downloadTrack = (track: Track) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!user.subscribed) {
      setShowMembership(true);
      return;
    }

    const a = document.createElement("a");
    a.href = track.downloadUrl;
    a.download = `${track.title}.mp3`;
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <audio ref={audioRef} preload="none" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>Blackster</h1>
        <p style={{ color: "#999", marginBottom: 24 }}>DJ pool prototype</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              border: "1px solid #222",
              borderRadius: 24,
              padding: 20,
              background: "#0a0a0a",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>MEMBERSHIP</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>€5<span style={{ fontSize: 16, color: "#888" }}>/month</span></div>
              <button
                onClick={() => setShowMembership(true)}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "#fff",
                  color: "#000",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {user?.subscribed ? "Membership Active" : "Activate"}
              </button>
            </div>

            <div style={{ border: "1px solid #222", borderRadius: 18, padding: 14, background: "#000" }}>
              <div style={{ marginBottom: 8 }}>Login: <strong>{user ? user.name : "Guest"}</strong></div>
              <div style={{ marginBottom: 8 }}>Downloads: <strong>{user?.subscribed ? "Unlocked" : "Locked"}</strong></div>
              <div>Tracks: <strong>{tracks.length}</strong></div>
            </div>
          </div>

          <div>
            <div
              style={{
                border: "1px solid #222",
                borderRadius: 24,
                padding: 20,
                background: "#0a0a0a",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ color: "#888", fontSize: 14 }}>
                    {user ? `Welkom, ${user.name}` : "Welcome"}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>Blackster DJ Pool</div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tracks..."
                    style={{
                      minWidth: 260,
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "1px solid #222",
                      background: "#000",
                      color: "#fff",
                    }}
                  />
                  {!user ? (
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setShowAuth(true);
                      }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 14,
                        border: "none",
                        background: "#fff",
                        color: "#000",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Login
                    </button>
                  ) : (
                    <button
                      onClick={() => setUser(null)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 14,
                        border: "1px solid #222",
                        background: "#000",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #222",
                borderRadius: 24,
                padding: 20,
                background: "#0a0a0a",
                marginBottom: 20,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Upload MP3</h2>
              <p style={{ color: "#999" }}>Upload lokaal of gebruik Dropbox preview- en downloadlinks</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" style={inputStyle} />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={inputStyle} />
                <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version" style={inputStyle} />
                <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key" style={inputStyle} />
                <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" style={inputStyle} />
                <input
                  value={String(bpm)}
                  onChange={(e) => setBpm(Number(e.target.value) || 100)}
                  placeholder="BPM"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={uploadBoxStyle}>
                  <div style={{ color: "#999", marginBottom: 8 }}>Main MP3 file</div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMainFile(file);
                      if (file) setBpm(fakeBpm(file));
                    }}
                  />
                </div>

                <div style={uploadBoxStyle}>
                  <div style={{ color: "#999", marginBottom: 8 }}>Preview file</div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <input
                  value={dropboxPreviewUrl}
                  onChange={(e) => setDropboxPreviewUrl(e.target.value)}
                  placeholder="Dropbox preview URL (optional)"
                  style={inputStyle}
                />
                <input
                  value={dropboxDownloadUrl}
                  onChange={(e) => setDropboxDownloadUrl(e.target.value)}
                  placeholder="Dropbox download URL"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={uploadTrack}
                style={{
                  width: "100%",
                  marginTop: 18,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "#fff",
                  color: "#000",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Publish track
              </button>
            </div>

            <div
              style={{
                border: "1px solid #222",
                borderRadius: 24,
                padding: 20,
                background: "#0a0a0a",
                marginBottom: 20,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Trending</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {trendingTracks.map((track) => (
                  <div key={track.id} style={{ border: "1px solid #222", borderRadius: 18, padding: 14, background: "#000" }}>
                    <div style={{ fontWeight: 700 }}>{track.title}</div>
                    <div style={{ color: "#999", fontSize: 14 }}>{track.version}</div>
                    <div style={{ marginTop: 10, color: "#bbb", fontSize: 12 }}>
                      {track.plays || 0} plays • {track.downloads || 0} downloads
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #222",
                borderRadius: 24,
                padding: 20,
                background: "#0a0a0a",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Track library</h2>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid #222",
                      background: activeGenre === g ? "#fff" : "#000",
                      color: activeGenre === g ? "#000" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {filteredTracks.map((track) => {
                  const isPlaying = playingId === track.id;
                  return (
                    <div
                      key={track.id}
                      style={{
                        border: "1px solid #222",
                        borderRadius: 20,
                        padding: 16,
                        background: "#000",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 16,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{track.title}</div>
                          <div style={{ color: "#999" }}>{track.version}</div>
                          <div style={{ color: "#777", fontSize: 13, marginTop: 4 }}>
                            {track.genre} • {track.bpm} BPM • {track.keyName} • {track.source}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => playPreview(track)} style={smallButtonStyle}>
                            {isPlaying ? "Pause" : "Play"}
                          </button>
                          <button
                            onClick={() => toggleLike(track.id)}
                            style={smallButtonStyle}
                          >
                            {track.liked ? "Liked" : "Like"}
                          </button>
                          <button
                            onClick={() => openCrateModal(track.id)}
                            style={smallButtonStyle}
                          >
                            Crate
                          </button>
                          <button
                            onClick={() => downloadTrack(track)}
                            style={{
                              ...smallButtonStyle,
                              background: "#fff",
                              color: "#000",
                              border: "none",
                            }}
                          >
                            {user?.subscribed ? "Download" : "Members only"}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ color: "#777", fontSize: 12, marginBottom: 6 }}>Preview waveform</div>
                        <Waveform progress={isPlaying ? 0.45 : 0} bars={track.waveform} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuth && (
        <Modal
          open={showAuth}
          title={authMode === "login" ? "Login to Blackster" : "Create Blackster account"}
          onClose={() => setShowAuth(false)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setAuthMode("login")}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #222",
                  background: authMode === "login" ? "#fff" : "#000",
                  color: authMode === "login" ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode("register")}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #222",
                  background: authMode === "register" ? "#fff" : "#000",
                  color: authMode === "register" ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                Register
              </button>
            </div>

            {authMode === "register" && (
              <input
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Display name"
                style={inputStyle}
              />
            )}

            <input
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email address"
              style={inputStyle}
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
            />

            {authMode === "login" ? (
              <button onClick={login} style={primaryButtonStyle}>Login</button>
            ) : (
              <button onClick={register} style={primaryButtonStyle}>Create account</button>
            )}
          </div>
        </Modal>
      )}

      {showMembership && (
        <Modal open={showMembership} title="Activate membership" onClose={() => setShowMembership(false)}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ border: "1px solid #222", borderRadius: 16, background: "#000", padding: 16 }}>
              <div style={{ color: "#777", fontSize: 12, textTransform: "uppercase" }}>Blackster Standard</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>€5<span style={{ fontSize: 16, color: "#888" }}>/month</span></div>
              <div style={{ color: "#999", marginTop: 10 }}>Unlimited member downloads, weekly uploads en crates.</div>
            </div>

            <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" style={inputStyle} />
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" style={inputStyle} />
              <input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="CVC" style={inputStyle} />
            </div>

            <button onClick={activateMembership} style={primaryButtonStyle}>
              Activate membership
            </button>
          </div>
        </Modal>
      )}

      {showCrateOpen(crateOpen, setShowCrateOpenHelper)}

      {toast && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            background: "#111",
            border: "1px solid #222",
            borderRadius: 16,
            padding: "12px 14px",
            color: "#fff",
            zIndex: 1000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );

  function setShowCrateOpenHelper(next: boolean) {
    if (!next) setCrateOpen(false);
  }

  function showCrateOpen(open: boolean, onClose: (next: boolean) => void) {
    if (!open) return null;

    return (
      <Modal open={open} title="DJ Crates" onClose={() => onClose(false)}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Create new crate</div>
            <input
              value={newCrateName}
              onChange={(e) => setNewCrateName(e.target.value)}
              placeholder="Crate name"
              style={inputStyle}
            />
            <button onClick={createCrate} style={{ ...primaryButtonStyle, marginTop: 12 }}>
              Create crate
            </button>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Add track to existing crate</div>
            <div style={{ display: "grid", gap: 8 }}>
              {crates.map((crate) => (
                <button
                  key={crate.id}
                  onClick={() => addTrackToCrate(crate.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #222",
                    background: "#000",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {crate.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #222",
  background: "#000",
  color: "#fff",
  boxSizing: "border-box",
};

const uploadBoxStyle: React.CSSProperties = {
  border: "1px solid #222",
  borderRadius: 16,
  background: "#000",
  padding: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "none",
  background: "#fff",
  color: "#000",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "#000",
  color: "#fff",
  cursor: "pointer",
};
