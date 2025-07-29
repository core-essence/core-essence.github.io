// アプリケーション設定
const CONFIG = {
    // R2設定
    R2: {
        BASE_URL: 'https://pub-a2319224352d4abda31362be3c2b1c19.r2.dev',
        PRODUCTS_PATH: '/products/',
        ACCESS_KEY_ID: '016edad8d98f07ad63d2496fa598910a',
        // SECRET_ACCESS_KEYは本番環境では環境変数から取得すること
    },
    
    // 画像設定
    IMAGE: {
        MAX_DETAIL_IMAGES: 10,
        ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        THUMBNAIL_PREFIX: 'thumb',
        DETAIL_PREFIX: 'detail'
    },
    
    // Excel設定
    EXCEL: {
        ACCEPTED_EXTENSIONS: ['.xlsx', '.xls'],
        HEADER_ROW: 0,  // 0-indexed
        DATA_START_ROW: 1
    },
    
    // API設定
    API: {
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    },
    
    // UI設定
    UI: {
        LOG_MAX_ENTRIES: 100,
        SUCCESS_MESSAGE_DURATION: 3000,
        ANIMATION_DURATION: 300
    }
};