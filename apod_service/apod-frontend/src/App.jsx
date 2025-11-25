// src/App.jsx
import React, { useEffect, useState } from "react";

const VIDEO_FALLBACK = "/video-thumb.jpg";
const API_BASE = "/api/apod";

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toISOString().split("T")[0];
}

/* ------------ Modal ------------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-lg max-w-3xl w-full overflow-auto">
        <div className="p-4 border-b border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 bg-slate-700 rounded">Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------ APOD Hero ------------- */
function APODHero({ apod, onOpenDetail }) {
  if (!apod) return null;
  return (
    <div className="bg-slate-900 rounded-lg shadow p-4">
      {apod.media_type === "image" ? (
        <img
          src={apod.media_url || apod.url}
          alt={apod.title}
          className="w-full rounded mb-3"
        />
      ) : (
        <div className="aspect-video mb-3">
          <iframe
            src={apod.media_url || apod.url}
            title={apod.title}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold">{apod.title}</h2>
        <div className="text-sm text-slate-400">
          {apod.date} {apod.copyright ? ` — © ${apod.copyright}` : ""}
        </div>
        <p className="mt-3 text-slate-300">{apod.explanation}</p>
        <div className="mt-4">
          <button
            onClick={() => onOpenDetail(apod)}
            className="bg-sky-600 px-4 py-2 rounded"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------ APOD Card (Gallery) ------------- */
function APODCard({ item, onClick }) {
  const thumb =
    item.media_type === "video"
      ? VIDEO_FALLBACK
      : item.media_url || item.url;

  return (
    <div
      className="bg-slate-900 rounded overflow-hidden shadow hover:scale-[1.01] transition cursor-pointer"
      onClick={() => onClick(item)}
    >
      <img
        src={thumb}
        alt={item.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-3">
        <div className="text-sm font-medium">{item.title}</div>
        <div className="text-xs text-slate-400">{item.date}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [today, setToday] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchAPOD(dateStr = "") {
    try {
      let url = dateStr
        ? `${API_BASE}?date=${dateStr}`
        : `${API_BASE}/today`;

      const resp = await fetch(url);
      const data = await resp.json();

      return {
        ...data,
        media_url: data.media_url || data.hdurl || data.url,
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async function loadToday() {
    setLoading(true);
    setError("");
    try {
      const apod = await fetchAPOD("");
      setToday(apod);
    } catch (e) {
      setError("Failed to load today's APOD.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGallery(days = 12) {
    setGalleryLoading(true);
    setError("");

    try {
      const resp = await fetch(`${API_BASE}/recent?days=${days}`);
      let arr = [];

      if (resp.ok) {
        arr = await resp.json();
      } else {
        arr = [];
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          const item = await fetchAPOD(ds);
          arr.push(item);
        }
      }

      arr = arr.map((item) => ({
        ...item,
        media_url: item.media_url || item.hdurl || item.url,
      }));

      setGallery(arr);
    } catch (e) {
      console.error(e);
      setError("Failed to load gallery.");
    } finally {
      setGalleryLoading(false);
    }
  }

  useEffect(() => {
    loadToday();
    loadGallery(12);
  }, []);

  async function onPickDate(value) {
    if (!value) return;
    setLoading(true);
    setError("");

    try {
      const item = await fetchAPOD(value);
      setToday(item);
    } catch (e) {
      setError("Failed to load selected date.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🚀 NASA APOD Explorer</h1>
          <div className="text-sm text-slate-400">
            Powered by your Django API
          </div>
        </header>

        {error && <div className="mb-4 text-red-400">{error}</div>}

        <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Today's APOD</h2>
            {loading ? (
              <div>Loading…</div>
            ) : (
              <APODHero apod={today} onOpenDetail={(a) => setSelected(a)} />
            )}
          </div>

          <aside>
            <h2 className="text-xl font-semibold mb-3">Pick a date</h2>
            <div className="bg-slate-900 p-4 rounded">
              <input
                type="date"
                className="w-full p-2 bg-slate-800 rounded text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <div className="mt-3 flex gap-2">
                <button
                  className="bg-sky-600 px-3 py-2 rounded"
                  onClick={() => onPickDate(date)}
                >
                  Load
                </button>
                <button
                  className="bg-slate-700 px-3 py-2 rounded"
                  onClick={() => {
                    setDate("");
                    loadToday();
                  }}
                >
                  Today
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Quick gallery</h3>
              <div className="grid grid-cols-2 gap-3">
                {(galleryLoading
                  ? new Array(4).fill(null)
                  : gallery.slice(0, 4)
                ).map((g, i) =>
                  g ? (
                    <div
                      key={g.date}
                      className="cursor-pointer"
                      onClick={() => setSelected(g)}
                    >
                      <img
                        src={
                          g.media_type === "video"
                            ? VIDEO_FALLBACK
                            : g.media_url
                        }
                        alt={g.title}
                        className="w-full h-24 object-cover rounded"
                      />
                      <div className="text-xs mt-1">{g.date}</div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="h-24 bg-slate-800 rounded animate-pulse"
                    ></div>
                  )
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Gallery (Recent)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.map((item) => (
              <APODCard
                key={item.date}
                item={item}
                onClick={(it) => setSelected(it)}
              />
            ))}
          </div>
        </section>

        <footer className="text-sm text-slate-400 mt-12">
          Data from NASA APOD API — your API key is stored on the backend.
        </footer>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h2 className="text-2xl font-bold">{selected.title}</h2>
            <div className="text-sm text-slate-400">{selected.date}</div>

            <div className="mt-4">
              {selected.media_type === "image" ? (
                <img
                  src={selected.media_url}
                  alt={selected.title}
                  className="w-full rounded"
                />
              ) : (
                <div className="aspect-video">
                  <iframe
                    src={selected.media_url}
                    className="w-full h-full"
                    title={selected.title}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            <p className="mt-4 text-slate-300">
              {selected.explanation}
            </p>

            {selected.copyright && (
              <div className="mt-2 text-slate-400">
                © {selected.copyright}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
