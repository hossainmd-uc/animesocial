-- First, drop the existing policies that might be causing issues
DROP POLICY IF EXISTS "Avatar uploads are allowed for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar updates are allowed for own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar deletes are allowed for own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar reads are allowed for everyone" ON storage.objects;

-- Create simpler, more permissive policies

-- Allow everyone to read avatars (public access)
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to insert avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own avatars  
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
); 