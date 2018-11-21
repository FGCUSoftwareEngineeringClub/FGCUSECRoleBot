module.exports = {
    "extends": "google",
    "parserOptions": {
        "ecmaVersion": "2017"
    },
    "rules": {
        "linebreak-style": ["error", "windows"],
        "no-unused-vars": "warn",
        "max-len": [2, {
            code: 100,
            ignoreUrls: true,
            ignoreTemplateLiterals: true
        }]
    }
};