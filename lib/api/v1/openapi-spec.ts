/**
 * OpenAPI 3.1.0 specification for the VaxEvidence Public REST API (v1).
 *
 * This spec is served at GET /api/v1/docs and documents every v1 endpoint,
 * including authentication, pagination, and error shapes.
 */

/* ------------------------------------------------------------------ */
/*  Reusable component fragments                                      */
/* ------------------------------------------------------------------ */

const paginationParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Page number (1-indexed).",
  },
  {
    name: "per_page",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    description: "Items per page (max 100).",
  },
] as const;

const errorResponses = {
  "400": {
    description: "Bad request — malformed input or missing required fields.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
  },
  "401": {
    description: "Unauthorized — missing or invalid API key.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
  },
  "403": {
    description: "Forbidden — insufficient scopes.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
  },
  "404": {
    description: "Resource not found.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
  },
  "429": {
    description: "Rate limit exceeded.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
    headers: {
      "X-RateLimit-Limit": {
        schema: { type: "integer" },
        description: "Maximum requests per window.",
      },
      "X-RateLimit-Remaining": {
        schema: { type: "integer" },
        description: "Remaining requests in the current window.",
      },
      "X-RateLimit-Reset": {
        schema: { type: "integer" },
        description: "Unix timestamp when the window resets.",
      },
    },
  },
  "500": {
    description: "Internal server error.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiError" },
      },
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/*  OpenAPI spec                                                       */
/* ------------------------------------------------------------------ */

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "VaxEvidence API",
    version: "1.0.0",
    description:
      "Public REST API for VaxEvidence RWE platform. Provides programmatic access to protocols, evidence, datasets, and systematic review screening data.",
    contact: {
      name: "VaxEvidence API Support",
      url: "https://vaxevidence.com/support",
    },
    license: {
      name: "Proprietary",
    },
  },
  servers: [{ url: "/api/v1" }],

  /* ---------------------------------------------------------------- */
  /*  Security                                                         */
  /* ---------------------------------------------------------------- */

  security: [{ BearerAuth: [] }],

  /* ---------------------------------------------------------------- */
  /*  Paths                                                            */
  /* ---------------------------------------------------------------- */

  paths: {
    /* ---- Protocols ------------------------------------------------ */

    "/protocols": {
      get: {
        operationId: "listProtocols",
        summary: "List all protocols in the workspace.",
        tags: ["Protocols"],
        parameters: [...paginationParams],
        responses: {
          "200": {
            description: "Paginated list of protocols.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Protocol" },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      post: {
        operationId: "createProtocol",
        summary: "Create a new protocol.",
        tags: ["Protocols"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProtocolCreate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created protocol.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Protocol" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    "/protocols/{id}": {
      get: {
        operationId: "getProtocol",
        summary: "Retrieve a single protocol by ID.",
        tags: ["Protocols"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Protocol detail.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Protocol" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      patch: {
        operationId: "updateProtocol",
        summary: "Update an existing protocol.",
        tags: ["Protocols"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProtocolUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated protocol.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Protocol" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      delete: {
        operationId: "deleteProtocol",
        summary: "Delete a protocol.",
        tags: ["Protocols"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Protocol deleted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "null" } },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    /* ---- Evidence ------------------------------------------------- */

    "/evidence": {
      get: {
        operationId: "listEvidence",
        summary: "List all evidence items in the workspace.",
        tags: ["Evidence"],
        parameters: [
          ...paginationParams,
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["academic", "regulatory", "dataset", "note"],
            },
            description: "Filter by evidence type.",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" },
            description: "Filter by evidence status.",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Full-text search across title and description.",
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of evidence items.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/EvidenceItem" },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      post: {
        operationId: "createEvidence",
        summary: "Create a new evidence item.",
        tags: ["Evidence"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EvidenceItemCreate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created evidence item.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/EvidenceItem" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    "/evidence/{id}": {
      get: {
        operationId: "getEvidence",
        summary: "Retrieve a single evidence item by ID.",
        tags: ["Evidence"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Evidence item detail.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/EvidenceItem" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      patch: {
        operationId: "updateEvidence",
        summary: "Update an existing evidence item.",
        tags: ["Evidence"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EvidenceItemUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated evidence item.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/EvidenceItem" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      delete: {
        operationId: "deleteEvidence",
        summary: "Delete an evidence item.",
        tags: ["Evidence"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Evidence item deleted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "null" } },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    /* ---- Datasets ------------------------------------------------- */

    "/datasets": {
      get: {
        operationId: "listDatasets",
        summary: "List all datasets in the workspace.",
        tags: ["Datasets"],
        parameters: [...paginationParams],
        responses: {
          "200": {
            description: "Paginated list of datasets.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Dataset" },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      post: {
        operationId: "createDataset",
        summary: "Create a new dataset record.",
        tags: ["Datasets"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DatasetCreate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created dataset.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Dataset" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    "/datasets/{id}": {
      get: {
        operationId: "getDataset",
        summary: "Retrieve a single dataset by ID.",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Dataset detail.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Dataset" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      patch: {
        operationId: "updateDataset",
        summary: "Update an existing dataset.",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DatasetUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated dataset.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Dataset" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      delete: {
        operationId: "deleteDataset",
        summary: "Delete a dataset.",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Dataset deleted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "null" } },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    /* ---- Screening ------------------------------------------------ */

    "/protocols/{id}/screening": {
      get: {
        operationId: "listScreeningDecisions",
        summary: "List screening decisions for a protocol.",
        tags: ["Screening"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Protocol ID.",
          },
          {
            name: "stage",
            in: "query",
            schema: {
              type: "string",
              enum: ["identification", "screening", "eligibility", "included"],
            },
            description: "Filter by screening stage.",
          },
          ...paginationParams,
        ],
        responses: {
          "200": {
            description: "Paginated list of screening decisions.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ScreeningDecision",
                      },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
      post: {
        operationId: "createScreeningDecision",
        summary: "Create or upsert a screening decision.",
        tags: ["Screening"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Protocol ID.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ScreeningDecisionCreate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created or updated screening decision.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/ScreeningDecision",
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },

    /* ---- Docs ----------------------------------------------------- */

    "/docs": {
      get: {
        operationId: "getApiDocs",
        summary: "Retrieve the OpenAPI specification.",
        tags: ["Documentation"],
        security: [],
        responses: {
          "200": {
            description: "OpenAPI 3.1.0 specification document.",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
  },

  /* ---------------------------------------------------------------- */
  /*  Components                                                       */
  /* ---------------------------------------------------------------- */

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description:
          "API key issued from the workspace settings. Pass as `Authorization: Bearer vxe_...`",
      },
    },

    schemas: {
      /* ---- Protocol ------------------------------------------------ */

      Protocol: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          workspace_id: { type: "string", format: "uuid" },
          title: { type: "string" },
          study_question: { type: "string" },
          population: { type: "string" },
          intervention: { type: "string" },
          comparator: { type: "string" },
          outcomes: { type: "string" },
          design: { type: "string" },
          status: {
            type: "string",
            enum: ["draft", "in_review", "final"],
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "user_id",
          "title",
          "study_question",
          "population",
          "comparator",
          "outcomes",
          "design",
          "status",
          "created_at",
          "updated_at",
        ],
      },

      ProtocolCreate: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 500 },
          study_question: { type: "string", minLength: 10, maxLength: 10000 },
          population: { type: "string", minLength: 3, maxLength: 10000 },
          intervention: { type: "string", maxLength: 10000 },
          comparator: { type: "string", minLength: 3, maxLength: 10000 },
          outcomes: { type: "string", minLength: 3, maxLength: 10000 },
          design: { type: "string", minLength: 3, maxLength: 5000 },
          status: {
            type: "string",
            enum: ["draft", "in_review", "final"],
            default: "draft",
          },
        },
        required: [
          "title",
          "study_question",
          "population",
          "comparator",
          "outcomes",
          "design",
        ],
      },

      ProtocolUpdate: {
        type: "object",
        description:
          "All fields are optional. Only provided fields are updated.",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 500 },
          study_question: { type: "string", minLength: 10, maxLength: 10000 },
          population: { type: "string", minLength: 3, maxLength: 10000 },
          intervention: { type: "string", maxLength: 10000 },
          comparator: { type: "string", minLength: 3, maxLength: 10000 },
          outcomes: { type: "string", minLength: 3, maxLength: 10000 },
          design: { type: "string", minLength: 3, maxLength: 5000 },
          status: {
            type: "string",
            enum: ["draft", "in_review", "final"],
          },
        },
      },

      /* ---- Evidence ------------------------------------------------ */

      EvidenceItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          title: { type: "string" },
          type: {
            type: "string",
            enum: ["academic", "regulatory", "dataset", "note"],
          },
          status: { type: "string" },
          authors: { type: "string", nullable: true },
          doi: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          publication_date: { type: "string", nullable: true },
          tags: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
          external_id: { type: "string", nullable: true },
          external_source: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "user_id",
          "title",
          "type",
          "created_at",
          "updated_at",
        ],
      },

      EvidenceItemCreate: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: {
            type: "string",
            enum: ["academic", "regulatory", "dataset", "note"],
          },
          status: { type: "string" },
          authors: { type: "string" },
          doi: { type: "string" },
          description: { type: "string" },
          publication_date: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          external_id: { type: "string" },
          external_source: { type: "string" },
        },
        required: ["title", "type"],
      },

      EvidenceItemUpdate: {
        type: "object",
        description:
          "All fields are optional. Only provided fields are updated.",
        properties: {
          title: { type: "string" },
          type: {
            type: "string",
            enum: ["academic", "regulatory", "dataset", "note"],
          },
          status: { type: "string" },
          authors: { type: "string" },
          doi: { type: "string" },
          description: { type: "string" },
          publication_date: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },

      /* ---- Dataset ------------------------------------------------- */

      Dataset: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          source: { type: "string", nullable: true },
          file_url: { type: "string", nullable: true },
          file_size: { type: "integer", nullable: true },
          record_count: { type: "integer", nullable: true },
          tags: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
        required: ["id", "user_id", "name", "created_at", "updated_at"],
      },

      DatasetCreate: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          source: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },

      DatasetUpdate: {
        type: "object",
        description:
          "All fields are optional. Only provided fields are updated.",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          source: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },

      /* ---- Screening ----------------------------------------------- */

      ScreeningDecision: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          protocol_id: { type: "string", format: "uuid" },
          evidence_id: { type: "string", format: "uuid" },
          stage: {
            type: "string",
            enum: ["identification", "screening", "eligibility", "included"],
          },
          decision: {
            type: "string",
            enum: ["pending", "include", "exclude", "duplicate"],
          },
          exclusion_reason: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          decided_by: { type: "string", format: "uuid", nullable: true },
          decided_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "protocol_id",
          "evidence_id",
          "stage",
          "decision",
          "created_at",
          "updated_at",
        ],
      },

      ScreeningDecisionCreate: {
        type: "object",
        properties: {
          evidence_id: { type: "string", format: "uuid" },
          stage: {
            type: "string",
            enum: ["identification", "screening", "eligibility", "included"],
          },
          decision: {
            type: "string",
            enum: ["pending", "include", "exclude", "duplicate"],
          },
          exclusion_reason: { type: "string" },
          notes: { type: "string" },
        },
        required: ["evidence_id", "stage", "decision"],
      },

      /* ---- Shared -------------------------------------------------- */

      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          per_page: { type: "integer" },
          total: { type: "integer" },
          total_pages: { type: "integer" },
        },
        required: ["page", "per_page", "total", "total_pages"],
      },

      ApiError: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
    },
  },
} as const satisfies Record<string, unknown>;
