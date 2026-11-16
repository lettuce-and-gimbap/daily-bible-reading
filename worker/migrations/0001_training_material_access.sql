ALTER TABLE training_readers ADD COLUMN material_mask INTEGER NOT NULL DEFAULT 0
  CHECK (material_mask BETWEEN 0 AND 3);

-- Preserve access already granted before individual material selection existed.
UPDATE training_readers SET material_mask = 3 WHERE status = 'approved';
