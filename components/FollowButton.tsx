"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  targetUserId,
  initiallyFollowing,
}: {
  targetUserId: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); return; }

    if (following) {
      await sb.from("follows").delete()
        .eq("follower_id", user.id).eq("followee_id", targetUserId);
    } else {
      await sb.from("follows").insert({ follower_id: user.id, followee_id: targetUserId });
    }
    setFollowing(!following);
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={following ? "btn-outline btn-sm" : "btn-accent btn-sm"}
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
