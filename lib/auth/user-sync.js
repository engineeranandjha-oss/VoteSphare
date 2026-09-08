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
  const email = supabaseUser.email || '';
  const metadata = supabaseUser.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'VoteSphere User');

  const image = metadata.avatar_url || metadata.picture || null;

  try {
    // 1. Try finding by Supabase User ID first
    let user = await User.findOne({
      where: { supabaseUserId },
    });

    // 2. Fallback check by email (in case user was seeded or created previously)
    if (!user && email) {
      user = await User.findOne({
        where: { email },
      });

      if (user) {
        user.supabaseUserId = supabaseUserId;
      }
    }

    if (!user) {
      // 3. Create new user
      user = await User.create({
        supabaseUserId,
        name,
        email,
        image,
      });
      console.log(`[UserSync] Created new MySQL user: ${user.id} (${email})`);
    } else {
      // 4. Update existing user attributes if changed
      let hasChanges = false;

      if (user.name !== name && name) {
        user.name = name;
        hasChanges = true;
      }

      if (user.email !== email && email) {
        user.email = email;
        hasChanges = true;
      }

      if (image && user.image !== image) {
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
    // Return null or throw depending on design, returning null avoids crashing callback if DB is temporarily unreachable
    return null;
  }
}
