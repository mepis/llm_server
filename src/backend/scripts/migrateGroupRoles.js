const { getDB } = require('../config/db');

const knex = () => getDB();

async function migrateGroupRoles() {
  const db = knex();

  try {
    console.log('Starting document groups RBAC migration...');

    // Phase A: Add new roles column if it doesn't exist (safe, no data loss)
    console.log('Phase A: Adding roles column...');
    try {
      await db.raw(`ALTER TABLE document_groups ADD COLUMN roles JSON DEFAULT '["user"]'`);
      console.log('  Added roles column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  Roles column already exists, skipping');
      } else {
        throw err;
      }
    }

    // Phase B: Migrate data
    console.log('Phase B: Migrating group data...');

    // Fetch all groups with owner role info via JOIN
    const groups = await db('document_groups')
      .select('document_groups.id', 'document_groups.visibility', 'document_groups.owner_id', 'document_groups.members', 'users.roles as owner_roles')
      .leftJoin('users', 'users.id', 'document_groups.owner_id');

    console.log(`  Found ${groups.length} groups to migrate`);

    for (const group of groups) {
      let targetRoles = [];

      // Determine base roles from visibility
      if (group.visibility === 'public') {
        targetRoles.push('user');
      } else if (group.visibility === 'team') {
        targetRoles.push('admin');
      } else {
        // private - use owner's actual roles
        if (group.owner_roles) {
          const ownerRoles = typeof group.owner_roles === 'string' ? JSON.parse(group.owner_roles) : group.owner_roles;
          targetRoles.push(...ownerRoles);
        } else {
          // Orphaned group - default to ['user']
          targetRoles.push('user');
        }
      }

      // Enrich roles from existing members
      if (group.members) {
        const members = typeof group.members === 'string' ? JSON.parse(group.members) : group.members;
        if (Array.isArray(members) && members.length > 0) {
          const memberIds = members.map(m => m.user_id).filter(Boolean);
          if (memberIds.length > 0) {
            const memberUsers = await db('users').whereIn('id', memberIds).select('id', 'roles');
            for (const mu of memberUsers) {
              const muRoles = typeof mu.roles === 'string' ? JSON.parse(mu.roles) : mu.roles;
              if (Array.isArray(muRoles)) {
                targetRoles.push(...muRoles);
              }
            }
          }
        }
      }

      // Deduplicate using Set
      const uniqueRoles = [...new Set(targetRoles)];

      // Validate: if empty, default to ['user']
      if (uniqueRoles.length === 0) {
        uniqueRoles.push('user');
      }

      await db('document_groups')
        .where({ id: group.id })
        .update({ roles: JSON.stringify(uniqueRoles) });

      console.log(`  Group "${group.id}": ${JSON.stringify(uniqueRoles)}`);
    }

    // Phase C: Drop old columns
    console.log('Phase C: Dropping old columns...');
    try {
      await db.raw(`ALTER TABLE document_groups DROP COLUMN visibility`);
      console.log('  Dropped visibility column');
    } catch (err) {
      console.error('  Warning: Could not drop visibility column:', err.message);
    }

    try {
      await db.raw(`ALTER TABLE document_groups DROP COLUMN members`);
      console.log('  Dropped members column');
    } catch (err) {
      console.error('  Warning: Could not drop members column:', err.message);
    }

    // Verification
    const verifyGroups = await db('document_groups').select('id', 'name', 'roles');
    console.log('\nMigration complete. Verified groups:');
    for (const g of verifyGroups) {
      console.log(`  ${g.id}: roles=${g.roles}`);
    }

    console.log('\nMigration successful!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateGroupRoles();
