/** TODO: Add purpose docstring. */
"use client";

import { useEffect, useState } from "react";

interface FanData {
  email: string;
  created_at: string;
  referred_by: string | null;
}

interface Props {
  creatorId: string;
  creatorName: string;
  fanCount: number;
}

export function FanStatsCard({ creatorId, creatorName, fanCount }: Props) {
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => {
    setShowModal(true);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="rounded-3xl border border-[#E8E4DB] bg-white p-6 cursor-pointer hover:border-[#5A6A4A] transition-colors shadow-sm"
      >
        <div className="mb-3 text-2xl">🙌</div>
        <div className="text-3xl font-semibold text-gray-900">{fanCount}</div>
        <div className="mt-1 text-sm text-gray-500">Fans</div>
      </div>

      {showModal && (
        <CreatorFanModalImpl
          creatorId={creatorId}
          creatorName={creatorName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

interface CreatorFanModalProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}

function CreatorFanModalImpl({ creatorId, creatorName, onClose }: CreatorFanModalProps) {
  const [fans, setFans] = useState<FanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/creators/${creatorId}/fans`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFans(data))
      .finally(() => setLoading(false));
  }, [creatorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Fans of {creatorName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : fans.length === 0 ? (
          <p className="text-sm text-gray-500">No fans yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase text-gray-400">
                <th className="py-2">Email</th>
                <th className="py-2">Joined</th>
                <th className="py-2">Referred by</th>
              </tr>
            </thead>
            <tbody>
              {fans.map((f, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-900">{f.email}</td>
                  <td className="py-2 text-gray-500">{new Date(f.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-gray-500">{f.referred_by || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export { CreatorFanModalImpl as CreatorFanModal };
