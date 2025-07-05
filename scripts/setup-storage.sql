-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the avatars bucket

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Avatar uploads are allowed for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Avatar updates are allowed for own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (split_part(name, '-', 1) = concat('avatars/', auth.uid()::text) OR
       split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%'))
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Avatar deletes are allowed for own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (split_part(name, '-', 1) = concat('avatars/', auth.uid()::text) OR
       split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%'))
);

-- Allow public read access to all avatars (since they're profile pictures)
CREATE POLICY "Avatar reads are allowed for everyone" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
); 