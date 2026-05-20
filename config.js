// Michelle Artistry - Supabase & ImageKit Configuration
// Replace these placeholders with your actual credentials from Supabase and ImageKit.

const CONFIG = {
    // 1. Supabase credentials (found in Project Settings -> API)
    SUPABASE_URL: "https://lhejyxhllenegcebodzr.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_Z4VzOY99QtYxbZ9qS0n_dA_EjmKM7_B",

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
