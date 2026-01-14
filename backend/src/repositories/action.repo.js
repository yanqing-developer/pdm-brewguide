import { query } from "../db/pool.js";

export async function saveAction(actionType, breweryId) {
  await query(
    `INSERT INTO user_action(action_type, brewery_id)
     VALUES ($1,$2)
     ON CONFLICT (action_type, brewery_id) DO NOTHING`,
    [actionType, breweryId]
  );
}

export async function listActionIds(actionType) {
  const r = await query(
    "SELECT brewery_id FROM user_action WHERE action_type=$1",
    [actionType]
  );
  return r.rows.map(x => x.brewery_id);
};
