-- Publish must snapshot title/date/cover too, so draft edits to them do not
-- leak to the public site before the publish button is pressed.
ALTER TABLE pages ADD COLUMN published_title TEXT;
ALTER TABLE pages ADD COLUMN published_date TEXT;
ALTER TABLE pages ADD COLUMN published_cover TEXT;
UPDATE pages SET published_title = title, published_date = date, published_cover = cover WHERE status = 'published';
