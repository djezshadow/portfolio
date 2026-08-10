-- Fuerza el logo a modo "Fijo" (esquina superior izquierda, igual que
-- el EN/Tema en la derecha) directo en la base, sin pasar por el admin.
UPDATE "SiteSettings" SET "logoFloating" = true WHERE id = 'default';
