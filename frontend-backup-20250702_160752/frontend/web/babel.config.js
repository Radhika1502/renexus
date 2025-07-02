module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { 
      isTSX: true, 
      allExtensions: true,
      allowNamespaces: true,
      allowDeclareFields: true
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime'
  ]
};