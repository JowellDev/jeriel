import { z } from 'zod'

const undefinedStringTransformer = (v: string | undefined) =>
	v === 'undefined' ? undefined : v

const stringToBooleanTransformer =
	(defaultValue?: boolean) => (v: string | undefined) => {
		if (v === undefined || v === 'undefined') return defaultValue
		return v === 'true'
	}

const optionalStringSchema = z
	.string()
	.optional()
	.transform(undefinedStringTransformer)

export const querySchema = z.object({
	tribeId: optionalStringSchema,
	departmentId: optionalStringSchema,
	honorFamilyId: optionalStringSchema,
	managerIdToInclude: optionalStringSchema,

	entitiesToExclude: z
		.string()
		.trim()
		.optional()
		.transform(v => v?.split(';').filter(item => item.trim().length > 0) ?? []),

	excludeCurrentMember: z
		.string()
		.optional()
		.default('true')
		.transform(stringToBooleanTransformer(true)),

	isAdmin: z
		.string()
		.optional()
		.transform(stringToBooleanTransformer(undefined)),

	isActive: z
		.string()
		.optional()
		.default('true')
		.transform(stringToBooleanTransformer(true)),
})

export type QueryParams = z.infer<typeof querySchema>
