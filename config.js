// Michelle Artistry - Supabase & ImageKit Configuration
// Replace these placeholders with your actual credentials from Supabase and ImageKit.

const CONFIG = {
    // 1. Supabase credentials (found in Project Settings -> API)
    SUPABASE_URL: "https://lhejyxhllenegcebodzr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZWp5eGhsbGVuZWdjZWJvZHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODY4MDQsImV4cCI6MjA5NDg2MjgwNH0.IXFPYmpy6dt3uQAVZMcyFEcW3mLKjzShwN08a6a9Xq8",

    // 2. ImageKit endpoint (found in Dashboard under Developer Options -> URL Endpoint)
    // E.g., "https://ik.imagekit.io/your_imagekit_id/"
    IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/scmchurch"
};

// Export configuration if using Node.js, otherwise bind to window for browser access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
