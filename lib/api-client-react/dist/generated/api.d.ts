import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AddShareGroupItemBody, AnalyticsData, ApplyInvoice200, ApprovePrepLibraryTaskBody, BookingNote, BookingNoteInput, BuildPrepListBody, BuildSuggestionsResponse, Chemical, ChemicalBlockedError, ChemicalInput, ClaimPrepTaskBody, CleaningCompleteBody, CleaningLog, CleaningTask, CleaningTaskInput, CompleteServiceCleaningTaskBody, CompleteServicePrepTaskBody, ComplianceSummary, ComplianceTask, ConfirmInvoice201, CopyResult, CopySharedContentBody, CreateQuickSpecial201, CreateShareBody, CreateShareGroupBody, DashboardData, DeferPrepTaskBody, FoodCostConfidence, GetMyVenueRole200, HandoverNote, HandoverNoteInput, HandoverNoteUpdate, HealthStatus, ImportSuppliersInput, ImportSuppliersResult, InventoryAISuggestion, InventoryAlerts, InventoryItem, InventoryItemInput, InventoryItemUpdate, Invoice, InvoiceConfirmInput, InvoiceDetail, InvoiceInput, InvoiceScanInput, InvoiceScanResult, LinkChemicalToCleaningTaskBody, ListHandoverNotesParams, ListPrepLibraryTasksParams, ListPrepTasksParams, ListRecipesParams, ListTemperatureLogsParams, LogPrepInput, LogPrepResult, Menu, MenuDetail, MenuInput, MenuItemCosted, MenuItemInput, MenuItemUpdate, PrepInstructionSuggestInput, PrepInstructionSuggestResult, PrepLibraryTask, PrepLibraryTaskInput, PrepLibraryTaskReactivationChecklist, PrepTask, PrepTaskInput, PriceComparisonEntry, PriceHistoryEntry, PriceHistoryPoint, PurchaseOrder, PurchaseOrderDetail, PurchaseOrderInput, PurchaseOrderItem, PurchaseOrderItemInput, PurchaseOrderItemUpdate, PurchaseOrderUpdate, QuickAddPrepTaskBody, QuickAddPrepTaskResponse, QuickSpecialInput, QuickTempLogInput, QuickTempLogResult, QuickWasteLogInput, QuickWasteLogResult, Recipe, RecipeAdaptInput, RecipeClassifyInput, RecipeComponent, RecipeComponentInput, RecipeComponentUpdate, RecipeDetail, RecipeImportBatchResult, RecipeImportInput, RecipeIngredient, RecipeIngredientInput, RecipeIngredientUpdate, RecipeInput, RecipeUpdate, ScanPrepListBody, ScanPrepListResult, SeedDemoResult, ServiceBootstrapConfig, SetupProgress, Share, ShareGroup, ShareGroupItem, SharedContentPayload, StagnantSuggestion, StarterPackInput, StarterPackResult, Stocktake, StocktakeDetail, StocktakeInput, StocktakeSectionSaveBody, StocktakeSectionSaveResult, StocktakeSubmitBody, SuggestInventoryItemFieldsBody, SuggestedOrdersResult, Supplier, SupplierCutoff, SupplierInput, SupplierUpdate, TemperatureEquipment, TemperatureEquipmentInput, TemperatureLog, TemperatureLogInput, TemperatureLogUpdate, TemperatureSummary, UnclassifiedRecipeCount, UpdateInvoiceNoteBody, Venue, VenueInput, VenueStaffInput, VenueStaffMember, VenueUpdate, WasteLog, WasteLogCreated, WasteLogInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListVenuesUrl: () => string;
/**
 * @summary List all venues for the current user
 */
export declare const listVenues: (options?: RequestInit) => Promise<Venue[]>;
export declare const getListVenuesQueryKey: () => readonly ["/api/venues"];
export declare const getListVenuesQueryOptions: <TData = Awaited<ReturnType<typeof listVenues>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVenues>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listVenues>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListVenuesQueryResult = NonNullable<Awaited<ReturnType<typeof listVenues>>>;
export type ListVenuesQueryError = ErrorType<unknown>;
/**
 * @summary List all venues for the current user
 */
export declare function useListVenues<TData = Awaited<ReturnType<typeof listVenues>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVenues>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateVenueUrl: () => string;
/**
 * @summary Create a new venue
 */
export declare const createVenue: (venueInput: VenueInput, options?: RequestInit) => Promise<Venue>;
export declare const getCreateVenueMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVenue>>, TError, {
        data: BodyType<VenueInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createVenue>>, TError, {
    data: BodyType<VenueInput>;
}, TContext>;
export type CreateVenueMutationResult = NonNullable<Awaited<ReturnType<typeof createVenue>>>;
export type CreateVenueMutationBody = BodyType<VenueInput>;
export type CreateVenueMutationError = ErrorType<unknown>;
/**
* @summary Create a new venue
*/
export declare const useCreateVenue: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVenue>>, TError, {
        data: BodyType<VenueInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createVenue>>, TError, {
    data: BodyType<VenueInput>;
}, TContext>;
export declare const getGetVenueUrl: (venueId: number) => string;
/**
 * @summary Get a single venue
 */
export declare const getVenue: (venueId: number, options?: RequestInit) => Promise<Venue>;
export declare const getGetVenueQueryKey: (venueId: number) => readonly [`/api/venues/${number}`];
export declare const getGetVenueQueryOptions: <TData = Awaited<ReturnType<typeof getVenue>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVenue>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getVenue>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetVenueQueryResult = NonNullable<Awaited<ReturnType<typeof getVenue>>>;
export type GetVenueQueryError = ErrorType<unknown>;
/**
 * @summary Get a single venue
 */
export declare function useGetVenue<TData = Awaited<ReturnType<typeof getVenue>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVenue>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateVenueUrl: (venueId: number) => string;
/**
 * @summary Update a venue
 */
export declare const updateVenue: (venueId: number, venueUpdate: VenueUpdate, options?: RequestInit) => Promise<Venue>;
export declare const getUpdateVenueMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateVenue>>, TError, {
        venueId: number;
        data: BodyType<VenueUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateVenue>>, TError, {
    venueId: number;
    data: BodyType<VenueUpdate>;
}, TContext>;
export type UpdateVenueMutationResult = NonNullable<Awaited<ReturnType<typeof updateVenue>>>;
export type UpdateVenueMutationBody = BodyType<VenueUpdate>;
export type UpdateVenueMutationError = ErrorType<unknown>;
/**
* @summary Update a venue
*/
export declare const useUpdateVenue: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateVenue>>, TError, {
        venueId: number;
        data: BodyType<VenueUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateVenue>>, TError, {
    venueId: number;
    data: BodyType<VenueUpdate>;
}, TContext>;
export declare const getDeleteVenueUrl: (venueId: number) => string;
/**
 * @summary Delete a venue
 */
export declare const deleteVenue: (venueId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteVenueMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteVenue>>, TError, {
        venueId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteVenue>>, TError, {
    venueId: number;
}, TContext>;
export type DeleteVenueMutationResult = NonNullable<Awaited<ReturnType<typeof deleteVenue>>>;
export type DeleteVenueMutationError = ErrorType<unknown>;
/**
* @summary Delete a venue
*/
export declare const useDeleteVenue: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteVenue>>, TError, {
        venueId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteVenue>>, TError, {
    venueId: number;
}, TContext>;
export declare const getGetMyVenueRoleUrl: (venueId: number) => string;
/**
 * @summary Get the current user's role for a venue
 */
export declare const getMyVenueRole: (venueId: number, options?: RequestInit) => Promise<GetMyVenueRole200>;
export declare const getGetMyVenueRoleQueryKey: (venueId: number) => readonly [`/api/venues/${number}/my-role`];
export declare const getGetMyVenueRoleQueryOptions: <TData = Awaited<ReturnType<typeof getMyVenueRole>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyVenueRole>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyVenueRole>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyVenueRoleQueryResult = NonNullable<Awaited<ReturnType<typeof getMyVenueRole>>>;
export type GetMyVenueRoleQueryError = ErrorType<unknown>;
/**
 * @summary Get the current user's role for a venue
 */
export declare function useGetMyVenueRole<TData = Awaited<ReturnType<typeof getMyVenueRole>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyVenueRole>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListInventoryUrl: (venueId: number) => string;
/**
 * @summary List inventory items for a venue
 */
export declare const listInventory: (venueId: number, options?: RequestInit) => Promise<InventoryItem[]>;
export declare const getListInventoryQueryKey: (venueId: number) => readonly [`/api/venues/${number}/inventory`];
export declare const getListInventoryQueryOptions: <TData = Awaited<ReturnType<typeof listInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInventoryQueryResult = NonNullable<Awaited<ReturnType<typeof listInventory>>>;
export type ListInventoryQueryError = ErrorType<unknown>;
/**
 * @summary List inventory items for a venue
 */
export declare function useListInventory<TData = Awaited<ReturnType<typeof listInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateInventoryItemUrl: (venueId: number) => string;
/**
 * @summary Create an inventory item
 */
export declare const createInventoryItem: (venueId: number, inventoryItemInput: InventoryItemInput, options?: RequestInit) => Promise<InventoryItem>;
export declare const getCreateInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInventoryItem>>, TError, {
        venueId: number;
        data: BodyType<InventoryItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createInventoryItem>>, TError, {
    venueId: number;
    data: BodyType<InventoryItemInput>;
}, TContext>;
export type CreateInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof createInventoryItem>>>;
export type CreateInventoryItemMutationBody = BodyType<InventoryItemInput>;
export type CreateInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Create an inventory item
*/
export declare const useCreateInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInventoryItem>>, TError, {
        venueId: number;
        data: BodyType<InventoryItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createInventoryItem>>, TError, {
    venueId: number;
    data: BodyType<InventoryItemInput>;
}, TContext>;
export declare const getGetInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Get an inventory item
 */
export declare const getInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<InventoryItem>;
export declare const getGetInventoryItemQueryKey: (venueId: number, itemId: number) => readonly [`/api/venues/${number}/inventory/${number}`];
export declare const getGetInventoryItemQueryOptions: <TData = Awaited<ReturnType<typeof getInventoryItem>>, TError = ErrorType<unknown>>(venueId: number, itemId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInventoryItem>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInventoryItemQueryResult = NonNullable<Awaited<ReturnType<typeof getInventoryItem>>>;
export type GetInventoryItemQueryError = ErrorType<unknown>;
/**
 * @summary Get an inventory item
 */
export declare function useGetInventoryItem<TData = Awaited<ReturnType<typeof getInventoryItem>>, TError = ErrorType<unknown>>(venueId: number, itemId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Update an inventory item
 */
export declare const updateInventoryItem: (venueId: number, itemId: number, inventoryItemUpdate: InventoryItemUpdate, options?: RequestInit) => Promise<InventoryItem>;
export declare const getUpdateInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
        data: BodyType<InventoryItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
    data: BodyType<InventoryItemUpdate>;
}, TContext>;
export type UpdateInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateInventoryItem>>>;
export type UpdateInventoryItemMutationBody = BodyType<InventoryItemUpdate>;
export type UpdateInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Update an inventory item
*/
export declare const useUpdateInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
        data: BodyType<InventoryItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
    data: BodyType<InventoryItemUpdate>;
}, TContext>;
export declare const getDeleteInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Delete an inventory item
 */
export declare const deleteInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export type DeleteInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteInventoryItem>>>;
export type DeleteInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Delete an inventory item
*/
export declare const useDeleteInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export declare const getGetInventoryItemPriceHistoryUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Get cost history for a specific inventory item
 */
export declare const getInventoryItemPriceHistory: (venueId: number, itemId: number, options?: RequestInit) => Promise<PriceHistoryPoint[]>;
export declare const getGetInventoryItemPriceHistoryQueryKey: (venueId: number, itemId: number) => readonly [`/api/venues/${number}/inventory/${number}/price-history`];
export declare const getGetInventoryItemPriceHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getInventoryItemPriceHistory>>, TError = ErrorType<unknown>>(venueId: number, itemId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryItemPriceHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInventoryItemPriceHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInventoryItemPriceHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getInventoryItemPriceHistory>>>;
export type GetInventoryItemPriceHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get cost history for a specific inventory item
 */
export declare function useGetInventoryItemPriceHistory<TData = Awaited<ReturnType<typeof getInventoryItemPriceHistory>>, TError = ErrorType<unknown>>(venueId: number, itemId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryItemPriceHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getArchiveInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Archive (deactivate) an inventory item
 */
export declare const archiveInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<InventoryItem>;
export declare const getArchiveInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archiveInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof archiveInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export type ArchiveInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof archiveInventoryItem>>>;
export type ArchiveInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Archive (deactivate) an inventory item
*/
export declare const useArchiveInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archiveInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof archiveInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export declare const getRestoreInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Restore an archived inventory item
 */
export declare const restoreInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<InventoryItem>;
export declare const getRestoreInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restoreInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof restoreInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export type RestoreInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof restoreInventoryItem>>>;
export type RestoreInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Restore an archived inventory item
*/
export declare const useRestoreInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restoreInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof restoreInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export declare const getDeactivateInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Deactivate an inventory item (soft off, not archived)
 */
export declare const deactivateInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<InventoryItem>;
export declare const getDeactivateInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deactivateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deactivateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export type DeactivateInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof deactivateInventoryItem>>>;
export type DeactivateInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Deactivate an inventory item (soft off, not archived)
*/
export declare const useDeactivateInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deactivateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deactivateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export declare const getReactivateInventoryItemUrl: (venueId: number, itemId: number) => string;
/**
 * @summary Reactivate a deactivated inventory item back to active
 */
export declare const reactivateInventoryItem: (venueId: number, itemId: number, options?: RequestInit) => Promise<InventoryItem>;
export declare const getReactivateInventoryItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reactivateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof reactivateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export type ReactivateInventoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof reactivateInventoryItem>>>;
export type ReactivateInventoryItemMutationError = ErrorType<unknown>;
/**
* @summary Reactivate a deactivated inventory item back to active
*/
export declare const useReactivateInventoryItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reactivateInventoryItem>>, TError, {
        venueId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof reactivateInventoryItem>>, TError, {
    venueId: number;
    itemId: number;
}, TContext>;
export declare const getListInactiveInventoryUrl: (venueId: number) => string;
/**
 * @summary List deactivated (inactive but not archived) inventory items
 */
export declare const listInactiveInventory: (venueId: number, options?: RequestInit) => Promise<InventoryItem[]>;
export declare const getListInactiveInventoryQueryKey: (venueId: number) => readonly [`/api/venues/${number}/inventory/inactive`];
export declare const getListInactiveInventoryQueryOptions: <TData = Awaited<ReturnType<typeof listInactiveInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInactiveInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInactiveInventory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInactiveInventoryQueryResult = NonNullable<Awaited<ReturnType<typeof listInactiveInventory>>>;
export type ListInactiveInventoryQueryError = ErrorType<unknown>;
/**
 * @summary List deactivated (inactive but not archived) inventory items
 */
export declare function useListInactiveInventory<TData = Awaited<ReturnType<typeof listInactiveInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInactiveInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListArchivedInventoryUrl: (venueId: number) => string;
/**
 * @summary List archived (inactive) inventory items
 */
export declare const listArchivedInventory: (venueId: number, options?: RequestInit) => Promise<InventoryItem[]>;
export declare const getListArchivedInventoryQueryKey: (venueId: number) => readonly [`/api/venues/${number}/inventory/archived`];
export declare const getListArchivedInventoryQueryOptions: <TData = Awaited<ReturnType<typeof listArchivedInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArchivedInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listArchivedInventory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListArchivedInventoryQueryResult = NonNullable<Awaited<ReturnType<typeof listArchivedInventory>>>;
export type ListArchivedInventoryQueryError = ErrorType<unknown>;
/**
 * @summary List archived (inactive) inventory items
 */
export declare function useListArchivedInventory<TData = Awaited<ReturnType<typeof listArchivedInventory>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArchivedInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetInventoryAlertsUrl: (venueId: number) => string;
/**
 * @summary Get critical alerts - low stock, stagnant, expiry risk items
 */
export declare const getInventoryAlerts: (venueId: number, options?: RequestInit) => Promise<InventoryAlerts>;
export declare const getGetInventoryAlertsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/inventory/alerts`];
export declare const getGetInventoryAlertsQueryOptions: <TData = Awaited<ReturnType<typeof getInventoryAlerts>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInventoryAlerts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInventoryAlertsQueryResult = NonNullable<Awaited<ReturnType<typeof getInventoryAlerts>>>;
export type GetInventoryAlertsQueryError = ErrorType<unknown>;
/**
 * @summary Get critical alerts - low stock, stagnant, expiry risk items
 */
export declare function useGetInventoryAlerts<TData = Awaited<ReturnType<typeof getInventoryAlerts>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSuggestInventoryItemFieldsUrl: (venueId: number) => string;
/**
 * @summary Use AI to suggest storage location and category for an inventory item by name
 */
export declare const suggestInventoryItemFields: (venueId: number, suggestInventoryItemFieldsBody: SuggestInventoryItemFieldsBody, options?: RequestInit) => Promise<InventoryAISuggestion>;
export declare const getSuggestInventoryItemFieldsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suggestInventoryItemFields>>, TError, {
        venueId: number;
        data: BodyType<SuggestInventoryItemFieldsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof suggestInventoryItemFields>>, TError, {
    venueId: number;
    data: BodyType<SuggestInventoryItemFieldsBody>;
}, TContext>;
export type SuggestInventoryItemFieldsMutationResult = NonNullable<Awaited<ReturnType<typeof suggestInventoryItemFields>>>;
export type SuggestInventoryItemFieldsMutationBody = BodyType<SuggestInventoryItemFieldsBody>;
export type SuggestInventoryItemFieldsMutationError = ErrorType<unknown>;
/**
* @summary Use AI to suggest storage location and category for an inventory item by name
*/
export declare const useSuggestInventoryItemFields: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suggestInventoryItemFields>>, TError, {
        venueId: number;
        data: BodyType<SuggestInventoryItemFieldsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof suggestInventoryItemFields>>, TError, {
    venueId: number;
    data: BodyType<SuggestInventoryItemFieldsBody>;
}, TContext>;
export declare const getGetStagnantSuggestionsUrl: (venueId: number) => string;
/**
 * @summary Get operational suggestions for stagnant or near-expiry stock
 */
export declare const getStagnantSuggestions: (venueId: number, options?: RequestInit) => Promise<StagnantSuggestion[]>;
export declare const getGetStagnantSuggestionsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/inventory/suggestions`];
export declare const getGetStagnantSuggestionsQueryOptions: <TData = Awaited<ReturnType<typeof getStagnantSuggestions>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStagnantSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStagnantSuggestions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStagnantSuggestionsQueryResult = NonNullable<Awaited<ReturnType<typeof getStagnantSuggestions>>>;
export type GetStagnantSuggestionsQueryError = ErrorType<unknown>;
/**
 * @summary Get operational suggestions for stagnant or near-expiry stock
 */
export declare function useGetStagnantSuggestions<TData = Awaited<ReturnType<typeof getStagnantSuggestions>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStagnantSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListStocktakesUrl: (venueId: number) => string;
/**
 * @summary List stocktakes for a venue
 */
export declare const listStocktakes: (venueId: number, options?: RequestInit) => Promise<Stocktake[]>;
export declare const getListStocktakesQueryKey: (venueId: number) => readonly [`/api/venues/${number}/stocktakes`];
export declare const getListStocktakesQueryOptions: <TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListStocktakesQueryResult = NonNullable<Awaited<ReturnType<typeof listStocktakes>>>;
export type ListStocktakesQueryError = ErrorType<unknown>;
/**
 * @summary List stocktakes for a venue
 */
export declare function useListStocktakes<TData = Awaited<ReturnType<typeof listStocktakes>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStocktakes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateStocktakeUrl: (venueId: number) => string;
/**
 * @summary Create a new stocktake (draft) pre-populated with current inventory
 */
export declare const createStocktake: (venueId: number, stocktakeInput: StocktakeInput, options?: RequestInit) => Promise<StocktakeDetail>;
export declare const getCreateStocktakeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError, {
        venueId: number;
        data: BodyType<StocktakeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError, {
    venueId: number;
    data: BodyType<StocktakeInput>;
}, TContext>;
export type CreateStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof createStocktake>>>;
export type CreateStocktakeMutationBody = BodyType<StocktakeInput>;
export type CreateStocktakeMutationError = ErrorType<unknown>;
/**
* @summary Create a new stocktake (draft) pre-populated with current inventory
*/
export declare const useCreateStocktake: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createStocktake>>, TError, {
        venueId: number;
        data: BodyType<StocktakeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createStocktake>>, TError, {
    venueId: number;
    data: BodyType<StocktakeInput>;
}, TContext>;
export declare const getGetStocktakeUrl: (venueId: number, stocktakeId: number) => string;
/**
 * @summary Get a stocktake with all its items
 */
export declare const getStocktake: (venueId: number, stocktakeId: number, options?: RequestInit) => Promise<StocktakeDetail>;
export declare const getGetStocktakeQueryKey: (venueId: number, stocktakeId: number) => readonly [`/api/venues/${number}/stocktakes/${number}`];
export declare const getGetStocktakeQueryOptions: <TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorType<unknown>>(venueId: number, stocktakeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStocktakeQueryResult = NonNullable<Awaited<ReturnType<typeof getStocktake>>>;
export type GetStocktakeQueryError = ErrorType<unknown>;
/**
 * @summary Get a stocktake with all its items
 */
export declare function useGetStocktake<TData = Awaited<ReturnType<typeof getStocktake>>, TError = ErrorType<unknown>>(venueId: number, stocktakeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStocktake>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteStocktakeUrl: (venueId: number, stocktakeId: number) => string;
/**
 * @summary Delete a draft stocktake
 */
export declare const deleteStocktake: (venueId: number, stocktakeId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteStocktakeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStocktake>>, TError, {
        venueId: number;
        stocktakeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteStocktake>>, TError, {
    venueId: number;
    stocktakeId: number;
}, TContext>;
export type DeleteStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteStocktake>>>;
export type DeleteStocktakeMutationError = ErrorType<unknown>;
/**
* @summary Delete a draft stocktake
*/
export declare const useDeleteStocktake: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStocktake>>, TError, {
        venueId: number;
        stocktakeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteStocktake>>, TError, {
    venueId: number;
    stocktakeId: number;
}, TContext>;
export declare const getSubmitStocktakeUrl: (venueId: number, stocktakeId: number) => string;
/**
 * @summary Submit a stocktake — updates inventory currentStock to actual counts
 */
export declare const submitStocktake: (venueId: number, stocktakeId: number, stocktakeSubmitBody: StocktakeSubmitBody, options?: RequestInit) => Promise<StocktakeDetail>;
export declare const getSubmitStocktakeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitStocktake>>, TError, {
        venueId: number;
        stocktakeId: number;
        data: BodyType<StocktakeSubmitBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitStocktake>>, TError, {
    venueId: number;
    stocktakeId: number;
    data: BodyType<StocktakeSubmitBody>;
}, TContext>;
export type SubmitStocktakeMutationResult = NonNullable<Awaited<ReturnType<typeof submitStocktake>>>;
export type SubmitStocktakeMutationBody = BodyType<StocktakeSubmitBody>;
export type SubmitStocktakeMutationError = ErrorType<unknown>;
/**
* @summary Submit a stocktake — updates inventory currentStock to actual counts
*/
export declare const useSubmitStocktake: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitStocktake>>, TError, {
        venueId: number;
        stocktakeId: number;
        data: BodyType<StocktakeSubmitBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitStocktake>>, TError, {
    venueId: number;
    stocktakeId: number;
    data: BodyType<StocktakeSubmitBody>;
}, TContext>;
export declare const getSaveStocktakeSectionUrl: (venueId: number, stocktakeId: number) => string;
/**
 * @summary Save counts for items in one section without submitting the full stocktake
 */
export declare const saveStocktakeSection: (venueId: number, stocktakeId: number, stocktakeSectionSaveBody: StocktakeSectionSaveBody, options?: RequestInit) => Promise<StocktakeSectionSaveResult>;
export declare const getSaveStocktakeSectionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveStocktakeSection>>, TError, {
        venueId: number;
        stocktakeId: number;
        data: BodyType<StocktakeSectionSaveBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveStocktakeSection>>, TError, {
    venueId: number;
    stocktakeId: number;
    data: BodyType<StocktakeSectionSaveBody>;
}, TContext>;
export type SaveStocktakeSectionMutationResult = NonNullable<Awaited<ReturnType<typeof saveStocktakeSection>>>;
export type SaveStocktakeSectionMutationBody = BodyType<StocktakeSectionSaveBody>;
export type SaveStocktakeSectionMutationError = ErrorType<unknown>;
/**
* @summary Save counts for items in one section without submitting the full stocktake
*/
export declare const useSaveStocktakeSection: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveStocktakeSection>>, TError, {
        venueId: number;
        stocktakeId: number;
        data: BodyType<StocktakeSectionSaveBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveStocktakeSection>>, TError, {
    venueId: number;
    stocktakeId: number;
    data: BodyType<StocktakeSectionSaveBody>;
}, TContext>;
export declare const getGetServiceModeConfigUrl: (venueId: number) => string;
/**
 * @summary Bootstrap config for service mode — staff, inventory, equipment
 */
export declare const getServiceModeConfig: (venueId: number, options?: RequestInit) => Promise<ServiceBootstrapConfig>;
export declare const getGetServiceModeConfigQueryKey: (venueId: number) => readonly [`/api/venues/${number}/service/config`];
export declare const getGetServiceModeConfigQueryOptions: <TData = Awaited<ReturnType<typeof getServiceModeConfig>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServiceModeConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getServiceModeConfig>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetServiceModeConfigQueryResult = NonNullable<Awaited<ReturnType<typeof getServiceModeConfig>>>;
export type GetServiceModeConfigQueryError = ErrorType<unknown>;
/**
 * @summary Bootstrap config for service mode — staff, inventory, equipment
 */
export declare function useGetServiceModeConfig<TData = Awaited<ReturnType<typeof getServiceModeConfig>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServiceModeConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCompleteServicePrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Toggle a prep task complete or undo (no auth — service mode only)
 */
export declare const completeServicePrepTask: (venueId: number, taskId: number, completeServicePrepTaskBody: CompleteServicePrepTaskBody, options?: RequestInit) => Promise<void>;
export declare const getCompleteServicePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeServicePrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CompleteServicePrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeServicePrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CompleteServicePrepTaskBody>;
}, TContext>;
export type CompleteServicePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof completeServicePrepTask>>>;
export type CompleteServicePrepTaskMutationBody = BodyType<CompleteServicePrepTaskBody>;
export type CompleteServicePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Toggle a prep task complete or undo (no auth — service mode only)
*/
export declare const useCompleteServicePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeServicePrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CompleteServicePrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeServicePrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CompleteServicePrepTaskBody>;
}, TContext>;
export declare const getListServiceCleaningTasksUrl: (venueId: number) => string;
/**
 * @summary List active cleaning tasks for service mode (no auth)
 */
export declare const listServiceCleaningTasks: (venueId: number, options?: RequestInit) => Promise<void>;
export declare const getListServiceCleaningTasksQueryKey: (venueId: number) => readonly [`/api/venues/${number}/service/cleaning-tasks`];
export declare const getListServiceCleaningTasksQueryOptions: <TData = Awaited<ReturnType<typeof listServiceCleaningTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServiceCleaningTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listServiceCleaningTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListServiceCleaningTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listServiceCleaningTasks>>>;
export type ListServiceCleaningTasksQueryError = ErrorType<unknown>;
/**
 * @summary List active cleaning tasks for service mode (no auth)
 */
export declare function useListServiceCleaningTasks<TData = Awaited<ReturnType<typeof listServiceCleaningTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServiceCleaningTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCompleteServiceCleaningTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Complete a cleaning task during service (no auth)
 */
export declare const completeServiceCleaningTask: (venueId: number, taskId: number, completeServiceCleaningTaskBody: CompleteServiceCleaningTaskBody, options?: RequestInit) => Promise<void>;
export declare const getCompleteServiceCleaningTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeServiceCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CompleteServiceCleaningTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeServiceCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CompleteServiceCleaningTaskBody>;
}, TContext>;
export type CompleteServiceCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof completeServiceCleaningTask>>>;
export type CompleteServiceCleaningTaskMutationBody = BodyType<CompleteServiceCleaningTaskBody>;
export type CompleteServiceCleaningTaskMutationError = ErrorType<unknown>;
/**
* @summary Complete a cleaning task during service (no auth)
*/
export declare const useCompleteServiceCleaningTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeServiceCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CompleteServiceCleaningTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeServiceCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CompleteServiceCleaningTaskBody>;
}, TContext>;
export declare const getCreateServiceTemperatureLogUrl: (venueId: number) => string;
/**
 * @summary Quick temperature log during service (no auth)
 */
export declare const createServiceTemperatureLog: (venueId: number, quickTempLogInput: QuickTempLogInput, options?: RequestInit) => Promise<QuickTempLogResult>;
export declare const getCreateServiceTemperatureLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createServiceTemperatureLog>>, TError, {
        venueId: number;
        data: BodyType<QuickTempLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createServiceTemperatureLog>>, TError, {
    venueId: number;
    data: BodyType<QuickTempLogInput>;
}, TContext>;
export type CreateServiceTemperatureLogMutationResult = NonNullable<Awaited<ReturnType<typeof createServiceTemperatureLog>>>;
export type CreateServiceTemperatureLogMutationBody = BodyType<QuickTempLogInput>;
export type CreateServiceTemperatureLogMutationError = ErrorType<unknown>;
/**
* @summary Quick temperature log during service (no auth)
*/
export declare const useCreateServiceTemperatureLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createServiceTemperatureLog>>, TError, {
        venueId: number;
        data: BodyType<QuickTempLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createServiceTemperatureLog>>, TError, {
    venueId: number;
    data: BodyType<QuickTempLogInput>;
}, TContext>;
export declare const getCreateServiceWasteLogUrl: (venueId: number) => string;
/**
 * @summary Quick waste log during service — sets isQuick=true (no auth)
 */
export declare const createServiceWasteLog: (venueId: number, quickWasteLogInput: QuickWasteLogInput, options?: RequestInit) => Promise<QuickWasteLogResult>;
export declare const getCreateServiceWasteLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createServiceWasteLog>>, TError, {
        venueId: number;
        data: BodyType<QuickWasteLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createServiceWasteLog>>, TError, {
    venueId: number;
    data: BodyType<QuickWasteLogInput>;
}, TContext>;
export type CreateServiceWasteLogMutationResult = NonNullable<Awaited<ReturnType<typeof createServiceWasteLog>>>;
export type CreateServiceWasteLogMutationBody = BodyType<QuickWasteLogInput>;
export type CreateServiceWasteLogMutationError = ErrorType<unknown>;
/**
* @summary Quick waste log during service — sets isQuick=true (no auth)
*/
export declare const useCreateServiceWasteLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createServiceWasteLog>>, TError, {
        venueId: number;
        data: BodyType<QuickWasteLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createServiceWasteLog>>, TError, {
    venueId: number;
    data: BodyType<QuickWasteLogInput>;
}, TContext>;
export declare const getListSuppliersUrl: (venueId: number) => string;
/**
 * @summary List suppliers for a venue
 */
export declare const listSuppliers: (venueId: number, options?: RequestInit) => Promise<Supplier[]>;
export declare const getListSuppliersQueryKey: (venueId: number) => readonly [`/api/venues/${number}/suppliers`];
export declare const getListSuppliersQueryOptions: <TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSuppliersQueryResult = NonNullable<Awaited<ReturnType<typeof listSuppliers>>>;
export type ListSuppliersQueryError = ErrorType<unknown>;
/**
 * @summary List suppliers for a venue
 */
export declare function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateSupplierUrl: (venueId: number) => string;
/**
 * @summary Create a supplier
 */
export declare const createSupplier: (venueId: number, supplierInput: SupplierInput, options?: RequestInit) => Promise<Supplier>;
export declare const getCreateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        venueId: number;
        data: BodyType<SupplierInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
    venueId: number;
    data: BodyType<SupplierInput>;
}, TContext>;
export type CreateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof createSupplier>>>;
export type CreateSupplierMutationBody = BodyType<SupplierInput>;
export type CreateSupplierMutationError = ErrorType<unknown>;
/**
* @summary Create a supplier
*/
export declare const useCreateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        venueId: number;
        data: BodyType<SupplierInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSupplier>>, TError, {
    venueId: number;
    data: BodyType<SupplierInput>;
}, TContext>;
export declare const getGetSupplierUrl: (venueId: number, supplierId: number) => string;
/**
 * @summary Get a supplier
 */
export declare const getSupplier: (venueId: number, supplierId: number, options?: RequestInit) => Promise<Supplier>;
export declare const getGetSupplierQueryKey: (venueId: number, supplierId: number) => readonly [`/api/venues/${number}/suppliers/${number}`];
export declare const getGetSupplierQueryOptions: <TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(venueId: number, supplierId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;
export type GetSupplierQueryError = ErrorType<unknown>;
/**
 * @summary Get a supplier
 */
export declare function useGetSupplier<TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(venueId: number, supplierId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSupplierUrl: (venueId: number, supplierId: number) => string;
/**
 * @summary Update a supplier
 */
export declare const updateSupplier: (venueId: number, supplierId: number, supplierUpdate: SupplierUpdate, options?: RequestInit) => Promise<Supplier>;
export declare const getUpdateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        venueId: number;
        supplierId: number;
        data: BodyType<SupplierUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    venueId: number;
    supplierId: number;
    data: BodyType<SupplierUpdate>;
}, TContext>;
export type UpdateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof updateSupplier>>>;
export type UpdateSupplierMutationBody = BodyType<SupplierUpdate>;
export type UpdateSupplierMutationError = ErrorType<unknown>;
/**
* @summary Update a supplier
*/
export declare const useUpdateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        venueId: number;
        supplierId: number;
        data: BodyType<SupplierUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    venueId: number;
    supplierId: number;
    data: BodyType<SupplierUpdate>;
}, TContext>;
export declare const getDeleteSupplierUrl: (venueId: number, supplierId: number) => string;
/**
 * @summary Delete a supplier
 */
export declare const deleteSupplier: (venueId: number, supplierId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        venueId: number;
        supplierId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    venueId: number;
    supplierId: number;
}, TContext>;
export type DeleteSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSupplier>>>;
export type DeleteSupplierMutationError = ErrorType<unknown>;
/**
* @summary Delete a supplier
*/
export declare const useDeleteSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        venueId: number;
        supplierId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    venueId: number;
    supplierId: number;
}, TContext>;
export declare const getGetSupplierCutoffsUrl: (venueId: number) => string;
/**
 * @summary Get upcoming order cutoff countdowns for all suppliers
 */
export declare const getSupplierCutoffs: (venueId: number, options?: RequestInit) => Promise<SupplierCutoff[]>;
export declare const getGetSupplierCutoffsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/suppliers/cutoffs`];
export declare const getGetSupplierCutoffsQueryOptions: <TData = Awaited<ReturnType<typeof getSupplierCutoffs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierCutoffs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplierCutoffs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierCutoffsQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplierCutoffs>>>;
export type GetSupplierCutoffsQueryError = ErrorType<unknown>;
/**
 * @summary Get upcoming order cutoff countdowns for all suppliers
 */
export declare function useGetSupplierCutoffs<TData = Awaited<ReturnType<typeof getSupplierCutoffs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierCutoffs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSupplierPriceHistoryUrl: (venueId: number, supplierId: number) => string;
/**
 * @summary Get price history for a supplier's products
 */
export declare const getSupplierPriceHistory: (venueId: number, supplierId: number, options?: RequestInit) => Promise<PriceHistoryEntry[]>;
export declare const getGetSupplierPriceHistoryQueryKey: (venueId: number, supplierId: number) => readonly [`/api/venues/${number}/suppliers/${number}/price-history`];
export declare const getGetSupplierPriceHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getSupplierPriceHistory>>, TError = ErrorType<unknown>>(venueId: number, supplierId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierPriceHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplierPriceHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierPriceHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplierPriceHistory>>>;
export type GetSupplierPriceHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get price history for a supplier's products
 */
export declare function useGetSupplierPriceHistory<TData = Awaited<ReturnType<typeof getSupplierPriceHistory>>, TError = ErrorType<unknown>>(venueId: number, supplierId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierPriceHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPriceComparisonUrl: (venueId: number) => string;
/**
 * @summary Get all inventory items with supplier and cost for cross-supplier comparison
 */
export declare const getPriceComparison: (venueId: number, options?: RequestInit) => Promise<PriceComparisonEntry[]>;
export declare const getGetPriceComparisonQueryKey: (venueId: number) => readonly [`/api/venues/${number}/price-comparison`];
export declare const getGetPriceComparisonQueryOptions: <TData = Awaited<ReturnType<typeof getPriceComparison>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPriceComparison>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPriceComparison>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPriceComparisonQueryResult = NonNullable<Awaited<ReturnType<typeof getPriceComparison>>>;
export type GetPriceComparisonQueryError = ErrorType<unknown>;
/**
 * @summary Get all inventory items with supplier and cost for cross-supplier comparison
 */
export declare function useGetPriceComparison<TData = Awaited<ReturnType<typeof getPriceComparison>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPriceComparison>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSuggestedOrdersUrl: (venueId: number) => string;
/**
 * @summary Get suggested order quantities grouped by supplier
 */
export declare const getSuggestedOrders: (venueId: number, options?: RequestInit) => Promise<SuggestedOrdersResult>;
export declare const getGetSuggestedOrdersQueryKey: (venueId: number) => readonly [`/api/venues/${number}/suggested-orders`];
export declare const getGetSuggestedOrdersQueryOptions: <TData = Awaited<ReturnType<typeof getSuggestedOrders>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSuggestedOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSuggestedOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSuggestedOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof getSuggestedOrders>>>;
export type GetSuggestedOrdersQueryError = ErrorType<unknown>;
/**
 * @summary Get suggested order quantities grouped by supplier
 */
export declare function useGetSuggestedOrders<TData = Awaited<ReturnType<typeof getSuggestedOrders>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSuggestedOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListHandoverNotesUrl: (venueId: number, params?: ListHandoverNotesParams) => string;
/**
 * @summary List handover notes for a venue (pinned first, then newest)
 */
export declare const listHandoverNotes: (venueId: number, params?: ListHandoverNotesParams, options?: RequestInit) => Promise<HandoverNote[]>;
export declare const getListHandoverNotesQueryKey: (venueId: number, params?: ListHandoverNotesParams) => readonly [`/api/venues/${number}/handover-notes`, ...ListHandoverNotesParams[]];
export declare const getListHandoverNotesQueryOptions: <TData = Awaited<ReturnType<typeof listHandoverNotes>>, TError = ErrorType<unknown>>(venueId: number, params?: ListHandoverNotesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHandoverNotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listHandoverNotes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListHandoverNotesQueryResult = NonNullable<Awaited<ReturnType<typeof listHandoverNotes>>>;
export type ListHandoverNotesQueryError = ErrorType<unknown>;
/**
 * @summary List handover notes for a venue (pinned first, then newest)
 */
export declare function useListHandoverNotes<TData = Awaited<ReturnType<typeof listHandoverNotes>>, TError = ErrorType<unknown>>(venueId: number, params?: ListHandoverNotesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHandoverNotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateHandoverNoteUrl: (venueId: number) => string;
/**
 * @summary Create a shift handover note
 */
export declare const createHandoverNote: (venueId: number, handoverNoteInput: HandoverNoteInput, options?: RequestInit) => Promise<HandoverNote>;
export declare const getCreateHandoverNoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createHandoverNote>>, TError, {
        venueId: number;
        data: BodyType<HandoverNoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createHandoverNote>>, TError, {
    venueId: number;
    data: BodyType<HandoverNoteInput>;
}, TContext>;
export type CreateHandoverNoteMutationResult = NonNullable<Awaited<ReturnType<typeof createHandoverNote>>>;
export type CreateHandoverNoteMutationBody = BodyType<HandoverNoteInput>;
export type CreateHandoverNoteMutationError = ErrorType<unknown>;
/**
* @summary Create a shift handover note
*/
export declare const useCreateHandoverNote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createHandoverNote>>, TError, {
        venueId: number;
        data: BodyType<HandoverNoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createHandoverNote>>, TError, {
    venueId: number;
    data: BodyType<HandoverNoteInput>;
}, TContext>;
export declare const getUpdateHandoverNoteUrl: (venueId: number, noteId: number) => string;
/**
 * @summary Update a handover note (content, pin, shift)
 */
export declare const updateHandoverNote: (venueId: number, noteId: number, handoverNoteUpdate: HandoverNoteUpdate, options?: RequestInit) => Promise<HandoverNote>;
export declare const getUpdateHandoverNoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHandoverNote>>, TError, {
        venueId: number;
        noteId: number;
        data: BodyType<HandoverNoteUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateHandoverNote>>, TError, {
    venueId: number;
    noteId: number;
    data: BodyType<HandoverNoteUpdate>;
}, TContext>;
export type UpdateHandoverNoteMutationResult = NonNullable<Awaited<ReturnType<typeof updateHandoverNote>>>;
export type UpdateHandoverNoteMutationBody = BodyType<HandoverNoteUpdate>;
export type UpdateHandoverNoteMutationError = ErrorType<unknown>;
/**
* @summary Update a handover note (content, pin, shift)
*/
export declare const useUpdateHandoverNote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHandoverNote>>, TError, {
        venueId: number;
        noteId: number;
        data: BodyType<HandoverNoteUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateHandoverNote>>, TError, {
    venueId: number;
    noteId: number;
    data: BodyType<HandoverNoteUpdate>;
}, TContext>;
export declare const getDeleteHandoverNoteUrl: (venueId: number, noteId: number) => string;
/**
 * @summary Delete a handover note
 */
export declare const deleteHandoverNote: (venueId: number, noteId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteHandoverNoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteHandoverNote>>, TError, {
        venueId: number;
        noteId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteHandoverNote>>, TError, {
    venueId: number;
    noteId: number;
}, TContext>;
export type DeleteHandoverNoteMutationResult = NonNullable<Awaited<ReturnType<typeof deleteHandoverNote>>>;
export type DeleteHandoverNoteMutationError = ErrorType<unknown>;
/**
* @summary Delete a handover note
*/
export declare const useDeleteHandoverNote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteHandoverNote>>, TError, {
        venueId: number;
        noteId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteHandoverNote>>, TError, {
    venueId: number;
    noteId: number;
}, TContext>;
export declare const getListPurchaseOrdersUrl: (venueId: number) => string;
/**
 * @summary List purchase orders for a venue (newest first)
 */
export declare const listPurchaseOrders: (venueId: number, options?: RequestInit) => Promise<PurchaseOrder[]>;
export declare const getListPurchaseOrdersQueryKey: (venueId: number) => readonly [`/api/venues/${number}/purchase-orders`];
export declare const getListPurchaseOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPurchaseOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listPurchaseOrders>>>;
export type ListPurchaseOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List purchase orders for a venue (newest first)
 */
export declare function useListPurchaseOrders<TData = Awaited<ReturnType<typeof listPurchaseOrders>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchaseOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePurchaseOrderUrl: (venueId: number) => string;
/**
 * @summary Create a purchase order
 */
export declare const createPurchaseOrder: (venueId: number, purchaseOrderInput: PurchaseOrderInput, options?: RequestInit) => Promise<PurchaseOrderDetail>;
export declare const getCreatePurchaseOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError, {
        venueId: number;
        data: BodyType<PurchaseOrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError, {
    venueId: number;
    data: BodyType<PurchaseOrderInput>;
}, TContext>;
export type CreatePurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createPurchaseOrder>>>;
export type CreatePurchaseOrderMutationBody = BodyType<PurchaseOrderInput>;
export type CreatePurchaseOrderMutationError = ErrorType<unknown>;
/**
* @summary Create a purchase order
*/
export declare const useCreatePurchaseOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchaseOrder>>, TError, {
        venueId: number;
        data: BodyType<PurchaseOrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPurchaseOrder>>, TError, {
    venueId: number;
    data: BodyType<PurchaseOrderInput>;
}, TContext>;
export declare const getGetPurchaseOrderUrl: (venueId: number, orderId: number) => string;
/**
 * @summary Get a purchase order with its line items
 */
export declare const getPurchaseOrder: (venueId: number, orderId: number, options?: RequestInit) => Promise<PurchaseOrderDetail>;
export declare const getGetPurchaseOrderQueryKey: (venueId: number, orderId: number) => readonly [`/api/venues/${number}/purchase-orders/${number}`];
export declare const getGetPurchaseOrderQueryOptions: <TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorType<unknown>>(venueId: number, orderId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPurchaseOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchaseOrder>>>;
export type GetPurchaseOrderQueryError = ErrorType<unknown>;
/**
 * @summary Get a purchase order with its line items
 */
export declare function useGetPurchaseOrder<TData = Awaited<ReturnType<typeof getPurchaseOrder>>, TError = ErrorType<unknown>>(venueId: number, orderId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePurchaseOrderUrl: (venueId: number, orderId: number) => string;
/**
 * @summary Update status, notes, or supplier name
 */
export declare const updatePurchaseOrder: (venueId: number, orderId: number, purchaseOrderUpdate: PurchaseOrderUpdate, options?: RequestInit) => Promise<PurchaseOrder>;
export declare const getUpdatePurchaseOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrder>>, TError, {
        venueId: number;
        orderId: number;
        data: BodyType<PurchaseOrderUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrder>>, TError, {
    venueId: number;
    orderId: number;
    data: BodyType<PurchaseOrderUpdate>;
}, TContext>;
export type UpdatePurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof updatePurchaseOrder>>>;
export type UpdatePurchaseOrderMutationBody = BodyType<PurchaseOrderUpdate>;
export type UpdatePurchaseOrderMutationError = ErrorType<unknown>;
/**
* @summary Update status, notes, or supplier name
*/
export declare const useUpdatePurchaseOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrder>>, TError, {
        venueId: number;
        orderId: number;
        data: BodyType<PurchaseOrderUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePurchaseOrder>>, TError, {
    venueId: number;
    orderId: number;
    data: BodyType<PurchaseOrderUpdate>;
}, TContext>;
export declare const getDeletePurchaseOrderUrl: (venueId: number, orderId: number) => string;
/**
 * @summary Delete a purchase order
 */
export declare const deletePurchaseOrder: (venueId: number, orderId: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePurchaseOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrder>>, TError, {
        venueId: number;
        orderId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrder>>, TError, {
    venueId: number;
    orderId: number;
}, TContext>;
export type DeletePurchaseOrderMutationResult = NonNullable<Awaited<ReturnType<typeof deletePurchaseOrder>>>;
export type DeletePurchaseOrderMutationError = ErrorType<unknown>;
/**
* @summary Delete a purchase order
*/
export declare const useDeletePurchaseOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrder>>, TError, {
        venueId: number;
        orderId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePurchaseOrder>>, TError, {
    venueId: number;
    orderId: number;
}, TContext>;
export declare const getAddPurchaseOrderItemUrl: (venueId: number, orderId: number) => string;
/**
 * @summary Add a line item to a purchase order
 */
export declare const addPurchaseOrderItem: (venueId: number, orderId: number, purchaseOrderItemInput: PurchaseOrderItemInput, options?: RequestInit) => Promise<PurchaseOrderItem>;
export declare const getAddPurchaseOrderItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addPurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        data: BodyType<PurchaseOrderItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addPurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    data: BodyType<PurchaseOrderItemInput>;
}, TContext>;
export type AddPurchaseOrderItemMutationResult = NonNullable<Awaited<ReturnType<typeof addPurchaseOrderItem>>>;
export type AddPurchaseOrderItemMutationBody = BodyType<PurchaseOrderItemInput>;
export type AddPurchaseOrderItemMutationError = ErrorType<unknown>;
/**
* @summary Add a line item to a purchase order
*/
export declare const useAddPurchaseOrderItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addPurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        data: BodyType<PurchaseOrderItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addPurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    data: BodyType<PurchaseOrderItemInput>;
}, TContext>;
export declare const getUpdatePurchaseOrderItemUrl: (venueId: number, orderId: number, itemId: number) => string;
/**
 * @summary Update quantity or cost for a line item
 */
export declare const updatePurchaseOrderItem: (venueId: number, orderId: number, itemId: number, purchaseOrderItemUpdate: PurchaseOrderItemUpdate, options?: RequestInit) => Promise<PurchaseOrderItem>;
export declare const getUpdatePurchaseOrderItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        itemId: number;
        data: BodyType<PurchaseOrderItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    itemId: number;
    data: BodyType<PurchaseOrderItemUpdate>;
}, TContext>;
export type UpdatePurchaseOrderItemMutationResult = NonNullable<Awaited<ReturnType<typeof updatePurchaseOrderItem>>>;
export type UpdatePurchaseOrderItemMutationBody = BodyType<PurchaseOrderItemUpdate>;
export type UpdatePurchaseOrderItemMutationError = ErrorType<unknown>;
/**
* @summary Update quantity or cost for a line item
*/
export declare const useUpdatePurchaseOrderItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        itemId: number;
        data: BodyType<PurchaseOrderItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    itemId: number;
    data: BodyType<PurchaseOrderItemUpdate>;
}, TContext>;
export declare const getDeletePurchaseOrderItemUrl: (venueId: number, orderId: number, itemId: number) => string;
/**
 * @summary Remove a line item from a purchase order
 */
export declare const deletePurchaseOrderItem: (venueId: number, orderId: number, itemId: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePurchaseOrderItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    itemId: number;
}, TContext>;
export type DeletePurchaseOrderItemMutationResult = NonNullable<Awaited<ReturnType<typeof deletePurchaseOrderItem>>>;
export type DeletePurchaseOrderItemMutationError = ErrorType<unknown>;
/**
* @summary Remove a line item from a purchase order
*/
export declare const useDeletePurchaseOrderItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchaseOrderItem>>, TError, {
        venueId: number;
        orderId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePurchaseOrderItem>>, TError, {
    venueId: number;
    orderId: number;
    itemId: number;
}, TContext>;
export declare const getImportRecipeFromSourceUrl: (venueId: number) => string;
/**
 * @summary Extract a recipe from a photo or URL using AI
 */
export declare const importRecipeFromSource: (venueId: number, recipeImportInput: RecipeImportInput, options?: RequestInit) => Promise<RecipeImportBatchResult>;
export declare const getImportRecipeFromSourceMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importRecipeFromSource>>, TError, {
        venueId: number;
        data: BodyType<RecipeImportInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof importRecipeFromSource>>, TError, {
    venueId: number;
    data: BodyType<RecipeImportInput>;
}, TContext>;
export type ImportRecipeFromSourceMutationResult = NonNullable<Awaited<ReturnType<typeof importRecipeFromSource>>>;
export type ImportRecipeFromSourceMutationBody = BodyType<RecipeImportInput>;
export type ImportRecipeFromSourceMutationError = ErrorType<void>;
/**
* @summary Extract a recipe from a photo or URL using AI
*/
export declare const useImportRecipeFromSource: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importRecipeFromSource>>, TError, {
        venueId: number;
        data: BodyType<RecipeImportInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof importRecipeFromSource>>, TError, {
    venueId: number;
    data: BodyType<RecipeImportInput>;
}, TContext>;
export declare const getListRecipesUrl: (venueId: number, params?: ListRecipesParams) => string;
/**
 * @summary List recipes for a venue
 */
export declare const listRecipes: (venueId: number, params?: ListRecipesParams, options?: RequestInit) => Promise<Recipe[]>;
export declare const getListRecipesQueryKey: (venueId: number, params?: ListRecipesParams) => readonly [`/api/venues/${number}/recipes`, ...ListRecipesParams[]];
export declare const getListRecipesQueryOptions: <TData = Awaited<ReturnType<typeof listRecipes>>, TError = ErrorType<unknown>>(venueId: number, params?: ListRecipesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRecipesQueryResult = NonNullable<Awaited<ReturnType<typeof listRecipes>>>;
export type ListRecipesQueryError = ErrorType<unknown>;
/**
 * @summary List recipes for a venue
 */
export declare function useListRecipes<TData = Awaited<ReturnType<typeof listRecipes>>, TError = ErrorType<unknown>>(venueId: number, params?: ListRecipesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateRecipeUrl: (venueId: number) => string;
/**
 * @summary Create a recipe
 */
export declare const createRecipe: (venueId: number, recipeInput: RecipeInput, options?: RequestInit) => Promise<Recipe>;
export declare const getCreateRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
        venueId: number;
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
    venueId: number;
    data: BodyType<RecipeInput>;
}, TContext>;
export type CreateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof createRecipe>>>;
export type CreateRecipeMutationBody = BodyType<RecipeInput>;
export type CreateRecipeMutationError = ErrorType<unknown>;
/**
* @summary Create a recipe
*/
export declare const useCreateRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRecipe>>, TError, {
        venueId: number;
        data: BodyType<RecipeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRecipe>>, TError, {
    venueId: number;
    data: BodyType<RecipeInput>;
}, TContext>;
export declare const getGetRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Get a recipe with costing
 */
export declare const getRecipe: (venueId: number, recipeId: number, options?: RequestInit) => Promise<RecipeDetail>;
export declare const getGetRecipeQueryKey: (venueId: number, recipeId: number) => readonly [`/api/venues/${number}/recipes/${number}`];
export declare const getGetRecipeQueryOptions: <TData = Awaited<ReturnType<typeof getRecipe>>, TError = ErrorType<unknown>>(venueId: number, recipeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecipeQueryResult = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;
export type GetRecipeQueryError = ErrorType<unknown>;
/**
 * @summary Get a recipe with costing
 */
export declare function useGetRecipe<TData = Awaited<ReturnType<typeof getRecipe>>, TError = ErrorType<unknown>>(venueId: number, recipeId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecipe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Update a recipe
 */
export declare const updateRecipe: (venueId: number, recipeId: number, recipeUpdate: RecipeUpdate, options?: RequestInit) => Promise<Recipe>;
export declare const getUpdateRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeUpdate>;
}, TContext>;
export type UpdateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof updateRecipe>>>;
export type UpdateRecipeMutationBody = BodyType<RecipeUpdate>;
export type UpdateRecipeMutationError = ErrorType<unknown>;
/**
* @summary Update a recipe
*/
export declare const useUpdateRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeUpdate>;
}, TContext>;
export declare const getDeleteRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Delete a recipe
 */
export declare const deleteRecipe: (venueId: number, recipeId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export type DeleteRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRecipe>>>;
export type DeleteRecipeMutationError = ErrorType<unknown>;
/**
* @summary Delete a recipe
*/
export declare const useDeleteRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export declare const getGetUnclassifiedRecipeCountUrl: (venueId: number) => string;
/**
 * @summary Count recipes with no recipeType set (legacy rows pending classification)
 */
export declare const getUnclassifiedRecipeCount: (venueId: number, options?: RequestInit) => Promise<UnclassifiedRecipeCount>;
export declare const getGetUnclassifiedRecipeCountQueryKey: (venueId: number) => readonly [`/api/venues/${number}/recipes/unclassified-count`];
export declare const getGetUnclassifiedRecipeCountQueryOptions: <TData = Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUnclassifiedRecipeCountQueryResult = NonNullable<Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>>;
export type GetUnclassifiedRecipeCountQueryError = ErrorType<unknown>;
/**
 * @summary Count recipes with no recipeType set (legacy rows pending classification)
 */
export declare function useGetUnclassifiedRecipeCount<TData = Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUnclassifiedRecipeCount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getClassifyRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Set recipeType for a legacy unclassified recipe
 */
export declare const classifyRecipe: (venueId: number, recipeId: number, recipeClassifyInput: RecipeClassifyInput, options?: RequestInit) => Promise<Recipe>;
export declare const getClassifyRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof classifyRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeClassifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof classifyRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeClassifyInput>;
}, TContext>;
export type ClassifyRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof classifyRecipe>>>;
export type ClassifyRecipeMutationBody = BodyType<RecipeClassifyInput>;
export type ClassifyRecipeMutationError = ErrorType<unknown>;
/**
* @summary Set recipeType for a legacy unclassified recipe
*/
export declare const useClassifyRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof classifyRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeClassifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof classifyRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeClassifyInput>;
}, TContext>;
export declare const getActivateRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Set recipe status to active (admin only)
 */
export declare const activateRecipe: (venueId: number, recipeId: number, options?: RequestInit) => Promise<Recipe>;
export declare const getActivateRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof activateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof activateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export type ActivateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof activateRecipe>>>;
export type ActivateRecipeMutationError = ErrorType<unknown>;
/**
* @summary Set recipe status to active (admin only)
*/
export declare const useActivateRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof activateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof activateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export declare const getDeactivateRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Set recipe status to inactive (admin only)
 */
export declare const deactivateRecipe: (venueId: number, recipeId: number, options?: RequestInit) => Promise<Recipe>;
export declare const getDeactivateRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deactivateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deactivateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export type DeactivateRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof deactivateRecipe>>>;
export type DeactivateRecipeMutationError = ErrorType<unknown>;
/**
* @summary Set recipe status to inactive (admin only)
*/
export declare const useDeactivateRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deactivateRecipe>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deactivateRecipe>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export declare const getAddRecipeComponentUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Link a prep recipe as a component of a menu recipe
 */
export declare const addRecipeComponent: (venueId: number, recipeId: number, recipeComponentInput: RecipeComponentInput, options?: RequestInit) => Promise<RecipeComponent>;
export declare const getAddRecipeComponentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeComponentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeComponentInput>;
}, TContext>;
export type AddRecipeComponentMutationResult = NonNullable<Awaited<ReturnType<typeof addRecipeComponent>>>;
export type AddRecipeComponentMutationBody = BodyType<RecipeComponentInput>;
export type AddRecipeComponentMutationError = ErrorType<unknown>;
/**
* @summary Link a prep recipe as a component of a menu recipe
*/
export declare const useAddRecipeComponent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeComponentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeComponentInput>;
}, TContext>;
export declare const getUpdateRecipeComponentUrl: (venueId: number, recipeId: number, componentId: number) => string;
/**
 * @summary Update a recipe component link
 */
export declare const updateRecipeComponent: (venueId: number, recipeId: number, componentId: number, recipeComponentUpdate: RecipeComponentUpdate, options?: RequestInit) => Promise<RecipeComponent>;
export declare const getUpdateRecipeComponentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        componentId: number;
        data: BodyType<RecipeComponentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    componentId: number;
    data: BodyType<RecipeComponentUpdate>;
}, TContext>;
export type UpdateRecipeComponentMutationResult = NonNullable<Awaited<ReturnType<typeof updateRecipeComponent>>>;
export type UpdateRecipeComponentMutationBody = BodyType<RecipeComponentUpdate>;
export type UpdateRecipeComponentMutationError = ErrorType<unknown>;
/**
* @summary Update a recipe component link
*/
export declare const useUpdateRecipeComponent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        componentId: number;
        data: BodyType<RecipeComponentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    componentId: number;
    data: BodyType<RecipeComponentUpdate>;
}, TContext>;
export declare const getDeleteRecipeComponentUrl: (venueId: number, recipeId: number, componentId: number) => string;
/**
 * @summary Remove a recipe component link
 */
export declare const deleteRecipeComponent: (venueId: number, recipeId: number, componentId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteRecipeComponentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        componentId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    componentId: number;
}, TContext>;
export type DeleteRecipeComponentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRecipeComponent>>>;
export type DeleteRecipeComponentMutationError = ErrorType<unknown>;
/**
* @summary Remove a recipe component link
*/
export declare const useDeleteRecipeComponent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeComponent>>, TError, {
        venueId: number;
        recipeId: number;
        componentId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRecipeComponent>>, TError, {
    venueId: number;
    recipeId: number;
    componentId: number;
}, TContext>;
export declare const getAddRecipeIngredientUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Add an ingredient to a recipe
 */
export declare const addRecipeIngredient: (venueId: number, recipeId: number, recipeIngredientInput: RecipeIngredientInput, options?: RequestInit) => Promise<RecipeIngredient>;
export declare const getAddRecipeIngredientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeIngredientInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeIngredientInput>;
}, TContext>;
export type AddRecipeIngredientMutationResult = NonNullable<Awaited<ReturnType<typeof addRecipeIngredient>>>;
export type AddRecipeIngredientMutationBody = BodyType<RecipeIngredientInput>;
export type AddRecipeIngredientMutationError = ErrorType<unknown>;
/**
* @summary Add an ingredient to a recipe
*/
export declare const useAddRecipeIngredient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<RecipeIngredientInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<RecipeIngredientInput>;
}, TContext>;
export declare const getLogRecipePrepUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Log a prep run and deduct ingredients from inventory
 */
export declare const logRecipePrep: (venueId: number, recipeId: number, logPrepInput: LogPrepInput, options?: RequestInit) => Promise<LogPrepResult>;
export declare const getLogRecipePrepMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logRecipePrep>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<LogPrepInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logRecipePrep>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<LogPrepInput>;
}, TContext>;
export type LogRecipePrepMutationResult = NonNullable<Awaited<ReturnType<typeof logRecipePrep>>>;
export type LogRecipePrepMutationBody = BodyType<LogPrepInput>;
export type LogRecipePrepMutationError = ErrorType<unknown>;
/**
* @summary Log a prep run and deduct ingredients from inventory
*/
export declare const useLogRecipePrep: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logRecipePrep>>, TError, {
        venueId: number;
        recipeId: number;
        data: BodyType<LogPrepInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logRecipePrep>>, TError, {
    venueId: number;
    recipeId: number;
    data: BodyType<LogPrepInput>;
}, TContext>;
export declare const getAdaptRecipeUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Create an AI-adapted version of a recipe using currently in-stock ingredients
 */
export declare const adaptRecipe: (venueId: number, recipeId: number, recipeAdaptInput?: RecipeAdaptInput, options?: RequestInit) => Promise<RecipeDetail>;
export declare const getAdaptRecipeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adaptRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data?: BodyType<RecipeAdaptInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adaptRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data?: BodyType<RecipeAdaptInput>;
}, TContext>;
export type AdaptRecipeMutationResult = NonNullable<Awaited<ReturnType<typeof adaptRecipe>>>;
export type AdaptRecipeMutationBody = BodyType<RecipeAdaptInput> | undefined;
export type AdaptRecipeMutationError = ErrorType<unknown>;
/**
* @summary Create an AI-adapted version of a recipe using currently in-stock ingredients
*/
export declare const useAdaptRecipe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adaptRecipe>>, TError, {
        venueId: number;
        recipeId: number;
        data?: BodyType<RecipeAdaptInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adaptRecipe>>, TError, {
    venueId: number;
    recipeId: number;
    data?: BodyType<RecipeAdaptInput>;
}, TContext>;
export declare const getImportSuppliersUrl: (venueId: number) => string;
/**
 * @summary Copy suppliers from another venue owned by the same user
 */
export declare const importSuppliers: (venueId: number, importSuppliersInput: ImportSuppliersInput, options?: RequestInit) => Promise<ImportSuppliersResult>;
export declare const getImportSuppliersMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importSuppliers>>, TError, {
        venueId: number;
        data: BodyType<ImportSuppliersInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof importSuppliers>>, TError, {
    venueId: number;
    data: BodyType<ImportSuppliersInput>;
}, TContext>;
export type ImportSuppliersMutationResult = NonNullable<Awaited<ReturnType<typeof importSuppliers>>>;
export type ImportSuppliersMutationBody = BodyType<ImportSuppliersInput>;
export type ImportSuppliersMutationError = ErrorType<unknown>;
/**
* @summary Copy suppliers from another venue owned by the same user
*/
export declare const useImportSuppliers: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof importSuppliers>>, TError, {
        venueId: number;
        data: BodyType<ImportSuppliersInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof importSuppliers>>, TError, {
    venueId: number;
    data: BodyType<ImportSuppliersInput>;
}, TContext>;
export declare const getUpdateRecipeIngredientUrl: (venueId: number, recipeId: number, ingredientId: number) => string;
/**
 * @summary Update a recipe ingredient
 */
export declare const updateRecipeIngredient: (venueId: number, recipeId: number, ingredientId: number, recipeIngredientUpdate: RecipeIngredientUpdate, options?: RequestInit) => Promise<RecipeIngredient>;
export declare const getUpdateRecipeIngredientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        ingredientId: number;
        data: BodyType<RecipeIngredientUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    ingredientId: number;
    data: BodyType<RecipeIngredientUpdate>;
}, TContext>;
export type UpdateRecipeIngredientMutationResult = NonNullable<Awaited<ReturnType<typeof updateRecipeIngredient>>>;
export type UpdateRecipeIngredientMutationBody = BodyType<RecipeIngredientUpdate>;
export type UpdateRecipeIngredientMutationError = ErrorType<unknown>;
/**
* @summary Update a recipe ingredient
*/
export declare const useUpdateRecipeIngredient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        ingredientId: number;
        data: BodyType<RecipeIngredientUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    ingredientId: number;
    data: BodyType<RecipeIngredientUpdate>;
}, TContext>;
export declare const getDeleteRecipeIngredientUrl: (venueId: number, recipeId: number, ingredientId: number) => string;
/**
 * @summary Remove an ingredient from a recipe
 */
export declare const deleteRecipeIngredient: (venueId: number, recipeId: number, ingredientId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteRecipeIngredientMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        ingredientId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    ingredientId: number;
}, TContext>;
export type DeleteRecipeIngredientMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRecipeIngredient>>>;
export type DeleteRecipeIngredientMutationError = ErrorType<unknown>;
/**
* @summary Remove an ingredient from a recipe
*/
export declare const useDeleteRecipeIngredient: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRecipeIngredient>>, TError, {
        venueId: number;
        recipeId: number;
        ingredientId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRecipeIngredient>>, TError, {
    venueId: number;
    recipeId: number;
    ingredientId: number;
}, TContext>;
export declare const getListMenusUrl: (venueId: number) => string;
/**
 * @summary List all menus for a venue
 */
export declare const listMenus: (venueId: number, options?: RequestInit) => Promise<Menu[]>;
export declare const getListMenusQueryKey: (venueId: number) => readonly [`/api/venues/${number}/menus`];
export declare const getListMenusQueryOptions: <TData = Awaited<ReturnType<typeof listMenus>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMenus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMenus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMenusQueryResult = NonNullable<Awaited<ReturnType<typeof listMenus>>>;
export type ListMenusQueryError = ErrorType<unknown>;
/**
 * @summary List all menus for a venue
 */
export declare function useListMenus<TData = Awaited<ReturnType<typeof listMenus>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMenus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateMenuUrl: (venueId: number) => string;
/**
 * @summary Create a new menu
 */
export declare const createMenu: (venueId: number, menuInput: MenuInput, options?: RequestInit) => Promise<Menu>;
export declare const getCreateMenuMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMenu>>, TError, {
        venueId: number;
        data: BodyType<MenuInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createMenu>>, TError, {
    venueId: number;
    data: BodyType<MenuInput>;
}, TContext>;
export type CreateMenuMutationResult = NonNullable<Awaited<ReturnType<typeof createMenu>>>;
export type CreateMenuMutationBody = BodyType<MenuInput>;
export type CreateMenuMutationError = ErrorType<unknown>;
/**
* @summary Create a new menu
*/
export declare const useCreateMenu: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMenu>>, TError, {
        venueId: number;
        data: BodyType<MenuInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createMenu>>, TError, {
    venueId: number;
    data: BodyType<MenuInput>;
}, TContext>;
export declare const getGetMenuUrl: (venueId: number, menuId: number) => string;
/**
 * @summary Get a menu with costed items
 */
export declare const getMenu: (venueId: number, menuId: number, options?: RequestInit) => Promise<MenuDetail>;
export declare const getGetMenuQueryKey: (venueId: number, menuId: number) => readonly [`/api/venues/${number}/menus/${number}`];
export declare const getGetMenuQueryOptions: <TData = Awaited<ReturnType<typeof getMenu>>, TError = ErrorType<unknown>>(venueId: number, menuId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMenu>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMenu>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMenuQueryResult = NonNullable<Awaited<ReturnType<typeof getMenu>>>;
export type GetMenuQueryError = ErrorType<unknown>;
/**
 * @summary Get a menu with costed items
 */
export declare function useGetMenu<TData = Awaited<ReturnType<typeof getMenu>>, TError = ErrorType<unknown>>(venueId: number, menuId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMenu>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMenuUrl: (venueId: number, menuId: number) => string;
/**
 * @summary Update a menu
 */
export declare const updateMenu: (venueId: number, menuId: number, menuInput: MenuInput, options?: RequestInit) => Promise<Menu>;
export declare const getUpdateMenuMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMenu>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<MenuInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMenu>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<MenuInput>;
}, TContext>;
export type UpdateMenuMutationResult = NonNullable<Awaited<ReturnType<typeof updateMenu>>>;
export type UpdateMenuMutationBody = BodyType<MenuInput>;
export type UpdateMenuMutationError = ErrorType<unknown>;
/**
* @summary Update a menu
*/
export declare const useUpdateMenu: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMenu>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<MenuInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMenu>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<MenuInput>;
}, TContext>;
export declare const getDeleteMenuUrl: (venueId: number, menuId: number) => string;
/**
 * @summary Delete a menu
 */
export declare const deleteMenu: (venueId: number, menuId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteMenuMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMenu>>, TError, {
        venueId: number;
        menuId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMenu>>, TError, {
    venueId: number;
    menuId: number;
}, TContext>;
export type DeleteMenuMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMenu>>>;
export type DeleteMenuMutationError = ErrorType<unknown>;
/**
* @summary Delete a menu
*/
export declare const useDeleteMenu: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMenu>>, TError, {
        venueId: number;
        menuId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMenu>>, TError, {
    venueId: number;
    menuId: number;
}, TContext>;
export declare const getAddMenuItemUrl: (venueId: number, menuId: number) => string;
/**
 * @summary Add a recipe to a menu
 */
export declare const addMenuItem: (venueId: number, menuId: number, menuItemInput: MenuItemInput, options?: RequestInit) => Promise<MenuItemCosted>;
export declare const getAddMenuItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<MenuItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<MenuItemInput>;
}, TContext>;
export type AddMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof addMenuItem>>>;
export type AddMenuItemMutationBody = BodyType<MenuItemInput>;
export type AddMenuItemMutationError = ErrorType<unknown>;
/**
* @summary Add a recipe to a menu
*/
export declare const useAddMenuItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<MenuItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<MenuItemInput>;
}, TContext>;
export declare const getCreateQuickSpecialUrl: (venueId: number, menuId: number) => string;
/**
 * @summary Create a special recipe and add it to the menu in one step
 */
export declare const createQuickSpecial: (venueId: number, menuId: number, quickSpecialInput: QuickSpecialInput, options?: RequestInit) => Promise<CreateQuickSpecial201>;
export declare const getCreateQuickSpecialMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuickSpecial>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<QuickSpecialInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createQuickSpecial>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<QuickSpecialInput>;
}, TContext>;
export type CreateQuickSpecialMutationResult = NonNullable<Awaited<ReturnType<typeof createQuickSpecial>>>;
export type CreateQuickSpecialMutationBody = BodyType<QuickSpecialInput>;
export type CreateQuickSpecialMutationError = ErrorType<unknown>;
/**
* @summary Create a special recipe and add it to the menu in one step
*/
export declare const useCreateQuickSpecial: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createQuickSpecial>>, TError, {
        venueId: number;
        menuId: number;
        data: BodyType<QuickSpecialInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createQuickSpecial>>, TError, {
    venueId: number;
    menuId: number;
    data: BodyType<QuickSpecialInput>;
}, TContext>;
export declare const getUpdateMenuItemUrl: (venueId: number, menuId: number, itemId: number) => string;
/**
 * @summary Update a menu item (selling price, category, notes)
 */
export declare const updateMenuItem: (venueId: number, menuId: number, itemId: number, menuItemUpdate: MenuItemUpdate, options?: RequestInit) => Promise<MenuItemCosted>;
export declare const getUpdateMenuItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        itemId: number;
        data: BodyType<MenuItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    itemId: number;
    data: BodyType<MenuItemUpdate>;
}, TContext>;
export type UpdateMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateMenuItem>>>;
export type UpdateMenuItemMutationBody = BodyType<MenuItemUpdate>;
export type UpdateMenuItemMutationError = ErrorType<unknown>;
/**
* @summary Update a menu item (selling price, category, notes)
*/
export declare const useUpdateMenuItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        itemId: number;
        data: BodyType<MenuItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    itemId: number;
    data: BodyType<MenuItemUpdate>;
}, TContext>;
export declare const getDeleteMenuItemUrl: (venueId: number, menuId: number, itemId: number) => string;
/**
 * @summary Remove a recipe from a menu
 */
export declare const deleteMenuItem: (venueId: number, menuId: number, itemId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteMenuItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    itemId: number;
}, TContext>;
export type DeleteMenuItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMenuItem>>>;
export type DeleteMenuItemMutationError = ErrorType<unknown>;
/**
* @summary Remove a recipe from a menu
*/
export declare const useDeleteMenuItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMenuItem>>, TError, {
        venueId: number;
        menuId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMenuItem>>, TError, {
    venueId: number;
    menuId: number;
    itemId: number;
}, TContext>;
export declare const getListWasteLogsUrl: (venueId: number) => string;
/**
 * @summary List waste log entries for a venue (last 30 days)
 */
export declare const listWasteLogs: (venueId: number, options?: RequestInit) => Promise<WasteLog[]>;
export declare const getListWasteLogsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/waste`];
export declare const getListWasteLogsQueryOptions: <TData = Awaited<ReturnType<typeof listWasteLogs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWasteLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listWasteLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListWasteLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listWasteLogs>>>;
export type ListWasteLogsQueryError = ErrorType<unknown>;
/**
 * @summary List waste log entries for a venue (last 30 days)
 */
export declare function useListWasteLogs<TData = Awaited<ReturnType<typeof listWasteLogs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWasteLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateWasteLogUrl: (venueId: number) => string;
/**
 * @summary Log a waste event
 */
export declare const createWasteLog: (venueId: number, wasteLogInput: WasteLogInput, options?: RequestInit) => Promise<WasteLogCreated>;
export declare const getCreateWasteLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWasteLog>>, TError, {
        venueId: number;
        data: BodyType<WasteLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createWasteLog>>, TError, {
    venueId: number;
    data: BodyType<WasteLogInput>;
}, TContext>;
export type CreateWasteLogMutationResult = NonNullable<Awaited<ReturnType<typeof createWasteLog>>>;
export type CreateWasteLogMutationBody = BodyType<WasteLogInput>;
export type CreateWasteLogMutationError = ErrorType<unknown>;
/**
* @summary Log a waste event
*/
export declare const useCreateWasteLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createWasteLog>>, TError, {
        venueId: number;
        data: BodyType<WasteLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createWasteLog>>, TError, {
    venueId: number;
    data: BodyType<WasteLogInput>;
}, TContext>;
export declare const getDeleteWasteLogUrl: (venueId: number, logId: number) => string;
/**
 * @summary Delete a waste log
 */
export declare const deleteWasteLog: (venueId: number, logId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteWasteLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteWasteLog>>, TError, {
        venueId: number;
        logId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteWasteLog>>, TError, {
    venueId: number;
    logId: number;
}, TContext>;
export type DeleteWasteLogMutationResult = NonNullable<Awaited<ReturnType<typeof deleteWasteLog>>>;
export type DeleteWasteLogMutationError = ErrorType<unknown>;
/**
* @summary Delete a waste log
*/
export declare const useDeleteWasteLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteWasteLog>>, TError, {
        venueId: number;
        logId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteWasteLog>>, TError, {
    venueId: number;
    logId: number;
}, TContext>;
export declare const getListInvoicesUrl: (venueId: number) => string;
/**
 * @summary List invoices for a venue
 */
export declare const listInvoices: (venueId: number, options?: RequestInit) => Promise<Invoice[]>;
export declare const getListInvoicesQueryKey: (venueId: number) => readonly [`/api/venues/${number}/invoices`];
export declare const getListInvoicesQueryOptions: <TData = Awaited<ReturnType<typeof listInvoices>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInvoicesQueryResult = NonNullable<Awaited<ReturnType<typeof listInvoices>>>;
export type ListInvoicesQueryError = ErrorType<unknown>;
/**
 * @summary List invoices for a venue
 */
export declare function useListInvoices<TData = Awaited<ReturnType<typeof listInvoices>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateInvoiceUrl: (venueId: number) => string;
/**
 * @summary Create an invoice (manual or OCR placeholder)
 */
export declare const createInvoice: (venueId: number, invoiceInput: InvoiceInput, options?: RequestInit) => Promise<Invoice>;
export declare const getCreateInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceInput>;
}, TContext>;
export type CreateInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof createInvoice>>>;
export type CreateInvoiceMutationBody = BodyType<InvoiceInput>;
export type CreateInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Create an invoice (manual or OCR placeholder)
*/
export declare const useCreateInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceInput>;
}, TContext>;
export declare const getScanInvoiceUrl: (venueId: number) => string;
/**
 * @summary Scan an invoice photo and extract line items using AI
 */
export declare const scanInvoice: (venueId: number, invoiceScanInput: InvoiceScanInput, options?: RequestInit) => Promise<InvoiceScanResult>;
export declare const getScanInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof scanInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceScanInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof scanInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceScanInput>;
}, TContext>;
export type ScanInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof scanInvoice>>>;
export type ScanInvoiceMutationBody = BodyType<InvoiceScanInput>;
export type ScanInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Scan an invoice photo and extract line items using AI
*/
export declare const useScanInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof scanInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceScanInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof scanInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceScanInput>;
}, TContext>;
export declare const getConfirmInvoiceUrl: (venueId: number) => string;
/**
 * @summary Save a reviewed invoice with line items and optionally apply costs to inventory
 */
export declare const confirmInvoice: (venueId: number, invoiceConfirmInput: InvoiceConfirmInput, options?: RequestInit) => Promise<ConfirmInvoice201>;
export declare const getConfirmInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceConfirmInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof confirmInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceConfirmInput>;
}, TContext>;
export type ConfirmInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof confirmInvoice>>>;
export type ConfirmInvoiceMutationBody = BodyType<InvoiceConfirmInput>;
export type ConfirmInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Save a reviewed invoice with line items and optionally apply costs to inventory
*/
export declare const useConfirmInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmInvoice>>, TError, {
        venueId: number;
        data: BodyType<InvoiceConfirmInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof confirmInvoice>>, TError, {
    venueId: number;
    data: BodyType<InvoiceConfirmInput>;
}, TContext>;
export declare const getApplyInvoiceUrl: (venueId: number, invoiceId: number) => string;
/**
 * @summary Apply invoice line items to inventory costs and mark invoice processed
 */
export declare const applyInvoice: (venueId: number, invoiceId: number, options?: RequestInit) => Promise<ApplyInvoice200>;
export declare const getApplyInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyInvoice>>, TError, {
        venueId: number;
        invoiceId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyInvoice>>, TError, {
    venueId: number;
    invoiceId: number;
}, TContext>;
export type ApplyInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof applyInvoice>>>;
export type ApplyInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Apply invoice line items to inventory costs and mark invoice processed
*/
export declare const useApplyInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyInvoice>>, TError, {
        venueId: number;
        invoiceId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyInvoice>>, TError, {
    venueId: number;
    invoiceId: number;
}, TContext>;
export declare const getUpdateInvoiceNoteUrl: (venueId: number, invoiceId: number) => string;
/**
 * @summary Update or resolve an invoice note
 */
export declare const updateInvoiceNote: (venueId: number, invoiceId: number, updateInvoiceNoteBody: UpdateInvoiceNoteBody, options?: RequestInit) => Promise<Invoice>;
export declare const getUpdateInvoiceNoteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInvoiceNote>>, TError, {
        venueId: number;
        invoiceId: number;
        data: BodyType<UpdateInvoiceNoteBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateInvoiceNote>>, TError, {
    venueId: number;
    invoiceId: number;
    data: BodyType<UpdateInvoiceNoteBody>;
}, TContext>;
export type UpdateInvoiceNoteMutationResult = NonNullable<Awaited<ReturnType<typeof updateInvoiceNote>>>;
export type UpdateInvoiceNoteMutationBody = BodyType<UpdateInvoiceNoteBody>;
export type UpdateInvoiceNoteMutationError = ErrorType<unknown>;
/**
* @summary Update or resolve an invoice note
*/
export declare const useUpdateInvoiceNote: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateInvoiceNote>>, TError, {
        venueId: number;
        invoiceId: number;
        data: BodyType<UpdateInvoiceNoteBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateInvoiceNote>>, TError, {
    venueId: number;
    invoiceId: number;
    data: BodyType<UpdateInvoiceNoteBody>;
}, TContext>;
export declare const getGetInvoiceUrl: (venueId: number, invoiceId: number) => string;
/**
 * @summary Get an invoice with line items
 */
export declare const getInvoice: (venueId: number, invoiceId: number, options?: RequestInit) => Promise<InvoiceDetail>;
export declare const getGetInvoiceQueryKey: (venueId: number, invoiceId: number) => readonly [`/api/venues/${number}/invoices/${number}`];
export declare const getGetInvoiceQueryOptions: <TData = Awaited<ReturnType<typeof getInvoice>>, TError = ErrorType<unknown>>(venueId: number, invoiceId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInvoiceQueryResult = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;
export type GetInvoiceQueryError = ErrorType<unknown>;
/**
 * @summary Get an invoice with line items
 */
export declare function useGetInvoice<TData = Awaited<ReturnType<typeof getInvoice>>, TError = ErrorType<unknown>>(venueId: number, invoiceId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteInvoiceUrl: (venueId: number, invoiceId: number) => string;
/**
 * @summary Delete an invoice
 */
export declare const deleteInvoice: (venueId: number, invoiceId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
        venueId: number;
        invoiceId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
    venueId: number;
    invoiceId: number;
}, TContext>;
export type DeleteInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof deleteInvoice>>>;
export type DeleteInvoiceMutationError = ErrorType<unknown>;
/**
* @summary Delete an invoice
*/
export declare const useDeleteInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
        venueId: number;
        invoiceId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteInvoice>>, TError, {
    venueId: number;
    invoiceId: number;
}, TContext>;
export declare const getGetDashboardUrl: (venueId: number) => string;
/**
 * @summary Get today mode dashboard data - the core operational overview
 */
export declare const getDashboard: (venueId: number, options?: RequestInit) => Promise<DashboardData>;
export declare const getGetDashboardQueryKey: (venueId: number) => readonly [`/api/venues/${number}/dashboard`];
export declare const getGetDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboard>>>;
export type GetDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get today mode dashboard data - the core operational overview
 */
export declare function useGetDashboard<TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListShareGroupsUrl: (venueId: number) => string;
/**
 * @summary List all share groups for a venue
 */
export declare const listShareGroups: (venueId: number, options?: RequestInit) => Promise<ShareGroup[]>;
export declare const getListShareGroupsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/share-groups`];
export declare const getListShareGroupsQueryOptions: <TData = Awaited<ReturnType<typeof listShareGroups>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShareGroups>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listShareGroups>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListShareGroupsQueryResult = NonNullable<Awaited<ReturnType<typeof listShareGroups>>>;
export type ListShareGroupsQueryError = ErrorType<unknown>;
/**
 * @summary List all share groups for a venue
 */
export declare function useListShareGroups<TData = Awaited<ReturnType<typeof listShareGroups>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShareGroups>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateShareGroupUrl: (venueId: number) => string;
/**
 * @summary Create a share group
 */
export declare const createShareGroup: (venueId: number, createShareGroupBody: CreateShareGroupBody, options?: RequestInit) => Promise<ShareGroup>;
export declare const getCreateShareGroupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShareGroup>>, TError, {
        venueId: number;
        data: BodyType<CreateShareGroupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createShareGroup>>, TError, {
    venueId: number;
    data: BodyType<CreateShareGroupBody>;
}, TContext>;
export type CreateShareGroupMutationResult = NonNullable<Awaited<ReturnType<typeof createShareGroup>>>;
export type CreateShareGroupMutationBody = BodyType<CreateShareGroupBody>;
export type CreateShareGroupMutationError = ErrorType<unknown>;
/**
* @summary Create a share group
*/
export declare const useCreateShareGroup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShareGroup>>, TError, {
        venueId: number;
        data: BodyType<CreateShareGroupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createShareGroup>>, TError, {
    venueId: number;
    data: BodyType<CreateShareGroupBody>;
}, TContext>;
export declare const getUpdateShareGroupUrl: (venueId: number, groupId: number) => string;
/**
 * @summary Update a share group
 */
export declare const updateShareGroup: (venueId: number, groupId: number, createShareGroupBody: CreateShareGroupBody, options?: RequestInit) => Promise<ShareGroup>;
export declare const getUpdateShareGroupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShareGroup>>, TError, {
        venueId: number;
        groupId: number;
        data: BodyType<CreateShareGroupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateShareGroup>>, TError, {
    venueId: number;
    groupId: number;
    data: BodyType<CreateShareGroupBody>;
}, TContext>;
export type UpdateShareGroupMutationResult = NonNullable<Awaited<ReturnType<typeof updateShareGroup>>>;
export type UpdateShareGroupMutationBody = BodyType<CreateShareGroupBody>;
export type UpdateShareGroupMutationError = ErrorType<unknown>;
/**
* @summary Update a share group
*/
export declare const useUpdateShareGroup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShareGroup>>, TError, {
        venueId: number;
        groupId: number;
        data: BodyType<CreateShareGroupBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateShareGroup>>, TError, {
    venueId: number;
    groupId: number;
    data: BodyType<CreateShareGroupBody>;
}, TContext>;
export declare const getDeleteShareGroupUrl: (venueId: number, groupId: number) => string;
/**
 * @summary Delete a share group
 */
export declare const deleteShareGroup: (venueId: number, groupId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteShareGroupMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShareGroup>>, TError, {
        venueId: number;
        groupId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteShareGroup>>, TError, {
    venueId: number;
    groupId: number;
}, TContext>;
export type DeleteShareGroupMutationResult = NonNullable<Awaited<ReturnType<typeof deleteShareGroup>>>;
export type DeleteShareGroupMutationError = ErrorType<unknown>;
/**
* @summary Delete a share group
*/
export declare const useDeleteShareGroup: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShareGroup>>, TError, {
        venueId: number;
        groupId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteShareGroup>>, TError, {
    venueId: number;
    groupId: number;
}, TContext>;
export declare const getAddShareGroupItemUrl: (venueId: number, groupId: number) => string;
/**
 * @summary Add an item to a share group
 */
export declare const addShareGroupItem: (venueId: number, groupId: number, addShareGroupItemBody: AddShareGroupItemBody, options?: RequestInit) => Promise<ShareGroupItem>;
export declare const getAddShareGroupItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addShareGroupItem>>, TError, {
        venueId: number;
        groupId: number;
        data: BodyType<AddShareGroupItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addShareGroupItem>>, TError, {
    venueId: number;
    groupId: number;
    data: BodyType<AddShareGroupItemBody>;
}, TContext>;
export type AddShareGroupItemMutationResult = NonNullable<Awaited<ReturnType<typeof addShareGroupItem>>>;
export type AddShareGroupItemMutationBody = BodyType<AddShareGroupItemBody>;
export type AddShareGroupItemMutationError = ErrorType<unknown>;
/**
* @summary Add an item to a share group
*/
export declare const useAddShareGroupItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addShareGroupItem>>, TError, {
        venueId: number;
        groupId: number;
        data: BodyType<AddShareGroupItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addShareGroupItem>>, TError, {
    venueId: number;
    groupId: number;
    data: BodyType<AddShareGroupItemBody>;
}, TContext>;
export declare const getRemoveShareGroupItemUrl: (venueId: number, groupId: number, itemId: number) => string;
/**
 * @summary Remove an item from a share group
 */
export declare const removeShareGroupItem: (venueId: number, groupId: number, itemId: number, options?: RequestInit) => Promise<void>;
export declare const getRemoveShareGroupItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeShareGroupItem>>, TError, {
        venueId: number;
        groupId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof removeShareGroupItem>>, TError, {
    venueId: number;
    groupId: number;
    itemId: number;
}, TContext>;
export type RemoveShareGroupItemMutationResult = NonNullable<Awaited<ReturnType<typeof removeShareGroupItem>>>;
export type RemoveShareGroupItemMutationError = ErrorType<unknown>;
/**
* @summary Remove an item from a share group
*/
export declare const useRemoveShareGroupItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeShareGroupItem>>, TError, {
        venueId: number;
        groupId: number;
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof removeShareGroupItem>>, TError, {
    venueId: number;
    groupId: number;
    itemId: number;
}, TContext>;
export declare const getListSharesUrl: (venueId: number) => string;
/**
 * @summary List all active shares for a venue
 */
export declare const listShares: (venueId: number, options?: RequestInit) => Promise<Share[]>;
export declare const getListSharesQueryKey: (venueId: number) => readonly [`/api/venues/${number}/shares`];
export declare const getListSharesQueryOptions: <TData = Awaited<ReturnType<typeof listShares>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShares>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listShares>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSharesQueryResult = NonNullable<Awaited<ReturnType<typeof listShares>>>;
export type ListSharesQueryError = ErrorType<unknown>;
/**
 * @summary List all active shares for a venue
 */
export declare function useListShares<TData = Awaited<ReturnType<typeof listShares>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShares>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateShareUrl: (venueId: number) => string;
/**
 * @summary Create a share link
 */
export declare const createShare: (venueId: number, createShareBody: CreateShareBody, options?: RequestInit) => Promise<Share>;
export declare const getCreateShareMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShare>>, TError, {
        venueId: number;
        data: BodyType<CreateShareBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createShare>>, TError, {
    venueId: number;
    data: BodyType<CreateShareBody>;
}, TContext>;
export type CreateShareMutationResult = NonNullable<Awaited<ReturnType<typeof createShare>>>;
export type CreateShareMutationBody = BodyType<CreateShareBody>;
export type CreateShareMutationError = ErrorType<unknown>;
/**
* @summary Create a share link
*/
export declare const useCreateShare: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShare>>, TError, {
        venueId: number;
        data: BodyType<CreateShareBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createShare>>, TError, {
    venueId: number;
    data: BodyType<CreateShareBody>;
}, TContext>;
export declare const getRevokeShareUrl: (venueId: number, shareId: number) => string;
/**
 * @summary Revoke a share link
 */
export declare const revokeShare: (venueId: number, shareId: number, options?: RequestInit) => Promise<void>;
export declare const getRevokeShareMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeShare>>, TError, {
        venueId: number;
        shareId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof revokeShare>>, TError, {
    venueId: number;
    shareId: number;
}, TContext>;
export type RevokeShareMutationResult = NonNullable<Awaited<ReturnType<typeof revokeShare>>>;
export type RevokeShareMutationError = ErrorType<unknown>;
/**
* @summary Revoke a share link
*/
export declare const useRevokeShare: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeShare>>, TError, {
        venueId: number;
        shareId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof revokeShare>>, TError, {
    venueId: number;
    shareId: number;
}, TContext>;
export declare const getGetSharedContentUrl: (token: string) => string;
/**
 * @summary View shared content by token (public, no auth)
 */
export declare const getSharedContent: (token: string, options?: RequestInit) => Promise<SharedContentPayload>;
export declare const getGetSharedContentQueryKey: (token: string) => readonly [`/api/shared/${string}`];
export declare const getGetSharedContentQueryOptions: <TData = Awaited<ReturnType<typeof getSharedContent>>, TError = ErrorType<void>>(token: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSharedContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSharedContent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSharedContentQueryResult = NonNullable<Awaited<ReturnType<typeof getSharedContent>>>;
export type GetSharedContentQueryError = ErrorType<void>;
/**
 * @summary View shared content by token (public, no auth)
 */
export declare function useGetSharedContent<TData = Awaited<ReturnType<typeof getSharedContent>>, TError = ErrorType<void>>(token: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSharedContent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCopySharedContentUrl: (token: string) => string;
/**
 * @summary Copy shared items to your venue (requires auth)
 */
export declare const copySharedContent: (token: string, copySharedContentBody: CopySharedContentBody, options?: RequestInit) => Promise<CopyResult>;
export declare const getCopySharedContentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof copySharedContent>>, TError, {
        token: string;
        data: BodyType<CopySharedContentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof copySharedContent>>, TError, {
    token: string;
    data: BodyType<CopySharedContentBody>;
}, TContext>;
export type CopySharedContentMutationResult = NonNullable<Awaited<ReturnType<typeof copySharedContent>>>;
export type CopySharedContentMutationBody = BodyType<CopySharedContentBody>;
export type CopySharedContentMutationError = ErrorType<unknown>;
/**
* @summary Copy shared items to your venue (requires auth)
*/
export declare const useCopySharedContent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof copySharedContent>>, TError, {
        token: string;
        data: BodyType<CopySharedContentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof copySharedContent>>, TError, {
    token: string;
    data: BodyType<CopySharedContentBody>;
}, TContext>;
export declare const getListPrepTasksUrl: (venueId: number, params?: ListPrepTasksParams) => string;
/**
 * @summary List prep tasks for a venue, optionally filtered by date
 */
export declare const listPrepTasks: (venueId: number, params?: ListPrepTasksParams, options?: RequestInit) => Promise<PrepTask[]>;
export declare const getListPrepTasksQueryKey: (venueId: number, params?: ListPrepTasksParams) => readonly [`/api/venues/${number}/prep-tasks`, ...ListPrepTasksParams[]];
export declare const getListPrepTasksQueryOptions: <TData = Awaited<ReturnType<typeof listPrepTasks>>, TError = ErrorType<unknown>>(venueId: number, params?: ListPrepTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPrepTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPrepTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPrepTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listPrepTasks>>>;
export type ListPrepTasksQueryError = ErrorType<unknown>;
/**
 * @summary List prep tasks for a venue, optionally filtered by date
 */
export declare function useListPrepTasks<TData = Awaited<ReturnType<typeof listPrepTasks>>, TError = ErrorType<unknown>>(venueId: number, params?: ListPrepTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPrepTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePrepTaskUrl: (venueId: number) => string;
/**
 * @summary Create a new prep task
 */
export declare const createPrepTask: (venueId: number, prepTaskInput: PrepTaskInput, options?: RequestInit) => Promise<PrepTask>;
export declare const getCreatePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPrepTask>>, TError, {
        venueId: number;
        data: BodyType<PrepTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPrepTask>>, TError, {
    venueId: number;
    data: BodyType<PrepTaskInput>;
}, TContext>;
export type CreatePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createPrepTask>>>;
export type CreatePrepTaskMutationBody = BodyType<PrepTaskInput>;
export type CreatePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Create a new prep task
*/
export declare const useCreatePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPrepTask>>, TError, {
        venueId: number;
        data: BodyType<PrepTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPrepTask>>, TError, {
    venueId: number;
    data: BodyType<PrepTaskInput>;
}, TContext>;
export declare const getListArchivedPrepTasksUrl: (venueId: number) => string;
/**
 * @summary List archived prep tasks for a venue
 */
export declare const listArchivedPrepTasks: (venueId: number, options?: RequestInit) => Promise<PrepTask[]>;
export declare const getListArchivedPrepTasksQueryKey: (venueId: number) => readonly [`/api/venues/${number}/prep-tasks/archived`];
export declare const getListArchivedPrepTasksQueryOptions: <TData = Awaited<ReturnType<typeof listArchivedPrepTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArchivedPrepTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listArchivedPrepTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListArchivedPrepTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listArchivedPrepTasks>>>;
export type ListArchivedPrepTasksQueryError = ErrorType<unknown>;
/**
 * @summary List archived prep tasks for a venue
 */
export declare function useListArchivedPrepTasks<TData = Awaited<ReturnType<typeof listArchivedPrepTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArchivedPrepTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getArchivePrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Archive a prep task
 */
export declare const archivePrepTask: (venueId: number, taskId: number, options?: RequestInit) => Promise<PrepTask>;
export declare const getArchivePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archivePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof archivePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export type ArchivePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof archivePrepTask>>>;
export type ArchivePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Archive a prep task
*/
export declare const useArchivePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archivePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof archivePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export declare const getRestorePrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Restore an archived prep task
 */
export declare const restorePrepTask: (venueId: number, taskId: number, options?: RequestInit) => Promise<PrepTask>;
export declare const getRestorePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restorePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof restorePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export type RestorePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof restorePrepTask>>>;
export type RestorePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Restore an archived prep task
*/
export declare const useRestorePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof restorePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof restorePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export declare const getDeferPrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Defer a prep task to the next day (or a specified date)
 */
export declare const deferPrepTask: (venueId: number, taskId: number, deferPrepTaskBody?: DeferPrepTaskBody, options?: RequestInit) => Promise<PrepTask>;
export declare const getDeferPrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deferPrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data?: BodyType<DeferPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deferPrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data?: BodyType<DeferPrepTaskBody>;
}, TContext>;
export type DeferPrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof deferPrepTask>>>;
export type DeferPrepTaskMutationBody = BodyType<DeferPrepTaskBody> | undefined;
export type DeferPrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Defer a prep task to the next day (or a specified date)
*/
export declare const useDeferPrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deferPrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data?: BodyType<DeferPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deferPrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data?: BodyType<DeferPrepTaskBody>;
}, TContext>;
export declare const getScanPrepListImageUrl: (venueId: number) => string;
/**
 * @summary Scan a photo of a prep list and extract tasks using AI
 */
export declare const scanPrepListImage: (venueId: number, scanPrepListBody: ScanPrepListBody, options?: RequestInit) => Promise<ScanPrepListResult>;
export declare const getScanPrepListImageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof scanPrepListImage>>, TError, {
        venueId: number;
        data: BodyType<ScanPrepListBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof scanPrepListImage>>, TError, {
    venueId: number;
    data: BodyType<ScanPrepListBody>;
}, TContext>;
export type ScanPrepListImageMutationResult = NonNullable<Awaited<ReturnType<typeof scanPrepListImage>>>;
export type ScanPrepListImageMutationBody = BodyType<ScanPrepListBody>;
export type ScanPrepListImageMutationError = ErrorType<unknown>;
/**
* @summary Scan a photo of a prep list and extract tasks using AI
*/
export declare const useScanPrepListImage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof scanPrepListImage>>, TError, {
        venueId: number;
        data: BodyType<ScanPrepListBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof scanPrepListImage>>, TError, {
    venueId: number;
    data: BodyType<ScanPrepListBody>;
}, TContext>;
export declare const getUpdatePrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Update a prep task (title, status, assignee, etc.)
 */
export declare const updatePrepTask: (venueId: number, taskId: number, prepTaskInput: PrepTaskInput, options?: RequestInit) => Promise<PrepTask>;
export declare const getUpdatePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<PrepTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<PrepTaskInput>;
}, TContext>;
export type UpdatePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updatePrepTask>>>;
export type UpdatePrepTaskMutationBody = BodyType<PrepTaskInput>;
export type UpdatePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Update a prep task (title, status, assignee, etc.)
*/
export declare const useUpdatePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<PrepTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<PrepTaskInput>;
}, TContext>;
export declare const getDeletePrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Delete a prep task
 */
export declare const deletePrepTask: (venueId: number, taskId: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export type DeletePrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof deletePrepTask>>>;
export type DeletePrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Delete a prep task
*/
export declare const useDeletePrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePrepTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePrepTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export declare const getListVenueStaffUrl: (venueId: number) => string;
/**
 * @summary List staff members for a venue
 */
export declare const listVenueStaff: (venueId: number, options?: RequestInit) => Promise<VenueStaffMember[]>;
export declare const getListVenueStaffQueryKey: (venueId: number) => readonly [`/api/venues/${number}/staff`];
export declare const getListVenueStaffQueryOptions: <TData = Awaited<ReturnType<typeof listVenueStaff>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVenueStaff>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listVenueStaff>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListVenueStaffQueryResult = NonNullable<Awaited<ReturnType<typeof listVenueStaff>>>;
export type ListVenueStaffQueryError = ErrorType<unknown>;
/**
 * @summary List staff members for a venue
 */
export declare function useListVenueStaff<TData = Awaited<ReturnType<typeof listVenueStaff>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listVenueStaff>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateVenueStaffUrl: (venueId: number) => string;
/**
 * @summary Add a staff member to a venue
 */
export declare const createVenueStaff: (venueId: number, venueStaffInput: VenueStaffInput, options?: RequestInit) => Promise<VenueStaffMember>;
export declare const getCreateVenueStaffMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVenueStaff>>, TError, {
        venueId: number;
        data: BodyType<VenueStaffInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createVenueStaff>>, TError, {
    venueId: number;
    data: BodyType<VenueStaffInput>;
}, TContext>;
export type CreateVenueStaffMutationResult = NonNullable<Awaited<ReturnType<typeof createVenueStaff>>>;
export type CreateVenueStaffMutationBody = BodyType<VenueStaffInput>;
export type CreateVenueStaffMutationError = ErrorType<unknown>;
/**
* @summary Add a staff member to a venue
*/
export declare const useCreateVenueStaff: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createVenueStaff>>, TError, {
        venueId: number;
        data: BodyType<VenueStaffInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createVenueStaff>>, TError, {
    venueId: number;
    data: BodyType<VenueStaffInput>;
}, TContext>;
export declare const getDeleteVenueStaffUrl: (venueId: number, staffId: number) => string;
/**
 * @summary Remove a staff member from a venue
 */
export declare const deleteVenueStaff: (venueId: number, staffId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteVenueStaffMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteVenueStaff>>, TError, {
        venueId: number;
        staffId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteVenueStaff>>, TError, {
    venueId: number;
    staffId: number;
}, TContext>;
export type DeleteVenueStaffMutationResult = NonNullable<Awaited<ReturnType<typeof deleteVenueStaff>>>;
export type DeleteVenueStaffMutationError = ErrorType<unknown>;
/**
* @summary Remove a staff member from a venue
*/
export declare const useDeleteVenueStaff: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteVenueStaff>>, TError, {
        venueId: number;
        staffId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteVenueStaff>>, TError, {
    venueId: number;
    staffId: number;
}, TContext>;
export declare const getListPrepLibraryTasksUrl: (venueId: number, params?: ListPrepLibraryTasksParams) => string;
/**
 * @summary List all prep library tasks for a venue
 */
export declare const listPrepLibraryTasks: (venueId: number, params?: ListPrepLibraryTasksParams, options?: RequestInit) => Promise<PrepLibraryTask[]>;
export declare const getListPrepLibraryTasksQueryKey: (venueId: number, params?: ListPrepLibraryTasksParams) => readonly [`/api/venues/${number}/prep-library`, ...ListPrepLibraryTasksParams[]];
export declare const getListPrepLibraryTasksQueryOptions: <TData = Awaited<ReturnType<typeof listPrepLibraryTasks>>, TError = ErrorType<unknown>>(venueId: number, params?: ListPrepLibraryTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPrepLibraryTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPrepLibraryTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPrepLibraryTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listPrepLibraryTasks>>>;
export type ListPrepLibraryTasksQueryError = ErrorType<unknown>;
/**
 * @summary List all prep library tasks for a venue
 */
export declare function useListPrepLibraryTasks<TData = Awaited<ReturnType<typeof listPrepLibraryTasks>>, TError = ErrorType<unknown>>(venueId: number, params?: ListPrepLibraryTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPrepLibraryTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePrepLibraryTaskUrl: (venueId: number) => string;
/**
 * @summary Create a new prep library task (admins go active, others go waiting_approval)
 */
export declare const createPrepLibraryTask: (venueId: number, prepLibraryTaskInput: PrepLibraryTaskInput, options?: RequestInit) => Promise<PrepLibraryTask>;
export declare const getCreatePrepLibraryTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPrepLibraryTask>>, TError, {
        venueId: number;
        data: BodyType<PrepLibraryTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPrepLibraryTask>>, TError, {
    venueId: number;
    data: BodyType<PrepLibraryTaskInput>;
}, TContext>;
export type CreatePrepLibraryTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createPrepLibraryTask>>>;
export type CreatePrepLibraryTaskMutationBody = BodyType<PrepLibraryTaskInput>;
export type CreatePrepLibraryTaskMutationError = ErrorType<unknown>;
/**
* @summary Create a new prep library task (admins go active, others go waiting_approval)
*/
export declare const useCreatePrepLibraryTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPrepLibraryTask>>, TError, {
        venueId: number;
        data: BodyType<PrepLibraryTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPrepLibraryTask>>, TError, {
    venueId: number;
    data: BodyType<PrepLibraryTaskInput>;
}, TContext>;
export declare const getUpdatePrepLibraryTaskUrl: (venueId: number, libraryTaskId: number) => string;
/**
 * @summary Update a prep library task
 */
export declare const updatePrepLibraryTask: (venueId: number, libraryTaskId: number, prepLibraryTaskInput: PrepLibraryTaskInput, options?: RequestInit) => Promise<PrepLibraryTask>;
export declare const getUpdatePrepLibraryTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
        data: BodyType<PrepLibraryTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
    data: BodyType<PrepLibraryTaskInput>;
}, TContext>;
export type UpdatePrepLibraryTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updatePrepLibraryTask>>>;
export type UpdatePrepLibraryTaskMutationBody = BodyType<PrepLibraryTaskInput>;
export type UpdatePrepLibraryTaskMutationError = ErrorType<unknown>;
/**
* @summary Update a prep library task
*/
export declare const useUpdatePrepLibraryTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
        data: BodyType<PrepLibraryTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
    data: BodyType<PrepLibraryTaskInput>;
}, TContext>;
export declare const getDeletePrepLibraryTaskUrl: (venueId: number, libraryTaskId: number) => string;
/**
 * @summary Archive (soft-delete) a prep library task — admin only
 */
export declare const deletePrepLibraryTask: (venueId: number, libraryTaskId: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePrepLibraryTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
}, TContext>;
export type DeletePrepLibraryTaskMutationResult = NonNullable<Awaited<ReturnType<typeof deletePrepLibraryTask>>>;
export type DeletePrepLibraryTaskMutationError = ErrorType<unknown>;
/**
* @summary Archive (soft-delete) a prep library task — admin only
*/
export declare const useDeletePrepLibraryTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
}, TContext>;
export declare const getListPendingPrepLibraryTasksUrl: (venueId: number) => string;
/**
 * @summary List pending approval tasks — admin only
 */
export declare const listPendingPrepLibraryTasks: (venueId: number, options?: RequestInit) => Promise<PrepLibraryTask[]>;
export declare const getListPendingPrepLibraryTasksQueryKey: (venueId: number) => readonly [`/api/venues/${number}/prep-library/pending`];
export declare const getListPendingPrepLibraryTasksQueryOptions: <TData = Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPendingPrepLibraryTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>>;
export type ListPendingPrepLibraryTasksQueryError = ErrorType<unknown>;
/**
 * @summary List pending approval tasks — admin only
 */
export declare function useListPendingPrepLibraryTasks<TData = Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPendingPrepLibraryTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApprovePrepLibraryTaskUrl: (venueId: number, libraryTaskId: number) => string;
/**
 * @summary Approve a pending library task — admin only; optional days for temporary approval
 */
export declare const approvePrepLibraryTask: (venueId: number, libraryTaskId: number, approvePrepLibraryTaskBody?: ApprovePrepLibraryTaskBody, options?: RequestInit) => Promise<PrepLibraryTask>;
export declare const getApprovePrepLibraryTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approvePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
        data?: BodyType<ApprovePrepLibraryTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approvePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
    data?: BodyType<ApprovePrepLibraryTaskBody>;
}, TContext>;
export type ApprovePrepLibraryTaskMutationResult = NonNullable<Awaited<ReturnType<typeof approvePrepLibraryTask>>>;
export type ApprovePrepLibraryTaskMutationBody = BodyType<ApprovePrepLibraryTaskBody> | undefined;
export type ApprovePrepLibraryTaskMutationError = ErrorType<unknown>;
/**
* @summary Approve a pending library task — admin only; optional days for temporary approval
*/
export declare const useApprovePrepLibraryTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approvePrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
        data?: BodyType<ApprovePrepLibraryTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approvePrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
    data?: BodyType<ApprovePrepLibraryTaskBody>;
}, TContext>;
export declare const getRejectPrepLibraryTaskUrl: (venueId: number, libraryTaskId: number) => string;
/**
 * @summary Reject a pending library task — admin only (archives it)
 */
export declare const rejectPrepLibraryTask: (venueId: number, libraryTaskId: number, options?: RequestInit) => Promise<void>;
export declare const getRejectPrepLibraryTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectPrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectPrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
}, TContext>;
export type RejectPrepLibraryTaskMutationResult = NonNullable<Awaited<ReturnType<typeof rejectPrepLibraryTask>>>;
export type RejectPrepLibraryTaskMutationError = ErrorType<unknown>;
/**
* @summary Reject a pending library task — admin only (archives it)
*/
export declare const useRejectPrepLibraryTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectPrepLibraryTask>>, TError, {
        venueId: number;
        libraryTaskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectPrepLibraryTask>>, TError, {
    venueId: number;
    libraryTaskId: number;
}, TContext>;
export declare const getGetPrepLibraryTaskReactivationChecklistUrl: (venueId: number, libraryTaskId: number) => string;
/**
 * @summary Get reactivation checklist data for an inactive library task
 */
export declare const getPrepLibraryTaskReactivationChecklist: (venueId: number, libraryTaskId: number, options?: RequestInit) => Promise<PrepLibraryTaskReactivationChecklist>;
export declare const getGetPrepLibraryTaskReactivationChecklistQueryKey: (venueId: number, libraryTaskId: number) => readonly [`/api/venues/${number}/prep-library/${number}/reactivation-checklist`];
export declare const getGetPrepLibraryTaskReactivationChecklistQueryOptions: <TData = Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>, TError = ErrorType<unknown>>(venueId: number, libraryTaskId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPrepLibraryTaskReactivationChecklistQueryResult = NonNullable<Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>>;
export type GetPrepLibraryTaskReactivationChecklistQueryError = ErrorType<unknown>;
/**
 * @summary Get reactivation checklist data for an inactive library task
 */
export declare function useGetPrepLibraryTaskReactivationChecklist<TData = Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>, TError = ErrorType<unknown>>(venueId: number, libraryTaskId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPrepLibraryTaskReactivationChecklist>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBuildSuggestionsUrl: (venueId: number) => string;
/**
 * @summary Get A/B/C prep list suggestions driven by stock levels and library
 */
export declare const getBuildSuggestions: (venueId: number, options?: RequestInit) => Promise<BuildSuggestionsResponse>;
export declare const getGetBuildSuggestionsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/prep-tasks/build-suggestions`];
export declare const getGetBuildSuggestionsQueryOptions: <TData = Awaited<ReturnType<typeof getBuildSuggestions>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBuildSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBuildSuggestions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBuildSuggestionsQueryResult = NonNullable<Awaited<ReturnType<typeof getBuildSuggestions>>>;
export type GetBuildSuggestionsQueryError = ErrorType<unknown>;
/**
 * @summary Get A/B/C prep list suggestions driven by stock levels and library
 */
export declare function useGetBuildSuggestions<TData = Awaited<ReturnType<typeof getBuildSuggestions>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBuildSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getQuickAddPrepTaskUrl: (venueId: number) => string;
/**
 * @summary Immediately add a task to today's board and queue it for library approval
 */
export declare const quickAddPrepTask: (venueId: number, quickAddPrepTaskBody: QuickAddPrepTaskBody, options?: RequestInit) => Promise<QuickAddPrepTaskResponse>;
export declare const getQuickAddPrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof quickAddPrepTask>>, TError, {
        venueId: number;
        data: BodyType<QuickAddPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof quickAddPrepTask>>, TError, {
    venueId: number;
    data: BodyType<QuickAddPrepTaskBody>;
}, TContext>;
export type QuickAddPrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof quickAddPrepTask>>>;
export type QuickAddPrepTaskMutationBody = BodyType<QuickAddPrepTaskBody>;
export type QuickAddPrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Immediately add a task to today's board and queue it for library approval
*/
export declare const useQuickAddPrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof quickAddPrepTask>>, TError, {
        venueId: number;
        data: BodyType<QuickAddPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof quickAddPrepTask>>, TError, {
    venueId: number;
    data: BodyType<QuickAddPrepTaskBody>;
}, TContext>;
export declare const getClaimPrepTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Claim or unclaim a prep task
 */
export declare const claimPrepTask: (venueId: number, taskId: number, claimPrepTaskBody: ClaimPrepTaskBody, options?: RequestInit) => Promise<PrepTask>;
export declare const getClaimPrepTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimPrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<ClaimPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof claimPrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<ClaimPrepTaskBody>;
}, TContext>;
export type ClaimPrepTaskMutationResult = NonNullable<Awaited<ReturnType<typeof claimPrepTask>>>;
export type ClaimPrepTaskMutationBody = BodyType<ClaimPrepTaskBody>;
export type ClaimPrepTaskMutationError = ErrorType<unknown>;
/**
* @summary Claim or unclaim a prep task
*/
export declare const useClaimPrepTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof claimPrepTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<ClaimPrepTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof claimPrepTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<ClaimPrepTaskBody>;
}, TContext>;
export declare const getBuildPrepListUrl: (venueId: number) => string;
/**
 * @summary Build a prep list for a date from selected library tasks
 */
export declare const buildPrepList: (venueId: number, buildPrepListBody: BuildPrepListBody, options?: RequestInit) => Promise<PrepTask[]>;
export declare const getBuildPrepListMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof buildPrepList>>, TError, {
        venueId: number;
        data: BodyType<BuildPrepListBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof buildPrepList>>, TError, {
    venueId: number;
    data: BodyType<BuildPrepListBody>;
}, TContext>;
export type BuildPrepListMutationResult = NonNullable<Awaited<ReturnType<typeof buildPrepList>>>;
export type BuildPrepListMutationBody = BodyType<BuildPrepListBody>;
export type BuildPrepListMutationError = ErrorType<unknown>;
/**
* @summary Build a prep list for a date from selected library tasks
*/
export declare const useBuildPrepList: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof buildPrepList>>, TError, {
        venueId: number;
        data: BodyType<BuildPrepListBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof buildPrepList>>, TError, {
    venueId: number;
    data: BodyType<BuildPrepListBody>;
}, TContext>;
export declare const getSuggestPrepInstructionsUrl: (venueId: number) => string;
/**
 * @summary Use AI to suggest step-by-step prep instructions for a task
 */
export declare const suggestPrepInstructions: (venueId: number, prepInstructionSuggestInput: PrepInstructionSuggestInput, options?: RequestInit) => Promise<PrepInstructionSuggestResult>;
export declare const getSuggestPrepInstructionsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suggestPrepInstructions>>, TError, {
        venueId: number;
        data: BodyType<PrepInstructionSuggestInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof suggestPrepInstructions>>, TError, {
    venueId: number;
    data: BodyType<PrepInstructionSuggestInput>;
}, TContext>;
export type SuggestPrepInstructionsMutationResult = NonNullable<Awaited<ReturnType<typeof suggestPrepInstructions>>>;
export type SuggestPrepInstructionsMutationBody = BodyType<PrepInstructionSuggestInput>;
export type SuggestPrepInstructionsMutationError = ErrorType<unknown>;
/**
* @summary Use AI to suggest step-by-step prep instructions for a task
*/
export declare const useSuggestPrepInstructions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof suggestPrepInstructions>>, TError, {
        venueId: number;
        data: BodyType<PrepInstructionSuggestInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof suggestPrepInstructions>>, TError, {
    venueId: number;
    data: BodyType<PrepInstructionSuggestInput>;
}, TContext>;
export declare const getGetBookingNotesUrl: (venueId: number) => string;
/**
 * @summary Get venue booking notes (auto-creates if missing)
 */
export declare const getBookingNotes: (venueId: number, options?: RequestInit) => Promise<BookingNote>;
export declare const getGetBookingNotesQueryKey: (venueId: number) => readonly [`/api/venues/${number}/booking-notes`];
export declare const getGetBookingNotesQueryOptions: <TData = Awaited<ReturnType<typeof getBookingNotes>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBookingNotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBookingNotes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBookingNotesQueryResult = NonNullable<Awaited<ReturnType<typeof getBookingNotes>>>;
export type GetBookingNotesQueryError = ErrorType<unknown>;
/**
 * @summary Get venue booking notes (auto-creates if missing)
 */
export declare function useGetBookingNotes<TData = Awaited<ReturnType<typeof getBookingNotes>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBookingNotes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateBookingNotesUrl: (venueId: number) => string;
/**
 * @summary Update venue booking notes
 */
export declare const updateBookingNotes: (venueId: number, bookingNoteInput: BookingNoteInput, options?: RequestInit) => Promise<BookingNote>;
export declare const getUpdateBookingNotesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBookingNotes>>, TError, {
        venueId: number;
        data: BodyType<BookingNoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBookingNotes>>, TError, {
    venueId: number;
    data: BodyType<BookingNoteInput>;
}, TContext>;
export type UpdateBookingNotesMutationResult = NonNullable<Awaited<ReturnType<typeof updateBookingNotes>>>;
export type UpdateBookingNotesMutationBody = BodyType<BookingNoteInput>;
export type UpdateBookingNotesMutationError = ErrorType<unknown>;
/**
* @summary Update venue booking notes
*/
export declare const useUpdateBookingNotes: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBookingNotes>>, TError, {
        venueId: number;
        data: BodyType<BookingNoteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBookingNotes>>, TError, {
    venueId: number;
    data: BodyType<BookingNoteInput>;
}, TContext>;
export declare const getListCleaningTasksUrl: (venueId: number) => string;
/**
 * @summary List all cleaning tasks for a venue
 */
export declare const listCleaningTasks: (venueId: number, options?: RequestInit) => Promise<CleaningTask[]>;
export declare const getListCleaningTasksQueryKey: (venueId: number) => readonly [`/api/venues/${number}/cleaning-tasks`];
export declare const getListCleaningTasksQueryOptions: <TData = Awaited<ReturnType<typeof listCleaningTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCleaningTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCleaningTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCleaningTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listCleaningTasks>>>;
export type ListCleaningTasksQueryError = ErrorType<unknown>;
/**
 * @summary List all cleaning tasks for a venue
 */
export declare function useListCleaningTasks<TData = Awaited<ReturnType<typeof listCleaningTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCleaningTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateCleaningTaskUrl: (venueId: number) => string;
/**
 * @summary Create a cleaning task
 */
export declare const createCleaningTask: (venueId: number, cleaningTaskInput: CleaningTaskInput, options?: RequestInit) => Promise<CleaningTask>;
export declare const getCreateCleaningTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCleaningTask>>, TError, {
        venueId: number;
        data: BodyType<CleaningTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCleaningTask>>, TError, {
    venueId: number;
    data: BodyType<CleaningTaskInput>;
}, TContext>;
export type CreateCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createCleaningTask>>>;
export type CreateCleaningTaskMutationBody = BodyType<CleaningTaskInput>;
export type CreateCleaningTaskMutationError = ErrorType<unknown>;
/**
* @summary Create a cleaning task
*/
export declare const useCreateCleaningTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCleaningTask>>, TError, {
        venueId: number;
        data: BodyType<CleaningTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCleaningTask>>, TError, {
    venueId: number;
    data: BodyType<CleaningTaskInput>;
}, TContext>;
export declare const getUpdateCleaningTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Update a cleaning task
 */
export declare const updateCleaningTask: (venueId: number, taskId: number, cleaningTaskInput: CleaningTaskInput, options?: RequestInit) => Promise<CleaningTask>;
export declare const getUpdateCleaningTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CleaningTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CleaningTaskInput>;
}, TContext>;
export type UpdateCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updateCleaningTask>>>;
export type UpdateCleaningTaskMutationBody = BodyType<CleaningTaskInput>;
export type UpdateCleaningTaskMutationError = ErrorType<unknown>;
/**
* @summary Update a cleaning task
*/
export declare const useUpdateCleaningTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CleaningTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CleaningTaskInput>;
}, TContext>;
export declare const getDeleteCleaningTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Delete a cleaning task
 */
export declare const deleteCleaningTask: (venueId: number, taskId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCleaningTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export type DeleteCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCleaningTask>>>;
export type DeleteCleaningTaskMutationError = ErrorType<unknown>;
/**
* @summary Delete a cleaning task
*/
export declare const useDeleteCleaningTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export declare const getCompleteCleaningTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Log a cleaning task as completed
 */
export declare const completeCleaningTask: (venueId: number, taskId: number, cleaningCompleteBody: CleaningCompleteBody, options?: RequestInit) => Promise<CleaningLog>;
export declare const getCompleteCleaningTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CleaningCompleteBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CleaningCompleteBody>;
}, TContext>;
export type CompleteCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof completeCleaningTask>>>;
export type CompleteCleaningTaskMutationBody = BodyType<CleaningCompleteBody>;
export type CompleteCleaningTaskMutationError = ErrorType<unknown>;
/**
* @summary Log a cleaning task as completed
*/
export declare const useCompleteCleaningTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeCleaningTask>>, TError, {
        venueId: number;
        taskId: number;
        data: BodyType<CleaningCompleteBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeCleaningTask>>, TError, {
    venueId: number;
    taskId: number;
    data: BodyType<CleaningCompleteBody>;
}, TContext>;
export declare const getListCleaningLogsUrl: (venueId: number) => string;
/**
 * @summary List recent cleaning logs for a venue
 */
export declare const listCleaningLogs: (venueId: number, options?: RequestInit) => Promise<CleaningLog[]>;
export declare const getListCleaningLogsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/cleaning-logs`];
export declare const getListCleaningLogsQueryOptions: <TData = Awaited<ReturnType<typeof listCleaningLogs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCleaningLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCleaningLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCleaningLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listCleaningLogs>>>;
export type ListCleaningLogsQueryError = ErrorType<unknown>;
/**
 * @summary List recent cleaning logs for a venue
 */
export declare function useListCleaningLogs<TData = Awaited<ReturnType<typeof listCleaningLogs>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCleaningLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSeedDemoUrl: () => string;
/**
 * @summary Seed a demo venue "The Black Apron" for the authenticated user
 */
export declare const seedDemo: (options?: RequestInit) => Promise<SeedDemoResult>;
export declare const getSeedDemoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof seedDemo>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof seedDemo>>, TError, void, TContext>;
export type SeedDemoMutationResult = NonNullable<Awaited<ReturnType<typeof seedDemo>>>;
export type SeedDemoMutationError = ErrorType<unknown>;
/**
* @summary Seed a demo venue "The Black Apron" for the authenticated user
*/
export declare const useSeedDemo: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof seedDemo>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof seedDemo>>, TError, void, TContext>;
export declare const getGetAnalyticsUrl: (venueId: number) => string;
/**
 * @summary Get operational analytics for a venue (last 30 days)
 */
export declare const getAnalytics: (venueId: number, options?: RequestInit) => Promise<AnalyticsData>;
export declare const getGetAnalyticsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/analytics`];
export declare const getGetAnalyticsQueryOptions: <TData = Awaited<ReturnType<typeof getAnalytics>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAnalyticsQueryResult = NonNullable<Awaited<ReturnType<typeof getAnalytics>>>;
export type GetAnalyticsQueryError = ErrorType<unknown>;
/**
 * @summary Get operational analytics for a venue (last 30 days)
 */
export declare function useGetAnalytics<TData = Awaited<ReturnType<typeof getAnalytics>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListTemperatureEquipmentUrl: (venueId: number) => string;
/**
 * @summary List temperature-controlled equipment for a venue
 */
export declare const listTemperatureEquipment: (venueId: number, options?: RequestInit) => Promise<TemperatureEquipment[]>;
export declare const getListTemperatureEquipmentQueryKey: (venueId: number) => readonly [`/api/venues/${number}/temperature/equipment`];
export declare const getListTemperatureEquipmentQueryOptions: <TData = Awaited<ReturnType<typeof listTemperatureEquipment>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemperatureEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTemperatureEquipment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTemperatureEquipmentQueryResult = NonNullable<Awaited<ReturnType<typeof listTemperatureEquipment>>>;
export type ListTemperatureEquipmentQueryError = ErrorType<unknown>;
/**
 * @summary List temperature-controlled equipment for a venue
 */
export declare function useListTemperatureEquipment<TData = Awaited<ReturnType<typeof listTemperatureEquipment>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemperatureEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTemperatureEquipmentUrl: (venueId: number) => string;
/**
 * @summary Create temperature-controlled equipment (admin only)
 */
export declare const createTemperatureEquipment: (venueId: number, temperatureEquipmentInput: TemperatureEquipmentInput, options?: RequestInit) => Promise<TemperatureEquipment>;
export declare const getCreateTemperatureEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTemperatureEquipment>>, TError, {
        venueId: number;
        data: BodyType<TemperatureEquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTemperatureEquipment>>, TError, {
    venueId: number;
    data: BodyType<TemperatureEquipmentInput>;
}, TContext>;
export type CreateTemperatureEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof createTemperatureEquipment>>>;
export type CreateTemperatureEquipmentMutationBody = BodyType<TemperatureEquipmentInput>;
export type CreateTemperatureEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Create temperature-controlled equipment (admin only)
*/
export declare const useCreateTemperatureEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTemperatureEquipment>>, TError, {
        venueId: number;
        data: BodyType<TemperatureEquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTemperatureEquipment>>, TError, {
    venueId: number;
    data: BodyType<TemperatureEquipmentInput>;
}, TContext>;
export declare const getUpdateTemperatureEquipmentUrl: (venueId: number, equipmentId: number) => string;
/**
 * @summary Update temperature equipment (admin only)
 */
export declare const updateTemperatureEquipment: (venueId: number, equipmentId: number, temperatureEquipmentInput: TemperatureEquipmentInput, options?: RequestInit) => Promise<TemperatureEquipment>;
export declare const getUpdateTemperatureEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureEquipment>>, TError, {
        venueId: number;
        equipmentId: number;
        data: BodyType<TemperatureEquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureEquipment>>, TError, {
    venueId: number;
    equipmentId: number;
    data: BodyType<TemperatureEquipmentInput>;
}, TContext>;
export type UpdateTemperatureEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof updateTemperatureEquipment>>>;
export type UpdateTemperatureEquipmentMutationBody = BodyType<TemperatureEquipmentInput>;
export type UpdateTemperatureEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Update temperature equipment (admin only)
*/
export declare const useUpdateTemperatureEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureEquipment>>, TError, {
        venueId: number;
        equipmentId: number;
        data: BodyType<TemperatureEquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTemperatureEquipment>>, TError, {
    venueId: number;
    equipmentId: number;
    data: BodyType<TemperatureEquipmentInput>;
}, TContext>;
export declare const getArchiveTemperatureEquipmentUrl: (venueId: number, equipmentId: number) => string;
/**
 * @summary Archive temperature equipment (admin only)
 */
export declare const archiveTemperatureEquipment: (venueId: number, equipmentId: number, options?: RequestInit) => Promise<void>;
export declare const getArchiveTemperatureEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archiveTemperatureEquipment>>, TError, {
        venueId: number;
        equipmentId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof archiveTemperatureEquipment>>, TError, {
    venueId: number;
    equipmentId: number;
}, TContext>;
export type ArchiveTemperatureEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof archiveTemperatureEquipment>>>;
export type ArchiveTemperatureEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Archive temperature equipment (admin only)
*/
export declare const useArchiveTemperatureEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof archiveTemperatureEquipment>>, TError, {
        venueId: number;
        equipmentId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof archiveTemperatureEquipment>>, TError, {
    venueId: number;
    equipmentId: number;
}, TContext>;
export declare const getGetTemperatureSummaryUrl: (venueId: number) => string;
/**
 * @summary Get temperature summary for dashboard
 */
export declare const getTemperatureSummary: (venueId: number, options?: RequestInit) => Promise<TemperatureSummary>;
export declare const getGetTemperatureSummaryQueryKey: (venueId: number) => readonly [`/api/venues/${number}/temperature/summary`];
export declare const getGetTemperatureSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getTemperatureSummary>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTemperatureSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTemperatureSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTemperatureSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getTemperatureSummary>>>;
export type GetTemperatureSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get temperature summary for dashboard
 */
export declare function useGetTemperatureSummary<TData = Awaited<ReturnType<typeof getTemperatureSummary>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTemperatureSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListTemperatureLogsUrl: (venueId: number, params?: ListTemperatureLogsParams) => string;
/**
 * @summary List temperature logs
 */
export declare const listTemperatureLogs: (venueId: number, params?: ListTemperatureLogsParams, options?: RequestInit) => Promise<TemperatureLog[]>;
export declare const getListTemperatureLogsQueryKey: (venueId: number, params?: ListTemperatureLogsParams) => readonly [`/api/venues/${number}/temperature/logs`, ...ListTemperatureLogsParams[]];
export declare const getListTemperatureLogsQueryOptions: <TData = Awaited<ReturnType<typeof listTemperatureLogs>>, TError = ErrorType<unknown>>(venueId: number, params?: ListTemperatureLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemperatureLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTemperatureLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTemperatureLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listTemperatureLogs>>>;
export type ListTemperatureLogsQueryError = ErrorType<unknown>;
/**
 * @summary List temperature logs
 */
export declare function useListTemperatureLogs<TData = Awaited<ReturnType<typeof listTemperatureLogs>>, TError = ErrorType<unknown>>(venueId: number, params?: ListTemperatureLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTemperatureLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTemperatureLogUrl: (venueId: number) => string;
/**
 * @summary Create a temperature log entry
 */
export declare const createTemperatureLog: (venueId: number, temperatureLogInput: TemperatureLogInput, options?: RequestInit) => Promise<TemperatureLog>;
export declare const getCreateTemperatureLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTemperatureLog>>, TError, {
        venueId: number;
        data: BodyType<TemperatureLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTemperatureLog>>, TError, {
    venueId: number;
    data: BodyType<TemperatureLogInput>;
}, TContext>;
export type CreateTemperatureLogMutationResult = NonNullable<Awaited<ReturnType<typeof createTemperatureLog>>>;
export type CreateTemperatureLogMutationBody = BodyType<TemperatureLogInput>;
export type CreateTemperatureLogMutationError = ErrorType<unknown>;
/**
* @summary Create a temperature log entry
*/
export declare const useCreateTemperatureLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTemperatureLog>>, TError, {
        venueId: number;
        data: BodyType<TemperatureLogInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTemperatureLog>>, TError, {
    venueId: number;
    data: BodyType<TemperatureLogInput>;
}, TContext>;
export declare const getUpdateTemperatureLogUrl: (venueId: number, logId: number) => string;
/**
 * @summary Update a temperature log (corrective action)
 */
export declare const updateTemperatureLog: (venueId: number, logId: number, temperatureLogUpdate: TemperatureLogUpdate, options?: RequestInit) => Promise<TemperatureLog>;
export declare const getUpdateTemperatureLogMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureLog>>, TError, {
        venueId: number;
        logId: number;
        data: BodyType<TemperatureLogUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureLog>>, TError, {
    venueId: number;
    logId: number;
    data: BodyType<TemperatureLogUpdate>;
}, TContext>;
export type UpdateTemperatureLogMutationResult = NonNullable<Awaited<ReturnType<typeof updateTemperatureLog>>>;
export type UpdateTemperatureLogMutationBody = BodyType<TemperatureLogUpdate>;
export type UpdateTemperatureLogMutationError = ErrorType<unknown>;
/**
* @summary Update a temperature log (corrective action)
*/
export declare const useUpdateTemperatureLog: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTemperatureLog>>, TError, {
        venueId: number;
        logId: number;
        data: BodyType<TemperatureLogUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTemperatureLog>>, TError, {
    venueId: number;
    logId: number;
    data: BodyType<TemperatureLogUpdate>;
}, TContext>;
export declare const getListChemicalsUrl: (venueId: number) => string;
/**
 * @summary List all chemicals for a venue
 */
export declare const listChemicals: (venueId: number, options?: RequestInit) => Promise<Chemical[]>;
export declare const getListChemicalsQueryKey: (venueId: number) => readonly [`/api/venues/${number}/chemicals`];
export declare const getListChemicalsQueryOptions: <TData = Awaited<ReturnType<typeof listChemicals>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChemicals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listChemicals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListChemicalsQueryResult = NonNullable<Awaited<ReturnType<typeof listChemicals>>>;
export type ListChemicalsQueryError = ErrorType<unknown>;
/**
 * @summary List all chemicals for a venue
 */
export declare function useListChemicals<TData = Awaited<ReturnType<typeof listChemicals>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChemicals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateChemicalUrl: (venueId: number) => string;
/**
 * @summary Create a chemical
 */
export declare const createChemical: (venueId: number, chemicalInput: ChemicalInput, options?: RequestInit) => Promise<Chemical>;
export declare const getCreateChemicalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createChemical>>, TError, {
        venueId: number;
        data: BodyType<ChemicalInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createChemical>>, TError, {
    venueId: number;
    data: BodyType<ChemicalInput>;
}, TContext>;
export type CreateChemicalMutationResult = NonNullable<Awaited<ReturnType<typeof createChemical>>>;
export type CreateChemicalMutationBody = BodyType<ChemicalInput>;
export type CreateChemicalMutationError = ErrorType<unknown>;
/**
* @summary Create a chemical
*/
export declare const useCreateChemical: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createChemical>>, TError, {
        venueId: number;
        data: BodyType<ChemicalInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createChemical>>, TError, {
    venueId: number;
    data: BodyType<ChemicalInput>;
}, TContext>;
export declare const getUpdateChemicalUrl: (venueId: number, chemicalId: number) => string;
/**
 * @summary Update a chemical
 */
export declare const updateChemical: (venueId: number, chemicalId: number, chemicalInput: ChemicalInput, options?: RequestInit) => Promise<Chemical>;
export declare const getUpdateChemicalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateChemical>>, TError, {
        venueId: number;
        chemicalId: number;
        data: BodyType<ChemicalInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateChemical>>, TError, {
    venueId: number;
    chemicalId: number;
    data: BodyType<ChemicalInput>;
}, TContext>;
export type UpdateChemicalMutationResult = NonNullable<Awaited<ReturnType<typeof updateChemical>>>;
export type UpdateChemicalMutationBody = BodyType<ChemicalInput>;
export type UpdateChemicalMutationError = ErrorType<unknown>;
/**
* @summary Update a chemical
*/
export declare const useUpdateChemical: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateChemical>>, TError, {
        venueId: number;
        chemicalId: number;
        data: BodyType<ChemicalInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateChemical>>, TError, {
    venueId: number;
    chemicalId: number;
    data: BodyType<ChemicalInput>;
}, TContext>;
export declare const getDeleteChemicalUrl: (venueId: number, chemicalId: number) => string;
/**
 * @summary Soft-delete a chemical
 */
export declare const deleteChemical: (venueId: number, chemicalId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteChemicalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteChemical>>, TError, {
        venueId: number;
        chemicalId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteChemical>>, TError, {
    venueId: number;
    chemicalId: number;
}, TContext>;
export type DeleteChemicalMutationResult = NonNullable<Awaited<ReturnType<typeof deleteChemical>>>;
export type DeleteChemicalMutationError = ErrorType<unknown>;
/**
* @summary Soft-delete a chemical
*/
export declare const useDeleteChemical: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteChemical>>, TError, {
        venueId: number;
        chemicalId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteChemical>>, TError, {
    venueId: number;
    chemicalId: number;
}, TContext>;
export declare const getGetChemicalAlternativesUrl: (venueId: number, chemicalId: number) => string;
/**
 * @summary List suitable replacement chemicals of the same type that are VALID
 */
export declare const getChemicalAlternatives: (venueId: number, chemicalId: number, options?: RequestInit) => Promise<Chemical[]>;
export declare const getGetChemicalAlternativesQueryKey: (venueId: number, chemicalId: number) => readonly [`/api/venues/${number}/chemicals/${number}/alternatives`];
export declare const getGetChemicalAlternativesQueryOptions: <TData = Awaited<ReturnType<typeof getChemicalAlternatives>>, TError = ErrorType<unknown>>(venueId: number, chemicalId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChemicalAlternatives>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getChemicalAlternatives>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetChemicalAlternativesQueryResult = NonNullable<Awaited<ReturnType<typeof getChemicalAlternatives>>>;
export type GetChemicalAlternativesQueryError = ErrorType<unknown>;
/**
 * @summary List suitable replacement chemicals of the same type that are VALID
 */
export declare function useGetChemicalAlternatives<TData = Awaited<ReturnType<typeof getChemicalAlternatives>>, TError = ErrorType<unknown>>(venueId: number, chemicalId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChemicalAlternatives>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLinkChemicalToCleaningTaskUrl: (venueId: number, chemicalId: number) => string;
/**
 * @summary Link a chemical to a cleaning task (blocked chemicals are rejected with alternatives)
 */
export declare const linkChemicalToCleaningTask: (venueId: number, chemicalId: number, linkChemicalToCleaningTaskBody: LinkChemicalToCleaningTaskBody, options?: RequestInit) => Promise<void>;
export declare const getLinkChemicalToCleaningTaskMutationOptions: <TError = ErrorType<ChemicalBlockedError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof linkChemicalToCleaningTask>>, TError, {
        venueId: number;
        chemicalId: number;
        data: BodyType<LinkChemicalToCleaningTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof linkChemicalToCleaningTask>>, TError, {
    venueId: number;
    chemicalId: number;
    data: BodyType<LinkChemicalToCleaningTaskBody>;
}, TContext>;
export type LinkChemicalToCleaningTaskMutationResult = NonNullable<Awaited<ReturnType<typeof linkChemicalToCleaningTask>>>;
export type LinkChemicalToCleaningTaskMutationBody = BodyType<LinkChemicalToCleaningTaskBody>;
export type LinkChemicalToCleaningTaskMutationError = ErrorType<ChemicalBlockedError>;
/**
* @summary Link a chemical to a cleaning task (blocked chemicals are rejected with alternatives)
*/
export declare const useLinkChemicalToCleaningTask: <TError = ErrorType<ChemicalBlockedError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof linkChemicalToCleaningTask>>, TError, {
        venueId: number;
        chemicalId: number;
        data: BodyType<LinkChemicalToCleaningTaskBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof linkChemicalToCleaningTask>>, TError, {
    venueId: number;
    chemicalId: number;
    data: BodyType<LinkChemicalToCleaningTaskBody>;
}, TContext>;
export declare const getListComplianceTasksUrl: (venueId: number) => string;
/**
 * @summary List compliance tasks for a venue
 */
export declare const listComplianceTasks: (venueId: number, options?: RequestInit) => Promise<ComplianceTask[]>;
export declare const getListComplianceTasksQueryKey: (venueId: number) => readonly [`/api/venues/${number}/compliance-tasks`];
export declare const getListComplianceTasksQueryOptions: <TData = Awaited<ReturnType<typeof listComplianceTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listComplianceTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listComplianceTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListComplianceTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listComplianceTasks>>>;
export type ListComplianceTasksQueryError = ErrorType<unknown>;
/**
 * @summary List compliance tasks for a venue
 */
export declare function useListComplianceTasks<TData = Awaited<ReturnType<typeof listComplianceTasks>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listComplianceTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getResolveComplianceTaskUrl: (venueId: number, taskId: number) => string;
/**
 * @summary Mark a compliance task as resolved
 */
export declare const resolveComplianceTask: (venueId: number, taskId: number, options?: RequestInit) => Promise<ComplianceTask>;
export declare const getResolveComplianceTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveComplianceTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resolveComplianceTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export type ResolveComplianceTaskMutationResult = NonNullable<Awaited<ReturnType<typeof resolveComplianceTask>>>;
export type ResolveComplianceTaskMutationError = ErrorType<unknown>;
/**
* @summary Mark a compliance task as resolved
*/
export declare const useResolveComplianceTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveComplianceTask>>, TError, {
        venueId: number;
        taskId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resolveComplianceTask>>, TError, {
    venueId: number;
    taskId: number;
}, TContext>;
export declare const getGetComplianceSummaryUrl: (venueId: number) => string;
/**
 * @summary Operational compliance summary for the venue (score, blocked, expiring)
 */
export declare const getComplianceSummary: (venueId: number, options?: RequestInit) => Promise<ComplianceSummary>;
export declare const getGetComplianceSummaryQueryKey: (venueId: number) => readonly [`/api/venues/${number}/compliance/summary`];
export declare const getGetComplianceSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getComplianceSummary>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getComplianceSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getComplianceSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetComplianceSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getComplianceSummary>>>;
export type GetComplianceSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Operational compliance summary for the venue (score, blocked, expiring)
 */
export declare function useGetComplianceSummary<TData = Awaited<ReturnType<typeof getComplianceSummary>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getComplianceSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFoodCostConfidenceUrl: (venueId: number) => string;
/**
 * @summary Food cost confidence score with factor breakdown
 */
export declare const getFoodCostConfidence: (venueId: number, options?: RequestInit) => Promise<FoodCostConfidence>;
export declare const getGetFoodCostConfidenceQueryKey: (venueId: number) => readonly [`/api/venues/${number}/food-cost-confidence`];
export declare const getGetFoodCostConfidenceQueryOptions: <TData = Awaited<ReturnType<typeof getFoodCostConfidence>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFoodCostConfidence>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFoodCostConfidence>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFoodCostConfidenceQueryResult = NonNullable<Awaited<ReturnType<typeof getFoodCostConfidence>>>;
export type GetFoodCostConfidenceQueryError = ErrorType<unknown>;
/**
 * @summary Food cost confidence score with factor breakdown
 */
export declare function useGetFoodCostConfidence<TData = Awaited<ReturnType<typeof getFoodCostConfidence>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFoodCostConfidence>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getMarkRecipeReviewedUrl: (venueId: number, recipeId: number) => string;
/**
 * @summary Stamp a recipe as reviewed (refreshes lastReviewedAt)
 */
export declare const markRecipeReviewed: (venueId: number, recipeId: number, options?: RequestInit) => Promise<Recipe>;
export declare const getMarkRecipeReviewedMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markRecipeReviewed>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markRecipeReviewed>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export type MarkRecipeReviewedMutationResult = NonNullable<Awaited<ReturnType<typeof markRecipeReviewed>>>;
export type MarkRecipeReviewedMutationError = ErrorType<unknown>;
/**
* @summary Stamp a recipe as reviewed (refreshes lastReviewedAt)
*/
export declare const useMarkRecipeReviewed: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markRecipeReviewed>>, TError, {
        venueId: number;
        recipeId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markRecipeReviewed>>, TError, {
    venueId: number;
    recipeId: number;
}, TContext>;
export declare const getApplyStarterPackUrl: (venueId: number) => string;
/**
 * @summary Apply a venue archetype starter pack (seeds suppliers, inventory, chemicals)
 */
export declare const applyStarterPack: (venueId: number, starterPackInput: StarterPackInput, options?: RequestInit) => Promise<StarterPackResult>;
export declare const getApplyStarterPackMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyStarterPack>>, TError, {
        venueId: number;
        data: BodyType<StarterPackInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyStarterPack>>, TError, {
    venueId: number;
    data: BodyType<StarterPackInput>;
}, TContext>;
export type ApplyStarterPackMutationResult = NonNullable<Awaited<ReturnType<typeof applyStarterPack>>>;
export type ApplyStarterPackMutationBody = BodyType<StarterPackInput>;
export type ApplyStarterPackMutationError = ErrorType<unknown>;
/**
* @summary Apply a venue archetype starter pack (seeds suppliers, inventory, chemicals)
*/
export declare const useApplyStarterPack: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyStarterPack>>, TError, {
        venueId: number;
        data: BodyType<StarterPackInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyStarterPack>>, TError, {
    venueId: number;
    data: BodyType<StarterPackInput>;
}, TContext>;
export declare const getGetSetupProgressUrl: (venueId: number) => string;
/**
 * @summary Get first-week setup progress and feature unlock status
 */
export declare const getSetupProgress: (venueId: number, options?: RequestInit) => Promise<SetupProgress>;
export declare const getGetSetupProgressQueryKey: (venueId: number) => readonly [`/api/venues/${number}/setup-progress`];
export declare const getGetSetupProgressQueryOptions: <TData = Awaited<ReturnType<typeof getSetupProgress>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSetupProgress>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSetupProgress>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSetupProgressQueryResult = NonNullable<Awaited<ReturnType<typeof getSetupProgress>>>;
export type GetSetupProgressQueryError = ErrorType<unknown>;
/**
 * @summary Get first-week setup progress and feature unlock status
 */
export declare function useGetSetupProgress<TData = Awaited<ReturnType<typeof getSetupProgress>>, TError = ErrorType<unknown>>(venueId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSetupProgress>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map