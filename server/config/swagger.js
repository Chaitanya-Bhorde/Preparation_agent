const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrepAgent API',
      version: '1.0.0',
      description: 'Full-stack placement preparation platform API. Features include coding platform with Judge0 integration, ATS resume analyzer, analytics dashboard, and recommendation engine.',
      contact: {
        name: 'PrepAgent',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in httpOnly cookie. Use login endpoint to obtain it.',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Alternative: pass JWT token as Bearer token in Authorization header.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['student', 'admin'] },
            profile: {
              type: 'object',
              properties: {
                resumeUrl: { type: 'string' },
                atsScore: { type: 'number' },
                skills: { type: 'array', items: { type: 'string' } },
                college: { type: 'string' },
                year: { type: 'string' },
                branch: { type: 'string' },
                cgpa: { type: 'number' },
              },
            },
            stats: {
              type: 'object',
              properties: {
                totalSolved: { type: 'number' },
                easySolved: { type: 'number' },
                mediumSolved: { type: 'number' },
                hardSolved: { type: 'number' },
                totalSubmissions: { type: 'number' },
                streak: { type: 'number' },
              },
            },
          },
        },
        Problem: {
          type: 'object',
          required: ['title', 'description', 'difficulty'],
          properties: {
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            tags: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'string' },
            timeLimit: { type: 'number' },
            memoryLimit: { type: 'number' },
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                  output: { type: 'string' },
                  explanation: { type: 'string' },
                },
              },
            },
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                  expectedOutput: { type: 'string' },
                  isSample: { type: 'boolean' },
                  explanation: { type: 'string' },
                },
              },
            },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            problem: { type: 'string' },
            code: { type: 'string' },
            language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'] },
            type: { type: 'string', enum: ['run', 'submit'] },
            status: { type: 'string', enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'] },
            errorType: { type: 'string' },
            errorMessage: { type: 'string' },
            passedTestCases: { type: 'number' },
            totalTestCases: { type: 'number' },
            executionTime: { type: 'number' },
            memoryUsed: { type: 'number' },
            score: { type: 'number' },
          },
        },
        ResumeAnalysis: {
          type: 'object',
          properties: {
            category_scores: {
              type: 'object',
              properties: {
                contact_structure: { type: 'number' },
                experience: { type: 'number' },
                projects: { type: 'number' },
                technical_skills: { type: 'number' },
                achievements: { type: 'number' },
                education: { type: 'number' },
                keyword_density: { type: 'number' },
              },
            },
            total_score: { type: 'number' },
            top_3_improvements: { type: 'array', items: { type: 'string' } },
          },
        },
        AnalyticsResponse: {
          type: 'object',
          properties: {
            overallStats: {
              type: 'object',
              properties: {
                totalSolved: { type: 'number' },
                totalSubmissions: { type: 'number' },
                acceptanceRate: { type: 'number' },
                currentStreak: { type: 'number' },
                atsScore: { type: 'number' },
              },
            },
            difficultyDistribution: {
              type: 'object',
              properties: {
                easy: { type: 'number' },
                medium: { type: 'number' },
                hard: { type: 'number' },
              },
            },
            topicPerformance: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  total: { type: 'number' },
                  accepted: { type: 'number' },
                  successRate: { type: 'number' },
                },
              },
            },
            rank: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
            400: { description: 'User already exists or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/logout': {
        get: {
          tags: ['Auth'],
          summary: 'Logout user',
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: 'User profile retrieved' },
            401: { description: 'Not authorized' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update user profile',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    skills: { type: 'array', items: { type: 'string' } },
                    college: { type: 'string' },
                    year: { type: 'string' },
                    branch: { type: 'string' },
                    cgpa: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
          },
        },
      },
      '/api/problems': {
        get: {
          tags: ['Problems'],
          summary: 'Get all problems (paginated, filterable)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['easy', 'medium', 'hard'] } },
            { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Comma-separated tags' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Problems retrieved' },
          },
        },
        post: {
          tags: ['Problems'],
          summary: 'Create a new problem (Admin only)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Problem' },
              },
            },
          },
          responses: {
            201: { description: 'Problem created' },
            403: { description: 'Not authorized (admin only)' },
          },
        },
      },
      '/api/problems/tags': {
        get: {
          tags: ['Problems'],
          summary: 'Get all distinct tags',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: 'Tags retrieved' },
          },
        },
      },
      '/api/problems/{slug}': {
        get: {
          tags: ['Problems'],
          summary: 'Get a single problem by slug',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Problem retrieved' },
            404: { description: 'Problem not found' },
          },
        },
      },
      '/api/problems/{id}': {
        put: {
          tags: ['Problems'],
          summary: 'Update a problem (Admin only)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Problem updated' },
          },
        },
        delete: {
          tags: ['Problems'],
          summary: 'Soft-delete a problem (Admin only)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Problem deleted' },
          },
        },
      },
      '/api/submissions/run': {
        post: {
          tags: ['Submissions'],
          summary: 'Run code against sample test cases only',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'code', 'language'],
                  properties: {
                    problemId: { type: 'string' },
                    code: { type: 'string' },
                    language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Run result', content: { 'application/json': { schema: { $ref: '#/components/schemas/Submission' } } } },
          },
        },
      },
      '/api/submissions/submit': {
        post: {
          tags: ['Submissions'],
          summary: 'Submit code against all test cases for grading',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'code', 'language'],
                  properties: {
                    problemId: { type: 'string' },
                    code: { type: 'string' },
                    language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Submission result with grading' },
          },
        },
      },
      '/api/submissions': {
        get: {
          tags: ['Submissions'],
          summary: 'Get user submission history',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'problemId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Submissions retrieved' },
          },
        },
      },
      '/api/submissions/{id}': {
        get: {
          tags: ['Submissions'],
          summary: 'Get a single submission by ID',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Submission retrieved' },
            404: { description: 'Submission not found' },
          },
        },
      },
      '/api/ats/analyze': {
        post: {
          tags: ['Resume ATS'],
          summary: 'Upload and analyze a resume file',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    resume: {
                      type: 'string',
                      format: 'binary',
                      description: 'Resume file (PDF, DOCX, TXT)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Resume analyzed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumeAnalysis' } } } },
            400: { description: 'Upload error or parse failure' },
          },
        },
      },
      '/api/ats/analyze-text': {
        post: {
          tags: ['Resume ATS'],
          summary: 'Analyze pasted resume text',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string', minLength: 100 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Resume text analyzed' },
          },
        },
      },
      '/api/recommendations': {
        get: {
          tags: ['Recommendations'],
          summary: 'Get personalized problem recommendations and revision queue',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: {
              description: 'Recommendations retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      recommendations: { type: 'array', items: { $ref: '#/components/schemas/Problem' } },
                      revisionQueue: { type: 'array', items: { $ref: '#/components/schemas/Problem' } },
                      weakTopics: { type: 'array', items: { type: 'string' } },
                      targetDifficulty: { type: 'string' },
                      recentSuccessRate: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/recommendations/revision': {
        post: {
          tags: ['Recommendations'],
          summary: 'Add a problem to revision queue',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId'],
                  properties: {
                    problemId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Added to revision queue' },
          },
        },
      },
      '/api/recommendations/revision/{problemId}': {
        delete: {
          tags: ['Recommendations'],
          summary: 'Remove a problem from revision queue',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'problemId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Removed from revision queue' },
          },
        },
      },
      '/api/analytics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get personal analytics for current user',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: 'Analytics retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsResponse' } } } },
          },
        },
      },
      '/api/analytics/admin': {
        get: {
          tags: ['Analytics'],
          summary: 'Get admin-level platform analytics (Admin only)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: {
              description: 'Admin analytics retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalUsers: { type: 'number' },
                      totalStudents: { type: 'number' },
                      totalProblems: { type: 'number' },
                      totalSubmissions: { type: 'number' },
                      problemDistribution: {
                        type: 'object',
                        properties: {
                          easy: { type: 'number' },
                          medium: { type: 'number' },
                          hard: { type: 'number' },
                        },
                      },
                      topStudents: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/sql/problems': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get all SQL problems (paginated, filterable)',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['easy', 'medium', 'hard'] } },
            { name: 'topic', in: 'query', schema: { type: 'string' } },
            { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Comma-separated tags' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'SQL problems retrieved' },
          },
        },
      },
      '/api/sql/problems/{slug}': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get a single SQL problem by slug',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'SQL problem retrieved' },
            404: { description: 'SQL problem not found' },
          },
        },
      },
      '/api/sql/run': {
        post: {
          tags: ['SQL Practice'],
          summary: 'Run SQL query against sample test cases',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'query'],
                  properties: {
                    problemId: { type: 'string' },
                    query: { type: 'string', description: 'The SQL query to execute' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Run result with per-case comparison' },
          },
        },
      },
      '/api/sql/submit': {
        post: {
          tags: ['SQL Practice'],
          summary: 'Submit SQL query against ALL test cases for grading',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'query'],
                  properties: {
                    problemId: { type: 'string' },
                    query: { type: 'string', description: 'The SQL query to execute' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Submission result with per-case comparison' },
          },
        },
      },
      '/api/sql/submissions': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get user SQL submission history',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'problemId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Submissions retrieved' },
          },
        },
      },
      '/api/sql/submissions/{id}': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get a single SQL submission by ID',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Submission retrieved' },
            404: { description: 'Submission not found' },
          },
        },
      },
      '/api/sql/topics': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get all distinct SQL problem topics',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: 'Topics retrieved' },
          },
        },
      },
      '/api/sql/tags': {
        get: {
          tags: ['SQL Practice'],
          summary: 'Get all distinct SQL problem tags',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: 'Tags retrieved' },
          },
        },
      },
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          responses: {
            200: { description: 'API is running' },
          },
        },
      },
      '/api/coding/run': {
        post: {
          tags: ['Coding Practice'],
          summary: 'Run code against visible and custom test cases',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'language', 'code'],
                  properties: {
                    problemId: { type: 'string' },
                    language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'] },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Run completed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { status: { type: 'string' }, testCaseResults: { type: 'array', items: { type: 'object', properties: { input: { type: 'string' }, expectedOutput: { type: 'string' }, actualOutput: { type: 'string' }, passed: { type: 'boolean' }, executionTime: { type: 'number' }, memoryUsed: { type: 'number' }, error: { type: 'string' }, errorType: { type: 'string' } } } } } } } } } },
          },
        },
      },
      '/api/coding/submit': {
        post: {
          tags: ['Coding Practice'],
          summary: 'Submit code against all test cases for grading and save submission',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['problemId', 'language', 'code'],
                  properties: {
                    problemId: { type: 'string' },
                    language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'] },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Submission created with verdict', content: { 'application/json': { schema: { $ref: '#/components/schemas/Submission' } } } },
          },
        },
      },
      '/api/coding/submissions': {
        get: {
          tags: ['Coding Practice'],
          summary: 'Get user coding submission history',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'problemId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Submissions retrieved' },
          },
        },
      },
      '/api/coding/submissions/{id}': {
        get: {
          tags: ['Coding Practice'],
          summary: 'Get a single coding submission by ID',
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Submission retrieved' },
            404: { description: 'Submission not found' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);