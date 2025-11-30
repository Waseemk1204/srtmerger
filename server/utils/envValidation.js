/**
 * Environment variable validation
 * Validates required environment variables and their quality on server startup
 */

export const validateEnvironment = () => {
    const errors = [];
    const warnings = [];

    // Required variables
    const required = {
        'JWT_SECRET': {
            minLength: 32,
            description: 'JWT signing secret'
        },
        'MONGODB_URI': {
            minLength: 10,
            description: 'MongoDB connection string'
        },
        'RAZORPAY_KEY_ID': {
            minLength: 10,
            description: 'Razorpay API key ID'
        },
        'RAZORPAY_KEY_SECRET': {
            minLength: 10,
            description: 'Razorpay API secret'
        },
        'GOOGLE_CLIENT_ID': {
            minLength: 20,
            description: 'Google OAuth client ID'
        }
    };

    // Check each required variable
    for (const [key, config] of Object.entries(required)) {
        const value = process.env[key];

        if (!value) {
            errors.push(`Missing required environment variable: ${key} (${config.description})`);
            continue;
        }

        // Trim whitespace
        const trimmed = value.trim();
        if (trimmed !== value) {
            warnings.push(`${key} has leading/trailing whitespace - this may cause issues`);
        }

        // Check minimum length
        if (trimmed.length < config.minLength) {
            errors.push(`${key} is too short (${trimmed.length} chars, minimum: ${config.minLength})`);
        }

        // Special validations
        if (key === 'JWT_SECRET') {
            // Check for common weak secrets
            const weakSecrets = ['secret', 'password', '12345', 'test', 'dev', 'changeme'];
            if (weakSecrets.some(weak => trimmed.toLowerCase().includes(weak))) {
                warnings.push(`${key} appears to contain a weak/common password - consider using a stronger random value`);
            }

            // Encourage longer secrets
            if (trimmed.length < 64) {
                warnings.push(`${key} is valid but short (${trimmed.length} chars). Recommend 64+ characters for production.`);
            }
        }

        if (key === 'MONGODB_URI') {
            if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
                errors.push(`${key} must start with mongodb:// or mongodb+srv://`);
            }
        }
    }

    // Optional but recommended
    const optional = ['NODE_ENV', 'PORT'];
    for (const key of optional) {
        if (!process.env[key]) {
            warnings.push(`Optional variable ${key} not set - using defaults`);
        }
    }

    // Report results
    if (errors.length > 0) {
        console.error('\n❌ ENVIRONMENT VALIDATION FAILED\n');
        errors.forEach(err => console.error(`  • ${err}`));
        console.error('\nPlease check your .env file and restart the server.\n');
        throw new Error('Environment validation failed - see errors above');
    }

    if (warnings.length > 0) {
        console.warn('\n⚠️  ENVIRONMENT WARNINGS\n');
        warnings.forEach(warn => console.warn(`  • ${warn}`));
        console.warn('');
    }

    console.log('✓ Environment validation passed\n');
};
