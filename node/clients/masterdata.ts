import type { IOContext, InstanceOptions } from '@vtex/api'
import { MasterData } from '@vtex/api'

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export default class MasterDataClient extends MasterData {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
    })
  }

  /**
   * Fetch customers with server-side pagination
   * Uses searchDocumentsWithPaginationInfo for proper pagination with total count
   */
  public async getCustomersPaginated(
    page: number,
    pageSize: number,
    search?: string
  ): Promise<PaginatedResponse<any>> {
    const fields = ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn']

    // Build where clause for search if provided
    let where: string | undefined

    if (search && search.trim()) {
      // Search in firstName, lastName, or email using wildcard matching
      where = `firstName=*${search}* OR lastName=*${search}* OR email=*${search}*`
    }

    try {
      // Use searchDocumentsWithPaginationInfo to get total count
      const result = await this.searchDocumentsWithPaginationInfo({
        dataEntity: 'CL',
        fields,
        pagination: {
          page,
          pageSize: Math.min(pageSize, 100), // Max 100 per page
        },
        ...(where && { where }),
        sort: 'createdIn DESC',
      })

      return {
        data: result.data || [],
        pagination: {
          page: result.pagination?.page || page,
          pageSize: result.pagination?.pageSize || pageSize,
          total: result.pagination?.total || 0,
        },
      }
    } catch (error: any) {
      console.error('Error fetching customers with pagination:', error)

      // If search fails (e.g., field not searchable), try without search
      if (search && error.response?.status === 400) {
        console.log('Retrying without search filter...')

        const fallbackResult = await this.searchDocumentsWithPaginationInfo({
          dataEntity: 'CL',
          fields,
          pagination: {
            page,
            pageSize: Math.min(pageSize, 100),
          },
          sort: 'createdIn DESC',
        })

        return {
          data: fallbackResult.data || [],
          pagination: {
            page: fallbackResult.pagination?.page || page,
            pageSize: fallbackResult.pagination?.pageSize || pageSize,
            total: fallbackResult.pagination?.total || 0,
          },
        }
      }

      throw error
    }
  }
}
