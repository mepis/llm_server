import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LLM Server API',
      version: '1.0.0',
      description: 'A comprehensive API for managing local LLM instances with llama.cpp',
      contact: {
        name: 'LLM Server',
        url: 'https://github.com/mepis/llm_server',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'System',
        description: 'System information and metrics',
      },
      {
        name: 'Build',
        description: 'llama.cpp build management',
      },
      {
        name: 'Service',
        description: 'systemd service management',
      },
      {
        name: 'Models',
        description: 'LLM model management',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                version: {
                  type: 'string',
                  example: '1.0.0',
                },
              },
            },
          },
        },
        SystemInfo: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                platform: {
                  type: 'string',
                  example: 'linux',
                },
                cpu: {
                  type: 'object',
                  properties: {
                    model: {
                      type: 'string',
                      example: 'Intel Core i7',
                    },
                    cores: {
                      type: 'integer',
                      example: 8,
                    },
                    architecture: {
                      type: 'string',
                      example: 'x64',
                    },
                    features: {
                      type: 'object',
                      properties: {
                        avx2: {
                          type: 'boolean',
                        },
                        avx512: {
                          type: 'boolean',
                        },
                      },
                    },
                  },
                },
                memory: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                      example: 16777216000,
                    },
                    available: {
                      type: 'integer',
                      example: 8388608000,
                    },
                  },
                },
                gpu: {
                  type: 'object',
                  properties: {
                    nvidia: {
                      type: 'object',
                      properties: {
                        available: {
                          type: 'boolean',
                        },
                        name: {
                          type: 'string',
                          example: 'RTX 3080',
                        },
                        memory: {
                          type: 'integer',
                        },
                      },
                    },
                    amd: {
                      type: 'object',
                      properties: {
                        available: {
                          type: 'boolean',
                        },
                      },
                    },
                  },
                },
                recommendedBuild: {
                  type: 'string',
                  enum: ['cpu', 'cuda', 'rocm'],
                  example: 'cuda',
                },
              },
            },
          },
        },
        SystemMetrics: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                cpu: {
                  type: 'object',
                  properties: {
                    usage: {
                      type: 'number',
                      format: 'float',
                      example: 45.2,
                    },
                    cores: {
                      type: 'integer',
                      example: 8,
                    },
                  },
                },
                memory: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                    },
                    used: {
                      type: 'integer',
                    },
                    free: {
                      type: 'integer',
                    },
                  },
                },
                uptime: {
                  type: 'integer',
                  example: 86400,
                },
                loadAverage: {
                  type: 'array',
                  items: {
                    type: 'number',
                    format: 'float',
                  },
                  example: [1.5, 1.2, 1.0],
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./server/routes/*.js', './server/index.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
