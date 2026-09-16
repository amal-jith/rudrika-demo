"use client";

import { useState } from "react";

export default function SettingVideoField({
  current,
  action,
}: {
  current: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [value, setValue] = useState(current);
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setValue(url);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <form action={action} className="flex flex-wrap gap-3 items-center">
      <input type="hidden" name="key" value="homepage_video" />
      <input
        name="value"
        className="input flex-1 min-w-[220px]"
        placeholder="/uploads/video.mp4 or https://"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <label className="btn-outline !py-2.5 cursor-pointer">
        {uploading ? "Uploading" : "Upload video"}
        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={upload} disabled={uploading} />
      </label>
      <button className="btn-primary !py-2.5" disabled={uploading}>Save</button>
    </form>
  );
}
