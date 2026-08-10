-- Siembra los dos tipos de relación que ya existían como enum
-- ("client" / "creative"), para que la foreign key de Collaborator.type
-- encuentre esas filas y el próximo "db push" no falle.
-- Es seguro correrlo aunque la tabla ya tenga algo: no pisa nada gracias
-- al ON CONFLICT.

INSERT INTO "CollaboratorTypeOption" (id, slug, name, "isClient", "order")
VALUES
  (gen_random_uuid()::text, 'client', 'Cliente', true, 0),
  (gen_random_uuid()::text, 'creative', 'Colaborador creativo', false, 1)
ON CONFLICT (slug) DO NOTHING;
