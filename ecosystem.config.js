module.exports = {
	apps: [
		{
			name: 'image-upload-service',
			script: './build/index.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env_production: {
				NODE_ENV: 'production',
				PORT: 3030,
			},
		},
	],
};
