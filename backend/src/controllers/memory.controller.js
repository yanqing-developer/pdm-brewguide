import { readMemory, writeMemory } from "../services/memory.service.js";

export async function getMemory(req, res, next) {
  try {
    const memory = await readMemory();
    res.json({ ok: true, memory });
  } catch (e) {
    next(e);
  }
}

export async function updateMemory(req, res, next) {
  try {
    const updated = await writeMemory(req.body || {});
    res.json({ ok: true, memory: updated });
  } catch (e) {
    next(e);
  }
};
