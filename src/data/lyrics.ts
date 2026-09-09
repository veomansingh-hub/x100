export interface LyricWord {
  text: string;
  start: number;
  end: number;
}

export interface LyricLine {
  text: string;
  start: number;
  end: number;
  words: LyricWord[];
}

// TRACK 1: Sparks — Coldplay (YouTube: Ar48yzjn1PE)
// Vocals begin at ~33s. Timestamps calibrated manually.
export const sparksLyrics: LyricLine[] = [
  {
    text: "Did I drive you away?",
    start: 33.0, end: 38.5,
    words: [
      { text: "Did", start: 33.0, end: 33.5 },
      { text: "I", start: 33.5, end: 33.9 },
      { text: "drive", start: 33.9, end: 34.7 },
      { text: "you", start: 34.7, end: 35.2 },
      { text: "away?", start: 35.2, end: 38.5 },
    ]
  },
  {
    text: "I know what you'll say",
    start: 40.0, end: 45.5,
    words: [
      { text: "I", start: 40.0, end: 40.4 },
      { text: "know", start: 40.4, end: 41.0 },
      { text: "what", start: 41.0, end: 41.5 },
      { text: "you'll", start: 41.5, end: 42.2 },
      { text: "say", start: 42.2, end: 45.5 },
    ]
  },
  {
    text: "You say, \"Oh, sing one we know\"",
    start: 48.0, end: 54.0,
    words: [
      { text: "You", start: 48.0, end: 48.4 },
      { text: "say,", start: 48.4, end: 49.0 },
      { text: "\"Oh,", start: 49.0, end: 49.8 },
      { text: "sing", start: 49.8, end: 50.4 },
      { text: "one", start: 50.4, end: 50.9 },
      { text: "we", start: 50.9, end: 51.4 },
      { text: "know\"", start: 51.4, end: 54.0 },
    ]
  },
  {
    text: "But I promise you this",
    start: 55.0, end: 60.0,
    words: [
      { text: "But", start: 55.0, end: 55.4 },
      { text: "I", start: 55.4, end: 55.7 },
      { text: "promise", start: 55.7, end: 56.8 },
      { text: "you", start: 56.8, end: 57.3 },
      { text: "this", start: 57.3, end: 60.0 },
    ]
  },
  {
    text: "I'll always look out for you",
    start: 62.0, end: 67.5,
    words: [
      { text: "I'll", start: 62.0, end: 62.5 },
      { text: "always", start: 62.5, end: 63.5 },
      { text: "look", start: 63.5, end: 64.2 },
      { text: "out", start: 64.2, end: 64.7 },
      { text: "for", start: 64.7, end: 65.2 },
      { text: "you", start: 65.2, end: 67.5 },
    ]
  },
  {
    text: "Yeah, that's what I'll do",
    start: 70.0, end: 75.5,
    words: [
      { text: "Yeah,", start: 70.0, end: 70.8 },
      { text: "that's", start: 70.8, end: 71.5 },
      { text: "what", start: 71.5, end: 72.0 },
      { text: "I'll", start: 72.0, end: 72.6 },
      { text: "do", start: 72.6, end: 75.5 },
    ]
  },
  {
    text: "I say, \"Oh\"",
    start: 79.0, end: 85.5,
    words: [
      { text: "I", start: 79.0, end: 79.4 },
      { text: "say,", start: 79.4, end: 80.2 },
      { text: "\"Oh\"", start: 80.2, end: 85.5 },
    ]
  },
  {
    text: "I say, \"Oh\"",
    start: 85.5, end: 92.0,
    words: [
      { text: "I", start: 85.5, end: 85.9 },
      { text: "say,", start: 85.9, end: 86.7 },
      { text: "\"Oh\"", start: 86.7, end: 92.0 },
    ]
  },
  {
    text: "My heart is yours",
    start: 100.0, end: 105.5,
    words: [
      { text: "My", start: 100.0, end: 100.5 },
      { text: "heart", start: 100.5, end: 101.5 },
      { text: "is", start: 101.5, end: 102.0 },
      { text: "yours", start: 102.0, end: 105.5 },
    ]
  },
  {
    text: "It's you that I hold on to",
    start: 107.0, end: 112.5,
    words: [
      { text: "It's", start: 107.0, end: 107.5 },
      { text: "you", start: 107.5, end: 108.3 },
      { text: "that", start: 108.3, end: 108.9 },
      { text: "I", start: 108.9, end: 109.3 },
      { text: "hold", start: 109.3, end: 110.0 },
      { text: "on", start: 110.0, end: 110.5 },
      { text: "to", start: 110.5, end: 112.5 },
    ]
  },
  {
    text: "Yeah, that's what I do",
    start: 114.0, end: 119.5,
    words: [
      { text: "Yeah,", start: 114.0, end: 114.9 },
      { text: "that's", start: 114.9, end: 115.7 },
      { text: "what", start: 115.7, end: 116.3 },
      { text: "I", start: 116.3, end: 116.7 },
      { text: "do", start: 116.7, end: 119.5 },
    ]
  },
  {
    text: "And I know I was wrong",
    start: 122.0, end: 127.5,
    words: [
      { text: "And", start: 122.0, end: 122.5 },
      { text: "I", start: 122.5, end: 122.9 },
      { text: "know", start: 122.9, end: 123.7 },
      { text: "I", start: 123.7, end: 124.1 },
      { text: "was", start: 124.1, end: 124.7 },
      { text: "wrong", start: 124.7, end: 127.5 },
    ]
  },
  {
    text: "But I won't let you down",
    start: 130.0, end: 135.5,
    words: [
      { text: "But", start: 130.0, end: 130.5 },
      { text: "I", start: 130.5, end: 130.9 },
      { text: "won't", start: 130.9, end: 131.7 },
      { text: "let", start: 131.7, end: 132.3 },
      { text: "you", start: 132.3, end: 132.9 },
      { text: "down", start: 132.9, end: 135.5 },
    ]
  },
  {
    text: "Oh yeah, I will, yeah, I will, yes, I will",
    start: 137.0, end: 144.5,
    words: [
      { text: "Oh", start: 137.0, end: 137.5 },
      { text: "yeah,", start: 137.5, end: 138.1 },
      { text: "I", start: 138.1, end: 138.4 },
      { text: "will,", start: 138.4, end: 139.1 },
      { text: "yeah,", start: 139.1, end: 139.7 },
      { text: "I", start: 139.7, end: 140.0 },
      { text: "will,", start: 140.0, end: 141.0 },
      { text: "yes,", start: 141.0, end: 141.7 },
      { text: "I", start: 141.7, end: 142.0 },
      { text: "will", start: 142.0, end: 144.5 },
    ]
  },
  {
    text: "I said, \"Oh\"",
    start: 146.0, end: 152.0,
    words: [
      { text: "I", start: 146.0, end: 146.4 },
      { text: "said,", start: 146.4, end: 147.2 },
      { text: "\"Oh\"", start: 147.2, end: 152.0 },
    ]
  },
  {
    text: "I cry, \"Oh\"",
    start: 153.0, end: 159.0,
    words: [
      { text: "I", start: 153.0, end: 153.4 },
      { text: "cry,", start: 153.4, end: 154.2 },
      { text: "\"Oh\"", start: 154.2, end: 159.0 },
    ]
  },
  {
    text: "Yeah, I saw sparks",
    start: 167.0, end: 172.5,
    words: [
      { text: "Yeah,", start: 167.0, end: 167.9 },
      { text: "I", start: 167.9, end: 168.3 },
      { text: "saw", start: 168.3, end: 169.1 },
      { text: "sparks", start: 169.1, end: 172.5 },
    ]
  },
  {
    text: "Yeah, I saw sparks",
    start: 174.0, end: 179.5,
    words: [
      { text: "Yeah,", start: 174.0, end: 174.9 },
      { text: "I", start: 174.9, end: 175.3 },
      { text: "saw", start: 175.3, end: 176.1 },
      { text: "sparks", start: 176.1, end: 179.5 },
    ]
  },
  {
    text: "And I saw sparks",
    start: 181.5, end: 187.0,
    words: [
      { text: "And", start: 181.5, end: 182.2 },
      { text: "I", start: 182.2, end: 182.6 },
      { text: "saw", start: 182.6, end: 183.4 },
      { text: "sparks", start: 183.4, end: 187.0 },
    ]
  },
  {
    text: "Yeah, I saw sparks",
    start: 188.5, end: 194.0,
    words: [
      { text: "Yeah,", start: 188.5, end: 189.4 },
      { text: "I", start: 189.4, end: 189.8 },
      { text: "saw", start: 189.8, end: 190.6 },
      { text: "sparks", start: 190.6, end: 194.0 },
    ]
  },
  {
    text: "Sing it out",
    start: 197.5, end: 200.5,
    words: [
      { text: "Sing", start: 197.5, end: 198.1 },
      { text: "it", start: 198.1, end: 198.7 },
      { text: "out", start: 198.7, end: 200.5 },
    ]
  },
];

// TRACK 2: Baroon / Banjara (YouTube: kyqJ_FId-_w)
// Timestamps approximate — calibrate by ear
export const baroonLyrics: LyricLine[] = [
  {
    text: "Banjara banjara",
    start: 14.0, end: 18.5,
    words: [
      { text: "Banjara", start: 14.0, end: 15.5 },
      { text: "banjara", start: 15.5, end: 18.5 },
    ]
  },
  {
    text: "Yun hi chalte rehna",
    start: 19.0, end: 24.0,
    words: [
      { text: "Yun", start: 19.0, end: 19.7 },
      { text: "hi", start: 19.7, end: 20.3 },
      { text: "chalte", start: 20.3, end: 21.5 },
      { text: "rehna", start: 21.5, end: 24.0 },
    ]
  },
  {
    text: "Raahon ko badalna",
    start: 25.0, end: 30.0,
    words: [
      { text: "Raahon", start: 25.0, end: 26.2 },
      { text: "ko", start: 26.2, end: 26.8 },
      { text: "badalna", start: 26.8, end: 30.0 },
    ]
  },
  {
    text: "Aasman ko chhoona",
    start: 31.0, end: 36.0,
    words: [
      { text: "Aasman", start: 31.0, end: 32.2 },
      { text: "ko", start: 32.2, end: 32.8 },
      { text: "chhoona", start: 32.8, end: 36.0 },
    ]
  },
  {
    text: "Banjara banjara",
    start: 37.0, end: 42.0,
    words: [
      { text: "Banjara", start: 37.0, end: 38.8 },
      { text: "banjara", start: 38.8, end: 42.0 },
    ]
  },
];

// TRACK 3: Arz Kiya Hai — Anuv Jain × Lost Stories (YouTube: up3j1A3RPJI)
// Timestamps approximate — calibrate by ear
export const arzKiyaHaiLyrics: LyricLine[] = [
  {
    text: "Arz kiya hai",
    start: 20.0, end: 25.0,
    words: [
      { text: "Arz", start: 20.0, end: 21.0 },
      { text: "kiya", start: 21.0, end: 22.2 },
      { text: "hai", start: 22.2, end: 25.0 },
    ]
  },
  {
    text: "Dil ke armaan",
    start: 27.0, end: 32.0,
    words: [
      { text: "Dil", start: 27.0, end: 27.8 },
      { text: "ke", start: 27.8, end: 28.4 },
      { text: "armaan", start: 28.4, end: 32.0 },
    ]
  },
  {
    text: "Tujhse bhi toh kehna tha",
    start: 34.0, end: 40.0,
    words: [
      { text: "Tujhse", start: 34.0, end: 35.2 },
      { text: "bhi", start: 35.2, end: 35.8 },
      { text: "toh", start: 35.8, end: 36.4 },
      { text: "kehna", start: 36.4, end: 37.5 },
      { text: "tha", start: 37.5, end: 40.0 },
    ]
  },
  {
    text: "Jab tu nahi tha paas",
    start: 42.0, end: 48.0,
    words: [
      { text: "Jab", start: 42.0, end: 42.8 },
      { text: "tu", start: 42.8, end: 43.4 },
      { text: "nahi", start: 43.4, end: 44.3 },
      { text: "tha", start: 44.3, end: 45.0 },
      { text: "paas", start: 45.0, end: 48.0 },
    ]
  },
  {
    text: "Toh dil yun tha udaas",
    start: 50.0, end: 56.0,
    words: [
      { text: "Toh", start: 50.0, end: 50.6 },
      { text: "dil", start: 50.6, end: 51.2 },
      { text: "yun", start: 51.2, end: 52.0 },
      { text: "tha", start: 52.0, end: 52.6 },
      { text: "udaas", start: 52.6, end: 56.0 },
    ]
  },
  {
    text: "Arz kiya hai",
    start: 60.0, end: 65.0,
    words: [
      { text: "Arz", start: 60.0, end: 61.0 },
      { text: "kiya", start: 61.0, end: 62.3 },
      { text: "hai", start: 62.3, end: 65.0 },
    ]
  },
];

// TRACK 4: I Like Me Better — Lauv (YouTube: hLQl3WQQoQ0)
// Timestamps calibrated for the studio version
export const iLikeMeBetterLyrics: LyricLine[] = [
  {
    text: "To be young and in love in New York City",
    start: 28.5, end: 34.5,
    words: [
      { text: "To", start: 28.5, end: 28.9 },
      { text: "be", start: 28.9, end: 29.3 },
      { text: "young", start: 29.3, end: 29.9 },
      { text: "and", start: 29.9, end: 30.3 },
      { text: "in", start: 30.3, end: 30.6 },
      { text: "love", start: 30.6, end: 31.2 },
      { text: "in", start: 31.2, end: 31.5 },
      { text: "New", start: 31.5, end: 32.0 },
      { text: "York", start: 32.0, end: 32.5 },
      { text: "City", start: 32.5, end: 34.5 },
    ]
  },
  {
    text: "In New York City",
    start: 34.5, end: 37.5,
    words: [
      { text: "In", start: 34.5, end: 35.0 },
      { text: "New", start: 35.0, end: 35.6 },
      { text: "York", start: 35.6, end: 36.2 },
      { text: "City", start: 36.2, end: 37.5 },
    ]
  },
  {
    text: "To not know who I am",
    start: 38.0, end: 42.5,
    words: [
      { text: "To", start: 38.0, end: 38.4 },
      { text: "not", start: 38.4, end: 38.9 },
      { text: "know", start: 38.9, end: 39.5 },
      { text: "who", start: 39.5, end: 40.0 },
      { text: "I", start: 40.0, end: 40.4 },
      { text: "am,", start: 40.4, end: 42.5 },
    ]
  },
  {
    text: "but still know that I'm good",
    start: 42.5, end: 47.0,
    words: [
      { text: "but", start: 42.5, end: 43.0 },
      { text: "still", start: 43.0, end: 43.7 },
      { text: "know", start: 43.7, end: 44.3 },
      { text: "that", start: 44.3, end: 44.8 },
      { text: "I'm", start: 44.8, end: 45.4 },
      { text: "good", start: 45.4, end: 47.0 },
    ]
  },
  {
    text: "long as you're here with me",
    start: 47.0, end: 52.0,
    words: [
      { text: "long", start: 47.0, end: 47.5 },
      { text: "as", start: 47.5, end: 47.9 },
      { text: "you're", start: 47.9, end: 48.6 },
      { text: "here", start: 48.6, end: 49.3 },
      { text: "with", start: 49.3, end: 49.8 },
      { text: "me", start: 49.8, end: 52.0 },
    ]
  },
  {
    text: "To be drunk and in love in New York City",
    start: 53.0, end: 59.5,
    words: [
      { text: "To", start: 53.0, end: 53.4 },
      { text: "be", start: 53.4, end: 53.8 },
      { text: "drunk", start: 53.8, end: 54.5 },
      { text: "and", start: 54.5, end: 54.9 },
      { text: "in", start: 54.9, end: 55.2 },
      { text: "love", start: 55.2, end: 55.9 },
      { text: "in", start: 55.9, end: 56.2 },
      { text: "New", start: 56.2, end: 56.7 },
      { text: "York", start: 56.7, end: 57.3 },
      { text: "City", start: 57.3, end: 59.5 },
    ]
  },
  {
    text: "In New York City",
    start: 59.5, end: 62.5,
    words: [
      { text: "In", start: 59.5, end: 60.0 },
      { text: "New", start: 60.0, end: 60.6 },
      { text: "York", start: 60.6, end: 61.2 },
      { text: "City", start: 61.2, end: 62.5 },
    ]
  },
  {
    text: "Midnight into morning coffee",
    start: 63.0, end: 68.5,
    words: [
      { text: "Midnight", start: 63.0, end: 64.0 },
      { text: "into", start: 64.0, end: 64.8 },
      { text: "morning", start: 64.8, end: 65.8 },
      { text: "coffee", start: 65.8, end: 68.5 },
    ]
  },
  {
    text: "Burning through the hours talking",
    start: 68.5, end: 74.5,
    words: [
      { text: "Burning", start: 68.5, end: 69.5 },
      { text: "through", start: 69.5, end: 70.2 },
      { text: "the", start: 70.2, end: 70.6 },
      { text: "hours", start: 70.6, end: 71.6 },
      { text: "talking", start: 71.6, end: 74.5 },
    ]
  },
  {
    text: "Damn, I like me better when I'm with you",
    start: 78.0, end: 85.0,
    words: [
      { text: "Damn,", start: 78.0, end: 78.7 },
      { text: "I", start: 78.7, end: 79.0 },
      { text: "like", start: 79.0, end: 79.6 },
      { text: "me", start: 79.6, end: 80.1 },
      { text: "better", start: 80.1, end: 81.0 },
      { text: "when", start: 81.0, end: 81.6 },
      { text: "I'm", start: 81.6, end: 82.2 },
      { text: "with", start: 82.2, end: 82.7 },
      { text: "you", start: 82.7, end: 85.0 },
    ]
  },
  {
    text: "I like me better",
    start: 85.0, end: 90.0,
    words: [
      { text: "I", start: 85.0, end: 85.5 },
      { text: "like", start: 85.5, end: 86.2 },
      { text: "me", start: 86.2, end: 86.9 },
      { text: "better", start: 86.9, end: 90.0 },
    ]
  },
];
