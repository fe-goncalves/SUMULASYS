-- Public bucket for team/tournament logos. Run once in the Supabase SQL editor
-- if uploads fail with "Bucket not found".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
on storage.objects for select
using (bucket_id = 'logos');

drop policy if exists "logos_user_insert" on storage.objects;
create policy "logos_user_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "logos_user_update" on storage.objects;
create policy "logos_user_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "logos_user_delete" on storage.objects;
create policy "logos_user_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
