-- Fix RLS policies for the post storage bucket
-- This script addresses the "new row violates row-level security policy" error

-- First, drop any existing policies for the post bucket to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Server members can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;

-- Create new, properly configured policies for the post bucket

-- Allow authenticated users to upload post images
-- File path structure: {user_id}/image_{timestamp}.{extension}
CREATE POLICY "Authenticated users can upload post images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'post' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to post images (since posts are viewable by server members)
-- You might want to make this more restrictive based on server membership later
CREATE POLICY "Post images are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'post');

-- Allow users to update their own post images
CREATE POLICY "Users can update own post images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'post' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete own post images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'post' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Alternative more restrictive SELECT policy if you want to restrict access to server members only
-- This is commented out, but you can use it instead of the public read policy above
/*
CREATE POLICY "Server members can view post images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'post' 
  AND EXISTS (
    SELECT 1 FROM server_posts sp
    JOIN server_channels sc ON sp.channel_id = sc.id
    JOIN server_members sm ON sc.server_id = sm.server_id
    WHERE sp.image_url LIKE '%' || name || '%'
    AND sm.user_id = auth.uid()
  )
);
*/
