import pool from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // ── Users ──────────────────────────────────────────────────────
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass  = await bcrypt.hash('user123', 10);

    await pool.query(`
      INSERT INTO users (id, email, password, role) VALUES
        ($1, 'admin@metro.com', $2, 'admin'),
        ($3, 'user@metro.com',  $4, 'user')
      ON CONFLICT (email) DO NOTHING
    `, [uuidv4(), adminPass, uuidv4(), userPass]);
    console.log('✅ Users seeded');

    // ── Stops ──────────────────────────────────────────────────────
    const stopData = [
      // Yellow Line
      { code: 'YL01', name: 'Samaypur Badli' },
      { code: 'YL02', name: 'Rohini Sector 18' },
      { code: 'YL03', name: 'Jahangirpuri' },
      { code: 'YL04', name: 'Adarsh Nagar' },
      { code: 'YL05', name: 'Azadpur' },
      { code: 'YL06', name: 'Model Town' },
      { code: 'YL07', name: 'GTB Nagar' },
      { code: 'YL08', name: 'Vishwa Vidyalaya' },
      { code: 'YL09', name: 'Civil Lines' },
      { code: 'YL10', name: 'Kashmere Gate' },   // interchange with Red Line
      { code: 'YL11', name: 'Chandni Chowk' },
      { code: 'YL12', name: 'Chawri Bazar' },
      { code: 'YL13', name: 'New Delhi' },
      { code: 'YL14', name: 'Rajiv Chowk' },     // interchange with Blue Line ← key interchange
      { code: 'YL15', name: 'Patel Chowk' },
      { code: 'YL16', name: 'Central Secretariat' },
      { code: 'YL17', name: 'Udyog Bhawan' },
      { code: 'YL18', name: 'Lok Kalyan Marg' },
      { code: 'YL19', name: 'Jor Bagh' },
      { code: 'YL20', name: 'INA' },
      { code: 'YL21', name: 'AIIMS' },
      { code: 'YL22', name: 'Green Park' },
      { code: 'YL23', name: 'Hauz Khas' },
      { code: 'YL24', name: 'Malviya Nagar' },
      { code: 'YL25', name: 'Saket' },
      { code: 'YL26', name: 'Qutub Minar' },
      { code: 'YL27', name: 'Chhattarpur' },
      { code: 'YL28', name: 'Sultanpur' },
      { code: 'YL29', name: 'Ghitorni' },
      { code: 'YL30', name: 'HUDA City Centre' },

      // Blue Line only stops (Rajiv Chowk is shared so we reuse YL14's id)
      { code: 'BL01', name: 'Dwarka Sector 21' },
      { code: 'BL02', name: 'Dwarka Sector 8' },
      { code: 'BL03', name: 'Dwarka' },
      { code: 'BL04', name: 'Dwarka Mor' },
      { code: 'BL05', name: 'Nawada' },
      { code: 'BL06', name: 'Janakpuri West' },
      { code: 'BL07', name: 'Janakpuri East' },
      { code: 'BL08', name: 'Tilak Nagar' },
      { code: 'BL09', name: 'Rajouri Garden' },
      { code: 'BL10', name: 'Moti Nagar' },
      { code: 'BL11', name: 'Kirti Nagar' },
      { code: 'BL12', name: 'Shadipur' },
      { code: 'BL13', name: 'Patel Nagar' },
      { code: 'BL14', name: 'Karol Bagh' },
      { code: 'BL15', name: 'Jhandewalan' },
      { code: 'BL16', name: 'RK Ashram Marg' },
      // Rajiv Chowk → YL14 (shared)
      { code: 'BL17', name: 'Mandi House' },
      { code: 'BL18', name: 'Barakhamba Road' },
      { code: 'BL19', name: 'Pragati Maidan' },
      { code: 'BL20', name: 'Indraprastha' },
      { code: 'BL21', name: 'Yamuna Bank' },
      { code: 'BL22', name: 'Laxmi Nagar' },
      { code: 'BL23', name: 'Nirman Vihar' },
      { code: 'BL24', name: 'Preet Vihar' },
      { code: 'BL25', name: 'Karkarduma' },
      { code: 'BL26', name: 'Anand Vihar' },
      { code: 'BL27', name: 'Kaushambi' },
      { code: 'BL28', name: 'Vaishali' },
    ];

    // Insert stops and collect id map
    const stopIdMap = {}; // code → id
    for (const s of stopData) {
      const existing = await pool.query('SELECT id FROM stops WHERE code = $1', [s.code]);
      if (existing.rows.length > 0) {
        stopIdMap[s.code] = existing.rows[0].id;
      } else {
        const id = uuidv4();
        await pool.query('INSERT INTO stops (id, name, code) VALUES ($1, $2, $3)', [id, s.name, s.code]);
        stopIdMap[s.code] = id;
      }
    }
    console.log(`✅ Stops seeded: ${Object.keys(stopIdMap).length}`);

    // ── Yellow Line ────────────────────────────────────────────────
    let yellowId;
    const yl = await pool.query("SELECT id FROM routes WHERE name = 'Yellow Line'");
    if (yl.rows.length > 0) {
      yellowId = yl.rows[0].id;
    } else {
      yellowId = uuidv4();
      await pool.query("INSERT INTO routes (id, name, color) VALUES ($1, 'Yellow Line', '#FFD700')", [yellowId]);
    }

    const yellowStops = [
      'YL01','YL02','YL03','YL04','YL05','YL06','YL07','YL08','YL09','YL10',
      'YL11','YL12','YL13','YL14','YL15','YL16','YL17','YL18','YL19','YL20',
      'YL21','YL22','YL23','YL24','YL25','YL26','YL27','YL28','YL29','YL30',
    ];

    for (let i = 0; i < yellowStops.length; i++) {
      const exists = await pool.query(
        'SELECT id FROM route_stops WHERE route_id = $1 AND stop_id = $2',
        [yellowId, stopIdMap[yellowStops[i]]]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO route_stops (id, route_id, stop_id, stop_order, travel_time_to_next) VALUES ($1,$2,$3,$4,$5)',
          [uuidv4(), yellowId, stopIdMap[yellowStops[i]], i + 1, i < yellowStops.length - 1 ? 3 : null]
        );
      }
    }
    console.log('✅ Yellow Line seeded');

    // ── Blue Line ──────────────────────────────────────────────────
    // Rajiv Chowk (YL14) is shared — it sits in the middle of Blue Line too
    let blueId;
    const bl = await pool.query("SELECT id FROM routes WHERE name = 'Blue Line'");
    if (bl.rows.length > 0) {
      blueId = bl.rows[0].id;
    } else {
      blueId = uuidv4();
      await pool.query("INSERT INTO routes (id, name, color) VALUES ($1, 'Blue Line', '#0000FF')", [blueId]);
    }

    const blueStops = [
      'BL01','BL02','BL03','BL04','BL05','BL06','BL07','BL08','BL09','BL10',
      'BL11','BL12','BL13','BL14','BL15','BL16',
      'YL14', // ← Rajiv Chowk interchange
      'BL17','BL18','BL19','BL20','BL21','BL22','BL23','BL24','BL25','BL26','BL27','BL28',
    ];

    for (let i = 0; i < blueStops.length; i++) {
      const exists = await pool.query(
        'SELECT id FROM route_stops WHERE route_id = $1 AND stop_id = $2',
        [blueId, stopIdMap[blueStops[i]]]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO route_stops (id, route_id, stop_id, stop_order, travel_time_to_next) VALUES ($1,$2,$3,$4,$5)',
          [uuidv4(), blueId, stopIdMap[blueStops[i]], i + 1, i < blueStops.length - 1 ? 3 : null]
        );
      }
    }
    console.log('✅ Blue Line seeded');

    // ── Print test IDs ─────────────────────────────────────────────
    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────────────');
    console.log('Admin → admin@metro.com / admin123');
    console.log('User  → user@metro.com  / user123');
    console.log('\nTest route IDs:');
    console.log(`Yellow only (YL01→YL30):  from=${stopIdMap['YL01']}  to=${stopIdMap['YL30']}`);
    console.log(`Cross-line  (BL01→YL30):  from=${stopIdMap['BL01']}  to=${stopIdMap['YL30']}`);
    console.log('  ↑ This requires interchange at Rajiv Chowk (YL14)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();