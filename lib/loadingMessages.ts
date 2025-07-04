// lib/loadingMessages.ts
export interface LoadingMessage {
  text: string;
  duration: number; // milliseconds
  icon?: string;
}

export const recipeImportMessages: LoadingMessage[] = [
  { text: "🔍 Analyzing your recipe link...", duration: 2000 },
  { text: "🤖 AI chef is reading the ingredients...", duration: 2500 },
  { text: "📝 Extracting cooking instructions...", duration: 2000 },
  { text: "🎨 Finding the perfect recipe photo...", duration: 2000 },
  { text: "🧮 Calculating nutritional information...", duration: 1500 },
  { text: "🏷️ Organizing recipe tags and categories...", duration: 1500 },
  { text: "⚡ Almost ready! Finalizing your recipe...", duration: 2000 },
  { text: "✨ Adding some culinary magic...", duration: 1500 },
  { text: "👨‍🍳 Quality checking with our AI chef...", duration: 2000 },
  { text: "📚 Preparing to add to your library...", duration: 1500 }
];

export const platformSpecificMessages: Record<string, LoadingMessage[]> = {
  tiktok: [
    { text: "🎵 Parsing TikTok cooking video...", duration: 2000 },
    { text: "📱 Extracting recipe from viral content...", duration: 2500 },
    { text: "🎬 Analyzing video thumbnail...", duration: 2000 },
    { text: "⭐ This looks like a trending recipe!", duration: 1500 }
  ],
  instagram: [
    { text: "📸 Processing Instagram recipe post...", duration: 2000 },
    { text: "🌟 Extracting from food influencer content...", duration: 2500 },
    { text: "📖 Reading recipe from beautiful photos...", duration: 2000 },
    { text: "✨ Instagram-worthy recipe incoming!", duration: 1500 }
  ],
  youtube: [
    { text: "🎥 Analyzing YouTube cooking tutorial...", duration: 2000 },
    { text: "👨‍🍳 Learning from the chef's video...", duration: 2500 },
    { text: "📺 Extracting step-by-step instructions...", duration: 2000 },
    { text: "🎬 Processing video thumbnail...", duration: 1500 }
  ],
  pinterest: [
    { text: "📌 Unpinning this delicious recipe...", duration: 2000 },
    { text: "🎨 Analyzing Pinterest recipe board...", duration: 2500 },
    { text: "📝 Extracting pinned cooking wisdom...", duration: 2000 }
  ],
  facebook: [
    { text: "📘 Reading Facebook recipe post...", duration: 2000 },
    { text: "👥 Processing shared cooking content...", duration: 2500 },
    { text: "🍽️ Extracting community recipe...", duration: 2000 }
  ],
  website: [
    { text: "🌐 Scanning recipe website...", duration: 2000 },
    { text: "📄 Reading professional recipe content...", duration: 2500 },
    { text: "👨‍🍳 Extracting chef's instructions...", duration: 2000 }
  ]
};

// Platform detection from URL
export function detectPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('pinterest.com')) return 'pinterest';
  if (url.includes('facebook.com')) return 'facebook';
  return 'website';
}

// Get appropriate messages for platform
export function getLoadingMessages(url: string): LoadingMessage[] {
  const platform = detectPlatform(url);
  const platformMessages = platformSpecificMessages[platform] || [];
  
  // Combine platform-specific + general messages
  const combinedMessages = [
    ...platformMessages,
    ...recipeImportMessages.slice(0, 6) // Take first 6 general messages
  ];
  
  // Shuffle and return 4-6 messages for variety
  const shuffled = combinedMessages.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 4); // 4-6 messages
}