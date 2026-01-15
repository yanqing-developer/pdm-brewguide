import { listBreweryTypes } from "../repositories/brewery.repo.js";

export async function getBreweryTypes(req, res, next) {
  try {
    const types = await listBreweryTypes();
    res.json({ ok: true, types });
  } catch (e) {
    next(e);
  }
};
