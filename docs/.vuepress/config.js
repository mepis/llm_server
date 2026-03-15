module.exports = {
  title: 'llama.cpp Documentation',
  description: 'Documentation for all build and runtime options of llama.cpp',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Build Options', link: '/build-options' },
      { text: 'Runtime Options', link: '/runtime-options' },
      { text: 'Backend', link: '/backend' },
      { text: 'Multimodal', link: '/multimodal' },
      { text: 'Operations', link: '/ops' }
    ],
    sidebar: {
      '/build-options/': [
        {
          title: 'Build Options',
          path: '/build-options/'
        }
      ],
      '/runtime-options/': [
        {
          title: 'Runtime Options',
          path: '/runtime-options/'
        }
 ]
  '/backend/': [
    {
      title: 'Backend',
      path: '/backend/'
    }
  ],
  '/multimodal/': [
    {
      title: 'Multimodal',
      path: '/multimodal/'
    }
  ],
  '/ops/': [
    {
      title: 'Operations',
      path: '/ops/'
    }
  ],
},
    markdown: {
      lineNumbers: true
    }
  },
  markdown: {
    lineNumbers: true
  }
}