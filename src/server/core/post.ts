import { context, reddit } from '@devvit/web/server';

/**
 * Creates a simple custom post in the subreddit where the app is installed.
 */
export const createPost = async () => {
  const { subredditName } = context;

  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    subredditName,
    title: 'Hello from Devvit 🚀',
    splash: {
      appDisplayName: 'hackathon-prj2',
    },
  });
};
