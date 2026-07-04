export const CHANGE_REQUEST_ENTITY_TYPES = ["Branch", "Lease", "Lessor"] as const
export type ChangeRequestEntityType = typeof CHANGE_REQUEST_ENTITY_TYPES[number]

export const CHANGE_REQUEST_OPERATIONS = ["Create", "Update", "Delete"] as const
export type ChangeRequestOperation = typeof CHANGE_REQUEST_OPERATIONS[number]

export const CHANGE_REQUEST_STATUSES = ["Pending", "Approved", "Rejected"] as const
export type ChangeRequestStatus = typeof CHANGE_REQUEST_STATUSES[number]

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

export type EntitySummary = {
    entityId: number
    entityType: ChangeRequestEntityType
    name: string
    reference: string
}

export type UserSummary = {
    userId: number
    fullName: string
    email: string
}

export type ChangeRequest = {
	entityChangeRequestId: number
	entityId: number
	entityType: ChangeRequestEntityType
    entitySummary: EntitySummary
	operation: ChangeRequestOperation
	oldValueSnapshot: JsonObject | null
	newValueSnapshot: JsonObject
	status: ChangeRequestStatus
	requestedBy: number
    requestedByUser: UserSummary
	requestedAt: string
	requestComments: string | null
	reviewedBy: number | null
    reviewedByUser: UserSummary | null
	reviewedAt: string | null
	reviewComments: string | null
	entityUpdatedAtSnapshot: string | null
}

export type GetChangeRequestsParams = {
	status?: ChangeRequestStatus
	entityType?: ChangeRequestEntityType
}

export type ReviewChangeRequestInput = {
	status: Extract<ChangeRequestStatus, "Approved" | "Rejected">
	reviewComments?: string
}

export type ReviewChangeRequestResponse = {
	message: string
	data: ChangeRequest
}

