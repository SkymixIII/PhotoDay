import { File } from 'expo-file-system';

import type { Eyes } from './alignment';
import { monthRange } from './dates';
import { SELFIE_BUCKET, supabase } from './supabase';

export type Group = { id: string; name: string; invite_code: string; created_by: string };

export type Member = { user_id: string; display_name: string };

export type Selfie = {
  id: string;
  user_id: string;
  taken_on: string;
  storage_path: string;
  width: number;
  height: number;
  left_eye_x: number | null;
  left_eye_y: number | null;
  right_eye_x: number | null;
  right_eye_y: number | null;
};

export type SelfieWithUrl = Selfie & { url: string };

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): NonNullable<T> {
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
}

export async function myGroups(): Promise<Group[]> {
  return check(await supabase.from('groups').select('id, name, invite_code, created_by').order('created_at'));
}

export async function getGroup(id: string): Promise<Group> {
  return check(await supabase.from('groups').select('id, name, invite_code, created_by').eq('id', id).single());
}

export async function createGroup(name: string): Promise<Group> {
  return check(await supabase.rpc('create_group', { group_name: name.trim() }));
}

export async function joinGroup(code: string): Promise<Group> {
  return check(await supabase.rpc('join_group', { code }));
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  check(await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId));
}

export async function groupMembers(groupId: string): Promise<Member[]> {
  const members = check(await supabase.from('group_members').select('user_id').eq('group_id', groupId));
  const ids = members.map((m) => m.user_id as string);
  const profiles = check(await supabase.from('profiles').select('id, display_name').in('id', ids));
  return profiles.map((p) => ({ user_id: p.id as string, display_name: p.display_name as string }));
}

export async function getDisplayName(userId: string): Promise<string> {
  const p = check<{ display_name: string }>(await supabase.from('profiles').select('display_name').eq('id', userId).single());
  return p.display_name;
}

export async function setDisplayName(userId: string, displayName: string): Promise<void> {
  check(await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId));
}

/** Uploads today's selfie (replacing an earlier one from the same day). */
export async function uploadSelfie(params: {
  userId: string;
  day: string;
  uri: string;
  width: number;
  height: number;
  eyes: Eyes | null;
}): Promise<void> {
  const { userId, day, uri, width, height, eyes } = params;
  const path = `${userId}/${day}.jpg`;
  const bytes = await new File(uri).arrayBuffer();
  check(
    await supabase.storage.from(SELFIE_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true }),
  );
  check(
    await supabase.from('selfies').upsert(
      {
        user_id: userId,
        taken_on: day,
        storage_path: path,
        width,
        height,
        left_eye_x: eyes?.left.x ?? null,
        left_eye_y: eyes?.left.y ?? null,
        right_eye_x: eyes?.right.x ?? null,
        right_eye_y: eyes?.right.y ?? null,
      },
      { onConflict: 'user_id,taken_on' },
    ),
  );
}

export async function hasSelfieOn(userId: string, day: string): Promise<boolean> {
  const rows = check(await supabase.from('selfies').select('id').eq('user_id', userId).eq('taken_on', day));
  return rows.length > 0;
}

/** Selfies of the given users for one day, with signed URLs. */
export async function selfiesOn(userIds: string[], day: string): Promise<SelfieWithUrl[]> {
  const rows: Selfie[] = check(await supabase.from('selfies').select('*').in('user_id', userIds).eq('taken_on', day));
  return withUrls(rows);
}

/** One person's selfies for a YYYY-MM month, oldest first, with signed URLs. */
export async function monthSelfies(userId: string, month: string): Promise<SelfieWithUrl[]> {
  const { from, to } = monthRange(month);
  const rows: Selfie[] = check(
    await supabase
      .from('selfies')
      .select('*')
      .eq('user_id', userId)
      .gte('taken_on', from)
      .lte('taken_on', to)
      .order('taken_on'),
  );
  return withUrls(rows);
}

async function withUrls(rows: Selfie[]): Promise<SelfieWithUrl[]> {
  if (rows.length === 0) return [];
  const signed = check(
    await supabase.storage.from(SELFIE_BUCKET).createSignedUrls(
      rows.map((r) => r.storage_path),
      60 * 60,
    ),
  );
  const byPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return rows.flatMap((r) => {
    const url = byPath.get(r.storage_path);
    return url ? [{ ...r, url }] : [];
  });
}

export function selfieEyes(s: Selfie): Eyes | null {
  if (s.left_eye_x == null || s.left_eye_y == null || s.right_eye_x == null || s.right_eye_y == null) return null;
  return { left: { x: s.left_eye_x, y: s.left_eye_y }, right: { x: s.right_eye_x, y: s.right_eye_y } };
}
