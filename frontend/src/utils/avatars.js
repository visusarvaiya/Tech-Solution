// Pre-built cartoon avatars
export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Blake',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Cameron',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Drew',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emery',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Finley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Hayden',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Logan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Parker',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Reese',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Skyler',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Tatum',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Winter'
];

// Get avatar URL by index or seed
export const getAvatarUrl = (index) => {
  if (index >= 0 && index < AVATARS.length) {
    return AVATARS[index];
  }
  // Generate random avatar if index is out of range
  const seed = `user-${index || Math.random()}`;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Check if URL is an avatar URL
export const isAvatarUrl = (url) => {
  return url && url.includes('dicebear.com');
};

