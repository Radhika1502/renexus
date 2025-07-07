export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['module-resolver', {
      root: ['.'],
      alias: {
        '@': './src',
        '@packages': './packages',
        '@services': './services',
        '@types': './types'
      }
    }]
  ]
}; 