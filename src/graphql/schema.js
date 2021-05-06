'use strict';

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLEnumType
} = require('graphql');

const PG_ERROR_CODE_TABLE_DOES_NOT_EXIST = '42P01';

const Program = new GraphQLObjectType({
  name: 'Program',
  description: 'Program type definition',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    runId: {
      type: new GraphQLNonNull(GraphQLString)
    },
    jobs: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString))
    },
    jobData: {
      type: GraphQLString
    },
    programData: {
      type: GraphQLString
    },
    step: {
      type: new GraphQLNonNull(GraphQLInt)
    },
    finishedAt: {
      type: GraphQLString
    },
    erroredAt: {
      type: GraphQLString
    },
    errorMessage: {
      type: GraphQLString
    },
    stepRetryCount: {
      type: GraphQLInt
    },
    createdAt: {
      type: GraphQLString
    },
    updatedAt: {
      type: GraphQLString
    }
  })
});

const ProgramFilterInput = new GraphQLInputObjectType({
  name: 'ProgramFilter',
  fields: {
    inProgressOnly: {
      type: GraphQLBoolean,
      defaultValue: false
    },
    stepRetryCountGte: {
      type: GraphQLInt,
      defaultValue: 0
    }
  }
});

const OrderByEnumType = new GraphQLEnumType({
  name: 'OrderByEnum',
  values: {
    ASC: {
      value: 'ASC'
    },
    DESC: {
      value: 'DESC'
    }
  }
});

const OrderByInput = new GraphQLInputObjectType({
  name: 'OrderByInput',
  fields: {
    id: {
      type: OrderByEnumType,
      defaultValue: OrderByEnumType.getValue('DESC')
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      programs: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Program))),
        args: {
          filter: {
            type: ProgramFilterInput
          },
          orderBy: {
            type: OrderByInput
          }
        },
        resolve: async (_root, args, { knex, tableName }) => {
          let query = knex(tableName);

          if (args.filter && args.filter.inProgressOnly) {
            query = query.whereRaw('finished_at is null AND errored_at is null');
          }

          if (args.filter && args.filter.stepRetryCountGte) {
            query = query.where('step_retry_count', '>=', args.filter.stepRetryCountGte);
          }

          if (args.orderBy && args.orderBy.id) {
            query = query.orderBy('id', args.orderBy.id);
          }

          try {
            const programs = await query;
            return programs.map(camelCaseAndStringify);
          } catch (err) {
            if (err.code === PG_ERROR_CODE_TABLE_DOES_NOT_EXIST) {
              return [];
            }
            throw err;
          }
        }
      }
    }
  })
});

const camelCaseAndStringify = function (data) {
  return {
    id: data.id,
    runId: data.run_id,
    jobs: data.jobs,
    step: data.step,
    programData: JSON.stringify(data.program_data),
    jobData: JSON.stringify(data.job_data),
    finishedAt: data.finished_at,
    erroredAt: data.errored_at,
    errorMessage: data.error_message,
    stepRetryCount: data.step_retry_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

module.exports = schema;
