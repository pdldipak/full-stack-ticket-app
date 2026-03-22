import { getPool } from '../config/database.js';

function mapTicketRow(row) {
  if (!row) return null;
  return {
    ...row,
    checkedIn: Boolean(row.checkedIn),
    paid: Boolean(row.paid),
    paidTo: row.paidTo ?? null,
    phone: row.phone ?? null,
    phoneContactConsent: Boolean(row.phoneContactConsent),
    countAdults: row.countAdults != null ? Number(row.countAdults) : 0,
    countStudent: row.countStudent != null ? Number(row.countStudent) : 0,
    countChild: row.countChild != null ? Number(row.countChild) : 0,
    submissionSource: row.submissionSource || 'seller',
    verifiedAt: row.verifiedAt ?? null,
    verifiedBy: row.verifiedBy ?? null,
  };
}

export async function createTicketRow({
  fullName,
  phone = null,
  phoneContactConsent = false,
  countAdults,
  countStudent,
  countChild,
  ticketType,
  price,
  soldBy,
  city,
  paid = false,
  paidTo = null,
  submissionSource = 'seller',
}) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [[countRow]] = await conn.query('SELECT COUNT(*) AS cnt FROM tickets');
    if (Number(countRow.cnt) === 0) {
      await conn.query('ALTER TABLE tickets AUTO_INCREMENT = 1');
    }

    await conn.beginTransaction();

    const paidVal = paid ? 1 : 0;
    const paidToVal = paid && paidTo ? paidTo : null;
    const phoneVal = phone != null && String(phone).trim() !== '' ? String(phone).trim() : null;
    const src = submissionSource === 'public' ? 'public' : 'seller';
    const consentVal =
      src === 'public' && phoneContactConsent ? 1 : 0;

    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    const ticketCount = a + s + c;

    const [result] = await conn.query(
      `INSERT INTO tickets (
        ticket_code,
        full_name,
        phone,
        phone_contact_consent,
        ticket_count,
        count_adults,
        count_student,
        count_child,
        ticket_type,
        price,
        sold_by,
        city,
        checked_in,
        paid,
        paid_to,
        submission_source,
        verified_at,
        verified_by,
        qr_image_base64
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?,
        CASE WHEN ? = 'seller' THEN CURRENT_TIMESTAMP ELSE NULL END,
        CASE WHEN ? = 'seller' THEN ? ELSE NULL END,
        NULL)`,
      [
        fullName,
        phoneVal,
        consentVal,
        ticketCount,
        a,
        s,
        c,
        ticketType,
        price,
        soldBy,
        city,
        paidVal,
        paidToVal,
        src,
        src,
        src,
        soldBy,
      ]
    );

    const id = result.insertId;
    const ticketCode = `TKT-${String(id).padStart(4, '0')}`;

    await conn.query(
      `UPDATE tickets SET ticket_code = ? WHERE id = ?`,
      [ticketCode, id]
    );

    await conn.commit();

    return { id, ticketCode };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateTicketQr(id, qrImageBase64) {
  const pool = getPool();
  await pool.query(`UPDATE tickets SET qr_image_base64 = ? WHERE id = ?`, [
    qrImageBase64,
    id,
  ]);
}

export async function findAllTickets({
  search,
  checkedIn,
  city,
  paid,
  paidTo,
  submissionSource,
  soldBy,
}) {
  const pool = getPool();
  const conditions = [];
  const params = [];

  if (soldBy != null && String(soldBy).trim()) {
    conditions.push('sold_by = ?');
    params.push(String(soldBy).trim());
  }

  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    conditions.push(
      '(full_name LIKE ? OR ticket_code LIKE ? OR phone LIKE ?)'
    );
    params.push(q, q, q);
  }

  if (submissionSource === 'public' || submissionSource === 'seller') {
    conditions.push('submission_source = ?');
    params.push(submissionSource);
  }

  if (checkedIn === 'true' || checkedIn === true) {
    conditions.push('checked_in = 1');
  } else if (checkedIn === 'false' || checkedIn === false) {
    conditions.push('checked_in = 0');
  }

  if (city && String(city).trim()) {
    conditions.push('city = ?');
    params.push(String(city).trim());
  }

  if (paid === 'true' || paid === true) {
    conditions.push('paid = 1');
  } else if (paid === 'false' || paid === false) {
    conditions.push('paid = 0');
  }

  if (paidTo && String(paidTo).trim()) {
    conditions.push('paid_to = ?');
    params.push(String(paidTo).trim());
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      id,
      ticket_code AS ticketCode,
      full_name AS fullName,
      phone,
      phone_contact_consent AS phoneContactConsent,
      ticket_count AS ticketCount,
      count_adults AS countAdults,
      count_student AS countStudent,
      count_child AS countChild,
      ticket_type AS ticketType,
      price,
      sold_by AS soldBy,
      city,
      checked_in AS checkedIn,
      paid,
      paid_to AS paidTo,
      submission_source AS submissionSource,
      verified_at AS verifiedAt,
      verified_by AS verifiedBy,
      qr_image_base64 AS qrImageBase64,
      created_at AS createdAt
    FROM tickets
    ${where}
    ORDER BY created_at DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows.map(mapTicketRow);
}

export async function findTicketByCode(ticketCode) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      id,
      ticket_code AS ticketCode,
      full_name AS fullName,
      phone,
      phone_contact_consent AS phoneContactConsent,
      ticket_count AS ticketCount,
      count_adults AS countAdults,
      count_student AS countStudent,
      count_child AS countChild,
      ticket_type AS ticketType,
      price,
      sold_by AS soldBy,
      city,
      checked_in AS checkedIn,
      paid,
      paid_to AS paidTo,
      submission_source AS submissionSource,
      verified_at AS verifiedAt,
      verified_by AS verifiedBy,
      qr_image_base64 AS qrImageBase64,
      created_at AS createdAt
    FROM tickets
    WHERE ticket_code = ?
    LIMIT 1`,
    [ticketCode]
  );
  return mapTicketRow(rows[0]) || null;
}

/**
 * Marks a web order as verified. Returns whether a row was updated.
 * @param {number} id
 * @param {string} verifiedByUsername
 */
export async function verifyWebOrderById(id, verifiedByUsername) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE tickets
     SET verified_at = CURRENT_TIMESTAMP, verified_by = ?
     WHERE id = ? AND submission_source = 'public' AND verified_at IS NULL`,
    [String(verifiedByUsername).trim(), id]
  );
  return result.affectedRows > 0;
}

export async function setCheckedInByCode(ticketCode) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE tickets SET checked_in = 1 WHERE ticket_code = ? AND checked_in = 0`,
    [ticketCode]
  );
  return result.affectedRows > 0;
}

export async function updateTicketById(id, fields) {
  const pool = getPool();
  const {
    fullName,
    ticketCount,
    countAdults,
    countStudent,
    countChild,
    ticketType,
    price,
    city,
    paid,
    paidTo,
    soldBy,
    phone,
  } = fields;
  const paidVal = paid ? 1 : 0;
  const paidToVal = paid && paidTo ? paidTo : null;
  const phoneVal =
    phone === undefined
      ? undefined
      : phone != null && String(phone).trim() !== ''
        ? String(phone).trim()
        : null;

  if (soldBy !== undefined && soldBy !== null) {
    if (phoneVal === undefined) {
      await pool.query(
        `UPDATE tickets SET
          full_name = ?,
          ticket_count = ?,
          count_adults = ?,
          count_student = ?,
          count_child = ?,
          ticket_type = ?,
          price = ?,
          city = ?,
          paid = ?,
          paid_to = ?,
          sold_by = ?
        WHERE id = ?`,
        [
          fullName,
          ticketCount,
          countAdults,
          countStudent,
          countChild,
          ticketType,
          price,
          city,
          paidVal,
          paidToVal,
          soldBy,
          id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE tickets SET
          full_name = ?,
          phone = ?,
          ticket_count = ?,
          count_adults = ?,
          count_student = ?,
          count_child = ?,
          ticket_type = ?,
          price = ?,
          city = ?,
          paid = ?,
          paid_to = ?,
          sold_by = ?
        WHERE id = ?`,
        [
          fullName,
          phoneVal,
          ticketCount,
          countAdults,
          countStudent,
          countChild,
          ticketType,
          price,
          city,
          paidVal,
          paidToVal,
          soldBy,
          id,
        ]
      );
    }
    return;
  }
  if (phoneVal === undefined) {
    await pool.query(
      `UPDATE tickets SET
        full_name = ?,
        ticket_count = ?,
        count_adults = ?,
        count_student = ?,
        count_child = ?,
        ticket_type = ?,
        price = ?,
        city = ?,
        paid = ?,
        paid_to = ?
      WHERE id = ?`,
      [
        fullName,
        ticketCount,
        countAdults,
        countStudent,
        countChild,
        ticketType,
        price,
        city,
        paidVal,
        paidToVal,
        id,
      ]
    );
    return;
  }
  await pool.query(
    `UPDATE tickets SET
      full_name = ?,
      phone = ?,
      ticket_count = ?,
      count_adults = ?,
      count_student = ?,
      count_child = ?,
      ticket_type = ?,
      price = ?,
      city = ?,
      paid = ?,
      paid_to = ?
    WHERE id = ?`,
    [
      fullName,
      phoneVal,
      ticketCount,
      countAdults,
      countStudent,
      countChild,
      ticketType,
      price,
      city,
      paidVal,
      paidToVal,
      id,
    ]
  );
}

export async function deleteTicketById(id) {
  const pool = getPool();
  await pool.query(`DELETE FROM tickets WHERE id = ?`, [id]);
}
