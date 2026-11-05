/* eslint-disable no-console */
import { User } from '@/models/index.js';

/**
 * Synchronizes a Supabase authenticated user with the MySQL database.
 * Creates a new record if the user does not exist, or updates their profile if changed.
 *
 * @param {import('@supabase/supabase-js').User} supabaseUser
 * @returns {Promise<import('@/models/user.js').User | null>}
 */
export async function syncUser(supabaseUser) {
  if (!supabaseUser || !supabaseUser.id) {
    return null;
  }

  const supabaseUserId = supabaseUser.id;
  const email = (supabaseUser.email || '').toLowerCase().trim();
  const metadata = supabaseUser.user_metadata || {};
  const isEmailVerified = Boolean(
    supabaseUser.email_confirmed_at || supabaseUser.confirmed_at
  );

  const name =
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'VoteSphere User');

  const image =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.avatar ||
    metadata.image ||
    null;

  try {
    // 1. Primary lookup: Exactly by unique Supabase User ID
    let user = await User.findOne({
      where: { supabaseUserId },
    });

    // 2. Verified email association (e.g. existing seed/OAuth account with same verified email)
    // Security constraint: NEVER silently merge accounts based only on an unverified email.
    if (!user && email && isEmailVerified) {
      user = await User.findOne({
        where: { email },
      });

      if (user) {
        user.supabaseUserId = supabaseUserId;
      }
    }

    if (!user) {
      // 3. Create new local user record
      try {
        user = await User.create({
          supabaseUserId,
          name,
          email,
          image,
        });
        console.log(`[UserSync] Created new MySQL user: ${user.id} (${email})`);
      } catch (createErr) {
        // If unique constraint triggers on race condition, fetch existing
        if (createErr.name === 'SequelizeUniqueConstraintError') {
          user = await User.findOne({
            where: { supabaseUserId },
          });
          if (!user && email) {
            user = await User.findOne({
              where: { email },
            });
          }
        } else {
          throw createErr;
        }
      }
    } else {
      // 4. Update existing user profile attributes safely
      let hasChanges = false;

      if (user.name !== name && name && name !== 'VoteSphere User') {
        user.name = name;
        hasChanges = true;
      }

      if (user.email !== email && email) {
        user.email = email;
        hasChanges = true;
      }

      if (image && !user.image) {
        user.image = image;
        hasChanges = true;
      }

      if (hasChanges) {
        await user.save();
        console.log(`[UserSync] Updated MySQL user profile: ${user.id} (${email})`);
      }
    }

    return user;
  } catch (error) {
    console.error('[UserSync] Error syncing user with database:', error);
    const isConnectionError =
      error.name === 'SequelizeConnectionError' ||
      error.name === 'SequelizeHostNotFoundError' ||
      error.name === 'SequelizeConnectionRefusedError' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.original?.code === 'ENOTFOUND' ||
      error.parent?.code === 'ENOTFOUND';

    if (isConnectionError) {
      throw error;
    }
    return null;
  }
}

