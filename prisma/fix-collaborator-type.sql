-- Convierte Collaborator.type de enum a texto SIN perder los valores
-- existentes ("client" / "creative" en cada fila se mantienen igual).
-- Corré esto UNA sola vez, antes de volver a hacer "npx prisma db push".

ALTER TABLE "Collaborator"
  ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "Collaborator"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text;

ALTER TABLE "Collaborator"
  ALTER COLUMN "type" SET DEFAULT 'client';
